'use client'
import { useState } from 'react'
import { type Question } from '../lib/questions'
import { MoodQuestionCard } from './MoodQuestion'
import { SliderQuestionCard } from './SliderQuestion'
import { RankQuestionCard } from './RankQuestion'
import { Btn } from './Btn'

interface Props {
  question: Question
  onAnswer: (value: string | string[]) => void
  disabled?: boolean
}

export function QuestionCard({ question, onAnswer, disabled }: Props) {
  // Route extended types to their own components
  if (question.type === 'mood')
    return <MoodQuestionCard question={question} onAnswer={onAnswer as (v: string) => void} disabled={disabled} />
  if (question.type === 'slider')
    return <SliderQuestionCard question={question} onAnswer={onAnswer as (v: string) => void} disabled={disabled} />
  if (question.type === 'rank')
    return <RankQuestionCard question={question} onAnswer={onAnswer as (v: string) => void} disabled={disabled} />

  // single / multi
  const isMulti = question.type === 'multi'
  return <ChoiceCard question={question} isMulti={isMulti} onAnswer={onAnswer} disabled={disabled} />
}

function ChoiceCard({ question, isMulti, onAnswer, disabled }: Props & { isMulti: boolean }) {
  const [selected, setSelected] = useState<string[]>([])

  function toggle(id: string) {
    if (!isMulti) {
      setSelected([id])
      setTimeout(() => onAnswer(id), 200)
      return
    }
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function submit() {
    if (selected.length === 0) return
    onAnswer(isMulti ? selected : selected[0])
  }

  const opts = 'options' in question ? question.options : []

  return (
    <div className="fade-up">
      <p className="font-mono text-[10px] tracking-[.2em] uppercase text-muted mb-1">{question.category}</p>
      <h2 className="font-serif text-[24px] leading-tight text-dark mb-1">{question.title}</h2>
      {'subtitle' in question && question.subtitle && (
        <p className="font-sans text-[12px] text-muted mb-4">{question.subtitle}</p>
      )}
      {!('subtitle' in question && question.subtitle) && <div className="mb-4" />}

      <div className="flex flex-col gap-2">
        {opts.map(opt => {
          const on = selected.includes(opt.id)
          return (
            <button
              key={opt.id}
              disabled={disabled}
              onClick={() => toggle(opt.id)}
              style={{ transition: 'all .16s cubic-bezier(.4,0,.2,1)', transform: on ? 'scale(1.01)' : 'scale(1)' }}
              className={[
                'w-full flex items-center gap-3 px-4 py-3 border-2 text-left cursor-pointer',
                on ? 'border-dark bg-dark' : 'border-dark/[.12] bg-card hover:border-dark/40',
              ].join(' ')}
            >
              <span className="text-[22px] leading-none flex-shrink-0">{opt.emoji}</span>
              <span className={['font-sans text-[14px] font-medium flex-1', on ? 'text-bg' : 'text-dark'].join(' ')}>
                {opt.label}
              </span>
              {on && <span className="font-mono text-[14px] text-bg flex-shrink-0">✓</span>}
            </button>
          )
        })}
      </div>

      {isMulti && (
        <div className="mt-6">
          <Btn onClick={submit} disabled={selected.length === 0 || disabled} fullWidth>
            Bevestig {selected.length > 1 ? `${selected.length} keuzes` : 'keuze'} →
          </Btn>
        </div>
      )}
    </div>
  )
}
