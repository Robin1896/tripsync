'use client'
import Image from 'next/image'
import { type ScoredDestination } from '../lib/engine'

interface Props {
  a: ScoredDestination
  b: ScoredDestination
  onClose: () => void
}

function Row({ label, va, vb }: { label: string; va: string; vb: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-dark/[.06] last:border-0 py-2">
      <div className="flex-1 text-right font-sans text-[12px] text-dark">{va}</div>
      <div className="w-20 text-center font-mono text-[9px] text-muted uppercase tracking-wide flex-shrink-0">{label}</div>
      <div className="flex-1 font-sans text-[12px] text-dark">{vb}</div>
    </div>
  )
}

export function CompareSheet({ a, b, onClose }: Props) {
  const da = a.destination, db = b.destination
  return (
    <>
      <div className="fixed inset-0 bg-dark/40 z-40" onClick={onClose} />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 max-w-[440px] mx-auto bg-bg border-t border-dark/[.15]"
        style={{ animation: 'slideSheet .28s cubic-bezier(.25,.46,.45,.94) both' }}
      >
        {/* Header photos */}
        <div className="grid grid-cols-2 h-[110px]">
          {[{ d: da, score: a.score }, { d: db, score: b.score }].map(({ d, score }) => (
            <div key={d.id} className="relative overflow-hidden">
              <Image src={d.image} alt={d.city} fill className="object-cover" sizes="220px" />
              <div className="absolute inset-0 bg-gradient-to-t from-dark/70 to-transparent" />
              <div className="absolute bottom-2 left-2">
                <p className="font-serif text-[15px] text-bg leading-tight">{d.city}</p>
                <p className="font-sans text-[13px] font-medium text-brand">{score}%</p>
              </div>
            </div>
          ))}
        </div>

        <button onClick={onClose} className="absolute top-2 right-2 w-7 h-7 bg-dark/40 flex items-center justify-center font-mono text-[12px] text-bg z-10">✕</button>

        <div className="px-4 py-3">
          <Row label="Vlucht"     va={`${da.flightHours}u`}   vb={`${db.flightHours}u`} />
          <Row label="Budget"     va={da.avgPrice}              vb={db.avgPrice} />
          <Row label="Klimaat"    va={da.climate}               vb={db.climate} />
          <Row label="Beste tijd" va={da.bestMonths}            vb={db.bestMonths} />
          <Row label="Sfeer"      va={da.crowd === 'tourist' ? 'Toeristisch' : da.crowd === 'mix' ? 'Mix' : 'Off-beaten'}
                                  vb={db.crowd === 'tourist' ? 'Toeristisch' : db.crowd === 'mix' ? 'Mix' : 'Off-beaten'} />
          <Row label="Afstand"    va={da.distance === 'nearby' ? 'Dichtbij' : da.distance === 'europe' ? 'Europa' : 'Wereldwijd'}
                                  vb={db.distance === 'nearby' ? 'Dichtbij' : db.distance === 'europe' ? 'Europa' : 'Wereldwijd'} />
        </div>
      </div>
    </>
  )
}
