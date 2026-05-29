import { neon, type NeonQueryFunction } from '@neondatabase/serverless'

let _sql: NeonQueryFunction<false, false> | null = null

function getSql() {
  if (!_sql) {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error('DATABASE_URL not set')
    _sql = neon(url)
  }
  return _sql
}

export async function query<T = Record<string, unknown>>(
  sqlStr: string,
  params?: unknown[],
): Promise<T[]> {
  const rows = await getSql()(sqlStr, params as never[])
  return rows as T[]
}

export async function queryOne<T = Record<string, unknown>>(
  sqlStr: string,
  params?: unknown[],
): Promise<T | null> {
  const rows = await query<T>(sqlStr, params)
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

export interface Vote {
  id: string
  group_id: string
  user_id: string
  destination_id: string
  rank: number
}
