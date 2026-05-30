import { type AnswerMap } from './engine'

export interface GroupProfile {
  consensusScore: number  // 0-100: how much members agree
  traits: string[]        // 2-3 sentences about the group
  badge: string           // emoji badge
}

function mostCommon(values: (string | undefined)[]): string | null {
  const counts: Record<string, number> = {}
  for (const v of values) { if (v) counts[v] = (counts[v] ?? 0) + 1 }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
  return sorted[0]?.[0] ?? null
}

export function computeGroupProfile(allAnswers: { userId: string; answers: AnswerMap }[]): GroupProfile {
  if (allAnswers.length === 0) return { consensusScore: 0, traits: [], badge: '👥' }

  const n = allAnswers.length
  let agreementPoints = 0
  let maxPoints = 0

  // Measure agreement on key questions
  const keys = ['climate', 'budget', 'vibe', 'crowd', 'season']
  for (const key of keys) {
    const vals = allAnswers.map(a => a.answers[key] as string | undefined)
    const topCount = Math.max(...Object.values(
      vals.filter(Boolean).reduce((acc, v) => ({ ...acc, [v!]: (acc[v!] ?? 0) + 1 }), {} as Record<string, number>)
    ), 0)
    agreementPoints += topCount
    maxPoints += n
  }

  const consensusScore = maxPoints > 0 ? Math.round((agreementPoints / maxPoints) * 100) : 50

  // Build traits
  const traits: string[] = []
  const climate  = mostCommon(allAnswers.map(a => a.answers['climate'] as string | undefined))
  const budget   = mostCommon(allAnswers.map(a => a.answers['budget'] as string | undefined))
  const vibe     = mostCommon(allAnswers.map(a => a.answers['vibe'] as string | undefined))
  const crowd    = mostCommon(allAnswers.map(a => a.answers['crowd'] as string | undefined))
  const season   = mostCommon(allAnswers.map(a => a.answers['season'] as string | undefined))

  const climateMap: Record<string, string> = { warm: 'warm weer', gematigd: 'aangenaam klimaat', koud: 'fris avontuur' }
  const vibeMap: Record<string, string>    = { relax: 'ontspanning', discover: 'ontdekken', wellness: 'bijkomen', party: 'feesten', adventure: 'avontuur' }
  const crowdMap: Record<string, string>   = { tourist: 'bekende plekken', mix: 'een mix', offbeaten: 'rustige plekken' }
  const seasonMap: Record<string, string>  = { winter: 'de winter', spring: 'het voorjaar', summer: 'de zomer', autumn: 'het najaar' }

  if (climate) traits.push(`Jullie houden van ${climateMap[climate] ?? climate}`)
  if (vibe)    traits.push(`De groepsvibe is ${vibeMap[vibe] ?? vibe}`)
  if (crowd)   traits.push(`Voorkeur voor ${crowdMap[crowd] ?? crowd}`)
  if (budget === '€€€€' || budget === '€€€') traits.push('Budget is geen probleem')
  else if (budget === '€') traits.push('Jullie reizen slim en budget-bewust')
  if (season)  traits.push(`Beste reistijd: ${seasonMap[season] ?? season}`)

  const badge = consensusScore >= 80 ? '🎯' : consensusScore >= 60 ? '👌' : consensusScore >= 40 ? '🤝' : '🌪'

  return { consensusScore, traits: traits.slice(0, 3), badge }
}
