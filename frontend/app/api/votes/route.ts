import { NextRequest, NextResponse } from 'next/server'
import { query } from '../../lib/db'
import { pusherServer, groupChannel, EVENTS } from '../../lib/pusher'
import { logApi } from '../../lib/log'

export async function POST(req: NextRequest) {
  const t0 = Date.now()
  let userId    = ''
  let groupCode = ''
  try {
    const body = await req.json()
    const { groupId, code, votes } = body
    userId    = body.userId ?? ''
    groupCode = code ?? ''

    for (const v of votes) {
      await query(
        `INSERT INTO ts_votes (group_id, user_id, destination_id, rank)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (group_id, user_id, rank) DO UPDATE SET destination_id = EXCLUDED.destination_id`,
        [groupId, userId, v.destinationId, v.rank],
      )
    }

    await pusherServer.trigger(groupChannel(code), EVENTS.VOTE_SUBMITTED, { userId })

    logApi({ method: 'POST', path: '/api/votes', status: 200, durationMs: Date.now() - t0, userId, groupCode })
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    logApi({ method: 'POST', path: '/api/votes', status: 500, durationMs: Date.now() - t0, userId, groupCode, error: msg })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const t0 = Date.now()
  const { searchParams } = new URL(req.url)
  const groupId = searchParams.get('groupId')

  if (!groupId) {
    logApi({ method: 'GET', path: '/api/votes', status: 400, durationMs: Date.now() - t0 })
    return NextResponse.json({ error: 'Missing groupId' }, { status: 400 })
  }

  try {
    const votes = await query<{ user_id: string; destination_id: string; rank: number }>(
      'SELECT user_id, destination_id, rank FROM ts_votes WHERE group_id = $1',
      [groupId],
    )
    logApi({ method: 'GET', path: '/api/votes', status: 200, durationMs: Date.now() - t0 })
    return NextResponse.json({ votes })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    logApi({ method: 'GET', path: '/api/votes', status: 500, durationMs: Date.now() - t0, error: msg })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
