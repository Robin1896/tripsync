export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[10px] tracking-[.15em] uppercase text-muted mb-3">
      {children}
    </p>
  )
}
