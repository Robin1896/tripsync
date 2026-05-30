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

export function getUserEmail(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('tripsync_user_email') ?? ''
}

export function setUserEmail(email: string) {
  localStorage.setItem('tripsync_user_email', email)
}

export interface RecentGame {
  code: string
  groupName: string
  joinedAt: string
  winnerCity?: string
  winnerEmoji?: string
}

export function addRecentGame(code: string, groupName: string, winner?: { city: string; emoji: string }) {
  if (typeof window === 'undefined') return
  const existing = getRecentGames().filter(g => g.code !== code)
  const entry: RecentGame = { code, groupName, joinedAt: new Date().toISOString(), winnerCity: winner?.city, winnerEmoji: winner?.emoji }
  localStorage.setItem('tripsync_recent_games', JSON.stringify([entry, ...existing].slice(0, 8)))
}

export function getRecentGames(): RecentGame[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem('tripsync_recent_games') ?? '[]')
  } catch {
    return []
  }
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
