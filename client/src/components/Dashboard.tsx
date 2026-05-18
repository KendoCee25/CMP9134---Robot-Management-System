import { useState } from 'react'
import { useTelemetry } from '../hooks/useTelemetry'
import { AlertBanners } from './AlertBanners'
import { AuditLog } from './AuditLog'
import { GridMap } from './GridMap'
import { MoveControl } from './MoveControl'
import { Navbar } from './Navbar'
import { StatusBar } from './StatusBar'
import { TelemetryPanel } from './TelemetryPanel'

export function Dashboard() {
  const { telemetry, connection, stale } = useTelemetry(true)
  const [mapVersion, setMapVersion] = useState(0)
  const [auditKey, setAuditKey] = useState(0)

  return (
    <>
      <Navbar />
      <StatusBar telemetry={telemetry} connection={connection} stale={stale} />
      <AlertBanners telemetry={telemetry} connection={connection} />

      <main className="container-fluid px-4 py-3" id="dashboard">
        <div className="row g-3">
          <div className="col-lg-5">
            <GridMap telemetry={telemetry} mapVersion={mapVersion} />
          </div>
          <div className="col-lg-7">
            <div className="row g-3">
              <div className="col-12">
                <TelemetryPanel telemetry={telemetry} stale={stale} />
              </div>
              <div className="col-12">
                <MoveControl
                  telemetry={telemetry}
                  onAfterReset={() => setMapVersion((v) => v + 1)}
                  onCommandSent={() => setAuditKey((k) => k + 1)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="row mt-3">
          <div className="col-12">
            <AuditLog refreshKey={auditKey} />
          </div>
        </div>
      </main>
    </>
  )
}
