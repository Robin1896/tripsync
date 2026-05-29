import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne, type Group } from '../../../lib/db'
import { pusherServer, groupChannel, EVENTS } from '../../../lib/pusher'
import { computeVoteWinner } from '../../../lib/engine'
import { logApi } from '../../../lib/log'

export async function POST(req: NextRequest) {
  const t0 = Date.now()
  let userId    = ''
  let groupCode = ''
  try {
    const body = await req.json()
    const { groupId, code } = body
    userId    = body.userId ?? ''
    groupCode = code ?? ''

    const group = await queryOne<Group>('SELECT * FROM ts_groups WHERE id = $1', [groupId])
    if (!group) {
      logApi({ method: 'POST', path: '/api/votes/reveal', status: 404, durationMs: Date.now() - t0, userId, groupCode })
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (group.owner_id !== userId) {
      logApi({ method: 'POST', path: '/api/votes/reveal', status: 403, durationMs: Date.now() - t0, userId, groupCode })
      return NextResponse.json({ error: 'Not owner' }, { status: 403 })
    }

    const votes = await query<{ user_id: string; destination_id: string; rank: number }>(
      'SELECT user_id, destination_id, rank FROM ts_votes WHERE group_id = $1',
      [groupId],
    )

    const winner = computeVoteWinner(
      votes.map(v => ({ userId: v.user_id, destinationId: v.destination_id, rank: v.rank }))
    )

    if (!winner) {
      logApi({ method: 'POST', path: '/api/votes/reveal', status: 400, durationMs: Date.now() - t0, userId, groupCode, error: 'No votes' })
      return NextResponse.json({ error: 'No votes' }, { status: 400 })
    }

    await query(
      "UPDATE ts_groups SET phase = 'winner', winner_id = $1 WHERE id = $2",
      [winner, groupId],
    )

    await pusherServer.trigger(groupChannel(code), EVENTS.PHASE_CHANGED, {
      phase: 'winner', winnerId: winner,
    })

    logApi({ method: 'POST', path: '/api/votes/reveal', status: 200, durationMs: Date.now() - t0, userId, groupCode })
    return NextResponse.json({ ok: true, winnerId: winner })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    logApi({ method: 'POST', path: '/api/votes/reveal', status: 500, durationMs: Date.now() - t0, userId, groupCode, error: msg })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
