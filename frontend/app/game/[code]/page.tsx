'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, getUserId } from '../../lib/supabase'
import { QUESTIONS } from '../../lib/questions'
import { QuestionCard } from '../../components/QuestionCard'
import { ProgressBar } from '../../components/ProgressBar'
import { Loader } from '../../components/Loader'

export default function GamePage() {
  const { code }  = useParams<{ code: string }>()
  const router    = useRouter()
  const userId    = getUserId()

  const [groupId,  setGroupId]  = useState<string>('')
  const [qIndex,   setQIndex]   = useState(0)
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [done,     setDone]     = useState(false)

  useEffect(() => {
    async function init() {
      const { data: g } = await supabase.from('groups').select().eq('invite_code', code).single()
      if (!g) { router.replace('/'); return }

      if (g.phase === 'results') { router.replace(`/results/${code}`); return }
      if (g.phase === 'lobby')   { router.replace(`/lobby/${code}`);   return }
      if (g.phase === 'winner')  { router.replace(`/winner/${code}`);  return }

      setGroupId(g.id)

      // Find which questions already answered
      const { data: ans } = await supabase.from('answers').select().eq('group_id', g.id).eq('user_id', userId)
      const answeredIds = new Set((ans ?? []).map((a: { question_id: string }) => a.question_id))
      const firstUnanswered = QUESTIONS.findIndex(q => !answeredIds.has(q.id))
      if (firstUnanswered === -1) {
        setDone(true)
      } else {
        setQIndex(firstUnanswered)
      }
      setLoading(false)
    }
    init()

    const ch = supabase
      .channel(`game-phase-${code}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'groups', filter: `invite_code=eq.${code}` }, (payload) => {
        const g2 = payload.new as { phase: string }
        if (g2.phase === 'results') router.replace(`/results/${code}`)
        if (g2.phase === 'vote')    router.replace(`/vote/${code}`)
        if (g2.phase === 'winner')  router.replace(`/winner/${code}`)
      })
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [code, router, userId])

  const handleAnswer = useCallback(async (value: string | string[]) => {
    if (!groupId || saving) return
    setSaving(true)
    const q = QUESTIONS[qIndex]
    const stored = Array.isArray(value) ? value.join(',') : value

    await supabase.from('answers').upsert({
      group_id: groupId, user_id: userId,
      question_id: q.id, value: stored,
    }, { onConflict: 'group_id,user_id,question_id' })

    const nextIndex = qIndex + 1
    if (nextIndex >= QUESTIONS.length) {
      // Mark done
      await supabase.from('group_members')
        .update({ questions_done: QUESTIONS.length })
        .eq('group_id', groupId).eq('user_id', userId)

      // Check if all done → advance phase
      const { data: members } = await supabase.from('group_members').select().eq('group_id', groupId)
      const allDone = (members ?? []).every((m: { questions_done: number }) => m.questions_done >= QUESTIONS.length)
      if (allDone) {
        await supabase.from('groups').update({ phase: 'results' }).eq('id', groupId)
      }
      setDone(true)
    } else {
      // Update progress
      await supabase.from('group_members')
        .update({ questions_done: nextIndex })
        .eq('group_id', groupId).eq('user_id', userId)
      setQIndex(nextIndex)
    }
    setSaving(false)
  }, [groupId, qIndex, saving, userId])

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
            Jouw voorkeuren zijn opgeslagen.<br />
            We wachten op de rest van de groep…
          </p>
          <div className="mt-8">
            <Loader msg="Wachten op anderen…" />
          </div>
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
