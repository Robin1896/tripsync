import { NextRequest, NextResponse } from 'next/server'
import { queryOne, query, type Group } from '../../../../lib/db'
import { pusherServer, groupChannel, EVENTS } from '../../../../lib/pusher'
import { logApi } from '../../../../lib/log'

export async function POST(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const t0 = Date.now()
  const { code } = await params
  let userId = ''
  try {
    const body = await req.json()
    userId = body.userId ?? ''
    const { phase, winnerId, mode } = body

    const group = await queryOne<Group>(
      'SELECT * FROM ts_groups WHERE invite_code = $1',
      [code],
    )
    if (!group) {
      logApi({ method: 'POST', path: '/api/groups/[code]/phase', status: 404, durationMs: Date.now() - t0, groupCode: code, userId })
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (group.owner_id !== userId) {
      logApi({ method: 'POST', path: '/api/groups/[code]/phase', status: 403, durationMs: Date.now() - t0, groupCode: code, userId })
      return NextResponse.json({ error: 'Not owner' }, { status: 403 })
    }

    await query(
      `UPDATE ts_groups
       SET phase = $1,
           winner_id = COALESCE($2, winner_id),
           mode = COALESCE($3, mode)
       WHERE id = $4`,
      [phase, winnerId ?? null, mode ?? null, group.id],
    )

    // When resetting to lobby for a new round, clear all answers and votes
    if (phase === 'lobby') {
      await query('DELETE FROM ts_answers WHERE group_id = $1', [group.id])
      await query('DELETE FROM ts_votes WHERE group_id = $1', [group.id])
      await query('UPDATE ts_members SET questions_done = 0 WHERE group_id = $1', [group.id])
    }

    await pusherServer.trigger(groupChannel(code), EVENTS.PHASE_CHANGED, { phase, winnerId })

    logApi({ method: 'POST', path: '/api/groups/[code]/phase', status: 200, durationMs: Date.now() - t0, groupCode: code, userId })
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    logApi({ method: 'POST', path: '/api/groups/[code]/phase', status: 500, durationMs: Date.now() - t0, groupCode: code, userId, error: msg })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
