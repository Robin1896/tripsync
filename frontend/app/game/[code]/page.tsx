'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getUserId, addRecentGame } from '../../lib/user'
import { trackEvent } from '../../lib/tracker'
import { getPusher, groupChannel, EVENTS, watchConnection } from '../../lib/pusher-client'
import { QUESTIONS } from '../../lib/questions'
import { EXTENDED_QUESTIONS, EXTENDED_ROUNDS } from '../../lib/questions-extended'
import { QuestionCard } from '../../components/QuestionCard'
import { ProgressBar } from '../../components/ProgressBar'
import { DestinationCloud } from '../../components/DestinationCloud'
import { DestinationReactions } from '../../components/DestinationReactions'
import { Loader } from '../../components/Loader'
import { computePartialResults, type AnswerMap } from '../../lib/engine'

type Mode = 'quick' | 'extended'

interface MemberInfo {
  userId: string
  name: string
  avatarColor: string
  questionsDone: number
}

interface RoundWaitState {
  round: number
  label: string
  emoji: string
  next: { label: string; emoji: string } | null
}

export default function GamePage() {
  const { code } = useParams<{ code: string }>()
  const router   = useRouter()
  const userId   = getUserId()

  const [groupId,     setGroupId]     = useState('')
  const [mode,        setMode]        = useState<Mode>('quick')
  const [qIndex,      setQIndex]      = useState(0)
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [done,        setDone]        = useState(false)
  const [waitRound,   setWaitRound]   = useState<RoundWaitState | null>(null)
  const [members,     setMembers]     = useState<MemberInfo[]>([])
  const [myAnswers,   setMyAnswers]   = useState<AnswerMap>({})
  const [cloudItems,  setCloudItems]  = useState<{ id: string; city: string; emoji: string; strength: number }[]>([])

  // Track which round-complete events arrived before waitRound was shown (race condition fix)
  const completedRounds = useRef<Set<number>>(new Set())

  const questions = mode === 'extended' ? EXTENDED_QUESTIONS : QUESTIONS

  const me       = members.find(m => m.userId === userId)
  const opponent = members.find(m => m.userId !== userId)

  useEffect(() => {
    async function init() {
      try {
        const res  = await fetch(`/api/groups/${code}`)
        if (!res.ok) { router.replace('/'); return }
        const data = await res.json()
        const g    = data.group

        if (g.phase === 'results') { router.replace(`/results/${code}`); return }
        if (g.phase === 'lobby')   { router.replace(`/lobby/${code}`);   return }
        if (g.phase === 'winner')  { router.replace(`/winner/${code}`);  return }

        const gameMode: Mode = g.mode === 'extended' ? 'extended' : 'quick'
        setGroupId(g.id)
        setMode(gameMode)
        addRecentGame(code, g.name)

        const memberList: MemberInfo[] = (data.members ?? []).map((m: {
          user_id: string; name: string; avatar_color: string; questions_done: number
        }) => ({
          userId: m.user_id,
          name: m.name,
          avatarColor: m.avatar_color,
          questionsDone: m.questions_done,
        }))
        setMembers(memberList)

        const qs = gameMode === 'extended' ? EXTENDED_QUESTIONS : QUESTIONS

        const ans = await fetch(`/api/answers?groupId=${g.id}&userId=${userId}`)
        const { answers } = await ans.json()
        const answeredIds = new Set(answers.map((a: { question_id: string }) => a.question_id))

        // Build answer map for partial scoring
        const aMap: AnswerMap = {}
        for (const a of answers) {
          aMap[a.question_id] = a.value.includes(',') ? a.value.split(',') : a.value
        }
        setMyAnswers(aMap)
        const partial = computePartialResults(aMap)
        setCloudItems(partial.map(r => ({ id: r.destination.id, city: r.destination.city, emoji: r.destination.emoji, strength: r.strength })))

        const first = qs.findIndex(q => !answeredIds.has(q.id))
        if (first === -1) {
          setDone(true)
        } else {
          if (gameMode === 'extended') {
            const doneCount = answeredIds.size
            const blockingRound = EXTENDED_ROUNDS.find(
              r => doneCount === r.to + 1 && first === r.to + 1
            )
            // Only show wait screen if that round's complete event hasn't already arrived
            if (blockingRound && !completedRounds.current.has(blockingRound.round)) {
              const nextRound = EXTENDED_ROUNDS.find(r => r.round === blockingRound.round + 1)
              setWaitRound({
                round: blockingRound.round,
                label: blockingRound.label,
                emoji: blockingRound.emoji,
                next: nextRound ? { label: nextRound.label, emoji: nextRound.emoji } : null,
              })
            }
          }
          setQIndex(first)
        }
        setLoading(false)
      } catch {
        router.replace('/')
      }
    }
    init()

    const pusher  = getPusher()
    const channel = pusher.subscribe(groupChannel(code))

    channel.bind(EVENTS.PHASE_CHANGED, ({ phase }: { phase: string }) => {
      if (phase === 'results') router.replace(`/results/${code}`)
      if (phase === 'vote')    router.replace(`/vote/${code}`)
      if (phase === 'winner')  router.replace(`/winner/${code}`)
    })

    channel.bind(EVENTS.ANSWER_SUBMITTED, ({ userId: uid, questionsDone }: { userId: string; questionsDone: number }) => {
      setMembers(prev => prev.map(m => m.userId === uid ? { ...m, questionsDone } : m))
    })

    channel.bind(EVENTS.ROUND_COMPLETE, ({ round, boundary }: { round: number; boundary: number }) => {
      completedRounds.current.add(round)
      setWaitRound(prev => (prev?.round === round ? null : prev))
      // Guard: don't set qIndex out of bounds (last round boundary === total questions)
      setQIndex(prev => boundary < questions.length ? boundary : prev)
    })

    let pollInterval: ReturnType<typeof setInterval> | null = null

    const stopWatch = watchConnection(
      () => {
        // Pusher disconnected → poll every 5s
        if (!pollInterval) {
          pollInterval = setInterval(async () => {
            try {
              const r = await fetch(`/api/groups/${code}`)
              if (!r.ok) return
              const { group: g, members: ms } = await r.json()
              if (g.phase === 'results') router.replace(`/results/${code}`)
              if (g.phase === 'vote')    router.replace(`/vote/${code}`)
              if (ms) {
                setMembers(ms.map((m: { user_id: string; name: string; avatar_color: string; questions_done: number }) => ({
                  userId: m.user_id, name: m.name, avatarColor: m.avatar_color, questionsDone: m.questions_done,
                })))
              }
            } catch { /* ignore */ }
          }, 5000)
        }
      },
      () => {
        if (pollInterval) { clearInterval(pollInterval); pollInterval = null }
      },
    )

    return () => {
      channel.unbind_all()
      pusher.unsubscribe(groupChannel(code))
      stopWatch()
      if (pollInterval) clearInterval(pollInterval)
    }
  }, [code])

  const handleAnswer = useCallback(async (value: string | string[]) => {
    if (!groupId || saving) return
    setSaving(true)
    const q      = questions[qIndex]
    const stored = Array.isArray(value) ? value.join(',') : value

    trackEvent('answer-question', { questionId: q.id, questionIndex: qIndex, mode })
    await fetch('/api/answers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId, code, userId, questionId: q.id, value: stored }),
    })

    // Update cloud with new answer
    const updatedAnswers = { ...myAnswers, [q.id]: Array.isArray(value) ? value : stored }
    setMyAnswers(updatedAnswers)
    const partial = computePartialResults(updatedAnswers)
    setCloudItems(partial.map(r => ({ id: r.destination.id, city: r.destination.city, emoji: r.destination.emoji, strength: r.strength })))

    const next = qIndex + 1
    setMembers(prev => prev.map(m => m.userId === userId ? { ...m, questionsDone: next } : m))

    if (next >= questions.length) {
      setDone(true)
    } else if (mode === 'extended') {
      const finishedRound = EXTENDED_ROUNDS.find(r => r.to + 1 === next)
      if (finishedRound) {
        // Only show wait screen if ROUND_COMPLETE hasn't already arrived for this round
        if (!completedRounds.current.has(finishedRound.round)) {
          const nextRound = EXTENDED_ROUNDS.find(r => r.round === finishedRound.round + 1)
          setWaitRound({
            round: finishedRound.round,
            label: finishedRound.label,
            emoji: finishedRound.emoji,
            next: nextRound ? { label: nextRound.label, emoji: nextRound.emoji } : null,
          })
        }
        setQIndex(next)
      } else {
        setQIndex(next)
      }
    } else {
      setQIndex(next)
    }
    setSaving(false)
  }, [groupId, qIndex, saving, userId, code, questions, mode])

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader msg="Laden…" /></div>

  // Round waiting screen
  if (waitRound) {
    const total = questions.length
    return (
      <div className="max-w-[440px] mx-auto flex flex-col gap-3 fade-in">
        {/* Round complete header */}
        <div className="text-center round-burst">
          <div className="text-[36px] mb-1">{waitRound.emoji}</div>
          <p className="font-mono text-[10px] tracking-[.2em] uppercase text-muted mb-0.5">
            Ronde {waitRound.round} voltooid
          </p>
          <h2 className="font-serif text-[22px] text-dark mb-0.5">{waitRound.label}</h2>
          <p className="font-sans text-[12px] text-muted">
            Jij bent klaar — wachten tot iedereen klaar is.
          </p>
        </div>

        {/* Member progress */}
        <div className="flex flex-col gap-1.5">
          {members.map(m => {
            const pct   = Math.min(100, Math.round((m.questionsDone / total) * 100))
            const isMe  = m.userId === userId
            const isDone = m.questionsDone >= total
            return (
              <div key={m.userId} className="bg-card border border-dark/[.1] px-3 py-2.5">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: m.avatarColor }}
                    >
                      <span className="font-mono text-[8px] text-bg font-bold uppercase">
                        {m.name.charAt(0)}
                      </span>
                    </div>
                    <span className="font-sans text-[13px] font-medium text-dark">
                      {m.name}{isMe ? ' (jij)' : ''}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-muted">
                    {isDone ? '✓ Klaar' : `${m.questionsDone}/${total}`}
                  </span>
                </div>
                <div className="h-[2px] bg-dim w-full rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: isDone ? '#2d7a3a' : m.avatarColor,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Live destination cloud */}
        {cloudItems.length > 0 && (
          <div className="border border-dark/[.1] bg-card px-4 py-4">
            <DestinationCloud
              items={cloudItems}
              answeredCount={me?.questionsDone ?? qIndex}
              totalQuestions={questions.length}
            />
          </div>
        )}

        {/* Emoji reactions on destinations */}
        <DestinationReactions code={code} myAnswers={myAnswers} />

        {/* Next round preview */}
        {waitRound.next && (
          <div className="border border-dark/[.12] bg-card px-3 py-2.5">
            <p className="font-mono text-[9px] uppercase tracking-widest text-muted mb-0.5">Volgende ronde</p>
            <p className="font-serif text-[16px] text-dark">
              {waitRound.next.emoji} {waitRound.next.label}
            </p>
          </div>
        )}

        {/* Nav buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/')}
            className="flex-1 border border-dark/[.2] bg-card font-mono text-[10px] tracking-[.12em] uppercase text-muted py-2.5 cursor-pointer hover:border-dark/40 transition-colors"
          >
            ← Hoofdmenu
          </button>
          <button
            onClick={() => router.push('/?register=1')}
            className="flex-1 border border-brand/40 bg-card font-mono text-[10px] tracking-[.12em] uppercase text-brand py-2.5 cursor-pointer hover:bg-brand/5 transition-colors"
          >
            Account aanmaken ↗
          </button>
        </div>

        {code === 'TESTEN' && (
          <button
            onClick={async () => {
              const res = await fetch('/api/test/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, userName: members.find(m => m.userId === userId)?.name ?? 'Robin' }),
              })
              if (res.ok) router.replace('/lobby/TESTEN')
            }}
            className="w-full border border-dark/[.2] bg-card font-mono text-[10px] tracking-[.12em] uppercase text-muted py-3 hover:border-dark/40 hover:text-dark transition-colors cursor-pointer"
          >
            ↺ Reset testgroep
          </button>
        )}

        <div className="text-center">
          <Loader msg="Wachten op de groep…" />
        </div>
      </div>
    )
  }

  // Round progress indicator
  const currentRound = mode === 'extended'
    ? EXTENDED_ROUNDS.find(r => qIndex >= r.from && qIndex <= r.to)
    : null

  return (
    <div className="max-w-[440px] mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <p className="font-mono text-[11px] tracking-[.2em] uppercase text-muted">TripSync.</p>
          <button
            onClick={() => router.push('/')}
            className="font-mono text-[10px] tracking-[.1em] uppercase text-muted hover:text-dark transition-colors cursor-pointer"
          >
            ← Hoofdmenu
          </button>
        </div>

        {currentRound && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[16px]">{currentRound.emoji}</span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
              Ronde {currentRound.round} · {currentRound.label}
            </span>
          </div>
        )}

        <ProgressBar
          current={me?.questionsDone ?? qIndex}
          total={questions.length}
          label={currentRound ? `Ronde ${currentRound.round}` : 'Vragen'}
          opponents={members.filter(m => m.userId !== userId).map(m => ({
            name: m.name,
            done: m.questionsDone,
            color: m.avatarColor,
          }))}
        />
      </div>

      {done ? (
        <div className="text-center py-16 fade-in">
          <p className="font-serif text-[32px] text-dark mb-3">Klaar! ✓</p>
          <p className="font-sans text-[14px] text-muted leading-relaxed">
            Jouw voorkeuren zijn opgeslagen.<br />We wachten op de rest van de groep…
          </p>
          <div className="mt-8"><Loader msg="Wachten op anderen…" /></div>
          {code === 'TESTEN' && (
            <button
              onClick={async () => {
                const res = await fetch('/api/test/reset', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userId, userName: members.find(m => m.userId === userId)?.name ?? 'Robin' }),
                })
                if (res.ok) router.replace('/lobby/TESTEN')
              }}
              className="mt-6 border border-dark/[.2] bg-card font-mono text-[10px] tracking-[.12em] uppercase text-muted px-6 py-3 hover:border-dark/40 hover:text-dark transition-colors cursor-pointer"
            >
              ↺ Reset testgroep
            </button>
          )}
        </div>
      ) : questions[qIndex] ? (
        <>
          <div key={qIndex} className="slide-right overflow-x-hidden">
            <QuestionCard
              question={questions[qIndex]}
              onAnswer={handleAnswer}
              disabled={saving}
            />
          </div>
          {cloudItems.length > 0 && (
            <div className="mt-6 border border-dark/[.08] bg-card/60 px-3 py-3 fade-in">
              <DestinationCloud
                items={cloudItems}
                answeredCount={me?.questionsDone ?? qIndex}
                totalQuestions={questions.length}
              />
            </div>
          )}
        </>
      ) : (
        <div className="flex items-center justify-center py-16">
          <Loader msg="Laden…" />
        </div>
      )}
    </div>
  )
}
