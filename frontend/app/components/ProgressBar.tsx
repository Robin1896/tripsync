interface Opponent {
  name: string
  done: number
  color: string
}

interface ProgressBarProps {
  current: number
  total: number
  label?: string
  // Legacy two-player props (kept for compatibility)
  opponentDone?: number | null
  opponentColor?: string
  opponentName?: string
  // Multi-player
  opponents?: Opponent[]
}

export function ProgressBar({ current, total, label, opponentDone, opponentColor, opponentName, opponents }: ProgressBarProps) {
  const myPct = Math.min(100, (current / total) * 100)

  // Normalise opponents: use new prop if available, fall back to legacy two-player props
  const allOpponents: Opponent[] = opponents
    ?? (opponentDone != null && opponentName
      ? [{ name: opponentName, done: opponentDone, color: opponentColor ?? '#8a8478' }]
      : [])

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-3">
        {label && (
          <span className="font-mono text-[10px] tracking-[.15em] uppercase text-muted">{label}</span>
        )}
        <div className="flex items-center gap-3 ml-auto flex-wrap justify-end">
          {allOpponents.map(op => (
            <span
              key={op.name}
              className="font-mono text-[9px] tracking-wide"
              style={{ color: op.color }}
            >
              {op.name.split(' ')[0]}: {op.done}/{total}
            </span>
          ))}
          <span className="font-mono text-[10px] text-muted">{current}/{total}</span>
        </div>
      </div>

      <div className="relative h-[2px] bg-dim w-full">
        <div
          className="h-full bg-brand transition-all duration-500 ease-out"
          style={{ width: `${myPct}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-brand transition-all duration-500"
          style={{ left: `${Math.max(1, myPct)}%` }}
        />
        {allOpponents.map(op => {
          const pct = Math.min(99, (op.done / total) * 100)
          return (
            <div
              key={op.name}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-bg opp-dot transition-all duration-700 ease-out"
              style={{ left: `${Math.max(1, pct)}%`, backgroundColor: op.color }}
            />
          )
        })}
      </div>
    </div>
  )
}
