'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { supabase, getUserId, type Group, type GroupMember } from '../../lib/supabase'
import { QUESTIONS } from '../../lib/questions'
import { computeResults, type ScoredDestination, type AnswerMap } from '../../lib/engine'
import { DESTINATIONS } from '../../lib/destinations'
import { Btn } from '../../components/Btn'
import { Loader } from '../../components/Loader'
import { SectionLabel } from '../../components/SectionLabel'
import { DestinationResult } from '../../components/DestinationResult'
import type { GlobeMarker } from '../../components/Globe'

const Globe = dynamic(() => import('../../components/Globe').then(m => m.Globe), { ssr: false })

export default function ResultsPage() {
  const { code } = useParams<{ code: string }>()
  const router   = useRouter()
  const userId   = getUserId()

  const [group,   setGroup]   = useState<Group | null>(null)
  const [results, setResults] = useState<ScoredDestination[]>([])
  const [markers, setMarkers] = useState<GlobeMarker[]>([])
  const [loading, setLoading] = useState(true)
  const [tab,     setTab]     = useState<'globe' | 'list'>('globe')

  const isOwner = group?.owner_id === userId

  useEffect(() => {
    async function init() {
      const { data: g } = await supabase.from('groups').select().eq('invite_code', code).single()
      if (!g) { router.replace('/'); return }
      setGroup(g)

      if (g.phase === 'vote')   { router.replace(`/vote/${code}`);   return }
      if (g.phase === 'winner') { router.replace(`/winner/${code}`); return }
      if (g.phase === 'lobby')  { router.replace(`/lobby/${code}`);  return }
      if (g.phase === 'game')   { router.replace(`/game/${code}`);   return }

      const { data: members } = await supabase.from('group_members').select().eq('group_id', g.id)
      const { data: answers } = await supabase.from('answers').select().eq('group_id', g.id)

      const memberIds = (members ?? []).map((m: GroupMember) => m.user_id)
      const allAnswers = memberIds.map((uid: string) => {
        const userAnswers = (answers ?? []).filter((a: { user_id: string }) => a.user_id === uid)
        const map: AnswerMap = {}
        for (const a of userAnswers) {
          map[a.question_id] = a.value.includes(',') ? a.value.split(',') : a.value
        }
        return { userId: uid, answers: map }
      })

      const scored = computeResults(allAnswers)
      setResults(scored)
      setMarkers(scored.map(r => ({
        lat: r.destination.lat,
        lng: r.destination.lng,
        label: r.destination.city,
        score: r.score,
      })))
      setLoading(false)
    }
    init()

    const ch = supabase
      .channel(`results-${code}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'groups', filter: `invite_code=eq.${code}` }, (payload) => {
        const g2 = payload.new as { phase: string }
        if (g2.phase === 'vote')   router.replace(`/vote/${code}`)
        if (g2.phase === 'winner') router.replace(`/winner/${code}`)
      })
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [code, router])

  async function startVote() {
    if (!group) return
    await supabase.from('groups').update({ phase: 'vote' }).eq('id', group.id)
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader msg="Resultaten berekenen…" /></div>

  return (
    <div className="max-w-[440px] mx-auto">
      <div className="mb-6">
        <p className="font-mono text-[11px] tracking-[.2em] uppercase text-muted mb-1">TripSync.</p>
        <h1 className="font-serif text-[32px] text-dark leading-tight">
          Top bestemmingen
        </h1>
        <p className="font-sans text-[13px] text-muted mt-1">
          Gebaseerd op de voorkeuren van de groep.
        </p>
      </div>

      {/* Tab toggle */}
      <div className="flex border border-dark/[.2] mb-6">
        {(['globe', 'list'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={[
              'flex-1 py-2 font-mono text-[11px] tracking-[.1em] uppercase transition-colors cursor-pointer',
              tab === t ? 'bg-dark text-bg' : 'bg-card text-muted hover:text-dark',
            ].join(' ')}
          >
            {t === 'globe' ? '🌍 Wereldbol' : '📋 Lijst'}
          </button>
        ))}
      </div>

      {tab === 'globe' && (
        <div className="w-full h-[320px] bg-[#0a1520] mb-6 fade-in">
          <Globe markers={markers} />
        </div>
      )}

      {tab === 'list' && (
        <div className="flex flex-col gap-3 mb-6 fade-in">
          <SectionLabel>Top 5 bestemmingen</SectionLabel>
          {results.map((r, i) => (
            <DestinationResult key={r.destination.id} result={r} rank={i + 1} />
          ))}
        </div>
      )}

      {/* Always show compact list under globe */}
      {tab === 'globe' && results.length > 0 && (
        <div className="mb-6">
          <SectionLabel>Beste matches</SectionLabel>
          <div className="flex flex-col gap-0 border border-dark/[.15] bg-card">
            {results.map((r, i) => (
              <div key={r.destination.id} className="flex items-center gap-3 px-4 py-3 border-b border-dark/[.06] last:border-0">
                <span className="font-mono text-[10px] text-muted w-4">#{i + 1}</span>
                <span className="text-[18px]">{r.destination.emoji}</span>
                <div className="flex-1">
                  <p className="font-sans text-[14px] font-medium text-dark">{r.destination.city}</p>
                  <p className="font-sans text-[11px] text-muted">{r.destination.country}</p>
                </div>
                <span className="font-sans text-[16px] font-medium text-brand">{r.score}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isOwner ? (
        <Btn onClick={startVote} fullWidth>Start stemronde →</Btn>
      ) : (
        <div className="border border-dark/[.1] bg-card p-4 text-center">
          <Loader msg="Wachten tot de host de stemronde start…" size="sm" />
        </div>
      )}
    </div>
  )
}
