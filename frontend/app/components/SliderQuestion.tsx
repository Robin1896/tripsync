'use client'
import { useState } from 'react'
import type { SliderQuestion } from '../lib/questions'

interface Props {
  question: SliderQuestion
  onAnswer: (value: string) => void
  disabled?: boolean
}

export function SliderQuestionCard({ question, onAnswer, disabled }: Props) {
  const mid = Math.round((question.min + question.max) / 2)
  const [value, setValue] = useState(mid)
  const [confirmed, setConfirmed] = useState(false)

  const pct = ((value - question.min) / (question.max - question.min)) * 100
  const label = question.valueLabels?.[value] ?? ''

  function confirm() {
    if (disabled || confirmed) return
    setConfirmed(true)
    setTimeout(() => onAnswer(String(value)), 200)
  }

  return (
    <div className="fade-up">
      <p className="font-mono text-[10px] tracking-[.2em] uppercase text-muted mb-1">{question.category}</p>
      <h2 className="font-serif text-[24px] leading-tight text-dark mb-1">{question.title}</h2>
      {question.subtitle && (
        <p className="font-sans text-[12px] text-muted mb-5">{question.subtitle}</p>
      )}

      {/* Value display */}
      <div className="bg-card border border-dark/[.1] px-6 pt-4 pb-4 mb-5 text-center">
        <div key={value} className="font-serif text-[52px] leading-none text-dark mb-1.5 value-pop">{value}</div>
        {label && (
          <p key={`lbl-${value}`} className="font-mono text-[11px] tracking-[.12em] uppercase text-muted label-slide">
            {label}
          </p>
        )}
      </div>

      {/* Slider */}
      <div className="mb-5 px-1">
        <style>{`
          .ts-range { -webkit-appearance:none; appearance:none; width:100%; height:6px; border-radius:0; background: linear-gradient(to right, #1a1d2e ${pct}%, rgba(26,29,46,.12) ${pct}%); outline:none; cursor:pointer; }
          .ts-range::-webkit-slider-thumb { -webkit-appearance:none; appearance:none; width:28px; height:28px; background:#1a1d2e; border-radius:50%; cursor:pointer; box-shadow: 0 2px 8px rgba(0,0,0,.25); transition: transform .12s ease; }
          .ts-range::-webkit-slider-thumb:active { transform: scale(1.15); }
          .ts-range::-moz-range-thumb { width:28px; height:28px; background:#1a1d2e; border-radius:50%; cursor:pointer; border:none; box-shadow: 0 2px 8px rgba(0,0,0,.25); }
        `}</style>
        <input
          type="range"
          min={question.min}
          max={question.max}
          step={question.step ?? 1}
          value={value}
          onChange={e => setValue(Number(e.target.value))}
          className="ts-range"
        />
        <div className="flex justify-between mt-5 gap-2">
          <div className="flex-1 text-left">
            <div className="text-[24px] mb-1">{question.minEmoji}</div>
            <p className="font-sans text-[11px] text-muted leading-snug">{question.minLabel}</p>
          </div>
          <div className="flex-1 text-right">
            <div className="text-[24px] mb-1">{question.maxEmoji}</div>
            <p className="font-sans text-[11px] text-muted leading-snug">{question.maxLabel}</p>
          </div>
        </div>
      </div>

      <button
        onClick={confirm}
        disabled={disabled || confirmed}
        className="w-full bg-dark text-bg font-mono text-[11px] tracking-[.15em] uppercase py-4 cursor-pointer disabled:opacity-50 transition-opacity"
      >
        {confirmed ? 'Opgeslagen ✓' : 'Bevestig →'}
      </button>
    </div>
  )
}
