import { ButtonHTMLAttributes } from 'react'

export type BtnVariant = 'primary' | 'outline' | 'ghost' | 'danger'

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant
  active?: boolean
  fullWidth?: boolean
}

const base = 'cursor-pointer transition-colors font-sans font-medium text-[13px] tracking-[.08em] uppercase'

const variants: Record<BtnVariant, string> = {
  primary: 'bg-dark text-bg px-6 py-3 hover:bg-brand disabled:bg-muted disabled:cursor-wait',
  outline: 'bg-card text-dark border border-dark text-[11px] px-[18px] py-[10px] hover:bg-dark hover:text-bg disabled:opacity-40 disabled:cursor-wait',
  ghost:   'bg-transparent text-muted text-[12px] px-[18px] py-[10px] hover:text-dark',
  danger:  'bg-card text-brand border border-brand text-[11px] px-[18px] py-[10px] hover:bg-brand hover:text-bg',
}

export function Btn({ variant = 'primary', active, fullWidth, className = '', children, ...props }: BtnProps) {
  const activeClass = active && variant === 'outline' ? 'bg-dark! text-bg!' : ''
  const widthClass  = fullWidth ? 'w-full' : ''
  return (
    <button
      {...props}
      className={`${base} ${variants[variant]} ${activeClass} ${widthClass} ${className}`.replace(/\s+/g, ' ').trim()}
    >
      {children}
    </button>
  )
}
