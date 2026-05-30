import { NextRequest, NextResponse } from 'next/server'
import { queryOne, query } from '../../lib/db'
import { pusherServer, groupChannel } from '../../lib/pusher'
import { logApi } from '../../lib/log'

const VETO_SUBMITTED = 'veto-submitted'

export async function POST(req: NextRequest) {
  const t0 = Date.now()
  let userId = '', groupCode = ''
  try {
    const { groupId, code, destinationId } = await req.json()
    userId    = req.headers.get('x-user-id') ?? ''
    groupCode = code ?? ''

    // Store as a "rank 0" vote with negative meaning (reusing ts_votes table with rank=-1 as veto marker)
    await query(
      `INSERT INTO ts_votes (group_id, user_id, destination_id, rank)
       VALUES ($1, $2, $3, -1)
       ON CONFLICT (group_id, user_id, rank) DO UPDATE SET destination_id = EXCLUDED.destination_id`,
      [groupId, userId, destinationId],
    )

    await pusherServer.trigger(groupChannel(code), VETO_SUBMITTED, { userId, destinationId })

    logApi({ method: 'POST', path: '/api/veto', status: 200, durationMs: Date.now() - t0, userId, groupCode })
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    logApi({ method: 'POST', path: '/api/veto', status: 500, durationMs: Date.now() - t0, userId, groupCode, error: msg })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const groupId = searchParams.get('groupId')
  if (!groupId) return NextResponse.json({ vetoes: [] })
  const rows = await query<{ user_id: string; destination_id: string }>(
    `SELECT user_id, destination_id FROM ts_votes WHERE group_id = $1 AND rank = -1`,
    [groupId],
  )
  return NextResponse.json({ vetoes: rows })
}
