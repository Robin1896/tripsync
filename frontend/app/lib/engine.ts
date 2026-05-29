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

function scoreForMember(dest: Destination, answers: AnswerMap): number {
  let total = 0

  const climate = answers['climate'] as string
  if (climate && dest.climate === climate) total += 20

  const types = (answers['type'] ?? []) as string[]
  if (types.length > 0) {
    const matched = overlap(types, dest.types)
    total += (matched / Math.max(types.length, 1)) * 20
  }

  const budget = answers['budget'] as string
  if (budget && dest.budgets.includes(budget)) total += 20

  const duration = answers['duration'] as string
  if (duration && dest.durations.includes(duration)) total += 15

  const accomm = answers['accommodation'] as string
  if (accomm && dest.accommodation.includes(accomm)) total += 10

  const activities = (answers['activities'] ?? []) as string[]
  if (activities.length > 0) {
    const matched = overlap(activities, dest.activities)
    total += (matched / Math.max(activities.length, 1)) * 15
  }

  return Math.round(total)
}

export function computeResults(
  allAnswers: { userId: string; answers: AnswerMap }[]
): ScoredDestination[] {
  if (allAnswers.length === 0) return []

  return DESTINATIONS.map(dest => {
    const scores = allAnswers.map(m => scoreForMember(dest, m.answers))
    const avg = scores.reduce((s, x) => s + x, 0) / scores.length

    return {
      destination: dest,
      score: Math.round(avg),
      breakdown: [
        { category: 'Match', score: Math.round(avg), max: 100 },
      ],
    }
  })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
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
