import { NextRequest, NextResponse } from 'next/server'
import { pusherServer, groupChannel } from '../../lib/pusher'

const REACTION_EVENT = 'destination-reaction'

export async function POST(req: NextRequest) {
  try {
    const { code, userId, userName, destinationId, emoji } = await req.json()
    await pusherServer.trigger(groupChannel(code), REACTION_EVENT, { userId, userName, destinationId, emoji })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
