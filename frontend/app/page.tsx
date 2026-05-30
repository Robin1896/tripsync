'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  getUserId, getUserName, setUserName,
  getUserEmail, setUserEmail,
  getRecentGames, addRecentGame, type RecentGame,
} from './lib/user'
import { trackEvent } from './lib/tracker'
import { Btn } from './components/Btn'
import { Loader } from './components/Loader'
import { SectionLabel } from './components/SectionLabel'

type Mode = 'home' | 'create' | 'join' | 'account' | 'loading'

function HomeContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const [mode,        setMode]        = useState<Mode>('home')
  const [groupName,   setGroupName]   = useState('')
  const [joinCode,    setJoinCode]    = useState('')
  const [userName,    setUserNameState] = useState('')
  const [userEmail,   setUserEmailState] = useState('')
  const [error,       setError]       = useState('')
  const [saved,       setSaved]       = useState(false)
  const [recentGames, setRecentGames] = useState<RecentGame[]>([])
  const [deleting,    setDeleting]    = useState(false)

  useEffect(() => {
    const localName  = getUserName()
    const localEmail = getUserEmail()
    setUserNameState(localName)
    setUserEmailState(localEmail)
    setRecentGames(getRecentGames())
    if (searchParams.get('register') === '1') setMode('account')

    // Sync from DB
    const userId = getUserId()
    if (userId) {
      fetch(`/api/account?userId=${userId}`)
        .then(r => r.json())
        .then(({ user }) => {
          if (user) {
            if (user.name && !localName)  { setUserName(user.name);  setUserNameState(user.name) }
            if (user.email && !localEmail) { setUserEmail(user.email); setUserEmailState(user.email) }
          }
        })
        .catch(() => {})
    }
  }, [searchParams])

  async function createGroup() {
    if (!groupName.trim() || !userName.trim()) { setError('Vul alle velden in.'); return }
    setMode('loading')
    setError('')
    const userId = getUserId()
    const trimmedName = userName.trim()
    setUserName(trimmedName)

    // Save name to DB so it syncs across devices
    fetch('/api/account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, name: trimmedName, email: userEmail.trim() }),
    }).catch(() => {})

    trackEvent('create-group')
    const res  = await fetch('/api/groups/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: groupName.trim(), userId, userName: trimmedName }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Fout'); setMode('create'); return }
    addRecentGame(data.code, groupName.trim())
    router.push(`/lobby/${data.code}`)
  }

  async function joinGroup() {
    if (!joinCode.trim() || !userName.trim()) { setError('Vul alle velden in.'); return }
    setMode('loading')
    setError('')
    const userId = getUserId()
    const trimmedName = userName.trim()
    setUserName(trimmedName)
    const code = joinCode.trim().toUpperCase()

    // Save name to DB so it syncs across devices
    fetch('/api/account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, name: trimmedName, email: userEmail.trim() }),
    }).catch(() => {})

    trackEvent('join-group')
    const res  = await fetch(`/api/groups/${code}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, userName: trimmedName }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Groep niet gevonden.'); setMode('join'); return }
    addRecentGame(code, data.group?.name ?? code)
    router.push(`/lobby/${code}`)
  }

  async function saveAccount() {
    if (!userName.trim()) { setError('Vul je naam in.'); return }
    setUserName(userName.trim())
    setUserEmail(userEmail.trim())
    const userId = getUserId()
    try {
      await fetch('/api/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, name: userName.trim(), email: userEmail.trim() }),
      })
    } catch { /* best effort */ }
    setSaved(true)
    setError('')
    setTimeout(() => setSaved(false), 2000)
  }

  async function deleteAccount() {
    if (!confirm('Weet je zeker dat je je account wilt verwijderen?')) return
    setDeleting(true)
    const userId = getUserId()
    try {
      await fetch('/api/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
    } catch { /* best effort */ }
    localStorage.removeItem('tripsync_user_name')
    localStorage.removeItem('tripsync_user_email')
    setUserNameState('')
    setUserEmailState('')
    setDeleting(false)
    setMode('home')
  }

  if (mode === 'loading') {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader msg="Verbinden…" /></div>
  }

  return (
    <div className="max-w-[440px] mx-auto">
      <div className="mb-8">
        <p className="font-mono text-[11px] tracking-[.2em] uppercase text-muted mb-2">TripSync.</p>
        <h1 className="font-serif text-[40px] leading-[1.05] text-dark">
          Stop discussiëren.<br /><em>Begin reizen.</em>
        </h1>
        <p className="font-sans text-[13px] text-muted mt-2 leading-relaxed">
          Kies samen de perfecte vakantiebestemming via realtime matching.
        </p>
      </div>

      {/* Account form */}
      {mode === 'account' && (
        <div className="fade-up flex flex-col gap-4 mb-8">
          <div>
            <SectionLabel>Jouw naam</SectionLabel>
            <input
              type="text"
              value={userName}
              onChange={e => { setUserNameState(e.target.value); setUserName(e.target.value) }}
              placeholder="Robin"
              className="w-full border border-dark/[.3] bg-card px-4 py-3 font-sans text-[15px] text-dark placeholder:text-dim focus:outline-none focus:border-dark"
            />
          </div>
          <div>
            <SectionLabel>E-mailadres</SectionLabel>
            <input
              type="email"
              value={userEmail}
              onChange={e => setUserEmailState(e.target.value)}
              placeholder="robin@email.com"
              className="w-full border border-dark/[.3] bg-card px-4 py-3 font-sans text-[15px] text-dark placeholder:text-dim focus:outline-none focus:border-dark"
            />
            <p className="font-sans text-[11px] text-muted mt-1">Bewaard op dit apparaat — voor straks.</p>
          </div>
          {error && <p className="font-mono text-[11px] text-brand tracking-[.06em]">{error}</p>}
          {saved && <p className="font-mono text-[11px] text-success tracking-[.06em]">✓ Opgeslagen</p>}
          <div className="flex gap-3">
            <Btn variant="outline" onClick={() => { setMode('home'); setError('') }}>← Terug</Btn>
            <Btn onClick={saveAccount} fullWidth>Opslaan</Btn>
          </div>
          {(getUserName() || getUserEmail()) && (
            <button
              onClick={deleteAccount}
              disabled={deleting}
              className="font-mono text-[10px] tracking-[.1em] uppercase text-muted/60 hover:text-brand transition-colors cursor-pointer mt-1"
            >
              {deleting ? 'Verwijderen…' : 'Account verwijderen'}
            </button>
          )}
        </div>
      )}

      {/* Recent games */}
      {mode === 'home' && recentGames.length > 0 && (
        <div className="mb-6 fade-up">
          <SectionLabel>Recente spellen</SectionLabel>
          <div className="flex flex-col gap-2">
            {recentGames.map(g => (
              <button
                key={g.code}
                onClick={() => router.push(`/lobby/${g.code}`)}
                className="w-full flex items-center justify-between border border-dark/[.12] bg-card px-4 py-3 text-left hover:border-dark/30 transition-colors cursor-pointer"
              >
                <div>
                  <p className="font-sans text-[14px] font-medium text-dark">{g.groupName}</p>
                  <p className="font-mono text-[10px] text-muted tracking-widest mt-0.5">{g.code}</p>
                </div>
                <span className="font-mono text-[11px] text-muted">→</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Home buttons */}
      {mode === 'home' && (
        <div className="flex flex-col gap-3 fade-up">
          {userName && (
            <p className="font-sans text-[13px] text-muted -mt-2 mb-1">
              Hoi, <strong className="text-dark">{userName}</strong>!
            </p>
          )}
          <Btn onClick={() => setMode('create')} fullWidth>Nieuwe groep aanmaken</Btn>
          <Btn variant="outline" onClick={() => setMode('join')} fullWidth>Meedoen met code</Btn>
          <button
            onClick={() => setMode('account')}
            className="w-full font-mono text-[10px] tracking-[.12em] uppercase text-muted py-2 cursor-pointer hover:text-dark transition-colors"
          >
            {userName ? `● ${userName}` : 'Account aanmaken ↗'}
          </button>
        </div>
      )}

      {/* Create / Join form */}
      {(mode === 'create' || mode === 'join') && (
        <div className="fade-up flex flex-col gap-4">
          <div>
            <SectionLabel>Jouw naam</SectionLabel>
            <input
              type="text"
              value={userName}
              onChange={e => { setUserNameState(e.target.value); setUserName(e.target.value) }}
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

          {error && <p className="font-mono text-[11px] text-brand tracking-[.06em]">{error}</p>}

          <div className="flex gap-3">
            <Btn variant="outline" onClick={() => { setMode('home'); setError('') }}>← Terug</Btn>
            <Btn onClick={mode === 'create' ? createGroup : joinGroup} fullWidth>
              {mode === 'create' ? 'Aanmaken' : 'Deelnemen'}
            </Btn>
          </div>
        </div>
      )}

      {mode === 'home' && recentGames.length === 0 && (
        <div className="mt-12">
          <SectionLabel>Hoe werkt het?</SectionLabel>
          <div className="flex flex-col gap-0">
            {[
              ['01', 'Maak een groep aan', 'Deel de code of link met je reisgezelschap.'],
              ['02', 'Beantwoord vragen', 'Klimaat, budget, vakantietype — iedereen vult in.'],
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

export default function HomePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Loader msg="Laden…" /></div>}>
      <HomeContent />
    </Suspense>
  )
}
