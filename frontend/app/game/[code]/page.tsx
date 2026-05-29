'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getUserId } from '../../lib/user'
import { getPusher, groupChannel, EVENTS } from '../../lib/pusher-client'
import { QUESTIONS } from '../../lib/questions'
import { QuestionCard } from '../../components/QuestionCard'
import { ProgressBar } from '../../components/ProgressBar'
import { Loader } from '../../components/Loader'

export default function GamePage() {
  const { code } = useParams<{ code: string }>()
  const router   = useRouter()
  const userId   = getUserId()

  const [groupId, setGroupId] = useState('')
  const [qIndex,  setQIndex]  = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [done,    setDone]    = useState(false)

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

        setGroupId(g.id)

        const ans = await fetch(`/api/answers?groupId=${g.id}&userId=${userId}`)
        const { answers } = await ans.json()
        const answeredIds = new Set(answers.map((a: { question_id: string }) => a.question_id))
        const first = QUESTIONS.findIndex(q => !answeredIds.has(q.id))
        if (first === -1) setDone(true)
        else setQIndex(first)
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
    return () => { channel.unbind_all(); pusher.unsubscribe(groupChannel(code)) }
  }, [code])

  const handleAnswer = useCallback(async (value: string | string[]) => {
    if (!groupId || saving) return
    setSaving(true)
    const q      = QUESTIONS[qIndex]
    const stored = Array.isArray(value) ? value.join(',') : value

    await fetch('/api/answers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId, code, userId, questionId: q.id, value: stored }),
    })

    const next = qIndex + 1
    if (next >= QUESTIONS.length) setDone(true)
    else setQIndex(next)
    setSaving(false)
  }, [groupId, qIndex, saving, userId, code])

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader msg="Laden…" /></div>

  return (
    <div className="max-w-[440px] mx-auto">
      <div className="mb-8">
        <p className="font-mono text-[11px] tracking-[.2em] uppercase text-muted mb-4">TripSync.</p>
        <ProgressBar current={qIndex} total={QUESTIONS.length} label="Vragen" />
      </div>

      {done ? (
        <div className="text-center py-16 fade-in">
          <p className="font-serif text-[32px] text-dark mb-3">Klaar! ✓</p>
          <p className="font-sans text-[14px] text-muted leading-relaxed">
            Jouw voorkeuren zijn opgeslagen.<br />We wachten op de rest van de groep…
          </p>
          <div className="mt-8"><Loader msg="Wachten op anderen…" /></div>
        </div>
      ) : (
        <QuestionCard
          key={qIndex}
          question={QUESTIONS[qIndex]}
          onAnswer={handleAnswer}
          disabled={saving}
        />
      )}
    </div>
  )
}
