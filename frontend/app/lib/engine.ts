import { DESTINATIONS, type Destination } from './destinations'

export interface AnswerMap {
  [questionId: string]: string | string[]
}

export interface ScoredDestination {
  destination: Destination
  score: number
  breakdown: ScoreBreakdownItem[]
}

function overlap(a: string[], b: string[]): number {
  return a.filter(x => b.includes(x)).length
}

function sliderProximity(value: number, target: number, max: number): number {
  const dist = Math.abs(value - target)
  return Math.max(0, 1 - dist / (max * 0.6))
}

export interface ScoreBreakdownItem {
  label: string
  pts: number
  max: number
  matched: boolean
}

function scoreWithBreakdown(dest: Destination, answers: AnswerMap): { total: number; breakdown: ScoreBreakdownItem[] } {
  const items: ScoreBreakdownItem[] = []

  const climate = answers['climate'] as string | undefined
  if (climate) {
    const pts = dest.climate === climate ? 20 : 0
    items.push({ label: 'Klimaat', pts, max: 20, matched: pts > 0 })
  }

  const types = toArr(answers['type'])
  if (types.length > 0) {
    const pts = Math.round((overlap(types, dest.types) / types.length) * 20)
    items.push({ label: 'Type reis', pts, max: 20, matched: pts > 0 })
  }

  const budget = answers['budget'] as string | undefined
  if (budget) {
    const pts = dest.budgets.includes(budget) ? 20 : 0
    items.push({ label: 'Budget', pts, max: 20, matched: pts > 0 })
  }

  const duration = answers['duration'] as string | undefined
  if (duration) {
    const pts = dest.durations.includes(duration) ? 15 : 0
    items.push({ label: 'Reisduur', pts, max: 15, matched: pts > 0 })
  }

  const accomm = answers['accommodation'] as string | undefined
  if (accomm) {
    const pts = dest.accommodation.includes(accomm) ? 10 : 0
    items.push({ label: 'Verblijf', pts, max: 10, matched: pts > 0 })
  }

  const activities = toArr(answers['activities'])
  if (activities.length > 0) {
    const pts = Math.round((overlap(activities, dest.activities) / activities.length) * 15)
    items.push({ label: 'Activiteiten', pts, max: 15, matched: pts > 0 })
  }

  const vibe = answers['vibe'] as string | undefined
  if (vibe) {
    const pts = dest.vibe.includes(vibe) ? 15 : 0
    items.push({ label: 'Sfeer', pts, max: 15, matched: pts > 0 })
  }

  const tempo = answers['tempo']
  if (tempo !== undefined) {
    const t = parseFloat(String(tempo))
    const pts = isNaN(t) ? 0 : Math.round(sliderProximity(t, dest.pace, 10) * 12)
    items.push({ label: 'Tempo', pts, max: 12, matched: pts >= 6 })
  }

  const comfort = answers['comfort']
  if (comfort !== undefined) {
    const c = parseFloat(String(comfort))
    const pts = isNaN(c) ? 0 : Math.round(sliderProximity(c, dest.luxury, 10) * 12)
    items.push({ label: 'Comfort', pts, max: 12, matched: pts >= 6 })
  }

  const food = toArr(answers['food'])
  if (food.length > 0) {
    const pts = Math.round((overlap(food, dest.foodScene) / food.length) * 10)
    items.push({ label: 'Eten', pts, max: 10, matched: pts > 0 })
  }

  const distance = answers['distance'] as string | undefined
  if (distance) {
    const pts = dest.distance === distance ? 8 : (distance === 'worldwide' && dest.distance !== 'nearby' ? 3 : 0)
    items.push({ label: 'Afstand', pts, max: 8, matched: pts > 0 })
  }

  const crowd = answers['crowd'] as string | undefined
  if (crowd) {
    const pts = dest.crowd === crowd ? 8 : 0
    items.push({ label: 'Drukte', pts, max: 8, matched: pts > 0 })
  }

  const season = answers['season'] as string | undefined
  if (season) {
    const seasonMonths: Record<string, string[]> = {
      winter: ['Dec', 'Jan', 'Feb'],
      spring: ['Mrt', 'Apr', 'Mei'],
      summer: ['Jun', 'Jul', 'Aug'],
      autumn: ['Sep', 'Okt', 'Nov'],
    }
    const wanted = seasonMonths[season] ?? []
    const bestStr = dest.bestMonths
    const hit = wanted.some(m => bestStr.includes(m))
    const pts = hit ? 12 : 0
    items.push({ label: 'Reisperiode', pts, max: 12, matched: hit })
  }

  const dealbreaker = answers['dealbreaker'] as string | undefined
  if (dealbreaker && dest.dealbreakers.includes(dealbreaker)) {
    items.push({ label: 'Dealbreaker ⚠', pts: -25, max: 0, matched: false })
  }

  const total = items.reduce((s, i) => s + i.pts, 0)
  return { total: Math.round(total), breakdown: items }
}

function scoreForMember(dest: Destination, answers: AnswerMap): number {
  return scoreWithBreakdown(dest, answers).total
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

  const maxPossible = 167 // quick 112 (incl season) + extended 55

  return DESTINATIONS.map(dest => {
    const results = allAnswers.map(m => scoreWithBreakdown(dest, m.answers))
    const rawAvg  = results.reduce((s, r) => s + r.total, 0) / results.length
    const pct     = Math.min(100, Math.max(0, Math.round((rawAvg / maxPossible) * 100)))

    // Average breakdown across members
    const breakdown = results[0]?.breakdown.map((item, idx) => ({
      ...item,
      pts: Math.round(results.reduce((s, r) => s + (r.breakdown[idx]?.pts ?? 0), 0) / results.length),
    })) ?? []

    return { destination: dest, score: pct, breakdown }
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
