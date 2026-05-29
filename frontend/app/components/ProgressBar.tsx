interface ProgressBarProps {
  current: number
  total: number
  label?: string
}

export function ProgressBar({ current, total, label }: ProgressBarProps) {
  const pct = Math.round((current / total) * 100)
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between mb-2">
          <span className="font-mono text-[10px] tracking-[.15em] uppercase text-muted">{label}</span>
          <span className="font-mono text-[10px] text-muted">{current}/{total}</span>
        </div>
      )}
      <div className="h-[2px] bg-dim w-full">
        <div
          className="h-full bg-brand transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
