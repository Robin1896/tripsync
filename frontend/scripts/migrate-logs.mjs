import { neon } from '@neondatabase/serverless'
const sql = neon(process.env.DATABASE_URL)
const stmts = [
  `CREATE TABLE IF NOT EXISTS app_logs (
    id          BIGSERIAL PRIMARY KEY,
    app         VARCHAR(50)  NOT NULL DEFAULT 'tripsync',
    method      VARCHAR(10)  NOT NULL,
    path        TEXT         NOT NULL,
    status_code SMALLINT     NOT NULL DEFAULT 200,
    duration_ms INTEGER      NOT NULL DEFAULT 0,
    user_id     TEXT,
    group_code  VARCHAR(20),
    error       TEXT,
    ip          VARCHAR(60),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_app_logs_app_created ON app_logs(app, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_app_logs_created ON app_logs(created_at DESC)`,
]
for (const s of stmts) {
  try {
    await sql(s)
    console.log('OK:', s.slice(0, 60).replace(/\n/g, ' '))
  } catch (e) {
    console.error('ERR:', e.message)
  }
}
console.log('Done')
