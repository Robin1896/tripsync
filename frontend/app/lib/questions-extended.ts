import type { Question } from './questions'

// Cooperative rounds — everyone must finish a round before next starts
export const EXTENDED_ROUNDS = [
  { round: 1, label: 'Eerste indruk',  emoji: '🌅', from: 0, to: 4  }, // questions 0-4
  { round: 2, label: 'Jouw details',   emoji: '🔍', from: 5, to: 9  }, // questions 5-9
  { round: 3, label: 'Afronden',       emoji: '🎯', from: 10, to: 13 }, // questions 10-13
]

export const EXTENDED_QUESTIONS: Question[] = [
  // 1 ─ Stemming / vibe
  {
    id: 'vibe', type: 'mood',
    category: 'Reisvibe', title: 'Welke sfeer zoek je?',
    subtitle: 'Kies de stemming die het beste past',
    options: [
      { id: 'relax',    emoji: '🌊', label: 'Onthaasten',   description: 'Zon, zee en nergens heen. Boek, cocktail, repeat.' },
      { id: 'discover', emoji: '🗺', label: 'Ontdekken',    description: 'Elke dag iets nieuws. Cultuur, mensen, verhalen.' },
      { id: 'wellness', emoji: '🧘', label: 'Bijkomen',     description: 'Rust, ritme en ruimte voor jezelf. Bewust genieten.' },
      { id: 'party',    emoji: '🎉', label: 'Feesten',      description: 'Leven bij de dag. Spontaan, sociaal en energiek.' },
      { id: 'adventure',emoji: '🧗', label: 'Avontuur',     description: 'Grenzen opzoeken. Natuur, adrenaline en verhalen.' },
    ],
  },

  // 2 ─ Klimaat
  {
    id: 'climate', type: 'single',
    category: 'Klimaat', title: 'Welk klimaat geeft jou energie?',
    options: [
      { id: 'warm',     label: 'Warm & zonnig',       emoji: '☀️', points: 5 },
      { id: 'gematigd', label: 'Aangenaam & mild',    emoji: '🌤', points: 4 },
      { id: 'koud',     label: 'Fris & avontuurlijk', emoji: '❄️', points: 4 },
    ],
  },

  // 3 ─ Vakantietype
  {
    id: 'type', type: 'multi',
    category: 'Vakantietype', title: 'Wat past bij deze reis?',
    subtitle: 'Kies alles wat klopt',
    options: [
      { id: 'strand',   label: 'Strand & zee',     emoji: '🏖', points: 5 },
      { id: 'cultuur',  label: 'Cultuur & musea',  emoji: '🏛', points: 3 },
      { id: 'natuur',   label: 'Natuur & bergen',  emoji: '🏔', points: 4 },
      { id: 'citytrip', label: 'Citytrip',         emoji: '🌆', points: 3 },
      { id: 'avontuur', label: 'Avontuur',         emoji: '🧗', points: 4 },
    ],
  },

  // 4 ─ Tempo (slider)
  {
    id: 'tempo', type: 'slider',
    category: 'Reistempo', title: 'Hoe beweeg jij door een bestemming?',
    subtitle: 'Jouw ideale reisritme',
    min: 1, max: 10, step: 1,
    minEmoji: '🪑', minLabel: 'Eén plek, diep genieten',
    maxEmoji: '⚡', maxLabel: 'Elke dag een nieuw avontuur',
  },

  // 5 ─ Budget
  {
    id: 'budget', type: 'single',
    category: 'Budget', title: 'Wat is jouw budget per persoon?',
    options: [
      { id: '€',    label: 'Tot €500',          emoji: '💶', points: 2 },
      { id: '€€',   label: '€500 – €1.000',     emoji: '💶', points: 3 },
      { id: '€€€',  label: '€1.000 – €2.500',   emoji: '💳', points: 4 },
      { id: '€€€€', label: 'Meer dan €2.500',   emoji: '💎', points: 5 },
    ],
  },

  // 6 ─ Comfort (slider)
  {
    id: 'comfort', type: 'slider',
    category: 'Comfortniveau', title: 'Hoe reis jij het liefst?',
    subtitle: 'Eerlijk zijn mag',
    min: 1, max: 10, step: 1,
    minEmoji: '🎒', minLabel: 'Rugzak & hostel, het gaat om de ervaring',
    maxEmoji: '🛁', maxLabel: 'Suite, roomservice, verwend worden',
  },

  // 7 ─ Reisduur
  {
    id: 'duration', type: 'single',
    category: 'Reisduur', title: 'Hoe lang wil je weg?',
    options: [
      { id: 'kort',   label: 'Lang weekend (3–5 dagen)', emoji: '📅', points: 3 },
      { id: 'middel', label: '1 tot 2 weken',            emoji: '🗓', points: 4 },
      { id: 'lang',   label: '3 weken of meer',          emoji: '✈️', points: 5 },
    ],
  },

  // 8 ─ Verblijf
  {
    id: 'accommodation', type: 'single',
    category: 'Verblijf', title: 'Waar slaap jij het liefst?',
    options: [
      { id: 'hotel',   label: 'Hotel',                   emoji: '🏨', points: 4 },
      { id: 'resort',  label: 'Resort met alles erbij',  emoji: '🌴', points: 5 },
      { id: 'airbnb',  label: 'Airbnb, lokaal wonen',    emoji: '🏡', points: 3 },
      { id: 'camping', label: 'Camping of glamping',     emoji: '⛺', points: 2 },
    ],
  },

  // 9 ─ Eten & drinken
  {
    id: 'food', type: 'multi',
    category: 'Eten & drinken', title: 'Wat zit er op jouw culinaire wishlist?',
    subtitle: 'Meerdere antwoorden mogelijk',
    options: [
      { id: 'streetfood',  label: 'Streetfood & lokale kramen', emoji: '🍜', points: 4 },
      { id: 'finedining',  label: 'Fine dining & restaurants',  emoji: '🍷', points: 4 },
      { id: 'markt',       label: 'Lokale markten',             emoji: '🧺', points: 3 },
      { id: 'wijn',        label: 'Wijn & proeverijen',         emoji: '🍇', points: 3 },
      { id: 'koffie',      label: 'Koffiebarculuur',            emoji: '☕', points: 2 },
    ],
  },

  // 10 ─ Activiteiten
  {
    id: 'activities', type: 'multi',
    category: 'Activiteiten', title: 'Wat wil je absoluut doen?',
    subtitle: 'Kies wat je echt trekt',
    options: [
      { id: 'wandelen', label: 'Wandelen & hiken', emoji: '🥾', points: 3 },
      { id: 'skiën',    label: 'Skiën',            emoji: '⛷',  points: 5 },
      { id: 'duiken',   label: 'Duiken & snorkelen',emoji: '🤿', points: 4 },
      { id: 'musea',    label: 'Musea & kunst',    emoji: '🖼',  points: 3 },
      { id: 'uitgaan',  label: 'Uitgaan & nightlife',emoji: '🎉', points: 3 },
      { id: 'roadtrip', label: 'Roadtrip',         emoji: '🚗',  points: 4 },
    ],
  },

  // 11 ─ Prioriteit (rank)
  {
    id: 'priority', type: 'rank',
    category: 'Prioriteit', title: 'Zet in volgorde van belang',
    subtitle: 'Tik op de elementen van meest naar minst belangrijk',
    items: [
      { id: 'strand',   label: 'Strand & zee',     emoji: '🏖' },
      { id: 'natuur',   label: 'Natuur & bergen',  emoji: '🏔' },
      { id: 'cultuur',  label: 'Cultuur & musea',  emoji: '🏛' },
      { id: 'citytrip', label: 'Stad & stadsleven', emoji: '🌆' },
      { id: 'avontuur', label: 'Avontuur',         emoji: '🧗' },
    ],
  },

  // 12 ─ Afstand
  {
    id: 'distance', type: 'single',
    category: 'Reisafstand', title: 'Hoe ver mag de bestemming zijn?',
    options: [
      { id: 'nearby',    label: 'Dichtbij (max. 4u vliegen)', emoji: '🚗', points: 3 },
      { id: 'europe',    label: 'Europa (max. 5u vliegen)',   emoji: '🌍', points: 4 },
      { id: 'worldwide', label: 'Wereldwijd, hoe verder hoe beter', emoji: '🌏', points: 5 },
    ],
  },

  // 13 ─ Drukte
  {
    id: 'crowd', type: 'single',
    category: 'Sfeer', title: 'Wat voor omgeving trekt jou?',
    options: [
      { id: 'tourist',   label: 'Populair & levendig',      emoji: '👥', points: 3 },
      { id: 'mix',       label: 'Mix van toeristisch & lokaal', emoji: '⚖️', points: 4 },
      { id: 'offbeaten', label: 'Onontdekt & authentiek',   emoji: '🌿', points: 5 },
    ],
  },

  // 14 ─ Dealbreaker
  {
    id: 'dealbreaker', type: 'single',
    category: 'Dealbreaker', title: 'Wat wil je absoluut vermijden?',
    subtitle: 'Eerlijk — dit telt mee in de matching',
    options: [
      { id: 'no-cold',    label: 'Kou & regen',          emoji: '🧥', points: 0 },
      { id: 'no-crowds',  label: 'Massa toeristen',       emoji: '🚌', points: 0 },
      { id: 'no-adventure',label: 'Avontuur & ongemak',   emoji: '😰', points: 0 },
      { id: 'no-city',    label: 'Grote drukke steden',   emoji: '🏙', points: 0 },
    ],
  },
]
