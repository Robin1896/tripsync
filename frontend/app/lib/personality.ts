import { type AnswerMap } from './engine'

export interface PersonalityType {
  id: string
  name: string
  emoji: string
  description: string
  color: string
}

const TYPES: PersonalityType[] = [
  { id: 'adventurer',  name: 'De Avonturier',       emoji: '🧗', description: 'Jij zoekt spanning, natuur en avontuur. Het liefst off-beaten.', color: '#2d7a3a' },
  { id: 'explorer',    name: 'De Ontdekker',         emoji: '🗺', description: 'Cultuur, geschiedenis en lokale sfeer zijn jouw drijfveer.', color: '#4a7fa5' },
  { id: 'relaxer',     name: 'De Zonneaanbidder',    emoji: '🌊', description: 'Zon, zee en totale ontspanning. Vakantie = echt bijkomen.', color: '#c4a35a' },
  { id: 'foodie',      name: 'De Culinair Reiziger', emoji: '🍽', description: 'Eten is cultuur. Jij plant je route langs de beste keukens.', color: '#c14a1f' },
  { id: 'luxury',      name: 'De Luxereiziger',      emoji: '💎', description: 'Comfort en kwaliteit staan voorop. Het beste of niets.', color: '#6b5b95' },
  { id: 'nightlife',   name: 'De Feestbeest',        emoji: '🎉', description: 'Het nachtleven begint als anderen slapen. Energie en sociale connectie.', color: '#a5304a' },
  { id: 'nature',      name: 'De Natuurganger',      emoji: '🏔', description: 'Bergen, bossen en open lucht. Je hebt ruimte nodig.', color: '#3a7a6b' },
  { id: 'citytrotter', name: 'De Stedentripper',     emoji: '🌆', description: 'Musea, architectuur en bruisende steden. Altijd actief.', color: '#1a1d2e' },
]

export function computePersonality(answers: AnswerMap): PersonalityType {
  const scores: Record<string, number> = {}
  for (const t of TYPES) scores[t.id] = 0

  const vibe = answers['vibe'] as string | undefined
  if (vibe === 'adventure') { scores['adventurer'] += 4; scores['nature'] += 2 }
  if (vibe === 'discover')  { scores['explorer']   += 4; scores['citytrotter'] += 2 }
  if (vibe === 'relax')     { scores['relaxer']    += 4 }
  if (vibe === 'party')     { scores['nightlife']  += 4; scores['feestbeest'] }
  if (vibe === 'wellness')  { scores['relaxer']    += 2; scores['nature'] += 2 }

  const types = (Array.isArray(answers['type']) ? answers['type'] : (answers['type'] as string | undefined)?.split(',') ?? []) as string[]
  if (types.includes('avontuur'))  { scores['adventurer'] += 3 }
  if (types.includes('cultuur'))   { scores['explorer']   += 3; scores['citytrotter'] += 2 }
  if (types.includes('strand'))    { scores['relaxer']    += 3 }
  if (types.includes('natuur'))    { scores['nature']     += 3 }
  if (types.includes('citytrip'))  { scores['citytrotter'] += 3; scores['explorer'] += 1 }

  const budget = answers['budget'] as string | undefined
  if (budget === '€€€€') scores['luxury'] += 4
  if (budget === '€€€')  scores['luxury'] += 2

  const food = (Array.isArray(answers['food']) ? answers['food'] : (answers['food'] as string | undefined)?.split(',') ?? []) as string[]
  if (food.includes('finedining') || food.includes('markt') || food.includes('streetfood')) scores['foodie'] += 3

  const activities = (Array.isArray(answers['activities']) ? answers['activities'] : (answers['activities'] as string | undefined)?.split(',') ?? []) as string[]
  if (activities.includes('skiën') || activities.includes('duiken') || activities.includes('roadtrip')) scores['adventurer'] += 2
  if (activities.includes('musea')) { scores['explorer'] += 2; scores['citytrotter'] += 1 }
  if (activities.includes('uitgaan')) scores['nightlife'] += 3

  const crowd = answers['crowd'] as string | undefined
  if (crowd === 'offbeaten') { scores['adventurer'] += 2; scores['nature'] += 1 }
  if (crowd === 'tourist')   scores['citytrotter'] += 1

  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0]
  return TYPES.find(t => t.id === best) ?? TYPES[0]
}

export function computeGroupPersonalities(allAnswers: { userId: string; answers: AnswerMap }[]): PersonalityType[] {
  return allAnswers.map(a => computePersonality(a.answers))
}
