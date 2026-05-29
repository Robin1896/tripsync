'use client'

let _userId: string | null = null

function getUserIdSafe(): string | null {
  try {
    if (_userId) return _userId
    _userId = localStorage.getItem('tripsync_user_id')
    return _userId
  } catch {
    return null
  }
}

async function send(method: string, path: string, extra?: Record<string, unknown>) {
  try {
    await fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key:    (process.env.NEXT_PUBLIC_ADMIN_KEY as string | undefined) ?? 'tripsync-admin',
        app:    'tripsync',
        method,
        path,
        status: 200,
        durationMs: 0,
        userId: getUserIdSafe(),
        ...extra,
      }),
    })
  } catch {
    // never throw
  }
}

export function trackPage(path: string) {
  send('PAGE', path)
}

export function trackEvent(action: string, extra?: Record<string, unknown>) {
  send('UI', `/ui/${action}`, extra)
}
