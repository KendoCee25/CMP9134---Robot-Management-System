import type { ConnectionState, Telemetry } from '../types'

interface Props {
  telemetry: Telemetry | null
  connection: ConnectionState
  stale: boolean
}

const CONNECTION_TEXT: Record<ConnectionState, string> = {
  connecting: 'Connecting…',
  connected: 'Connected',
  reconnecting: 'Reconnecting…',
  lost: 'Signal Lost',
}

const CONNECTION_CLASS: Record<ConnectionState, string> = {
  connecting: 'conn-reconnecting',
  connected: 'conn-connected',
  reconnecting: 'conn-reconnecting',
  lost: 'conn-lost',
}

export function StatusBar({ telemetry, connection, stale }: Props) {
  const battery = telemetry?.battery ?? null
  const status = telemetry?.status ?? '—'
  const x = telemetry?.position?.x ?? '—'
  const y = telemetry?.position?.y ?? '—'

  return (
    <div
      className="status-bar py-2 px-4 d-flex align-items-center gap-3 flex-wrap"
      role="status"
      aria-live="polite"
    >
      <span>
        <span className={`conn-dot ${CONNECTION_CLASS[connection]} me-1`} aria-hidden="true" />
        <span>{CONNECTION_TEXT[connection]}</span>
        {stale && connection === 'connected' && (
          <span className="text-warning ms-1">(stale)</span>
        )}
      </span>
      <span className="text-muted">|</span>
      <span>
        <i className="bi bi-battery-half" aria-hidden="true" />{' '}
        Battery: <strong>{battery !== null ? `${Math.round(battery)}%` : '—'}</strong>
      </span>
      <span className="text-muted">|</span>
      <span>
        Status:{' '}
        <span className={`badge badge-${status}`}>{status}</span>
      </span>
      <span className="text-muted">|</span>
      <span>
        Position: X <strong>{x}</strong>, Y <strong>{y}</strong>
      </span>
    </div>
  )
}
