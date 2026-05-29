import { NextRequest, NextResponse } from 'next/server'
import { query } from '../../lib/db'
import { pusherServer, groupChannel, EVENTS } from '../../lib/pusher'

export async function POST(req: NextRequest) {
  const { groupId, code, userId, votes } = await req.json()
  // votes: [{ destinationId, rank }]

  for (const v of votes) {
    await query(
      `INSERT INTO ts_votes (group_id, user_id, destination_id, rank)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (group_id, user_id, rank) DO UPDATE SET destination_id = EXCLUDED.destination_id`,
      [groupId, userId, v.destinationId, v.rank],
    )
  }

  await pusherServer.trigger(groupChannel(code), EVENTS.VOTE_SUBMITTED, { userId })

  return NextResponse.json({ ok: true })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const groupId = searchParams.get('groupId')
  if (!groupId) return NextResponse.json({ error: 'Missing groupId' }, { status: 400 })

  const votes = await query<{ user_id: string; destination_id: string; rank: number }>(
    'SELECT user_id, destination_id, rank FROM ts_votes WHERE group_id = $1',
    [groupId],
  )

  return NextResponse.json({ votes })
}
