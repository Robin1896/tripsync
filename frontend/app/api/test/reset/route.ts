import { NextRequest, NextResponse } from 'next/server'
import { query } from '../../../lib/db'

const BOT_ID   = 'test-bot-anna'
const BOT_NAME = 'Anna (bot)'

// Bot answers — one value per question (multi = comma-separated)
const BOT_ANSWERS: Record<string, string> = {
  climate:       'warm',
  type:          'strand,cultuur',
  budget:        '€€',
  duration:      'middel',
  accommodation: 'hotel',
  activities:    'duiken,musea',
}

export async function POST(req: NextRequest) {
  const { userId, userName } = await req.json()
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

  // Wipe old test group (cascade deletes members/answers/votes)
  await query(`DELETE FROM ts_groups WHERE invite_code = 'TESTEN'`)

  // Fresh group — caller is owner
  const [group] = await query<{ id: string }>(`
    INSERT INTO ts_groups (name, invite_code, owner_id, phase)
    VALUES ('Test Trip', 'TESTEN', $1, 'lobby')
    RETURNING id
  `, [userId])

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
  `, [gid, BOT_ID, BOT_NAME, Object.keys(BOT_ANSWERS).length])

  // Pre-fill bot answers
  for (const [questionId, value] of Object.entries(BOT_ANSWERS)) {
    await query(`
      INSERT INTO ts_answers (group_id, user_id, question_id, value)
      VALUES ($1, $2, $3, $4)
    `, [gid, BOT_ID, questionId, value])
  }

  return NextResponse.json({ ok: true, code: 'TESTEN', groupId: gid })
}
