'use client'

interface CloudItem {
  id: string
  city: string
  emoji: string
  strength: number // 0-100 relative
}

interface Props {
  items: CloudItem[]
  answeredCount: number
  totalQuestions: number
}

export function DestinationCloud({ items, answeredCount, totalQuestions }: Props) {
  if (items.length === 0) return null

  const progress = answeredCount / totalQuestions // 0-1

  // Threshold below which destinations fade out — rises as you answer more
  const fadeThreshold = progress * 45

  return (
    <div className="w-full">
      <p className="font-mono text-[9px] uppercase tracking-widest text-muted mb-2 text-center">
        {answeredCount === 0 ? 'Alle bestemmingen' : `${items.filter(i => i.strength >= fadeThreshold).length} nog in de race`}
      </p>
      <div className="flex flex-wrap gap-[6px] justify-center items-end px-1">
        {items.map(item => {
          const isAlive = item.strength >= fadeThreshold
          const relStrength = item.strength / 100

          // Size: 10-24px based on strength (only shown clearly)
          const fontSize = isAlive ? 10 + Math.round(relStrength * 14) : 9
          const opacity = isAlive
            ? 0.35 + relStrength * 0.65
            : 0.12 + (item.strength / fadeThreshold) * 0.08

          const isTop3 = items.indexOf(item) < 3 && answeredCount >= 3

          return (
            <div
              key={item.id}
              style={{
                opacity,
                fontSize,
                transition: 'all 0.7s cubic-bezier(.25,.46,.45,.94)',
                transform: isTop3 ? 'scale(1.05)' : 'scale(1)',
                lineHeight: 1.2,
                filter: isAlive ? 'none' : 'grayscale(60%)',
              }}
              className={[
                'font-mono tracking-tight text-center select-none',
                isTop3 ? 'text-dark font-medium' : 'text-dark',
                !isAlive ? 'line-through' : '',
              ].join(' ')}
            >
              <span style={{ fontSize: isAlive ? fontSize + 4 : fontSize + 2 }}>{item.emoji}</span>
              {' '}
              <span style={{ fontSize }}>{item.city}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
