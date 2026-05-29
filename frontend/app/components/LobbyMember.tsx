interface LobbyMemberProps {
  name: string
  avatarColor: string
  questionsDone: number
  totalQuestions: number
  isYou?: boolean
}

export function LobbyMember({ name, avatarColor, questionsDone, totalQuestions, isYou }: LobbyMemberProps) {
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const done = questionsDone >= totalQuestions

  return (
    <div className="flex items-center gap-3 py-3 border-b border-dark/[.08] last:border-0">
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: avatarColor }}
      >
        <span className="font-sans font-medium text-[13px] text-bg">{initials}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-sans text-[14px] font-medium text-dark truncate">
          {name}
          {isYou && <span className="font-mono text-[10px] text-muted ml-2 tracking-[.08em]">JIJ</span>}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <div className="h-[2px] flex-1 bg-dim">
            <div
              className="h-full bg-brand transition-all duration-500"
              style={{ width: `${totalQuestions > 0 ? (questionsDone / totalQuestions) * 100 : 0}%` }}
            />
          </div>
          <span className="font-mono text-[10px] text-muted">{questionsDone}/{totalQuestions}</span>
        </div>
      </div>
      <div className="flex-shrink-0">
        {done
          ? <span className="text-success text-[18px]">✓</span>
          : <span className="text-dim text-[18px]">○</span>
        }
      </div>
    </div>
  )
}
