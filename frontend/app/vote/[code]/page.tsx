'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { getUserId } from '../../lib/user'
import { getPusher, groupChannel, EVENTS } from '../../lib/pusher-client'
import { computeResults, type ScoredDestination, type AnswerMap } from '../../lib/engine'
import { type Group, type Member } from '../../lib/db'
import { Btn } from '../../components/Btn'
import { Loader } from '../../components/Loader'

export default function VotePage() {
  const { code } = useParams<{ code: string }>()
  const router   = useRouter()
  const userId   = getUserId()

  const [group,   setGroup]   = useState<Group | null>(null)
  const [results, setResults] = useState<ScoredDestination[]>([])
  const [ranking, setRanking] = useState<string[]>([])
  const [voted,   setVoted]   = useState(false)
  const [loading, setLoading] = useState(true)

  const isOwner = group?.owner_id === userId

  useEffect(() => {
    async function init() {
      const res  = await fetch(`/api/groups/${code}`)
      if (!res.ok) { router.replace('/'); return }
      const { group: g, members } = await res.json()
      setGroup(g)

      if (g.phase === 'winner') { router.replace(`/winner/${code}`); return }

      const allAnswers: { userId: string; answers: AnswerMap }[] = await Promise.all(
        members.map(async (m: Member) => {
          const r = await fetch(`/api/answers?groupId=${g.id}&userId=${m.user_id}`)
          const { answers } = await r.json()
          const map: AnswerMap = {}
          for (const a of answers) {
            map[a.question_id] = a.value.includes(',') ? a.value.split(',') : a.value
          }
          return { userId: m.user_id, answers: map }
        })
      )
      setResults(computeResults(allAnswers))

      // Check if already voted
      const vr = await fetch(`/api/votes?groupId=${g.id}`)
      const { votes } = await vr.json()
      const myVotes = votes.filter((v: { user_id: string }) => v.user_id === userId)
      if (myVotes.length > 0) {
        const ordered = [...myVotes].sort((a: { rank: number }, b: { rank: number }) => a.rank - b.rank).map((v: { destination_id: string }) => v.destination_id)
        setRanking(ordered)
        setVoted(true)
      }
      setLoading(false)
    }
    init()

    const pusher  = getPusher()
    const channel = pusher.subscribe(groupChannel(code))
    channel.bind(EVENTS.PHASE_CHANGED, ({ phase }: { phase: string }) => {
      if (phase === 'winner') router.replace(`/winner/${code}`)
    })
    return () => { channel.unbind_all(); pusher.unsubscribe(groupChannel(code)) }
  }, [code])

  function toggleRank(destId: string) {
    if (voted) return
    setRanking(prev =>
      prev.includes(destId) ? prev.filter(id => id !== destId)
      : prev.length >= 3 ? prev
      : [...prev, destId]
    )
  }

  async function submitVote() {
    if (!group || ranking.length < 3) return
    const votes = ranking.map((destId, i) => ({ destinationId: destId, rank: i + 1 }))
    await fetch('/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId: group.id, code, userId, votes }),
    })
    setVoted(true)
  }

  async function revealWinner() {
    if (!group) return
    await fetch('/api/votes/reveal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId: group.id, code, userId }),
    })
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader msg="Stemronde laden…" /></div>

  return (
    <div className="max-w-[440px] mx-auto">
      <div className="mb-6">
        <p className="font-mono text-[11px] tracking-[.2em] uppercase text-muted mb-1">TripSync.</p>
        <h1 className="font-serif text-[32px] text-dark">Stemronde</h1>
        <p className="font-sans text-[13px] text-muted mt-1">Rangschik je top 3 bestemmingen.</p>
      </div>

      {!voted && (
        <div className="border border-brand/[.3] bg-card px-4 py-3 mb-6">
          <p className="font-mono text-[10px] text-muted tracking-[.1em]">Geselecteerd: {ranking.length}/3</p>
          <div className="flex gap-2 mt-2">
            {[1, 2, 3].map(rank => {
              const dest = results.find(r => r.destination.id === ranking[rank - 1])
              return (
                <div key={rank} className={['flex-1 h-[38px] border flex items-center justify-center', dest ? 'border-dark bg-dark' : 'border-dark/[.2]'].join(' ')}>
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
        {results.map(r => {
          const rankIdx = ranking.indexOf(r.destination.id)
          const isSelected = rankIdx !== -1
          return (
            <div key={r.destination.id} onClick={() => toggleRank(r.destination.id)}
              className={['border transition-all overflow-hidden', voted ? 'opacity-70' : 'cursor-pointer', isSelected ? 'border-brand' : 'border-dark/[.2] hover:border-dark'].join(' ')}>
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
        <Btn onClick={submitVote} disabled={ranking.length < 3} fullWidth>Stem bevestigen</Btn>
      ) : (
        <div>
          <div className="border border-dark/[.1] bg-card p-4 text-center mb-4">
            <p className="font-serif text-[20px] text-dark mb-1">Stem uitgebracht ✓</p>
            <p className="font-sans text-[13px] text-muted">Wachten op alle stemmen…</p>
          </div>
          {isOwner && <Btn onClick={revealWinner} fullWidth variant="outline">Winnaar onthullen →</Btn>}
        </div>
      )}
    </div>
  )
}
