import { DESTINATIONS, type Destination } from './destinations'

export interface AnswerMap {
  [questionId: string]: string | string[]
}

export interface ScoredDestination {
  destination: Destination
  score: number
  breakdown: { category: string; score: number; max: number }[]
}

function overlap(a: string[], b: string[]): number {
  return a.filter(x => b.includes(x)).length
}

function sliderProximity(value: number, target: number, max: number): number {
  const dist = Math.abs(value - target)
  return Math.max(0, 1 - dist / (max * 0.6))
}

function scoreForMember(dest: Destination, answers: AnswerMap): number {
  let total = 0

  // --- QUICK mode questions ---

  const climate = answers['climate'] as string | undefined
  if (climate && dest.climate === climate) total += 20

  const types = toArr(answers['type'])
  if (types.length > 0) {
    const matched = overlap(types, dest.types)
    total += (matched / types.length) * 20
  }

  const budget = answers['budget'] as string | undefined
  if (budget && dest.budgets.includes(budget)) total += 20

  const duration = answers['duration'] as string | undefined
  if (duration && dest.durations.includes(duration)) total += 15

  const accomm = answers['accommodation'] as string | undefined
  if (accomm && dest.accommodation.includes(accomm)) total += 10

  const activities = toArr(answers['activities'])
  if (activities.length > 0) {
    const matched = overlap(activities, dest.activities)
    total += (matched / activities.length) * 15
  }

  // --- EXTENDED mode questions (each adds on top of quick base) ---

  // vibe (mood) — 15 pts
  const vibe = answers['vibe'] as string | undefined
  if (vibe && dest.vibe.includes(vibe)) total += 15

  // tempo (slider 1-10) vs dest.pace — 12 pts
  const tempo = answers['tempo']
  if (tempo !== undefined) {
    const t = parseFloat(String(tempo))
    if (!isNaN(t)) total += sliderProximity(t, dest.pace, 10) * 12
  }

  // comfort (slider 1-10) vs dest.luxury — 12 pts
  const comfort = answers['comfort']
  if (comfort !== undefined) {
    const c = parseFloat(String(comfort))
    if (!isNaN(c)) total += sliderProximity(c, dest.luxury, 10) * 12
  }

  // food (multi) vs dest.foodScene — 10 pts
  const food = toArr(answers['food'])
  if (food.length > 0) {
    const matched = overlap(food, dest.foodScene)
    total += (matched / food.length) * 10
  }

  // priority (rank, pipe-separated) — 10 pts weighted by position
  const priority = answers['priority'] as string | undefined
  if (priority) {
    const ranked = priority.split('|')
    const weights = [5, 3, 2, 1, 0.5]
    ranked.forEach((item, i) => {
      if (dest.types.includes(item) || dest.activities.includes(item)) {
        total += weights[i] ?? 0
      }
    })
  }

  // distance (single) — 8 pts
  const distance = answers['distance'] as string | undefined
  if (distance && dest.distance === distance) total += 8
  else if (distance === 'worldwide' && dest.distance !== 'nearby') total += 3

  // crowd (single) — 8 pts
  const crowd = answers['crowd'] as string | undefined
  if (crowd && dest.crowd === crowd) total += 8

  // dealbreaker — penalty -25 pts if selected dealbreaker matches destination
  const dealbreaker = answers['dealbreaker'] as string | undefined
  if (dealbreaker && dest.dealbreakers.includes(dealbreaker)) total -= 25

  return Math.round(total)
}

function toArr(val: string | string[] | undefined): string[] {
  if (!val) return []
  if (Array.isArray(val)) return val
  return val.split(',').filter(Boolean)
}

export function computeResults(
  allAnswers: { userId: string; answers: AnswerMap }[]
): ScoredDestination[] {
  if (allAnswers.length === 0) return []

  const maxPossible = 155 // quick 100 + extended 55

  return DESTINATIONS.map(dest => {
    const scores = allAnswers.map(m => scoreForMember(dest, m.answers))
    const rawAvg = scores.reduce((s, x) => s + x, 0) / scores.length
    const pct = Math.min(100, Math.max(0, Math.round((rawAvg / maxPossible) * 100)))

    return {
      destination: dest,
      score: pct,
      breakdown: [
        { category: 'Match', score: pct, max: 100 },
      ],
    }
  })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
}

// Partial scoring: use ALL destinations (not just top 5), score based on only answered questions.
// Returns relative strength (0-100) so the cloud can size/fade each dot.
export function computePartialResults(answers: AnswerMap): { destination: Destination; strength: number }[] {
  const raw = DESTINATIONS.map(dest => ({
    destination: dest,
    raw: scoreForMember(dest, answers),
  }))

  const max = Math.max(...raw.map(r => r.raw), 1)
  const min = Math.min(...raw.map(r => r.raw))
  const range = max - min || 1

  return raw
    .map(r => ({
      destination: r.destination,
      strength: Math.round(((r.raw - min) / range) * 100),
    }))
    .sort((a, b) => b.strength - a.strength)
}

export function computeVoteWinner(
  votes: { userId: string; destinationId: string; rank: number }[]
): string | null {
  const scores: Record<string, number> = {}
  for (const v of votes) {
    const pts = v.rank === 1 ? 3 : v.rank === 2 ? 2 : 1
    scores[v.destinationId] = (scores[v.destinationId] ?? 0) + pts
  }
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1])
  return sorted[0]?.[0] ?? null
}
