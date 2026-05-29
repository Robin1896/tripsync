import PusherJs from 'pusher-js'

let _instance: PusherJs | null = null

export function getPusher(): PusherJs {
  if (!_instance) {
    _instance = new PusherJs(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
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
