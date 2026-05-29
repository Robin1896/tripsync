'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, getUserId, type Group, type GroupMember } from '../../lib/supabase'
import { QUESTIONS } from '../../lib/questions'
import { Btn } from '../../components/Btn'
import { Loader } from '../../components/Loader'
import { SectionLabel } from '../../components/SectionLabel'
import { LobbyMember } from '../../components/LobbyMember'

export default function LobbyPage() {
  const { code }   = useParams<{ code: string }>()
  const router     = useRouter()
  const userId     = getUserId()
  const totalQ     = QUESTIONS.length

  const [group,   setGroup]   = useState<Group | null>(null)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [loading, setLoading] = useState(true)

  const isOwner  = group?.owner_id === userId
  const allDone  = members.length > 0 && members.every(m => m.questions_done >= totalQ)

  useEffect(() => {
    async function init() {
      const { data: g } = await supabase.from('groups').select().eq('invite_code', code).single()
      if (!g) { router.replace('/'); return }
      setGroup(g)

      if (g.phase === 'game')    router.replace(`/game/${code}`)
      if (g.phase === 'results') router.replace(`/results/${code}`)
      if (g.phase === 'vote')    router.replace(`/vote/${code}`)
      if (g.phase === 'winner')  router.replace(`/winner/${code}`)

      const { data: ms } = await supabase.from('group_members').select().eq('group_id', g.id)
      setMembers(ms ?? [])
      setLoading(false)
    }
    init()

    const ch = supabase
      .channel(`lobby-${code}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_members' }, async () => {
        const { data: g2 } = await supabase.from('groups').select().eq('invite_code', code).single()
        if (!g2) return
        const { data: ms } = await supabase.from('group_members').select().eq('group_id', g2.id)
        setMembers(ms ?? [])
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'groups', filter: `invite_code=eq.${code}` }, (payload) => {
        const g2 = payload.new as Group
        setGroup(g2)
        if (g2.phase === 'game')    router.replace(`/game/${code}`)
        if (g2.phase === 'results') router.replace(`/results/${code}`)
        if (g2.phase === 'vote')    router.replace(`/vote/${code}`)
        if (g2.phase === 'winner')  router.replace(`/winner/${code}`)
      })
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [code, router])

  async function startGame() {
    if (!group) return
    await supabase.from('groups').update({ phase: 'game' }).eq('id', group.id)
  }

  const inviteLink = typeof window !== 'undefined'
    ? `${window.location.origin}/lobby/${code}`
    : `https://tripsync.app/lobby/${code}`

  function copyCode() {
    navigator.clipboard.writeText(code)
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader msg="Lobby laden…" /></div>
  }

  return (
    <div className="max-w-[440px] mx-auto">
      <div className="mb-8">
        <p className="font-mono text-[11px] tracking-[.2em] uppercase text-muted mb-1">TripSync.</p>
        <h1 className="font-serif text-[32px] text-dark">{group?.name}</h1>
      </div>

      {/* Invite */}
      <div className="border border-dark/[.2] bg-card p-4 mb-8">
        <SectionLabel>Invite code</SectionLabel>
        <div className="flex items-center justify-between gap-4">
          <span className="font-mono text-[32px] tracking-[.25em] text-dark">{code}</span>
          <Btn variant="outline" onClick={copyCode}>Kopieer</Btn>
        </div>
        <p className="font-mono text-[10px] text-muted mt-2 break-all">{inviteLink}</p>
      </div>

      {/* Members */}
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

      {/* Start */}
      {isOwner ? (
        <div>
          <Btn
            onClick={startGame}
            disabled={members.length < 1}
            fullWidth
          >
            {members.length < 2 ? 'Wacht op meer deelnemers…' : 'Start het spel →'}
          </Btn>
          <p className="font-mono text-[10px] text-muted mt-2 text-center">Jij bent de host. Alleen jij kan starten.</p>
        </div>
      ) : (
        <div className="border border-dark/[.1] bg-card p-4 text-center">
          <Loader msg="Wachten tot de host start…" size="sm" />
        </div>
      )}
    </div>
  )
}
