import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { city, country, groupTraits, personalities } = await req.json()

    const prompt = `Je bent een enthousiaste reisadviseur. Schrijf in het Nederlands 2-3 korte, inspirerende zinnen (max 60 woorden) over waarom ${city}, ${country} perfect is voor deze specifieke groep.

Groepskenmerken: ${groupTraits.join(', ')}.
Reizigerspersoonlijkheden: ${personalities.join(', ')}.

Wees specifiek en persoonlijk. Geen algemeenheden. Eindig met één concrete tip of weetje over ${city}.`

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 150,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    return NextResponse.json({ description: text })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
