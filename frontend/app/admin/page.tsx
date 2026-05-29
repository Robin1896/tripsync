'use client'
import { useEffect, useState, useCallback } from 'react'

// ── types ────────────────────────────────────────────────────────────────────

interface Stats {
  total: number; errors: number; avgMs: number; p95Ms: number; errorRate: number
}
interface LogEntry {
  id: string; app: string; method: string; path: string
  status_code: number; duration_ms: number
  user_id: string | null; group_code: string | null
  error: string | null; created_at: string
}
interface GroupRow {
  id: string; name: string; invite_code: string
  phase: string; member_count: string; owner_id: string; created_at: string
}
interface PathRow {
  app: string; method: string; path: string
  count: string; errors: string; avg_ms: string
}
interface AdminData {
  stats: Stats
  perPath: PathRow[]
  groups: GroupRow[]
  logs: LogEntry[]
}

// ── helpers ──────────────────────────────────────────────────────────────────

function ago(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60)   return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}u`
  return `${Math.floor(s / 86400)}d`
}

function statusColor(code: number) {
  if (code < 300) return '#16a34a'
  if (code < 400) return '#ca8a04'
  if (code < 500) return '#ea580c'
  return '#dc2626'
}

function methodColor(m: string) {
  if (m === 'GET')  return '#1d4ed8'
  if (m === 'POST') return '#15803d'
  if (m === 'PAGE') return '#7c3aed'
  if (m === 'UI')   return '#be185d'
  return '#374151'
}

const PHASE_LABELS: Record<string, string> = {
  lobby: 'Lobby', game: 'Spel', results: 'Resultaten', vote: 'Stemmen', winner: 'Winner',
}

// ── component ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [key,      setKey]      = useState('')
  const [input,    setInput]    = useState('')
  const [data,     setData]     = useState<AdminData | null>(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [filter,   setFilter]   = useState<'all' | 'errors' | 'api' | 'page' | 'ui'>('all')
  const [search,   setSearch]   = useState('')
  const [tab,      setTab]      = useState<'logs' | 'groups' | 'endpoints'>('logs')
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const load = useCallback(async (k: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin?key=${encodeURIComponent(k)}`)
      if (res.status === 401) { setError('Verkeerde sleutel.'); setKey(''); return }
      if (!res.ok) { setError('Server fout.'); return }
      setData(await res.json())
      setLastRefresh(new Date())
    } catch {
      setError('Kan dashboard niet laden.')
    } finally {
      setLoading(false)
    }
  }, [])

  // auto-refresh every 30 s
  useEffect(() => {
    if (!key) return
    load(key)
    const t = setInterval(() => load(key), 30_000)
    return () => clearInterval(t)
  }, [key, load])

  // login form
  if (!key) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4efe6' }}>
        <div style={{ maxWidth: 360, width: '100%', padding: '0 16px' }}>
          <p style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#8b7f70', marginBottom: 8 }}>TripSync.</p>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 28, color: '#1a1d2e', marginBottom: 24 }}>Admin dashboard</h1>
          {error && <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#c14a1f', marginBottom: 12 }}>{error}</p>}
          <input
            type="password"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && setKey(input)}
            placeholder="Admin sleutel"
            autoFocus
            style={{
              width: '100%', boxSizing: 'border-box',
              border: '1px solid rgba(26,29,46,.3)', background: '#fffdf9',
              padding: '12px 16px', fontFamily: 'sans-serif', fontSize: 15,
              color: '#1a1d2e', outline: 'none', marginBottom: 12,
            }}
          />
          <button
            onClick={() => setKey(input)}
            style={{
              width: '100%', background: '#1a1d2e', color: '#fffdf9',
              border: 'none', padding: '12px 16px', fontFamily: 'monospace',
              fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Inloggen →
          </button>
        </div>
      </div>
    )
  }

  const s = data?.stats
  const logs = (data?.logs ?? []).filter(l => {
    if (filter === 'errors') return l.status_code >= 400
    if (filter === 'api')    return l.method !== 'PAGE' && l.method !== 'UI'
    if (filter === 'page')   return l.method === 'PAGE'
    if (filter === 'ui')     return l.method === 'UI'
    return true
  }).filter(l =>
    !search || l.path.includes(search) || (l.error ?? '').includes(search) ||
    (l.group_code ?? '').includes(search) || l.app.includes(search)
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f4efe6', padding: '24px 16px 48px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>

        {/* header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <p style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#8b7f70', marginBottom: 4 }}>TripSync.</p>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 28, color: '#1a1d2e', margin: 0 }}>Admin Dashboard</h1>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {lastRefresh && <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#8b7f70' }}>bijgewerkt {ago(lastRefresh.toISOString())} geleden</span>}
            <button onClick={() => load(key)} disabled={loading} style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', background: 'none', border: '1px solid rgba(26,29,46,.25)', padding: '6px 12px', cursor: 'pointer', color: '#1a1d2e' }}>
              {loading ? '…' : 'Vernieuwen'}
            </button>
            <button onClick={() => setKey('')} style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', background: 'none', border: '1px solid rgba(26,29,46,.25)', padding: '6px 12px', cursor: 'pointer', color: '#c14a1f' }}>
              Uitloggen
            </button>
          </div>
        </div>

        {/* stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 28 }}>
          {[
            { label: 'Calls (24u)', value: s?.total ?? '—', sub: 'verzoeken' },
            { label: 'Fouten', value: s ? `${s.errors} (${s.errorRate}%)` : '—', sub: '4xx / 5xx', color: s && s.errors > 0 ? '#c14a1f' : undefined },
            { label: 'Gem. tijd', value: s ? `${s.avgMs} ms` : '—', sub: 'response time' },
            { label: 'P95 tijd', value: s ? `${s.p95Ms} ms` : '—', sub: '95e percentiel' },
            { label: 'Actieve groepen', value: data?.groups.filter(g => ['lobby','game'].includes(g.phase)).length ?? '—', sub: 'lobby + spel' },
          ].map(c => (
            <div key={c.label} style={{ background: '#fffdf9', border: '1px solid rgba(26,29,46,.12)', padding: '14px 16px' }}>
              <p style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8b7f70', marginBottom: 6 }}>{c.label}</p>
              <p style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: c.color ?? '#1a1d2e', margin: 0 }}>{String(c.value)}</p>
              <p style={{ fontFamily: 'monospace', fontSize: 9, color: '#b8a898', marginTop: 4 }}>{c.sub}</p>
            </div>
          ))}
        </div>

        {/* tab nav */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(26,29,46,.15)', marginBottom: 20, gap: 0 }}>
          {([['logs', 'API Logs'], ['groups', 'Groepen'], ['endpoints', 'Endpoints']] as const).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.15em',
                textTransform: 'uppercase', border: 'none', background: 'none',
                padding: '8px 16px', cursor: 'pointer',
                color: tab === t ? '#1a1d2e' : '#8b7f70',
                borderBottom: tab === t ? '2px solid #1a1d2e' : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── LOGS tab ── */}
        {tab === 'logs' && (
          <>
            {/* filter bar */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 0 }}>
                {([['all', 'Alles'], ['api', 'API'], ['page', 'Pagina'], ['ui', 'Interacties'], ['errors', 'Fouten']] as const).map(([f, label]) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    style={{
                      fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.12em',
                      textTransform: 'uppercase', padding: '5px 10px', cursor: 'pointer',
                      border: '1px solid rgba(26,29,46,.2)',
                      background: filter === f ? '#1a1d2e' : '#fffdf9',
                      color: filter === f ? '#fffdf9' : '#8b7f70',
                      marginRight: -1,
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <input
                placeholder="Zoek in pad, error, code…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  flex: 1, minWidth: 160, border: '1px solid rgba(26,29,46,.2)', background: '#fffdf9',
                  padding: '5px 10px', fontFamily: 'monospace', fontSize: 11, color: '#1a1d2e', outline: 'none',
                }}
              />
              <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#8b7f70' }}>{logs.length} rijen</span>
            </div>

            {/* log table */}
            <div style={{ background: '#fffdf9', border: '1px solid rgba(26,29,46,.12)', overflow: 'auto', maxHeight: 560 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'monospace' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(26,29,46,.1)', position: 'sticky', top: 0, background: '#fffdf9' }}>
                    {['Tijd', 'App', 'Methode', 'Pad', 'Status', 'Duur', 'User', 'Groep', 'Error'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8b7f70', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map(l => (
                    <tr key={l.id} style={{ borderBottom: '1px solid rgba(26,29,46,.05)' }}>
                      <td style={{ padding: '6px 12px', color: '#8b7f70', whiteSpace: 'nowrap' }}>{ago(l.created_at)}</td>
                      <td style={{ padding: '6px 12px', color: '#1a1d2e' }}>{l.app}</td>
                      <td style={{ padding: '6px 12px' }}>
                        <span style={{ background: methodColor(l.method) + '18', color: methodColor(l.method), padding: '2px 6px', borderRadius: 2, fontSize: 10, letterSpacing: '0.1em' }}>{l.method}</span>
                      </td>
                      <td style={{ padding: '6px 12px', color: '#1a1d2e', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.path}</td>
                      <td style={{ padding: '6px 12px' }}>
                        <span style={{ color: statusColor(l.status_code), fontWeight: 600 }}>{l.status_code}</span>
                      </td>
                      <td style={{ padding: '6px 12px', color: l.duration_ms > 500 ? '#ea580c' : '#1a1d2e', whiteSpace: 'nowrap' }}>
                        {l.duration_ms > 0 ? `${l.duration_ms}ms` : '—'}
                      </td>
                      <td style={{ padding: '6px 12px', color: '#8b7f70', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {l.user_id ? l.user_id.slice(0, 8) + '…' : '—'}
                      </td>
                      <td style={{ padding: '6px 12px', color: '#1a1d2e' }}>{l.group_code ?? '—'}</td>
                      <td style={{ padding: '6px 12px', color: '#c14a1f', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {l.error ?? ''}
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr><td colSpan={9} style={{ padding: '24px 12px', color: '#8b7f70', textAlign: 'center' }}>Geen logs gevonden.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── GROUPS tab ── */}
        {tab === 'groups' && (
          <div style={{ background: '#fffdf9', border: '1px solid rgba(26,29,46,.12)', overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'monospace' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(26,29,46,.1)' }}>
                  {['Aangemaakt', 'Naam', 'Code', 'Fase', 'Leden', 'Owner'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8b7f70', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data?.groups ?? []).map(g => (
                  <tr key={g.id} style={{ borderBottom: '1px solid rgba(26,29,46,.05)' }}>
                    <td style={{ padding: '8px 12px', color: '#8b7f70', whiteSpace: 'nowrap' }}>{ago(g.created_at)}</td>
                    <td style={{ padding: '8px 12px', color: '#1a1d2e', fontWeight: 600 }}>{g.name}</td>
                    <td style={{ padding: '8px 12px', color: '#1a1d2e', letterSpacing: '0.2em' }}>{g.invite_code}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <span style={{
                        background: { lobby:'#dbeafe', game:'#dcfce7', results:'#fef9c3', vote:'#fce7f3', winner:'#f3e8ff' }[g.phase] ?? '#f3f4f6',
                        color:       { lobby:'#1d4ed8', game:'#15803d', results:'#a16207', vote:'#9d174d', winner:'#6b21a8' }[g.phase] ?? '#374151',
                        padding: '2px 8px', borderRadius: 2, fontSize: 10, letterSpacing: '0.1em',
                      }}>{PHASE_LABELS[g.phase] ?? g.phase}</span>
                    </td>
                    <td style={{ padding: '8px 12px', color: '#1a1d2e', textAlign: 'center' }}>{g.member_count}</td>
                    <td style={{ padding: '8px 12px', color: '#8b7f70', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {g.owner_id.slice(0, 10)}…
                    </td>
                  </tr>
                ))}
                {(data?.groups ?? []).length === 0 && (
                  <tr><td colSpan={6} style={{ padding: '24px 12px', color: '#8b7f70', textAlign: 'center' }}>Geen groepen gevonden.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── ENDPOINTS tab ── */}
        {tab === 'endpoints' && (
          <div style={{ background: '#fffdf9', border: '1px solid rgba(26,29,46,.12)', overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'monospace' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(26,29,46,.1)' }}>
                  {['App', 'Methode', 'Pad', 'Calls', 'Fouten', 'Gem. tijd'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8b7f70', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data?.perPath ?? []).map((p, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(26,29,46,.05)' }}>
                    <td style={{ padding: '8px 12px', color: '#1a1d2e' }}>{p.app}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <span style={{ background: methodColor(p.method) + '18', color: methodColor(p.method), padding: '2px 6px', borderRadius: 2, fontSize: 10, letterSpacing: '0.1em' }}>{p.method}</span>
                    </td>
                    <td style={{ padding: '8px 12px', color: '#1a1d2e' }}>{p.path}</td>
                    <td style={{ padding: '8px 12px', color: '#1a1d2e', textAlign: 'right' }}>{p.count}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                      <span style={{ color: parseInt(p.errors) > 0 ? '#c14a1f' : '#16a34a' }}>{p.errors}</span>
                    </td>
                    <td style={{ padding: '8px 12px', color: '#1a1d2e', textAlign: 'right' }}>{p.avg_ms} ms</td>
                  </tr>
                ))}
                {(data?.perPath ?? []).length === 0 && (
                  <tr><td colSpan={6} style={{ padding: '24px 12px', color: '#8b7f70', textAlign: 'center' }}>Geen data.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  )
}
