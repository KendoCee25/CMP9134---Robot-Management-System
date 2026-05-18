import type { ConnectionState, Telemetry } from '../types'

interface Props {
  telemetry: Telemetry | null
  connection: ConnectionState
}

export function AlertBanners({ telemetry, connection }: Props) {
  const battery = telemetry?.battery ?? 100
  const status = telemetry?.status

  return (
    <div className="container-fluid px-4 mt-2">
      {connection === 'lost' && (
        <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
          <i className="bi bi-wifi-off" aria-hidden="true" />
          <strong>Signal Lost:</strong> Unable to reach the robot after multiple attempts.
          Telemetry shown may be stale. The system will keep retrying in the background.
        </div>
      )}
      {connection === 'reconnecting' && (
        <div className="alert alert-warning d-flex align-items-center gap-2" role="alert">
          <i className="bi bi-arrow-repeat" aria-hidden="true" />
          <strong>Reconnecting…</strong> Telemetry transport interrupted — falling back to polling.
        </div>
      )}
      {battery < 20 && telemetry && (
        <div className="alert alert-warning d-flex align-items-center gap-2" role="alert">
          <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
          <strong>Low Battery Warning:</strong> Battery below 20% — return robot to the charging station at (0, 0).
        </div>
      )}
      {status === 'STUCK' && (
        <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
          <i className="bi bi-x-octagon-fill" aria-hidden="true" />
          <strong>Robot Stuck:</strong> Robot has hit an obstacle and cannot continue. Reset simulation to recover.
        </div>
      )}
    </div>
  )
}
