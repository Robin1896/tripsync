'use client'
import { useState } from 'react'
import type { RankQuestion } from '../lib/questions'

interface Props {
  question: RankQuestion
  onAnswer: (value: string) => void
  disabled?: boolean
}

export function RankQuestionCard({ question, onAnswer, disabled }: Props) {
  const [ranked, setRanked] = useState<string[]>([])

  function tap(id: string) {
    if (disabled) return
    if (ranked.includes(id)) {
      // deselect → remove and shift others
      setRanked(prev => prev.filter(x => x !== id))
    } else {
      setRanked(prev => [...prev, id])
    }
  }

  function confirm() {
    if (disabled || ranked.length !== question.items.length) return
    onAnswer(ranked.join('|'))
  }

  const allRanked = ranked.length === question.items.length

  return (
    <div className="fade-up">
      <p className="font-mono text-[10px] tracking-[.2em] uppercase text-muted mb-1">{question.category}</p>
      <h2 className="font-serif text-[24px] leading-tight text-dark mb-1">{question.title}</h2>
      <p className="font-sans text-[12px] text-muted mb-3">{question.subtitle}</p>

      {/* Progress indicator */}
      <div className="flex gap-1.5 mb-3">
        {question.items.map((_, i) => (
          <div
            key={i}
            className="h-[2px] flex-1 transition-all duration-300"
            style={{ background: i < ranked.length ? '#1a1d2e' : 'rgba(26,29,46,.15)' }}
          />
        ))}
      </div>

      <div className="flex flex-col gap-2 mb-3">
        {question.items.map(item => {
          const rank = ranked.indexOf(item.id)
          const isRanked = rank !== -1
          return (
            <button
              key={item.id}
              onClick={() => tap(item.id)}
              disabled={disabled}
              style={{
                transition: 'all .18s cubic-bezier(.4,0,.2,1)',
                transform: isRanked ? 'scale(1.01)' : 'scale(1)',
              }}
              className={[
                'w-full flex items-center gap-3 px-4 py-3 border-2 cursor-pointer',
                isRanked
                  ? 'border-dark bg-dark'
                  : 'border-dark/[.12] bg-card hover:border-dark/30',
              ].join(' ')}
            >
              <div
                className="w-6 h-6 flex items-center justify-center flex-shrink-0 font-sans text-[12px] font-medium rounded-full"
                style={{
                  background: isRanked ? 'rgba(255,253,249,.15)' : 'rgba(26,29,46,.06)',
                  transition: 'all .2s',
                }}
              >
                {isRanked
                  ? <span style={{ color: '#fffdf9' }}>{rank + 1}</span>
                  : <span style={{ color: 'rgba(26,29,46,.25)', fontSize: 11 }}>—</span>
                }
              </div>
              <span className="text-[22px] leading-none flex-shrink-0">{item.emoji}</span>
              <span className={[
                'font-sans text-[14px] font-medium text-left flex-1',
                isRanked ? 'text-bg' : 'text-dark',
              ].join(' ')}>
                {item.label}
              </span>
              {isRanked && (
                <span className="font-mono text-[10px] tracking-[.1em] uppercase text-bg/50">
                  #{rank + 1}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <button
        onClick={confirm}
        disabled={disabled || !allRanked}
        className={[
          'w-full font-mono text-[11px] tracking-[.15em] uppercase py-3 transition-all',
          allRanked
            ? 'bg-dark text-bg cursor-pointer'
            : 'bg-dark/10 text-muted cursor-not-allowed',
        ].join(' ')}
      >
        {allRanked ? 'Volgorde bevestigen →' : `Nog ${question.items.length - ranked.length} te kiezen`}
      </button>
    </div>
  )
}
