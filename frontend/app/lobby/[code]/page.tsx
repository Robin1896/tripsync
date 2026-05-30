'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getUserId, addRecentGame } from '../../lib/user'
import { trackEvent } from '../../lib/tracker'
import { getPusher, groupChannel, EVENTS } from '../../lib/pusher-client'
import { QUESTIONS } from '../../lib/questions'
import { EXTENDED_QUESTIONS } from '../../lib/questions-extended'
import { type Group, type Member } from '../../lib/db'
import { Btn } from '../../components/Btn'
import { Loader } from '../../components/Loader'
import { SectionLabel } from '../../components/SectionLabel'
import { LobbyMember } from '../../components/LobbyMember'

type Mode = 'quick' | 'extended'

export default function LobbyPage() {
  const { code }  = useParams<{ code: string }>()
  const router    = useRouter()
  const userId    = getUserId()
  const channelRef = useRef<ReturnType<ReturnType<typeof getPusher>['subscribe']> | null>(null)

  const [group,   setGroup]   = useState<Group | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [mode,    setMode]    = useState<Mode>('quick')

  const isOwner = group?.owner_id === userId
  const totalQ  = mode === 'extended' ? EXTENDED_QUESTIONS.length : QUESTIONS.length

  async function load() {
    const res  = await fetch(`/api/groups/${code}`)
    if (!res.ok) { router.replace('/'); return }
    const data = await res.json()
    setGroup(data.group)
    setMembers(data.members)
    addRecentGame(code, data.group.name)

    const phase = data.group.phase
    if (phase === 'game')    router.replace(`/game/${code}`)
    if (phase === 'results') router.replace(`/results/${code}`)
    if (phase === 'vote')    router.replace(`/vote/${code}`)
    if (phase === 'winner')  router.replace(`/winner/${code}`)
  }

  useEffect(() => {
    load().then(() => setLoading(false))

    const pusher  = getPusher()
    const channel = pusher.subscribe(groupChannel(code))
    channelRef.current = channel

    channel.bind(EVENTS.MEMBER_JOINED, load)
    channel.bind(EVENTS.PHASE_CHANGED, ({ phase }: { phase: string }) => {
      if (phase === 'game')    router.replace(`/game/${code}`)
      if (phase === 'results') router.replace(`/results/${code}`)
      if (phase === 'vote')    router.replace(`/vote/${code}`)
      if (phase === 'winner')  router.replace(`/winner/${code}`)
    })

    return () => { channel.unbind_all(); pusher.unsubscribe(groupChannel(code)) }
  }, [code])

  async function resetTest() {
    const res = await fetch('/api/test/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, userName: members.find(m => m.user_id === userId)?.name ?? 'Robin' }),
    })
    if (res.ok) router.replace('/lobby/TESTEN')
  }

  async function startGame() {
    trackEvent('start-game', { groupCode: code, memberCount: members.length, mode })
    await fetch(`/api/groups/${code}/phase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phase: 'game', userId, mode }),
    })
  }

  const inviteLink = typeof window !== 'undefined'
    ? `${window.location.origin}/lobby/${code}`
    : `https://tripsync-jade.vercel.app/lobby/${code}`

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader msg="Lobby laden…" /></div>

  return (
    <div className="max-w-[440px] mx-auto">
      <div className="mb-8">
        <p className="font-mono text-[11px] tracking-[.2em] uppercase text-muted mb-1">TripSync.</p>
        <h1 className="font-serif text-[32px] text-dark">{group?.name}</h1>
      </div>

      <div className="border border-dark/[.2] bg-card p-4 mb-8">
        <SectionLabel>Invite code</SectionLabel>
        <div className="flex items-center justify-between gap-4">
          <span className="font-mono text-[32px] tracking-[.25em] text-dark">{code}</span>
          <Btn variant="outline" onClick={() => navigator.clipboard.writeText(code)}>Kopieer</Btn>
        </div>
        <p className="font-mono text-[10px] text-muted mt-2 break-all">{inviteLink}</p>
      </div>

      <div className="mb-8">
        <SectionLabel>Deelnemers ({members.length})</SectionLabel>
        <div className="border border-dark/[.15] bg-card px-4">
          {members.map(m => (
            <LobbyMember
              key={m.id}
              name={m.name}
              avatarColor={m.avatar_color}
              questionsDone={m.questions_done}
              totalQuestions={totalQ}
              isYou={m.user_id === userId}
            />
          ))}
          {members.length === 0 && (
            <p className="font-mono text-[12px] text-muted py-4">Wachten op deelnemers…</p>
          )}
        </div>
      </div>

      {code === 'TESTEN' && (
        <div className="mb-6">
          <button
            onClick={resetTest}
            className="w-full border border-dark/[.2] bg-card font-mono text-[10px] tracking-[.12em] uppercase text-muted py-3 hover:border-dark/40 hover:text-dark transition-colors cursor-pointer"
          >
            ↺ Reset testgroep
          </button>
        </div>
      )}

      {isOwner ? (
        <div>
          {/* Mode selector */}
          <div className="mb-6">
            <SectionLabel>Modus</SectionLabel>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMode('quick')}
                className={`border p-4 text-left transition-all ${
                  mode === 'quick'
                    ? 'border-dark bg-dark text-bg'
                    : 'border-dark/[.2] bg-card text-dark hover:border-dark/[.5]'
                }`}
              >
                <div className="text-[22px] mb-1">⚡</div>
                <div className="font-serif text-[16px] mb-0.5">Snel</div>
                <div className="font-mono text-[10px] opacity-60">{QUESTIONS.length} vragen · ~5 min</div>
              </button>

              <button
                onClick={() => setMode('extended')}
                className={`border p-4 text-left transition-all ${
                  mode === 'extended'
                    ? 'border-dark bg-dark text-bg'
                    : 'border-dark/[.2] bg-card text-dark hover:border-dark/[.5]'
                }`}
              >
                <div className="text-[22px] mb-1">🔍</div>
                <div className="font-serif text-[16px] mb-0.5">Uitgebreid</div>
                <div className="font-mono text-[10px] opacity-60">{EXTENDED_QUESTIONS.length} vragen · 3 rondes · ~15 min</div>
              </button>
            </div>
            {mode === 'extended' && (
              <p className="font-mono text-[10px] text-muted mt-2">
                Elke ronde wacht iedereen op elkaar — daarna door.
              </p>
            )}
          </div>

          <Btn onClick={startGame} disabled={members.length < 1} fullWidth>
            {members.length < 2 ? 'Wacht op meer deelnemers…' : `Start ${mode === 'extended' ? 'uitgebreid' : 'snel'} spel →`}
          </Btn>
          <p className="font-mono text-[10px] text-muted mt-2 text-center">Jij bent de host.</p>
        </div>
      ) : (
        <div className="border border-dark/[.1] bg-card p-4 text-center">
          <Loader msg="Wachten tot de host start…" size="sm" />
        </div>
      )}
    </div>
  )
}
