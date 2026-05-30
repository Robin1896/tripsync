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

const VETO_SUBMITTED = 'veto-submitted'

export default function VetoPage() {
  const { code } = useParams<{ code: string }>()
  const router   = useRouter()
  const userId   = getUserId()

  const [group,   setGroup]   = useState<Group | null>(null)
  const [results, setResults] = useState<ScoredDestination[]>([])
  const [vetoed,  setVetoed]  = useState<string | null>(null)   // my veto
  const [others,  setOthers]  = useState<string[]>([])          // others' vetoes
  const [loading, setLoading] = useState(true)

  const isOwner = group?.owner_id === userId

  useEffect(() => {
    async function init() {
      const res = await fetch(`/api/groups/${code}`)
      if (!res.ok) { router.replace('/'); return }
      const { group: g, members } = await res.json()
      setGroup(g)

      if (g.phase === 'vote')   { router.replace(`/vote/${code}`);   return }
      if (g.phase === 'winner') { router.replace(`/winner/${code}`); return }

      const allAnswers: { userId: string; answers: AnswerMap }[] = await Promise.all(
        members.map(async (m: Member) => {
          const r = await fetch(`/api/answers?groupId=${g.id}&userId=${m.user_id}`)
          const { answers } = await r.json()
          const map: AnswerMap = {}
          for (const a of answers) map[a.question_id] = a.value.includes(',') ? a.value.split(',') : a.value
          return { userId: m.user_id, answers: map }
        })
      )
      setResults(computeResults(allAnswers))

      // Load existing vetoes
      const vr = await fetch(`/api/veto?groupId=${g.id}`)
      const { vetoes } = await vr.json()
      const mine = vetoes.find((v: { user_id: string }) => v.user_id === userId)
      if (mine) setVetoed(mine.destination_id)
      setOthers(vetoes.filter((v: { user_id: string }) => v.user_id !== userId).map((v: { destination_id: string }) => v.destination_id))
      setLoading(false)
    }
    init()

    const pusher  = getPusher()
    const channel = pusher.subscribe(groupChannel(code))
    channel.bind(EVENTS.PHASE_CHANGED, ({ phase }: { phase: string }) => {
      if (phase === 'vote')   router.replace(`/vote/${code}`)
      if (phase === 'winner') router.replace(`/winner/${code}`)
    })
    channel.bind(VETO_SUBMITTED, ({ userId: uid, destinationId }: { userId: string; destinationId: string }) => {
      if (uid !== userId) setOthers(prev => [...prev.filter(d => d !== destinationId), destinationId])
    })
    return () => { channel.unbind_all(); pusher.unsubscribe(groupChannel(code)) }
  }, [code])

  async function submitVeto(destId: string) {
    if (vetoed || !group) return
    await fetch('/api/veto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      body: JSON.stringify({ groupId: group.id, code, destinationId: destId }),
    })
    setVetoed(destId)
  }

  async function proceedToVote() {
    if (!group) return
    await fetch(`/api/groups/${code}/phase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phase: 'vote', userId }),
    })
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader msg="Veto-ronde laden…" /></div>

  // Filter out vetoed destinations from display after veto locked in
  const effectiveResults = results.filter(r => !others.includes(r.destination.id))

  return (
    <div className="max-w-[440px] mx-auto">
      <div className="mb-4">
        <p className="font-mono text-[11px] tracking-[.2em] uppercase text-muted mb-1">TripSync.</p>
        <h1 className="font-serif text-[32px] text-dark">Veto-ronde</h1>
        <p className="font-sans text-[13px] text-muted mt-1">
          {vetoed ? 'Jij hebt je veto gebruikt.' : 'Kies 1 bestemming om te blokkeren.'}
        </p>
      </div>

      {others.length > 0 && (
        <div className="border border-dark/[.1] bg-card px-4 py-2.5 mb-4">
          <p className="font-mono text-[9px] uppercase tracking-widest text-muted">
            Geblokkeerd door anderen: {others.length}×
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2.5 mb-6">
        {results.map(r => {
          const isVetoed  = others.includes(r.destination.id)
          const isMyVeto  = vetoed === r.destination.id

          return (
            <div
              key={r.destination.id}
              onClick={() => !vetoed && !isVetoed ? submitVeto(r.destination.id) : undefined}
              className={[
                'border overflow-hidden transition-all',
                isVetoed  ? 'opacity-35 grayscale' : '',
                isMyVeto  ? 'border-brand' : 'border-dark/[.2]',
                !vetoed && !isVetoed ? 'cursor-pointer hover:border-dark' : '',
              ].join(' ')}
            >
              <div className="relative h-[80px] overflow-hidden">
                <Image src={r.destination.image} alt={r.destination.city} fill className="object-cover" sizes="440px" />
                <div className="absolute inset-0 bg-gradient-to-t from-dark/60 to-transparent" />
                {isMyVeto && (
                  <div className="absolute inset-0 bg-brand/20 flex items-center justify-center">
                    <span className="font-mono text-[13px] text-brand font-medium bg-bg/80 px-3 py-1">🚫 Geblokkeerd</span>
                  </div>
                )}
                {isVetoed && !isMyVeto && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-mono text-[11px] text-muted bg-bg/80 px-2 py-0.5">Geblokkeerd</span>
                  </div>
                )}
                <div className="absolute bottom-2 left-3">
                  <p className="font-serif text-[16px] text-bg">{r.destination.city}</p>
                </div>
                <div className="absolute bottom-2 right-3">
                  <p className="font-sans text-[15px] font-medium text-brand">{r.score}%</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {vetoed && (
        <div className="border border-dark/[.1] bg-card p-4 text-center mb-4">
          <p className="font-sans text-[13px] text-muted">Wachten tot iedereen klaar is…</p>
        </div>
      )}

      {isOwner && (
        <Btn onClick={proceedToVote} fullWidth variant="outline">
          Doorgaan naar stemronde →
        </Btn>
      )}
    </div>
  )
}
