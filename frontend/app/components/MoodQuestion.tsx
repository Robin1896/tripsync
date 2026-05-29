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
      <p className="font-mono text-[10px] tracking-[.2em] uppercase text-muted mb-2">{question.category}</p>
      <h2 className="font-serif text-[28px] leading-tight text-dark mb-1">{question.title}</h2>
      {question.subtitle && (
        <p className="font-sans text-[13px] text-muted mb-6">{question.subtitle}</p>
      )}

      <div className="flex flex-col gap-3">
        {question.options.map(opt => {
          const active = selected === opt.id
          return (
            <button
              key={opt.id}
              onClick={() => pick(opt.id)}
              disabled={disabled}
              style={{
                transition: 'all .22s cubic-bezier(.4,0,.2,1)',
                transform: active ? 'scale(1.015)' : 'scale(1)',
              }}
              className={[
                'w-full text-left border-2 p-5 cursor-pointer',
                'flex items-start gap-4',
                active
                  ? 'border-dark bg-dark'
                  : 'border-dark/[.12] bg-card hover:border-dark/40',
              ].join(' ')}
            >
              <span style={{ fontSize: 34, lineHeight: 1, flexShrink: 0, marginTop: 2 }}>{opt.emoji}</span>
              <div>
                <p className={[
                  'font-serif text-[20px] leading-tight mb-1',
                  active ? 'text-bg' : 'text-dark',
                ].join(' ')}>
                  {opt.label}
                </p>
                <p className={[
                  'font-sans text-[13px] leading-relaxed',
                  active ? 'text-bg/70' : 'text-muted',
                ].join(' ')}>
                  {opt.description}
                </p>
              </div>
              {active && (
                <div className="ml-auto flex-shrink-0">
                  <span className="font-mono text-[18px] text-bg">✓</span>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
