import { useEffect, useState } from 'react'
import { request } from '../api/http'
import type { Telemetry } from '../types'

const GRID_SIZE = 21

interface MapResponse {
  width: number
  height: number
  grid: number[][]
}

interface Props {
  telemetry: Telemetry | null
  /** Bumped by parent when the simulation is reset, so we re-fetch the map. */
  mapVersion: number
}

export function GridMap({ telemetry, mapVersion }: Props) {
  const [grid, setGrid] = useState<number[][] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    request<MapResponse>('/api/map')
      .then((m) => {
        if (cancelled) return
        setGrid(m.grid)
        setError(null)
      })
      .catch((err) => { if (!cancelled) setError(String(err)) })
    return () => { cancelled = true }
  }, [mapVersion])

  const rx = telemetry?.position?.x
  const ry = telemetry?.position?.y

  const cells: React.ReactNode[] = []
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      let cls = 'grid-cell'
      const label: string[] = [`column ${col}`, `row ${row}`]
      if (col === rx && row === ry) {
        cls += ' cell-robot'
        label.push('robot here')
      } else if (col === 0 && row === 0) {
        cls += ' cell-charging'
        label.push('charging station')
      } else if (grid && grid[row]?.[col] === 1) {
        cls += ' cell-obstacle'
        label.push('obstacle')
      }
      cells.push(
        <div
          key={`${col},${row}`}
          className={cls}
          aria-label={label.join(', ')}
        />,
      )
    }
  }

  return (
    <div className="gcs-card h-100">
      <div className="gcs-card-header d-flex justify-content-between align-items-center px-3 py-2">
        <span><i className="bi bi-map" aria-hidden="true" /> 2D Grid Map</span>
        <span className="text-muted small fw-normal">21 × 21</span>
      </div>
      <div className="card-body p-2">
        <div
          className="grid-map"
          role="img"
          aria-label="21 by 21 robot position grid map"
          style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
        >
          {cells}
        </div>
        <div className="mt-2 d-flex gap-3 flex-wrap" style={{ fontSize: '0.75rem', color: '#8b949e' }}>
          <span><span className="cell-robot d-inline-block" style={{ width: 10, height: 10, borderRadius: '50%' }} /> Robot</span>
          <span><span className="cell-charging d-inline-block" style={{ width: 10, height: 10, borderRadius: '50%' }} /> Charging (0,0)</span>
          <span><span className="cell-obstacle d-inline-block" style={{ width: 10, height: 10, borderRadius: 2 }} /> Obstacle</span>
        </div>
        {error && <div className="text-warning small mt-2">Map unavailable: {error}</div>}
      </div>
    </div>
  )
}
