'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getUserId } from '../../lib/user'
import { trackEvent } from '../../lib/tracker'
import { getPusher, groupChannel, EVENTS } from '../../lib/pusher-client'
import { computeResults, type ScoredDestination, type AnswerMap } from '../../lib/engine'
import { type Group, type Member } from '../../lib/db'
import { Btn } from '../../components/Btn'
import { Loader } from '../../components/Loader'
import { SectionLabel } from '../../components/SectionLabel'
import { DestinationResult } from '../../components/DestinationResult'
import { GlobeErrorBoundary } from '../../components/GlobeErrorBoundary'
import { Globe, type GlobeMarker } from '../../components/Globe'
import { DestinationSheet } from '../../components/DestinationSheet'
import { MapView } from '../../components/MapView'
import { GroupInsights } from '../../components/GroupInsights'
import { CompareSheet } from '../../components/CompareSheet'
import { computeGroupProfile, type GroupProfile } from '../../lib/group-profile'
import { computeGroupPersonalities, type PersonalityType } from '../../lib/personality'

export default function ResultsPage() {
  const { code } = useParams<{ code: string }>()
  const router   = useRouter()
  const userId   = getUserId()

  const [group,   setGroup]   = useState<Group | null>(null)
  const [results, setResults] = useState<ScoredDestination[]>([])
  const [markers, setMarkers] = useState<GlobeMarker[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [tab, setTab] = useState<'globe' | 'map' | 'list'>('globe')
  const [sheet,       setSheet]       = useState<ScoredDestination | null>(null)
  const [compareA,    setCompareA]    = useState<ScoredDestination | null>(null)
  const [compareB,    setCompareB]    = useState<ScoredDestination | null>(null)
  const [groupProfile, setGroupProfile] = useState<GroupProfile | null>(null)
  const [personalities, setPersonalities] = useState<{ userId: string; name: string; type: PersonalityType }[]>([])

  const isOwner = group?.owner_id === userId


  useEffect(() => {
    async function init() {
      try {
      const res  = await fetch(`/api/groups/${code}`)
      if (!res.ok) { router.replace('/'); return }
      const { group: g, members } = await res.json()
      setGroup(g)

      if (g.phase === 'vote')   { router.replace(`/vote/${code}`);   return }
      if (g.phase === 'veto')   { router.replace(`/veto/${code}`);   return }
      if (g.phase === 'winner') { router.replace(`/winner/${code}`); return }
      if (g.phase === 'lobby')  { router.replace(`/lobby/${code}`);  return }
      if (g.phase === 'game')   { router.replace(`/game/${code}`);   return }

      // Fetch all answers for all members
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

      const scored = computeResults(allAnswers)
      setResults(scored)

      // Group insights
      setGroupProfile(computeGroupProfile(allAnswers))
      const types = computeGroupPersonalities(allAnswers)
      setPersonalities(members.map((m: Member, i: number) => ({ userId: m.user_id, name: m.name, type: types[i] })))
      setMarkers(scored.map(r => ({
        lat: r.destination.lat, lng: r.destination.lng,
        label: r.destination.city, score: r.score,
      })))
      setLoading(false)
      } catch (e) {
        console.error('Results init error:', e)
        setError('Kon resultaten niet laden. Probeer opnieuw.')
        setLoading(false)
      }
    }
    init()

    const pusher  = getPusher()
    const channel = pusher.subscribe(groupChannel(code))
    channel.bind(EVENTS.PHASE_CHANGED, ({ phase }: { phase: string }) => {
      if (phase === 'vote')   router.replace(`/vote/${code}`)
      if (phase === 'veto')   router.replace(`/veto/${code}`)
      if (phase === 'winner') router.replace(`/winner/${code}`)
    })
    return () => { channel.unbind_all(); pusher.unsubscribe(groupChannel(code)) }
  }, [code])

  async function startVeto() {
    trackEvent('start-veto', { groupCode: code })
    await fetch(`/api/groups/${code}/phase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phase: 'veto', userId }),
    })
  }

  async function startVote() {
    trackEvent('start-vote', { groupCode: code })
    await fetch(`/api/groups/${code}/phase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phase: 'vote', userId }),
    })
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader msg="Resultaten berekenen…" /></div>
  if (error)   return (
    <div className="max-w-[440px] mx-auto text-center py-16">
      <p className="font-serif text-[24px] text-dark mb-2">Oeps</p>
      <p className="font-sans text-[14px] text-muted mb-6">{error}</p>
      <Btn onClick={() => window.location.reload()}>Opnieuw proberen</Btn>
    </div>
  )

  return (
    <div className="max-w-[440px] mx-auto">
      <div className="mb-6">
        <p className="font-mono text-[11px] tracking-[.2em] uppercase text-muted mb-1">TripSync.</p>
        <h1 className="font-serif text-[32px] text-dark">Top bestemmingen</h1>
        <p className="font-sans text-[13px] text-muted mt-1">Gebaseerd op de voorkeuren van de groep.</p>
      </div>

      <div className="flex border border-dark/[.2] mb-6">
        {(['globe', 'map', 'list'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={[
              'flex-1 py-2 font-mono text-[11px] tracking-[.1em] uppercase transition-colors cursor-pointer',
              tab === t ? 'bg-dark text-bg' : 'bg-card text-muted hover:text-dark',
            ].join(' ')}
          >
            {t === 'globe' ? '🌍 Bol' : t === 'map' ? '🗺 Kaart' : '📋 Lijst'}
          </button>
        ))}
      </div>

      {groupProfile && <GroupInsights profile={groupProfile} personalities={personalities} />}

      {tab === 'globe' && (
        <div className="w-full h-[320px] mb-6 fade-in">
          <GlobeErrorBoundary>
            <Globe markers={markers} />
          </GlobeErrorBoundary>
        </div>
      )}

      {tab === 'map' && (
        <div className="w-full h-[320px] mb-6 fade-in border border-dark/[.1] overflow-hidden">
          <MapView markers={markers} />
        </div>
      )}

      {tab === 'list' && (
        <div className="flex flex-col gap-3 mb-6 fade-in">
          <SectionLabel>Top 5 bestemmingen</SectionLabel>
          {compareA && !compareB && (
            <div className="border border-brand/40 bg-card px-3 py-2 font-mono text-[10px] text-muted">
              Selecteer een 2e bestemming om te vergelijken met <span className="text-brand">{compareA.destination.city}</span>
            </div>
          )}
          {results.map((r, i) => (
            <div key={r.destination.id} className="relative">
              <DestinationResult result={r} rank={i + 1} onSelect={() => {
                if (!compareA) { setSheet(r) }
                else if (!compareB && r.destination.id !== compareA.destination.id) { setCompareB(r) }
                else { setSheet(r) }
              }} />
              <button
                onClick={e => { e.stopPropagation(); setCompareA(prev => prev?.destination.id === r.destination.id ? null : r); setCompareB(null) }}
                className={['absolute top-2 right-2 font-mono text-[9px] uppercase tracking-wide px-1.5 py-0.5 border transition-colors', compareA?.destination.id === r.destination.id ? 'border-brand text-brand bg-brand/5' : 'border-dark/20 text-muted hover:border-dark'].join(' ')}
              >
                {compareA?.destination.id === r.destination.id ? '✓ A' : '⇌'}
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'globe' && results.length > 0 && (
        <div className="mb-6">
          <SectionLabel>Beste matches</SectionLabel>
          <div className="flex flex-col gap-0 border border-dark/[.15] bg-card">
            {results.map((r, i) => (
              <div
                key={r.destination.id}
                onClick={() => setSheet(r)}
                className="flex items-center gap-3 px-4 py-3 border-b border-dark/[.06] last:border-0 cursor-pointer hover:bg-dim/10 active:bg-dim/20 transition-colors"
              >
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
        <div className="flex flex-col gap-2">
          <Btn onClick={startVeto} fullWidth variant="outline">🚫 Start veto-ronde</Btn>
          <Btn onClick={startVote} fullWidth>Start stemronde →</Btn>
        </div>
      ) : (
        <div className="border border-dark/[.1] bg-card p-4 text-center">
          <Loader msg="Wachten tot de host de stemronde start…" size="sm" />
        </div>
      )}

      {code === 'TESTEN' && (
        <button
          onClick={async () => {
            const res = await fetch('/api/test/reset', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId, userName: 'Robin' }),
            })
            if (res.ok) router.replace('/lobby/TESTEN')
          }}
          className="w-full mt-4 border border-dark/[.2] bg-card font-mono text-[10px] tracking-[.12em] uppercase text-muted py-3 hover:border-dark/40 hover:text-dark transition-colors cursor-pointer"
        >
          ↺ Reset testgroep
        </button>
      )}

      <DestinationSheet result={sheet} onClose={() => setSheet(null)} />
      {compareA && compareB && <CompareSheet a={compareA} b={compareB} onClose={() => { setCompareA(null); setCompareB(null) }} />}
    </div>
  )
}
