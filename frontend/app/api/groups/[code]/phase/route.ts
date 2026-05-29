import { NextRequest, NextResponse } from 'next/server'
import { queryOne, query, type Group } from '../../../../lib/db'
import { pusherServer, groupChannel, EVENTS } from '../../../../lib/pusher'

export async function POST(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const { phase, userId, winnerId } = await req.json()

  const group = await queryOne<Group>(
    'SELECT * FROM ts_groups WHERE invite_code = $1',
    [code],
  )
  if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (group.owner_id !== userId) return NextResponse.json({ error: 'Not owner' }, { status: 403 })

  await query(
    'UPDATE ts_groups SET phase = $1, winner_id = COALESCE($2, winner_id) WHERE id = $3',
    [phase, winnerId ?? null, group.id],
  )

  await pusherServer.trigger(groupChannel(code), EVENTS.PHASE_CHANGED, { phase, winnerId })

  return NextResponse.json({ ok: true })
}
