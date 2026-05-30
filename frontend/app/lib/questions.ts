// ── Shared types ──────────────────────────────────────────────────────────────

export interface Option {
  id: string
  label: string
  emoji: string
  points: number
}

interface BaseQ {
  id: string
  category: string
  title: string
  subtitle?: string
}

export interface SingleQuestion extends BaseQ {
  type: 'single'
  options: Option[]
}
export interface MultiQuestion extends BaseQ {
  type: 'multi'
  options: Option[]
}
export interface SliderQuestion extends BaseQ {
  type: 'slider'
  min: number; max: number
  minLabel: string; maxLabel: string
  minEmoji: string; maxEmoji: string
  step?: number
  valueLabels?: Record<number, string>
}
export interface RankQuestion extends BaseQ {
  type: 'rank'
  subtitle: string
  items: { id: string; label: string; emoji: string }[]
}
export interface MoodQuestion extends BaseQ {
  type: 'mood'
  options: { id: string; emoji: string; label: string; description: string }[]
}

export type Question = SingleQuestion | MultiQuestion | SliderQuestion | RankQuestion | MoodQuestion

// ── QUICK mode — 6 questions ──────────────────────────────────────────────────

export const QUESTIONS: Question[] = [
  {
    id: 'climate', type: 'single',
    category: 'Klimaat', title: 'Welk klimaat geeft jou energie?',
    options: [
      { id: 'warm',     label: 'Warm & zonnig',         emoji: '☀️', points: 5 },
      { id: 'gematigd', label: 'Aangenaam',              emoji: '🌤', points: 4 },
      { id: 'koud',     label: 'Fris & avontuurlijk',   emoji: '❄️', points: 4 },
    ],
  },
  {
    id: 'type', type: 'multi',
    category: 'Vakantietype', title: 'Wat is jouw perfecte vakantie?',
    options: [
      { id: 'strand',   label: 'Strand & zee',    emoji: '🏖', points: 5 },
      { id: 'cultuur',  label: 'Cultuur & musea', emoji: '🏛', points: 3 },
      { id: 'natuur',   label: 'Natuur & bergen', emoji: '🏔', points: 4 },
      { id: 'citytrip', label: 'Citytrip',        emoji: '🌆', points: 3 },
      { id: 'avontuur', label: 'Avontuur',        emoji: '🧗', points: 4 },
    ],
  },
  {
    id: 'budget', type: 'single',
    category: 'Budget', title: 'Wat is jouw reisbudget per persoon?',
    options: [
      { id: '€',    label: 'Tot €500',         emoji: '💶', points: 2 },
      { id: '€€',   label: '€500 – €1.000',    emoji: '💶', points: 3 },
      { id: '€€€',  label: '€1.000 – €2.500',  emoji: '💳', points: 4 },
      { id: '€€€€', label: 'Meer dan €2.500',  emoji: '💎', points: 5 },
    ],
  },
  {
    id: 'duration', type: 'single',
    category: 'Reisduur', title: 'Hoe lang wil je weg?',
    options: [
      { id: 'kort',   label: 'Lang weekend', emoji: '📅', points: 3 },
      { id: 'middel', label: '1 – 2 weken',  emoji: '🗓', points: 4 },
      { id: 'lang',   label: '3+ weken',     emoji: '✈️', points: 5 },
    ],
  },
  {
    id: 'accommodation', type: 'single',
    category: 'Verblijf', title: 'Waar slaap jij het liefst?',
    options: [
      { id: 'hotel',   label: 'Hotel',   emoji: '🏨', points: 4 },
      { id: 'resort',  label: 'Resort',  emoji: '🌴', points: 5 },
      { id: 'airbnb',  label: 'Airbnb',  emoji: '🏡', points: 3 },
      { id: 'camping', label: 'Camping', emoji: '⛺', points: 2 },
    ],
  },
  {
    id: 'activities', type: 'multi',
    category: 'Activiteiten', title: 'Wat wil je absoluut doen?',
    options: [
      { id: 'wandelen', label: 'Wandelen', emoji: '🥾', points: 3 },
      { id: 'skiën',    label: 'Skiën',    emoji: '⛷',  points: 5 },
      { id: 'duiken',   label: 'Duiken',   emoji: '🤿',  points: 4 },
      { id: 'musea',    label: 'Musea',    emoji: '🖼',  points: 3 },
      { id: 'uitgaan',  label: 'Uitgaan',  emoji: '🎉',  points: 3 },
      { id: 'roadtrip', label: 'Roadtrip', emoji: '🚗',  points: 4 },
    ],
  },
  {
    id: 'season', type: 'single',
    category: 'Wanneer', title: 'Wanneer gaan jullie op reis?',
    options: [
      { id: 'winter',  label: 'Dec – Feb',  emoji: '❄️', points: 3 },
      { id: 'spring',  label: 'Mrt – Mei',  emoji: '🌸', points: 4 },
      { id: 'summer',  label: 'Jun – Aug',  emoji: '☀️', points: 5 },
      { id: 'autumn',  label: 'Sep – Nov',  emoji: '🍂', points: 4 },
    ],
  },
]
