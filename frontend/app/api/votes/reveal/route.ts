import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne, type Group } from '../../../lib/db'
import { pusherServer, groupChannel, EVENTS } from '../../../lib/pusher'
import { computeVoteWinner } from '../../../lib/engine'

export async function POST(req: NextRequest) {
  const { groupId, code, userId } = await req.json()

  const group = await queryOne<Group>('SELECT * FROM ts_groups WHERE id = $1', [groupId])
  if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (group.owner_id !== userId) return NextResponse.json({ error: 'Not owner' }, { status: 403 })

  const votes = await query<{ user_id: string; destination_id: string; rank: number }>(
    'SELECT user_id, destination_id, rank FROM ts_votes WHERE group_id = $1',
    [groupId],
  )

  const winner = computeVoteWinner(
    votes.map(v => ({ userId: v.user_id, destinationId: v.destination_id, rank: v.rank }))
  )

  if (!winner) return NextResponse.json({ error: 'No votes' }, { status: 400 })

  await query(
    "UPDATE ts_groups SET phase = 'winner', winner_id = $1 WHERE id = $2",
    [winner, groupId],
  )

  await pusherServer.trigger(groupChannel(code), EVENTS.PHASE_CHANGED, {
    phase: 'winner', winnerId: winner,
  })

  return NextResponse.json({ ok: true, winnerId: winner })
}
