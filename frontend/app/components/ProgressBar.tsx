interface ProgressBarProps {
  current: number
  total: number
  label?: string
  opponentDone?: number | null
  opponentColor?: string
  opponentName?: string
}

export function ProgressBar({ current, total, label, opponentDone, opponentColor, opponentName }: ProgressBarProps) {
  const myPct  = Math.min(100, (current / total) * 100)
  const oppPct = opponentDone != null ? Math.min(99, (opponentDone / total) * 100) : null

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-3">
        {label && (
          <span className="font-mono text-[10px] tracking-[.15em] uppercase text-muted">{label}</span>
        )}
        <div className="flex items-center gap-3 ml-auto">
          {opponentDone != null && opponentName && (
            <span
              className="font-mono text-[9px] tracking-wide"
              style={{ color: opponentColor ?? '#8a8478' }}
            >
              {opponentName.split(' ')[0]}: {opponentDone}/{total}
            </span>
          )}
          <span className="font-mono text-[10px] text-muted">{current}/{total}</span>
        </div>
      </div>

      <div className="relative h-[2px] bg-dim w-full">
        {/* My progress fill */}
        <div
          className="h-full bg-brand transition-all duration-500 ease-out"
          style={{ width: `${myPct}%` }}
        />

        {/* My position dot */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-brand transition-all duration-500"
          style={{ left: `${Math.max(1, myPct)}%` }}
        />

        {/* Opponent dot */}
        {oppPct != null && (
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-bg opp-dot transition-all duration-700 ease-out"
            style={{
              left: `${Math.max(1, oppPct)}%`,
              backgroundColor: opponentColor ?? '#8a8478',
            }}
          />
        )}
      </div>
    </div>
  )
}
