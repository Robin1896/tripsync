import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne, type Group } from '../../../lib/db'
import { pusherServer, groupChannel, EVENTS } from '../../../lib/pusher'
import { generateInviteCode, getAvatarColor } from '../../../lib/user'

export async function POST(req: NextRequest) {
  const { name, userId, userName } = await req.json()
  if (!name || !userId || !userName) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const code = generateInviteCode()

  const group = await queryOne<Group>(
    `INSERT INTO ts_groups (name, invite_code, owner_id, phase)
     VALUES ($1, $2, $3, 'lobby')
     RETURNING *`,
    [name.trim(), code, userId],
  )

  if (!group) return NextResponse.json({ error: 'DB error' }, { status: 500 })

  await query(
    `INSERT INTO ts_members (group_id, user_id, name, avatar_color, questions_done)
     VALUES ($1, $2, $3, $4, 0)
     ON CONFLICT (group_id, user_id) DO NOTHING`,
    [group.id, userId, userName.trim(), getAvatarColor(userId)],
  )

  await pusherServer.trigger(groupChannel(code), EVENTS.MEMBER_JOINED, { userId, userName })

  return NextResponse.json({ code, groupId: group.id })
}
