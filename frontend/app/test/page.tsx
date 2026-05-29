'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getUserId, getUserName, setUserName } from '../lib/user'

export default function TestPage() {
  const router  = useRouter()
  const [status, setStatus] = useState('Testomgeving aanmaken…')
  const [name,   setName]   = useState('')
  const [ready,  setReady]  = useState(false)

  useEffect(() => {
    const saved = getUserName()
    if (saved) setName(saved)
    setReady(true)
  }, [])

  async function start() {
    const userId   = getUserId()
    const userName = name.trim() || 'Robin'
    setUserName(userName)
    setStatus('Reset bezig…')

    const res = await fetch('/api/test/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, userName }),
    })

    if (!res.ok) {
      setStatus('Fout bij aanmaken.')
      return
    }

    setStatus('Klaar! Doorsturen…')
    router.replace('/lobby/TESTEN')
  }

  if (!ready) return null

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4efe6' }}>
      <div style={{ maxWidth: 380, width: '100%', padding: '0 20px' }}>
        <p style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#8b7f70', marginBottom: 8 }}>TripSync.</p>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 28, color: '#1a1d2e', marginBottom: 6 }}>Testomgeving</h1>
        <p style={{ fontFamily: 'sans-serif', fontSize: 13, color: '#8b7f70', marginBottom: 28, lineHeight: 1.5 }}>
          Maakt een verse testgroep aan met code <strong>TESTEN</strong>. Jij wordt automatisch host.
        </p>

        <label style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8b7f70', display: 'block', marginBottom: 6 }}>Jouw naam</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Robin"
          style={{ width: '100%', border: '1px solid rgba(26,29,46,.3)', background: '#fffdf9', padding: '11px 14px', fontFamily: 'sans-serif', fontSize: 15, color: '#1a1d2e', outline: 'none', display: 'block', marginBottom: 14, boxSizing: 'border-box' }}
        />

        <button
          onClick={start}
          style={{ width: '100%', background: '#1a1d2e', color: '#fffdf9', border: 'none', padding: '13px 16px', fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer' }}
        >
          Reset & open testgroep →
        </button>

        <p style={{ fontFamily: 'monospace', fontSize: 10, color: '#8b7f70', marginTop: 16, textAlign: 'center' }}>{status}</p>

        <div style={{ marginTop: 28, padding: 14, background: '#fffdf9', border: '1px solid rgba(26,29,46,.1)' }}>
          <p style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8b7f70', marginBottom: 8 }}>Tweede apparaat laten meedoen</p>
          <p style={{ fontFamily: 'monospace', fontSize: 13, letterSpacing: '0.2em', color: '#1a1d2e' }}>TESTEN</p>
          <p style={{ fontFamily: 'sans-serif', fontSize: 11, color: '#8b7f70', marginTop: 4 }}>Typ deze code in op het tweede apparaat om mee te doen.</p>
        </div>
      </div>
    </div>
  )
}
