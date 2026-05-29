import { NextRequest, NextResponse } from 'next/server'
import { query } from '../../../lib/db'

const BOT_ID   = 'test-bot-anna'
const BOT_NAME = 'Anna (bot)'

// Quick mode (6 questions)
const BOT_QUICK: Record<string, string> = {
  climate:       'warm',
  type:          'strand,cultuur',
  budget:        '€€',
  duration:      'middel',
  accommodation: 'hotel',
  activities:    'duiken,musea',
}

// Extended mode (14 questions)
const BOT_EXTENDED: Record<string, string> = {
  vibe:          'discover',
  climate:       'warm',
  type:          'strand,cultuur',
  tempo:         '6',
  budget:        '€€',
  comfort:       '6',
  duration:      'middel',
  accommodation: 'hotel',
  food:          'streetfood,markt',
  activities:    'duiken,musea',
  priority:      'strand|cultuur|natuur|citytrip|avontuur',
  distance:      'europe',
  crowd:         'mix',
  dealbreaker:   'no-cold',
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { userId, userName, mode } = body
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

  const isExtended = mode === 'extended'
  const botAnswers = isExtended ? BOT_EXTENDED : BOT_QUICK

  // Wipe old test group (cascade deletes members/answers/votes)
  await query(`DELETE FROM ts_groups WHERE invite_code = 'TESTEN'`)

  // Fresh group — caller is owner, mode set
  const [group] = await query<{ id: string }>(`
    INSERT INTO ts_groups (name, invite_code, owner_id, phase, mode)
    VALUES ('Test Trip', 'TESTEN', $1, 'lobby', $2)
    RETURNING id
  `, [userId, isExtended ? 'extended' : 'quick'])

  const gid = group.id

  // Add caller as member
  await query(`
    INSERT INTO ts_members (group_id, user_id, name, avatar_color, questions_done)
    VALUES ($1, $2, $3, '#c14a1f', 0)
  `, [gid, userId, userName ?? 'Robin'])

  // Add bot member with all answers already filled
  await query(`
    INSERT INTO ts_members (group_id, user_id, name, avatar_color, questions_done)
    VALUES ($1, $2, $3, '#2563eb', $4)
  `, [gid, BOT_ID, BOT_NAME, Object.keys(botAnswers).length])

  // Pre-fill bot answers
  for (const [questionId, value] of Object.entries(botAnswers)) {
    await query(`
      INSERT INTO ts_answers (group_id, user_id, question_id, value)
      VALUES ($1, $2, $3, $4)
    `, [gid, BOT_ID, questionId, value])
  }

  return NextResponse.json({ ok: true, code: 'TESTEN', groupId: gid })
}
