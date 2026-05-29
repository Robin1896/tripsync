import { NextRequest, NextResponse } from 'next/server'
import { query } from '../../../lib/db'

// Only available when TEST_MODE env is set (remove in production if desired)
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production' && !process.env.TEST_MODE) {
    return NextResponse.json({ error: 'Not available' }, { status: 404 })
  }

  const { userId, userName } = await req.json()
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

  // Delete old test group
  await query(`DELETE FROM ts_groups WHERE invite_code = 'TESTEN'`)

  // Create fresh group with caller as owner
  const [group] = await query<{ id: string }>(`
    INSERT INTO ts_groups (name, invite_code, owner_id, phase)
    VALUES ('Test Trip', 'TESTEN', $1, 'lobby')
    RETURNING id
  `, [userId])

  // Add caller as first member
  await query(`
    INSERT INTO ts_members (group_id, user_id, name, avatar_color, questions_done)
    VALUES ($1, $2, $3, '#c14a1f', 0)
  `, [group.id, userId, userName ?? 'Robin'])

  return NextResponse.json({ ok: true, code: 'TESTEN', groupId: group.id })
}
