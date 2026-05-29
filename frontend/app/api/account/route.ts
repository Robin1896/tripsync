import { NextRequest, NextResponse } from 'next/server'
import { query } from '../../lib/db'
import { logApi } from '../../lib/log'

export async function POST(req: NextRequest) {
  const t0 = Date.now()
  try {
    const { userId, name, email } = await req.json()
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    await query(
      `INSERT INTO app_users (user_id, app, name, email, updated_at)
       VALUES ($1, 'tripsync', $2, $3, NOW())
       ON CONFLICT (user_id, app) DO UPDATE SET name=$2, email=$3, updated_at=NOW()`,
      [userId, name ?? '', email ?? ''],
    )
    logApi({ method: 'POST', path: '/api/account', status: 200, durationMs: Date.now() - t0, userId })
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    logApi({ method: 'POST', path: '/api/account', status: 500, durationMs: Date.now() - t0, error: msg })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const t0 = Date.now()
  const userId = new URL(req.url).searchParams.get('userId')
  if (!userId) return NextResponse.json({ user: null })
  try {
    const rows = await query<{ name: string; email: string }>(
      `SELECT name, email FROM app_users WHERE user_id=$1 AND app='tripsync'`,
      [userId],
    )
    logApi({ method: 'GET', path: '/api/account', status: 200, durationMs: Date.now() - t0, userId })
    return NextResponse.json({ user: rows[0] ?? null })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    logApi({ method: 'GET', path: '/api/account', status: 500, durationMs: Date.now() - t0, error: msg })
    return NextResponse.json({ user: null })
  }
}
