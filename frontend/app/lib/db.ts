import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
})

pool.on('error', (err) => {
  console.error('[DB] Pool error:', err.message)
})

export async function query<T = unknown>(
  sql: string,
  params?: unknown[],
): Promise<T[]> {
  const { rows } = await pool.query(sql, params)
  return rows as T[]
}

export async function queryOne<T = unknown>(
  sql: string,
  params?: unknown[],
): Promise<T | null> {
  const rows = await query<T>(sql, params)
  return rows[0] ?? null
}

export type Phase = 'lobby' | 'game' | 'results' | 'vote' | 'winner'

export interface Group {
  id: string
  name: string
  invite_code: string
  owner_id: string
  phase: Phase
  winner_id: string | null
  created_at: string
}

export interface Member {
  id: string
  group_id: string
  user_id: string
  name: string
  avatar_color: string
  questions_done: number
}

export interface Answer {
  id: string
  group_id: string
  user_id: string
  question_id: string
  value: string
}

export interface Vote {
  id: string
  group_id: string
  user_id: string
  destination_id: string
  rank: number
}
