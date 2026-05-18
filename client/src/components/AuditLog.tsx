import { useEffect, useMemo, useState } from 'react'
import { fetchAuditLog } from '../api/robot'
import type { AuditEntry } from '../types'

const PAGE_SIZE = 10

interface Props {
  refreshKey: number
}

export function AuditLog({ refreshKey }: Props) {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchAuditLog()
      .then((rows) => { if (!cancelled) setEntries(rows) })
      .catch((err) => { if (!cancelled) setError(String(err)) })
    return () => { cancelled = true }
  }, [refreshKey])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return entries
    return entries.filter((e) =>
      e.username.toLowerCase().includes(q) ||
      e.outcome.toLowerCase().includes(q) ||
      e.command.toLowerCase().includes(q),
    )
  }, [entries, query])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * PAGE_SIZE
  const visible = filtered.slice(start, start + PAGE_SIZE)

  return (
    <div className="gcs-card" id="audit-log">
      <div className="gcs-card-header d-flex justify-content-between align-items-center px-3 py-2">
        <span><i className="bi bi-journal-text" aria-hidden="true" /> Mission Audit Log</span>
      </div>
      <div className="card-body p-0">
        <div className="p-3 border-bottom" style={{ borderColor: '#30363d' }}>
          <label htmlFor="log-search" className="visually-hidden">Search audit log</label>
          <input
            id="log-search"
            type="search"
            className="form-control form-control-sm"
            placeholder="Filter by user, command, or outcome…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1) }}
            aria-label="Filter audit log entries"
          />
        </div>
        <div className="table-responsive">
          <table className="table table-hover mb-0 audit-table" aria-label="Mission audit log">
            <thead>
              <tr>
                <th scope="col">Timestamp (UTC)</th>
                <th scope="col">User</th>
                <th scope="col">Role</th>
                <th scope="col">Command</th>
                <th scope="col">Target</th>
                <th scope="col">Robot status</th>
                <th scope="col">Outcome</th>
              </tr>
            </thead>
            <tbody>
              {error && (
                <tr><td colSpan={7} className="text-danger text-center py-4">Failed to load audit log: {error}</td></tr>
              )}
              {!error && visible.length === 0 && (
                <tr><td colSpan={7} className="text-muted text-center py-4">No audit entries.</td></tr>
              )}
              {visible.map((e) => (
                <tr key={e.id}>
                  <td>{new Date(e.timestamp).toISOString().replace('T', ' ').slice(0, 19)} UTC</td>
                  <td>{e.username}</td>
                  <td>{e.role}</td>
                  <td>{e.command}</td>
                  <td>
                    {e.target
                      ? <>({e.target.x}, {e.target.y})</>
                      : <span className="text-muted">—</span>}
                  </td>
                  <td>
                    {e.robotStatus
                      ? <span className={`badge badge-${e.robotStatus}`}>{e.robotStatus}</span>
                      : <span className="text-muted">—</span>}
                    {typeof e.robotBattery === 'number' && (
                      <small className="text-muted ms-1">
                        {Math.round(e.robotBattery)}%
                        {e.robotPosition && ` · (${e.robotPosition.x},${e.robotPosition.y})`}
                      </small>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${e.outcome === 'SUCCESS' ? 'bg-success' : 'bg-danger'}`}>
                      {e.outcome}
                    </span>
                    {e.detail && <small className="text-muted ms-1">{e.detail}</small>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3 d-flex justify-content-between align-items-center" style={{ borderTop: '1px solid #30363d' }}>
          <span className="text-muted small">
            {filtered.length === 0
              ? 'No entries'
              : `Showing ${start + 1}–${Math.min(start + PAGE_SIZE, filtered.length)} of ${filtered.length}`}
          </span>
          <nav aria-label="Audit log pagination">
            <ul className="pagination pagination-sm mb-0">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <li key={p} className={`page-item ${p === safePage ? 'active' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => setPage(p)}
                    aria-label={`Page ${p}`}
                    aria-current={p === safePage ? 'page' : undefined}
                  >
                    {p}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </div>
  )
}
