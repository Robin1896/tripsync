import PusherServer from 'pusher'

export const pusherServer = new PusherServer({
  appId:   process.env.PUSHER_APP_ID!,
  key:     process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret:  process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS:  true,
})

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
