'use client'
import { useState } from 'react'
import type { MoodQuestion } from '../lib/questions'

interface Props {
  question: MoodQuestion
  onAnswer: (value: string) => void
  disabled?: boolean
}

export function MoodQuestionCard({ question, onAnswer, disabled }: Props) {
  const [selected, setSelected] = useState<string | null>(null)

  function pick(id: string) {
    if (disabled) return
    setSelected(id)
    setTimeout(() => onAnswer(id), 260)
  }

  return (
    <div className="fade-up">
      <p className="font-mono text-[10px] tracking-[.2em] uppercase text-muted mb-1">{question.category}</p>
      <h2 className="font-serif text-[24px] leading-tight text-dark mb-1">{question.title}</h2>
      {question.subtitle && (
        <p className="font-sans text-[12px] text-muted mb-4">{question.subtitle}</p>
      )}

      <div className="flex flex-col gap-2">
        {question.options.map(opt => {
          const active = selected === opt.id
          return (
            <button
              key={opt.id}
              onClick={() => pick(opt.id)}
              disabled={disabled}
              style={{
                transition: 'all .22s cubic-bezier(.4,0,.2,1)',
                transform: active ? 'scale(1.01)' : 'scale(1)',
              }}
              className={[
                'w-full text-left border-2 px-4 py-3 cursor-pointer',
                'flex items-center gap-3',
                active
                  ? 'border-dark bg-dark'
                  : 'border-dark/[.12] bg-card hover:border-dark/40',
              ].join(' ')}
            >
              <span className="text-[22px] leading-none flex-shrink-0">{opt.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className={[
                  'font-sans text-[14px] font-medium leading-tight',
                  active ? 'text-bg' : 'text-dark',
                ].join(' ')}>
                  {opt.label}
                </p>
                <p className={[
                  'font-sans text-[11px] leading-snug mt-0.5',
                  active ? 'text-bg/70' : 'text-muted',
                ].join(' ')}>
                  {opt.description}
                </p>
              </div>
              {active && <span className="font-mono text-[14px] text-bg flex-shrink-0">✓</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
