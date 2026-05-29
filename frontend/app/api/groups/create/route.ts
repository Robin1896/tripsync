import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne, type Group } from '../../../lib/db'
import { pusherServer, groupChannel, EVENTS } from '../../../lib/pusher'
import { generateInviteCode, getAvatarColor } from '../../../lib/user'
import { logApi } from '../../../lib/log'

export async function POST(req: NextRequest) {
  const t0 = Date.now()
  let userId = ''
  let code   = ''
  try {
    const body = await req.json()
    userId = body.userId ?? ''
    const { name, userName } = body

    if (!name || !userId || !userName) {
      logApi({ method: 'POST', path: '/api/groups/create', status: 400, durationMs: Date.now() - t0, userId })
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    code = generateInviteCode()

    const group = await queryOne<Group>(
      `INSERT INTO ts_groups (name, invite_code, owner_id, phase)
       VALUES ($1, $2, $3, 'lobby')
       RETURNING *`,
      [name.trim(), code, userId],
    )

    if (!group) {
      logApi({ method: 'POST', path: '/api/groups/create', status: 500, durationMs: Date.now() - t0, userId, error: 'DB insert returned null' })
      return NextResponse.json({ error: 'DB error' }, { status: 500 })
    }

    await query(
      `INSERT INTO ts_members (group_id, user_id, name, avatar_color, questions_done)
       VALUES ($1, $2, $3, $4, 0)
       ON CONFLICT (group_id, user_id) DO NOTHING`,
      [group.id, userId, userName.trim(), getAvatarColor(userId)],
    )

    await pusherServer.trigger(groupChannel(code), EVENTS.MEMBER_JOINED, { userId, userName })

    logApi({ method: 'POST', path: '/api/groups/create', status: 200, durationMs: Date.now() - t0, userId, groupCode: code })
    return NextResponse.json({ code, groupId: group.id })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    logApi({ method: 'POST', path: '/api/groups/create', status: 500, durationMs: Date.now() - t0, userId, groupCode: code || null, error: msg })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
