interface LoaderProps {
  msg?: string
  size?: 'sm' | 'md'
}

export function Loader({ msg, size = 'md' }: LoaderProps) {
  const dot = size === 'sm' ? 'w-[5px] h-[5px]' : 'w-[7px] h-[7px]'
  const gap = size === 'sm' ? 'gap-[5px]' : 'gap-[7px]'
  const pad = size === 'sm' ? 'py-4' : 'py-8'

  return (
    <div className={`flex flex-col items-center ${gap} ${pad}`}>
      <div className={`flex ${gap}`}>
        {[0, 200, 400].map((delay, i) => (
          <span
            key={i}
            className={`block ${dot} rounded-full bg-brand`}
            style={{ animation: `ldpulse 1.3s ease-in-out ${delay}ms infinite` }}
          />
        ))}
      </div>
      {msg && (
        <p className="font-mono text-[12px] text-muted tracking-[.06em] min-h-[18px] text-center">
          {msg}
        </p>
      )}
    </div>
  )
}
