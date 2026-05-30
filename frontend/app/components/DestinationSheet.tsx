'use client'
import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { type ScoredDestination } from '../lib/engine'

interface Props {
  result: ScoredDestination | null
  onClose: () => void
}

export function DestinationSheet({ result, onClose }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!result) return
    const handler = (e: TouchEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('touchstart', handler)
    return () => document.removeEventListener('touchstart', handler)
  }, [result, onClose])

  if (!result) return null
  const d = result.destination

  return (
    <>
      <div className="fixed inset-0 bg-dark/40 z-40" onClick={onClose} />
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-50 max-w-[440px] mx-auto bg-bg border-t border-dark/[.15] rounded-t-none"
        style={{ animation: 'slideSheet .28s cubic-bezier(.25,.46,.45,.94) both' }}
      >
        <div className="relative h-[180px] w-full overflow-hidden">
          <Image src={d.image} alt={d.city} fill className="object-cover" sizes="440px" />
          <div className="absolute inset-0 bg-gradient-to-t from-dark/70 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-7 h-7 bg-dark/50 flex items-center justify-center font-mono text-[12px] text-bg"
          >✕</button>
          <div className="absolute bottom-3 left-4">
            <p className="font-serif text-[28px] text-bg leading-tight">{d.city}</p>
            <p className="font-sans text-[12px] text-bg/70">{d.emoji} {d.country}</p>
          </div>
          <div className="absolute bottom-3 right-4">
            <p className="font-sans text-[24px] font-medium text-brand">{result.score}%</p>
            <p className="font-mono text-[9px] text-bg/60 tracking-[.1em]">MATCH</p>
          </div>
        </div>

        <div className="px-4 py-4">
          <div className="flex gap-0 border border-dark/[.12] mb-4">
            {[['Vlucht', `${d.flightHours}u ✈`], ['Budget', d.avgPrice], ['Beste tijd', d.bestMonths]].map(([label, val]) => (
              <div key={label} className="flex-1 px-3 py-2.5 border-r border-dark/[.08] last:border-0">
                <p className="font-mono text-[9px] uppercase tracking-[.12em] text-muted mb-1">{label}</p>
                <p className="font-serif text-[15px] text-dark">{val}</p>
              </div>
            ))}
          </div>

          <p className="font-mono text-[9px] uppercase tracking-[.12em] text-muted mb-2">Activiteiten</p>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {d.activities.map(a => (
              <span key={a} className="border border-dark/[.18] bg-card px-2.5 py-1 font-mono text-[10px] text-dark tracking-[.04em]">{a}</span>
            ))}
          </div>

          <div className="flex gap-2 text-[11px] font-mono text-muted mb-4 flex-wrap">
            <span className="border border-dark/[.1] px-2 py-1">🌡 {d.climate}</span>
            <span className="border border-dark/[.1] px-2 py-1">👥 {d.crowd === 'tourist' ? 'Toeristisch' : d.crowd === 'mix' ? 'Mix' : 'Off-beaten'}</span>
            <span className="border border-dark/[.1] px-2 py-1">✈ {d.distance === 'nearby' ? 'Dichtbij' : d.distance === 'europe' ? 'Europa' : 'Wereldwijd'}</span>
          </div>

          {result.breakdown.length > 0 && (
            <>
              <p className="font-mono text-[9px] uppercase tracking-[.12em] text-muted mb-2">Waarom deze score</p>
              <div className="flex flex-col gap-1">
                {result.breakdown.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-[11px] w-3 flex-shrink-0">
                      {item.pts < 0 ? '⚠' : item.matched ? '✓' : '✕'}
                    </span>
                    <span className="font-sans text-[11px] text-muted flex-1">{item.label}</span>
                    <span className={['font-mono text-[10px]', item.pts < 0 ? 'text-brand' : item.matched ? 'text-success' : 'text-dim'].join(' ')}>
                      {item.pts > 0 ? `+${item.pts}` : item.pts}
                    </span>
                    <div className="w-16 h-[3px] bg-dim rounded-full overflow-hidden">
                      <div
                        className={['h-full rounded-full', item.pts < 0 ? 'bg-brand' : item.matched ? 'bg-success' : 'bg-dim'].join(' ')}
                        style={{ width: item.max > 0 ? `${Math.max(0, Math.min(100, (item.pts / item.max) * 100))}%` : '100%' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <a
            href={`https://www.skyscanner.nl/transport/vluchten/ams/${d.id.slice(0, 3).toUpperCase()}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 w-full flex items-center justify-center gap-2 border border-brand/40 bg-card py-2.5 font-mono text-[10px] tracking-[.1em] uppercase text-brand hover:bg-brand/5 transition-colors"
          >
            ✈ Zoek vluchten via Skyscanner
          </a>
        </div>
      </div>
    </>
  )
}
