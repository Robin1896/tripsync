import { NextRequest, NextResponse } from 'next/server'
import { DESTINATIONS } from '../../lib/destinations'

// Purely local — no external API needed
export async function POST(req: NextRequest) {
  const { city, country, groupTraits } = await req.json()

  const dest = DESTINATIONS.find(d => d.city === city)
  if (!dest) return NextResponse.json({ description: '' })

  const vibeMap: Record<string, string> = {
    relax:     'perfect om echt bij te komen',
    discover:  'een geweldige keuze voor ontdekkers',
    adventure: 'ideaal voor avontuurlijke geesten',
    wellness:  'perfect om op adem te komen',
    party:     'de perfecte plek om het er goed van te nemen',
  }
  const climateMap: Record<string, string> = {
    warm:     'het warme klimaat zorgt voor echte zomerse sfeer',
    gematigd: 'het aangename klimaat maakt elke dag prettig',
    koud:     'de frisse lucht geeft energie',
  }
  const distanceMap: Record<string, string> = {
    nearby:   'bovendien dichtbij huis',
    europe:   'makkelijk bereikbaar vanuit Nederland',
    worldwide: 'een echte avontuurlijke verre reis',
  }

  const vibe    = dest.vibe[0] ? (vibeMap[dest.vibe[0]] ?? '') : ''
  const climate = climateMap[dest.climate] ?? ''
  const dist    = distanceMap[dest.distance] ?? ''
  const act     = dest.activities.slice(0, 2).join(' en ')

  const lines = [
    `${city} is ${vibe}.`,
    climate ? `${climate[0].toUpperCase()}${climate.slice(1)}.` : '',
    act ? `Denk aan: ${act}.` : '',
    dist ? `En ${dist}.` : '',
  ].filter(Boolean)

  return NextResponse.json({ description: lines.join(' ') })
}
