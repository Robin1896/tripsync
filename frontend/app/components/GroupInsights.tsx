'use client'
import { type GroupProfile } from '../lib/group-profile'
import { type PersonalityType } from '../lib/personality'

interface Props {
  profile: GroupProfile
  personalities: { userId: string; name: string; type: PersonalityType }[]
}

export function GroupInsights({ profile, personalities }: Props) {
  return (
    <div className="flex flex-col gap-3 mb-6">
      {/* Consensus score */}
      <div className="border border-dark/[.12] bg-card px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <p className="font-mono text-[9px] uppercase tracking-widest text-muted">Groepseenheid {profile.badge}</p>
          <span className="font-serif text-[22px] text-brand">{profile.consensusScore}%</span>
        </div>
        <div className="h-[3px] bg-dim rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-brand transition-all duration-700"
            style={{ width: `${profile.consensusScore}%` }}
          />
        </div>
        {profile.traits.length > 0 && (
          <ul className="mt-3 flex flex-col gap-1">
            {profile.traits.map((t, i) => (
              <li key={i} className="font-sans text-[12px] text-muted flex gap-2">
                <span className="text-brand">·</span> {t}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Individual personalities */}
      {personalities.length > 0 && (
        <div className="border border-dark/[.12] bg-card px-4 py-3">
          <p className="font-mono text-[9px] uppercase tracking-widest text-muted mb-3">Reizigerspersoonlijkheden</p>
          <div className="flex flex-col gap-2">
            {personalities.map(p => (
              <div key={p.userId} className="flex items-start gap-3">
                <span className="text-[20px] flex-shrink-0">{p.type.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-[13px] font-medium text-dark">{p.name} — <span style={{ color: p.type.color }}>{p.type.name}</span></p>
                  <p className="font-sans text-[11px] text-muted leading-snug">{p.type.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
