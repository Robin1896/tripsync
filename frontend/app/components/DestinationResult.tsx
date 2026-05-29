import Image from 'next/image'
import { type ScoredDestination } from '../lib/engine'

interface Props {
  result: ScoredDestination
  rank: number
  onSelect?: () => void
  selected?: boolean
}

export function DestinationResult({ result, rank, onSelect, selected }: Props) {
  const { destination: d, score } = result

  return (
    <div
      onClick={onSelect}
      className={[
        'border transition-all overflow-hidden',
        onSelect ? 'cursor-pointer' : '',
        selected ? 'border-brand' : 'border-dark/[.2] hover:border-dark',
      ].join(' ')}
    >
      <div className="relative h-[140px] w-full overflow-hidden">
        <Image
          src={d.image}
          alt={d.city}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark/60 to-transparent" />
        <div className="absolute top-2 left-3">
          <span className="font-mono text-[11px] text-bg/80 tracking-[.1em]">#{rank}</span>
        </div>
        <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
          <div>
            <p className="font-serif text-[22px] text-bg leading-tight">{d.city}</p>
            <p className="font-sans text-[12px] text-bg/70">{d.emoji} {d.country}</p>
          </div>
          <div className="text-right">
            <p className="font-sans text-[22px] font-medium text-brand">{score}%</p>
            <p className="font-mono text-[9px] text-bg/60 tracking-[.1em]">MATCH</p>
          </div>
        </div>
      </div>

      <div className="bg-card px-4 py-3 flex gap-4">
        <div className="flex-1">
          <p className="font-mono text-[9px] text-muted tracking-[.12em] uppercase mb-[3px]">Vlucht</p>
          <p className="font-sans text-[13px] text-dark">{d.flightHours}u ✈</p>
        </div>
        <div className="flex-1">
          <p className="font-mono text-[9px] text-muted tracking-[.12em] uppercase mb-[3px]">Budget</p>
          <p className="font-serif text-[16px] text-brand">{d.avgPrice}</p>
        </div>
        <div className="flex-1">
          <p className="font-mono text-[9px] text-muted tracking-[.12em] uppercase mb-[3px]">Beste tijd</p>
          <p className="font-sans text-[11px] text-dark">{d.bestMonths}</p>
        </div>
      </div>
    </div>
  )
}
