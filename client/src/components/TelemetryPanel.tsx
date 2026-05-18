import type { Telemetry } from '../types'

interface Props {
  telemetry: Telemetry | null
  stale: boolean
}

function batteryClass(b: number): string {
  if (b > 30) return 'battery-high'
  if (b > 20) return 'battery-medium'
  return 'battery-low'
}

export function TelemetryPanel({ telemetry, stale }: Props) {
  const t = telemetry
  const battery = t ? Math.max(0, Math.min(100, t.battery)) : 0
  const ts = t ? new Date(t.receivedAt).toISOString().replace('T', ' ').slice(0, 19) + ' UTC' : '—'

  return (
    <div className="gcs-card">
      <div className="gcs-card-header px-3 py-2">
        <i className="bi bi-activity" aria-hidden="true" /> Telemetry
      </div>
      <div className="card-body">
        <div className="row g-3">
          <div className="col-sm-3 text-center">
            <div className="text-muted small mb-1">Robot ID</div>
            <strong>{t?.id ?? '—'}</strong>
          </div>
          <div className="col-sm-3 text-center">
            <div className="text-muted small mb-1">Status</div>
            <span className={`badge fs-6 badge-${t?.status ?? 'UNREACHABLE'}`}>
              {t?.status ?? '—'}
            </span>
          </div>
          <div className="col-sm-3 text-center">
            <div className="text-muted small mb-1">Position</div>
            <strong>X: {t?.position?.x ?? '—'} &nbsp; Y: {t?.position?.y ?? '—'}</strong>
          </div>
          <div className="col-sm-3 text-center">
            <div className="text-muted small mb-1">Battery</div>
            <strong>{t ? `${Math.round(battery)}%` : '—'}</strong>
          </div>
        </div>
        <div className="mt-3">
          <div className="progress" style={{ height: 12 }}>
            <div
              className={`progress-bar ${batteryClass(battery)}`}
              role="progressbar"
              style={{ width: `${battery}%` }}
              aria-valuenow={Math.round(battery)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Battery ${Math.round(battery)}%`}
            />
          </div>
        </div>
        <div className="mt-2 text-muted small">
          Last update: {ts}
          {stale && <span className="text-warning ms-1">(stale)</span>}
        </div>
      </div>
    </div>
  )
}
