import { NextRequest, NextResponse } from 'next/server'
import { query } from '../../lib/db'

const ADMIN_KEY = process.env.ADMIN_KEY ?? 'tripsync-admin'

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key')
  if (key !== ADMIN_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Stats for last 24 hours
    const [statsRow] = await query<{
      total: string; errors: string; avg_ms: string; p95_ms: string
    }>(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status_code >= 400) AS errors,
        ROUND(AVG(duration_ms))::text AS avg_ms,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms)::text AS p95_ms
      FROM app_logs
      WHERE created_at > NOW() - INTERVAL '24 hours'
    `)

    // Requests per hour (last 24 h)
    const perHour = await query<{ hour: string; count: string }>(`
      SELECT
        DATE_TRUNC('hour', created_at) AS hour,
        COUNT(*) AS count
      FROM app_logs
      WHERE created_at > NOW() - INTERVAL '24 hours'
      GROUP BY 1
      ORDER BY 1
    `)

    // Per-path breakdown (top 20)
    const perPath = await query<{
      app: string; method: string; path: string
      count: string; errors: string; avg_ms: string
    }>(`
      SELECT app, method, path,
        COUNT(*) AS count,
        COUNT(*) FILTER (WHERE status_code >= 400) AS errors,
        ROUND(AVG(duration_ms))::text AS avg_ms
      FROM app_logs
      WHERE created_at > NOW() - INTERVAL '24 hours'
        AND method != 'PAGE'
        AND method != 'UI'
      GROUP BY app, method, path
      ORDER BY count DESC
      LIMIT 20
    `)

    // Active groups with member counts
    const groups = await query<{
      id: string; name: string; invite_code: string
      phase: string; member_count: string; owner_id: string; created_at: string
    }>(`
      SELECT g.id, g.name, g.invite_code, g.phase, g.owner_id, g.created_at,
        COUNT(m.id)::text AS member_count
      FROM ts_groups g
      LEFT JOIN ts_members m ON m.group_id = g.id
      WHERE g.created_at > NOW() - INTERVAL '7 days'
      GROUP BY g.id
      ORDER BY g.created_at DESC
      LIMIT 30
    `)

    // Recent logs (last 200)
    const logs = await query<{
      id: string; app: string; method: string; path: string
      status_code: number; duration_ms: number
      user_id: string | null; group_code: string | null
      error: string | null; created_at: string
    }>(`
      SELECT id, app, method, path, status_code, duration_ms,
             user_id, group_code, error, created_at
      FROM app_logs
      ORDER BY created_at DESC
      LIMIT 200
    `)

    return NextResponse.json({
      stats: {
        total:    parseInt(statsRow?.total  ?? '0'),
        errors:   parseInt(statsRow?.errors ?? '0'),
        avgMs:    parseInt(statsRow?.avg_ms ?? '0'),
        p95Ms:    parseInt(statsRow?.p95_ms ?? '0'),
        errorRate: statsRow?.total === '0' ? 0
          : Math.round((parseInt(statsRow.errors) / parseInt(statsRow.total)) * 1000) / 10,
      },
      perHour,
      perPath,
      groups,
      logs,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
