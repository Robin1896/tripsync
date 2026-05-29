import { query } from './db'

export async function logApi(opts: {
  app?: string
  method: string
  path: string
  status: number
  durationMs: number
  userId?: string | null
  groupCode?: string | null
  error?: string | null
  ip?: string | null
}) {
  query(
    `INSERT INTO app_logs (app, method, path, status_code, duration_ms, user_id, group_code, error, ip)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      opts.app ?? 'tripsync',
      opts.method.toUpperCase(),
      opts.path,
      opts.status,
      opts.durationMs,
      opts.userId   ?? null,
      opts.groupCode ?? null,
      opts.error    ?? null,
      opts.ip       ?? null,
    ]
  ).catch(() => {}) // fire-and-forget, never blocks the response
}
