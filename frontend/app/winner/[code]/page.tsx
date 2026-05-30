'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import confetti from 'canvas-confetti'
import { DESTINATIONS } from '../../lib/destinations'
import { getUserId, addRecentGame } from '../../lib/user'
import { Loader } from '../../components/Loader'
import { Btn } from '../../components/Btn'

export default function WinnerPage() {
  const { code } = useParams<{ code: string }>()
  const router   = useRouter()

  const userId = getUserId()
  const [winner,    setWinner]    = useState<(typeof DESTINATIONS)[0] | null>(null)
  const [groupName, setGroupName] = useState('')
  const [loading,   setLoading]   = useState(true)
  const [copied,    setCopied]    = useState(false)
  const [bgIdx,     setBgIdx]     = useState(0)

  // Rotate through top destination images as page background
  useEffect(() => {
    if (!winner) return
    const others = DESTINATIONS.filter(d => d.id !== winner.id).slice(0, 4)
    const all    = [winner, ...others]
    const id     = setInterval(() => setBgIdx(i => (i + 1) % all.length), 4000)
    return () => clearInterval(id)
  }, [winner])

  const bgImages = winner
    ? [winner, ...DESTINATIONS.filter(d => d.id !== winner.id).slice(0, 4)]
    : []

  useEffect(() => {
    async function init() {
      const res  = await fetch(`/api/groups/${code}`)
      if (!res.ok) { router.replace('/'); return }
      const { group } = await res.json()
      setGroupName(group.name)

      if (group.phase !== 'winner') { router.replace(`/results/${code}`); return }
      const w = DESTINATIONS.find(d => d.id === group.winner_id) ?? null
      setWinner(w)
      if (w) addRecentGame(code, group.name, { city: w.city, emoji: w.emoji })
      setLoading(false)

      if (w) {
        setTimeout(() => {
          confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 }, colors: ['#c14a1f', '#f4efe6', '#1a1d2e', '#fffdf9'] })
        }, 300)
      }
    }
    init()
  }, [code])

  async function share(w: typeof winner) {
    if (!w) return
    const text = `Wij gaan naar ${w.city}, ${w.country}! ${w.emoji} (via TripSync)`
    if (navigator.share) {
      await navigator.share({ title: 'TripSync bestemming', text })
    } else {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader msg="Winnaar onthullen…" /></div>

  if (!winner) return (
    <div className="max-w-[440px] mx-auto text-center py-16">
      <p className="font-serif text-[24px] text-dark">Geen winnaar gevonden.</p>
      <Btn className="mt-6" onClick={() => router.replace('/')}>Naar home</Btn>
    </div>
  )

  return (
    <div className="max-w-[440px] mx-auto">
      {/* Ambient background slideshow */}
      {bgImages.length > 0 && (
        <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
          {bgImages.map((d, i) => (
            <div
              key={d.id}
              className="absolute inset-0 transition-opacity duration-[2000ms]"
              style={{ opacity: i === bgIdx ? 0.12 : 0 }}
            >
              <Image src={d.image} alt="" fill className="object-cover blur-sm scale-110" sizes="100vw" />
            </div>
          ))}
        </div>
      )}

      <div className="mb-6">
        <p className="font-mono text-[11px] tracking-[.2em] uppercase text-muted mb-1">TripSync. — {groupName}</p>
        <p className="font-mono text-[10px] tracking-[.15em] uppercase text-muted">Jullie bestemming is…</p>
      </div>

      <div className="relative h-[300px] w-full overflow-hidden mb-2 fade-up">
        <Image src={winner.image} alt={winner.city} fill className="object-cover" sizes="440px" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-dark/80 via-dark/20 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <p className="font-mono text-[10px] tracking-[.15em] uppercase text-bg/60 mb-1">{winner.emoji} {winner.country}</p>
          <h1 className="font-serif text-[48px] text-bg leading-[1]">{winner.city}</h1>
        </div>
      </div>

      <div className="border border-dark/[.15] bg-card flex mb-6">
        {[['Vlucht', `${winner.flightHours}u`], ['Budget', winner.avgPrice], ['Beste tijd', winner.bestMonths]].map(([label, val]) => (
          <div key={label} className="flex-1 px-4 py-3 border-r border-dark/[.1] last:border-0">
            <p className="font-mono text-[9px] uppercase tracking-[.12em] text-muted mb-1">{label}</p>
            <p className="font-serif text-[18px] text-dark">{val}</p>
          </div>
        ))}
      </div>

      <div className="mb-8">
        <p className="font-mono text-[10px] tracking-[.15em] uppercase text-muted mb-3">Activiteiten</p>
        <div className="flex flex-wrap gap-2">
          {winner.activities.map(a => (
            <span key={a} className="border border-dark/[.2] bg-card px-3 py-1 font-mono text-[11px] text-dark tracking-[.06em]">{a}</span>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <a
          href={`https://www.skyscanner.nl/vluchten/?origin=AMS&destination=${winner.city.substring(0,3).toUpperCase()}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 border border-brand bg-brand/5 py-3 font-mono text-[11px] tracking-[.1em] uppercase text-brand hover:bg-brand/10 transition-colors"
        >
          ✈ Zoek vluchten naar {winner.city}
        </a>
        <Btn onClick={() => share(winner)} fullWidth variant="outline">
          {copied ? '✓ Gekopieerd!' : '↗ Delen met de groep'}
        </Btn>
        <Btn onClick={() => router.replace('/')} fullWidth>Nieuwe groep starten</Btn>
        <Btn variant="ghost" onClick={() => router.replace(`/results/${code}`)}>← Terug naar resultaten</Btn>
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
            className="w-full border border-dark/[.2] bg-card font-mono text-[10px] tracking-[.12em] uppercase text-muted py-3 hover:border-dark/40 hover:text-dark transition-colors cursor-pointer"
          >
            ↺ Reset testgroep
          </button>
        )}
      </div>
    </div>
  )
}
