import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne, type Group, type Member } from '../../../lib/db'
import { pusherServer, groupChannel, EVENTS } from '../../../lib/pusher'
import { getAvatarColor } from '../../../lib/user'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  try {
    const group = await queryOne<Group>(
      'SELECT * FROM ts_groups WHERE invite_code = $1',
      [code],
    )
    if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const members = await query<Member>(
      'SELECT * FROM ts_members WHERE group_id = $1 ORDER BY id',
      [group.id],
    )

    return NextResponse.json({ group, members })
  } catch (e) {
    console.error('GET /api/groups/[code] error:', e)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const { userId, userName } = await req.json()

  const group = await queryOne<Group>(
    'SELECT * FROM ts_groups WHERE invite_code = $1',
    [code],
  )
  if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await query(
    `INSERT INTO ts_members (group_id, user_id, name, avatar_color, questions_done)
     VALUES ($1, $2, $3, $4, 0)
     ON CONFLICT (group_id, user_id) DO UPDATE SET name = EXCLUDED.name`,
    [group.id, userId, userName.trim(), getAvatarColor(userId)],
  )

  await pusherServer.trigger(groupChannel(code), EVENTS.MEMBER_JOINED, { userId, userName })

  return NextResponse.json({ groupId: group.id, phase: group.phase })
}
