export interface Option {
  id: string
  label: string
  emoji: string
  points: number
}

export interface Question {
  id: string
  category: string
  title: string
  options: Option[]
  multi?: boolean
}

export const QUESTIONS: Question[] = [
  {
    id: 'climate',
    category: 'Klimaat',
    title: 'Welk klimaat geeft jou energie?',
    options: [
      { id: 'warm',      label: 'Warm & zonnig',  emoji: '☀️', points: 5 },
      { id: 'gematigd',  label: 'Aangenaam',       emoji: '🌤', points: 4 },
      { id: 'koud',      label: 'Fris & avontuurlijk', emoji: '❄️', points: 4 },
    ],
  },
  {
    id: 'type',
    category: 'Vakantietype',
    title: 'Wat is jouw perfecte vakantie?',
    multi: true,
    options: [
      { id: 'strand',    label: 'Strand & zee',    emoji: '🏖', points: 5 },
      { id: 'cultuur',   label: 'Cultuur & musea', emoji: '🏛', points: 3 },
      { id: 'natuur',    label: 'Natuur & bergen', emoji: '🏔', points: 4 },
      { id: 'citytrip',  label: 'Citytrip',        emoji: '🌆', points: 3 },
      { id: 'avontuur',  label: 'Avontuur',        emoji: '🧗', points: 4 },
    ],
  },
  {
    id: 'budget',
    category: 'Budget',
    title: 'Wat is jouw reisbudget per persoon?',
    options: [
      { id: '€',     label: 'Tot €500',          emoji: '💶', points: 2 },
      { id: '€€',    label: '€500 – €1.000',     emoji: '💶', points: 3 },
      { id: '€€€',   label: '€1.000 – €2.500',   emoji: '💳', points: 4 },
      { id: '€€€€',  label: 'Meer dan €2.500',   emoji: '💎', points: 5 },
    ],
  },
  {
    id: 'duration',
    category: 'Reisduur',
    title: 'Hoe lang wil je weg?',
    options: [
      { id: 'kort',   label: 'Lang weekend',  emoji: '📅', points: 3 },
      { id: 'middel', label: '1 – 2 weken',   emoji: '🗓', points: 4 },
      { id: 'lang',   label: '3+ weken',      emoji: '✈️', points: 5 },
    ],
  },
  {
    id: 'accommodation',
    category: 'Verblijf',
    title: 'Waar slaap jij het liefst?',
    options: [
      { id: 'hotel',   label: 'Hotel',   emoji: '🏨', points: 4 },
      { id: 'resort',  label: 'Resort',  emoji: '🌴', points: 5 },
      { id: 'airbnb',  label: 'Airbnb',  emoji: '🏡', points: 3 },
      { id: 'camping', label: 'Camping', emoji: '⛺', points: 2 },
    ],
  },
  {
    id: 'activities',
    category: 'Activiteiten',
    title: 'Wat wil je absoluut doen?',
    multi: true,
    options: [
      { id: 'wandelen', label: 'Wandelen',  emoji: '🥾', points: 3 },
      { id: 'skiën',    label: 'Skiën',     emoji: '⛷', points: 5 },
      { id: 'duiken',   label: 'Duiken',    emoji: '🤿', points: 4 },
      { id: 'musea',    label: 'Musea',     emoji: '🖼', points: 3 },
      { id: 'uitgaan',  label: 'Uitgaan',   emoji: '🎉', points: 3 },
      { id: 'roadtrip', label: 'Roadtrip',  emoji: '🚗', points: 4 },
    ],
  },
]
