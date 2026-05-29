import { NextRequest, NextResponse } from 'next/server'
import { logApi } from '../../lib/log'

// Universal log endpoint — other apps (flights, etc.) can POST here:
// POST /api/log  { key, app, method, path, status, durationMs, userId?, groupCode?, error? }

const ADMIN_KEY = process.env.ADMIN_KEY ?? 'tripsync-admin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (body.key !== ADMIN_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await logApi({
      app:       body.app       ?? 'unknown',
      method:    body.method    ?? 'GET',
      path:      body.path      ?? '/',
      status:    body.status    ?? 200,
      durationMs: body.durationMs ?? 0,
      userId:    body.userId    ?? null,
      groupCode: body.groupCode ?? null,
      error:     body.error     ?? null,
      ip:        req.headers.get('x-forwarded-for') ?? null,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}
