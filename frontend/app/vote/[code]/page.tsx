'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase, getUserId, type Group, type GroupMember } from '../../lib/supabase'
import { computeResults, computeVoteWinner, type ScoredDestination, type AnswerMap } from '../../lib/engine'
import { Btn } from '../../components/Btn'
import { Loader } from '../../components/Loader'
import { SectionLabel } from '../../components/SectionLabel'

export default function VotePage() {
  const { code } = useParams<{ code: string }>()
  const router   = useRouter()
  const userId   = getUserId()

  const [group,    setGroup]    = useState<Group | null>(null)
  const [results,  setResults]  = useState<ScoredDestination[]>([])
  const [ranking,  setRanking]  = useState<string[]>([])   // ordered dest ids
  const [voted,    setVoted]    = useState(false)
  const [loading,  setLoading]  = useState(true)
  const [allVotes, setAllVotes] = useState<{ userId: string; destinationId: string; rank: number }[]>([])

  const isOwner  = group?.owner_id === userId

  useEffect(() => {
    async function init() {
      const { data: g } = await supabase.from('groups').select().eq('invite_code', code).single()
      if (!g) { router.replace('/'); return }
      setGroup(g)

      if (g.phase === 'winner') { router.replace(`/winner/${code}`); return }
      if (g.phase === 'results') { router.replace(`/results/${code}`); return }

      const { data: members } = await supabase.from('group_members').select().eq('group_id', g.id)
      const { data: answers } = await supabase.from('answers').select().eq('group_id', g.id)

      const allAnswers = (members ?? []).map((m: GroupMember) => {
        const userAnswers = (answers ?? []).filter((a: { user_id: string }) => a.user_id === m.user_id)
        const map: AnswerMap = {}
        for (const a of userAnswers) {
          map[a.question_id] = a.value.includes(',') ? a.value.split(',') : a.value
        }
        return { userId: m.user_id, answers: map }
      })

      const scored = computeResults(allAnswers)
      setResults(scored)

      // Check if already voted
      const { data: myVotes } = await supabase.from('votes').select().eq('group_id', g.id).eq('user_id', userId)
      if (myVotes && myVotes.length > 0) {
        const ordered = [...myVotes].sort((a: { rank: number }, b: { rank: number }) => a.rank - b.rank).map((v: { destination_id: string }) => v.destination_id)
        setRanking(ordered)
        setVoted(true)
      }

      const { data: allV } = await supabase.from('votes').select().eq('group_id', g.id)
      setAllVotes((allV ?? []).map((v: { user_id: string; destination_id: string; rank: number }) => ({ userId: v.user_id, destinationId: v.destination_id, rank: v.rank })))
      setLoading(false)
    }
    init()

    const ch = supabase
      .channel(`vote-${code}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, async (payload) => {
        const { data: g2 } = await supabase.from('groups').select().eq('invite_code', code).single()
        if (!g2) return
        const { data: allV } = await supabase.from('votes').select().eq('group_id', g2.id)
        setAllVotes((allV ?? []).map((v: { user_id: string; destination_id: string; rank: number }) => ({ userId: v.user_id, destinationId: v.destination_id, rank: v.rank })))
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'groups', filter: `invite_code=eq.${code}` }, (payload) => {
        const g2 = payload.new as { phase: string }
        if (g2.phase === 'winner') router.replace(`/winner/${code}`)
      })
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [code, router, userId])

  function toggleRank(destId: string) {
    if (voted) return
    setRanking(prev => {
      if (prev.includes(destId)) return prev.filter(id => id !== destId)
      if (prev.length >= 3) return prev
      return [...prev, destId]
    })
  }

  async function submitVote() {
    if (!group || ranking.length < 3) return
    const rows = ranking.map((destId, i) => ({
      group_id: group.id, user_id: userId, destination_id: destId, rank: i + 1,
    }))
    await supabase.from('votes').upsert(rows, { onConflict: 'group_id,user_id,rank' })
    setVoted(true)
  }

  async function revealWinner() {
    if (!group) return
    const winner = computeVoteWinner(allVotes)
    if (!winner) return
    await supabase.from('groups').update({ phase: 'winner', winner_id: winner }).eq('id', group.id)
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader msg="Stemronde laden…" /></div>

  return (
    <div className="max-w-[440px] mx-auto">
      <div className="mb-6">
        <p className="font-mono text-[11px] tracking-[.2em] uppercase text-muted mb-1">TripSync.</p>
        <h1 className="font-serif text-[32px] text-dark">Stemronde</h1>
        <p className="font-sans text-[13px] text-muted mt-1">
          Rangschik je top 3 bestemmingen.
        </p>
      </div>

      {!voted && (
        <div className="border border-brand/[.3] bg-card px-4 py-3 mb-6">
          <p className="font-mono text-[10px] text-muted tracking-[.1em]">
            Geselecteerd: {ranking.length}/3
          </p>
          <div className="flex gap-2 mt-2">
            {[1, 2, 3].map(rank => {
              const destId = ranking[rank - 1]
              const dest   = results.find(r => r.destination.id === destId)
              return (
                <div key={rank} className={[
                  'flex-1 h-[38px] border flex items-center justify-center',
                  dest ? 'border-dark bg-dark' : 'border-dark/[.2]',
                ].join(' ')}>
                  {dest
                    ? <span className="font-sans text-[11px] text-bg truncate px-1">{dest.destination.emoji} {dest.destination.city}</span>
                    : <span className="font-mono text-[11px] text-dim">#{rank}</span>
                  }
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 mb-6">
        {results.map((r, i) => {
          const rankIdx = ranking.indexOf(r.destination.id)
          const isSelected = rankIdx !== -1
          return (
            <div
              key={r.destination.id}
              onClick={() => toggleRank(r.destination.id)}
              className={[
                'border transition-all overflow-hidden',
                voted ? 'opacity-70' : 'cursor-pointer',
                isSelected ? 'border-brand' : 'border-dark/[.2] hover:border-dark',
              ].join(' ')}
            >
              <div className="relative h-[100px] overflow-hidden">
                <Image src={r.destination.image} alt={r.destination.city} fill className="object-cover" sizes="440px" />
                <div className="absolute inset-0 bg-gradient-to-t from-dark/60 to-transparent" />
                {isSelected && (
                  <div className="absolute top-2 right-2 w-7 h-7 bg-brand flex items-center justify-center">
                    <span className="font-mono text-[12px] text-bg font-medium">#{rankIdx + 1}</span>
                  </div>
                )}
                <div className="absolute bottom-2 left-3">
                  <p className="font-serif text-[18px] text-bg">{r.destination.city}</p>
                  <p className="font-sans text-[11px] text-bg/70">{r.destination.emoji} {r.destination.country}</p>
                </div>
                <div className="absolute bottom-2 right-3">
                  <p className="font-sans text-[18px] font-medium text-brand">{r.score}%</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {!voted ? (
        <Btn onClick={submitVote} disabled={ranking.length < 3} fullWidth>
          Stem bevestigen
        </Btn>
      ) : (
        <div>
          <div className="border border-dark/[.1] bg-card p-4 text-center mb-4">
            <p className="font-serif text-[20px] text-dark mb-1">Stem uitgebracht ✓</p>
            <p className="font-sans text-[13px] text-muted">Wachten op alle stemmen…</p>
          </div>
          {isOwner && (
            <Btn onClick={revealWinner} fullWidth variant="outline">
              Winnaar onthullen →
            </Btn>
          )}
        </div>
      )}
    </div>
  )
}
