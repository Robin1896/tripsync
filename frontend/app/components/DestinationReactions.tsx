'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { getPusher, groupChannel } from '../lib/pusher-client'
import { getUserId, getUserName } from '../lib/user'
import { computePartialResults } from '../lib/engine'
import { type AnswerMap } from '../lib/engine'

const REACTION_EVENT = 'destination-reaction'
const EMOJIS = ['🔥', '😍', '😬', '💸', '❄️', '✈️']

interface Reaction {
  id: string
  userName: string
  destinationId: string
  destinationCity: string
  emoji: string
  ts: number
}

interface Props {
  code: string
  myAnswers: AnswerMap
}

export function DestinationReactions({ code, myAnswers }: Props) {
  const [reactions, setReactions] = useState<Reaction[]>([])
  const userId   = getUserId()
  const userName = getUserName() || 'Jij'

  // Top destinations to react to
  const destinations = computePartialResults(myAnswers).slice(0, 5)

  useEffect(() => {
    const pusher  = getPusher()
    const channel = pusher.subscribe(groupChannel(code))
    channel.bind(REACTION_EVENT, (data: { userId: string; userName: string; destinationId: string; emoji: string }) => {
      const city = destinations.find(d => d.destination.id === data.destinationId)?.destination.city ?? data.destinationId
      const r: Reaction = { id: `${Date.now()}-${Math.random()}`, userName: data.userName, destinationId: data.destinationId, destinationCity: city, emoji: data.emoji, ts: Date.now() }
      setReactions(prev => [r, ...prev].slice(0, 20))
    })
    return () => { channel.unbind(REACTION_EVENT); pusher.unsubscribe(groupChannel(code)) }
  }, [code])

  const sendReaction = useCallback(async (destId: string, emoji: string) => {
    await fetch('/api/react', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, userId, userName, destinationId: destId, emoji }),
    })
  }, [code, userId, userName])

  return (
    <div className="border border-dark/[.1] bg-card px-3 py-3">
      <p className="font-mono text-[9px] uppercase tracking-widest text-muted mb-3">Reageer op bestemmingen</p>

      <div className="flex flex-col gap-2 mb-3">
        {destinations.map(d => (
          <div key={d.destination.id} className="flex items-center gap-2">
            <span className="font-sans text-[12px] text-dark flex-1 truncate">{d.destination.emoji} {d.destination.city}</span>
            <div className="flex gap-1">
              {EMOJIS.map(e => (
                <button
                  key={e}
                  onClick={() => sendReaction(d.destination.id, e)}
                  className="text-[16px] hover:scale-125 transition-transform active:scale-90 cursor-pointer"
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {reactions.length > 0 && (
        <div className="border-t border-dark/[.08] pt-2 flex flex-col gap-0.5">
          {reactions.slice(0, 5).map(r => (
            <p key={r.id} className="font-mono text-[10px] text-muted">
              <span className="text-dark">{r.userName.split(' ')[0]}</span> {r.emoji} {r.destinationCity}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
