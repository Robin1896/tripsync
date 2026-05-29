'use client'
import { useState } from 'react'
import { type Question } from '../lib/questions'
import { Btn } from './Btn'

interface QuestionCardProps {
  question: Question
  onAnswer: (value: string | string[]) => void
  disabled?: boolean
}

export function QuestionCard({ question, onAnswer, disabled }: QuestionCardProps) {
  const [selected, setSelected] = useState<string[]>([])

  function toggle(id: string) {
    if (!question.multi) {
      setSelected([id])
      setTimeout(() => onAnswer(id), 200)
      return
    }
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  function submit() {
    if (selected.length === 0) return
    onAnswer(question.multi ? selected : selected[0])
  }

  return (
    <div className="fade-up">
      <p className="font-mono text-[10px] tracking-[.15em] uppercase text-muted mb-2">
        {question.category}
      </p>
      <h2 className="font-serif text-[26px] text-dark leading-tight mb-6">
        {question.title}
      </h2>

      <div className="flex flex-col gap-2">
        {question.options.map(opt => {
          const isSelected = selected.includes(opt.id)
          return (
            <button
              key={opt.id}
              disabled={disabled}
              onClick={() => toggle(opt.id)}
              className={[
                'w-full flex items-center gap-4 px-4 py-4 border text-left transition-all',
                'font-sans text-[14px] font-medium cursor-pointer',
                isSelected
                  ? 'border-dark bg-dark text-bg'
                  : 'border-dark/[.25] bg-card text-dark hover:border-dark',
              ].join(' ')}
            >
              <span className="text-[22px] leading-none">{opt.emoji}</span>
              <span className="flex-1">{opt.label}</span>
              {isSelected && <span className="text-brand text-[18px]">✓</span>}
            </button>
          )
        })}
      </div>

      {question.multi && (
        <div className="mt-6">
          <Btn
            onClick={submit}
            disabled={selected.length === 0 || disabled}
            fullWidth
          >
            Bevestig keuze{selected.length > 1 ? 's' : ''}
          </Btn>
        </div>
      )}
    </div>
  )
}
