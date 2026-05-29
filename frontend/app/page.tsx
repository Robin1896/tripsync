'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getUserId, getUserName, setUserName, getAvatarColor, generateInviteCode } from './lib/supabase'
import { Btn } from './components/Btn'
import { Loader } from './components/Loader'
import { SectionLabel } from './components/SectionLabel'

type Mode = 'home' | 'create' | 'join' | 'loading'

export default function HomePage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('home')
  const [groupName, setGroupName] = useState('')
  const [joinCode, setJoinCode]   = useState('')
  const [userName, setUserNameState] = useState('')
  const [error, setError]         = useState('')

  useEffect(() => {
    const saved = getUserName()
    if (saved) setUserNameState(saved)
  }, [])

  async function createGroup() {
    if (!groupName.trim() || !userName.trim()) { setError('Vul alle velden in.'); return }
    setMode('loading')
    setError('')
    const userId = getUserId()
    setUserName(userName.trim())

    const code = generateInviteCode()
    const { data: group, error: ge } = await supabase
      .from('groups')
      .insert({ name: groupName.trim(), invite_code: code, owner_id: userId, phase: 'lobby' })
      .select()
      .single()

    if (ge || !group) { setError('Kon groep niet aanmaken.'); setMode('create'); return }

    await supabase.from('group_members').insert({
      group_id: group.id,
      user_id: userId,
      name: userName.trim(),
      avatar_color: getAvatarColor(userId),
      questions_done: 0,
    })

    router.push(`/lobby/${code}`)
  }

  async function joinGroup() {
    if (!joinCode.trim() || !userName.trim()) { setError('Vul alle velden in.'); return }
    setMode('loading')
    setError('')
    const userId = getUserId()
    setUserName(userName.trim())
    const code = joinCode.trim().toUpperCase()

    const { data: group } = await supabase
      .from('groups')
      .select()
      .eq('invite_code', code)
      .single()

    if (!group) { setError('Groep niet gevonden. Controleer de code.'); setMode('join'); return }

    await supabase.from('group_members').upsert({
      group_id: group.id,
      user_id: userId,
      name: userName.trim(),
      avatar_color: getAvatarColor(userId),
      questions_done: 0,
    }, { onConflict: 'group_id,user_id' })

    router.push(`/lobby/${code}`)
  }

  if (mode === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader msg="Verbinden…" />
      </div>
    )
  }

  return (
    <div className="max-w-[440px] mx-auto">
      {/* Header */}
      <div className="mb-10">
        <p className="font-mono text-[11px] tracking-[.2em] uppercase text-muted mb-2">TripSync.</p>
        <h1 className="font-serif text-[42px] leading-[1.05] text-dark">
          Stop discussiëren.<br />
          <em>Begin reizen.</em>
        </h1>
        <p className="font-sans text-[14px] text-muted mt-3 leading-relaxed">
          Kies samen de perfecte vakantiebestemming via realtime matching.
        </p>
      </div>

      {mode === 'home' && (
        <div className="flex flex-col gap-3 fade-up">
          <Btn onClick={() => setMode('create')} fullWidth>Nieuwe groep aanmaken</Btn>
          <Btn variant="outline" onClick={() => setMode('join')} fullWidth>Meedoen met code</Btn>
        </div>
      )}

      {(mode === 'create' || mode === 'join') && (
        <div className="fade-up flex flex-col gap-4">
          <div>
            <SectionLabel>Jouw naam</SectionLabel>
            <input
              type="text"
              value={userName}
              onChange={e => setUserNameState(e.target.value)}
              placeholder="Robin"
              className="w-full border border-dark/[.3] bg-card px-4 py-3 font-sans text-[15px] text-dark placeholder:text-dim focus:outline-none focus:border-dark"
            />
          </div>

          {mode === 'create' && (
            <div>
              <SectionLabel>Groepsnaam</SectionLabel>
              <input
                type="text"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                placeholder="Zomer 2027"
                className="w-full border border-dark/[.3] bg-card px-4 py-3 font-sans text-[15px] text-dark placeholder:text-dim focus:outline-none focus:border-dark"
              />
            </div>
          )}

          {mode === 'join' && (
            <div>
              <SectionLabel>Invite code</SectionLabel>
              <input
                type="text"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ABCD12"
                maxLength={6}
                className="w-full border border-dark/[.3] bg-card px-4 py-3 font-mono text-[20px] tracking-[.3em] text-dark placeholder:text-dim focus:outline-none focus:border-dark uppercase"
              />
            </div>
          )}

          {error && (
            <p className="font-mono text-[11px] text-brand tracking-[.06em]">{error}</p>
          )}

          <div className="flex gap-3">
            <Btn variant="outline" onClick={() => { setMode('home'); setError('') }}>← Terug</Btn>
            <Btn
              onClick={mode === 'create' ? createGroup : joinGroup}
              fullWidth
            >
              {mode === 'create' ? 'Aanmaken' : 'Deelnemen'}
            </Btn>
          </div>
        </div>
      )}

      {/* How it works */}
      {mode === 'home' && (
        <div className="mt-14">
          <SectionLabel>Hoe werkt het?</SectionLabel>
          <div className="flex flex-col gap-0">
            {[
              ['01', 'Maak een groep aan', 'Deel de code of link met je reisgezelschap.'],
              ['02', 'Beantwoord vragen', 'Iedereen vult hun voorkeuren in. Klimaat, budget, type vakantie.'],
              ['03', 'Bekijk de wereldbol', 'TripSync berekent realtime welke bestemmingen passen.'],
              ['04', 'Stem op je favoriet', 'De groep kiest samen de winnaar.'],
            ].map(([num, title, desc]) => (
              <div key={num} className="flex gap-4 py-4 border-b border-dark/[.08] last:border-0">
                <span className="font-mono text-[11px] text-muted tracking-[.1em] mt-[3px] w-5 flex-shrink-0">{num}</span>
                <div>
                  <p className="font-sans text-[14px] font-medium text-dark">{title}</p>
                  <p className="font-sans text-[12px] text-muted mt-[3px]">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
