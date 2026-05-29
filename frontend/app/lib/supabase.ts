import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co'
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-key'

export const supabase = createClient(url, key)

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

export interface GroupMember {
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

export function getUserId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem('tripsync_user_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('tripsync_user_id', id)
  }
  return id
}

export function getUserName(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('tripsync_user_name') ?? ''
}

export function setUserName(name: string) {
  localStorage.setItem('tripsync_user_name', name)
}

const AVATAR_COLORS = [
  '#c14a1f', '#1a1d2e', '#2d7a3a', '#6b5b95',
  '#c4a35a', '#4a7fa5', '#a5304a', '#3a7a6b',
]

export function getAvatarColor(userId: string): string {
  let hash = 0
  for (const c of userId) hash = (hash * 31 + c.charCodeAt(0)) >>> 0
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}
