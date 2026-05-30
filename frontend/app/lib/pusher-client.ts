import PusherJs from 'pusher-js'

let _instance: PusherJs | null = null

export function getPusher(): PusherJs {
  if (!_instance) {
    _instance = new PusherJs(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      enabledTransports: ['ws', 'wss'],
    })
  }
  return _instance
}

export function groupChannel(code: string) {
  return `tripsync-${code}`
}

export const EVENTS = {
  MEMBER_JOINED:    'member-joined',
  PHASE_CHANGED:    'phase-changed',
  ANSWER_SUBMITTED: 'answer-submitted',
  VOTE_SUBMITTED:   'vote-submitted',
  ROUND_COMPLETE:   'round-complete',
} as const

// Returns a cleanup fn. Calls onDisconnect when Pusher is unavailable,
// onReconnect when it comes back. Caller can use this to start/stop polling.
export function watchConnection(onDisconnect: () => void, onReconnect: () => void): () => void {
  const p = getPusher()
  const handleState = (states: { current: string }) => {
    if (states.current === 'unavailable' || states.current === 'failed') onDisconnect()
    if (states.current === 'connected') onReconnect()
  }
  p.connection.bind('state_change', handleState)
  return () => p.connection.unbind('state_change', handleState)
}
