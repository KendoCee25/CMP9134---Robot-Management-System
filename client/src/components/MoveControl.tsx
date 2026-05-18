import { useState } from 'react'
import { sendMove, sendReset } from '../api/robot'
import type { Telemetry } from '../types'
import { useAuth } from '../auth/AuthContext'
import { useToast } from './toastBus'
import { ApiError } from '../api/http'

interface Props {
  telemetry: Telemetry | null
  onAfterReset: () => void
  onCommandSent: () => void
}

const GRID_MIN = 0
const GRID_MAX = 20

function validateCoord(raw: string): { value: number | null; error: string | null } {
  if (raw.trim() === '') return { value: null, error: 'Required.' }
  const n = Number(raw)
  if (!Number.isInteger(n)) return { value: null, error: 'Must be an integer.' }
  if (n < GRID_MIN || n > GRID_MAX) return { value: null, error: `Must be between ${GRID_MIN} and ${GRID_MAX}.` }
  return { value: n, error: null }
}

export function MoveControl({ telemetry, onAfterReset, onCommandSent }: Props) {
  const { isCommander } = useAuth()
  const toast = useToast()
  const [x, setX] = useState('')
  const [y, setY] = useState('')
  const [xErr, setXErr] = useState<string | null>(null)
  const [yErr, setYErr] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const moving = telemetry?.status === 'MOVING'
  const flat = telemetry?.battery === 0
  const unreachable = !telemetry || telemetry.status === 'UNREACHABLE'
  const disabled = moving || flat || unreachable || submitting

  if (!isCommander) {
    return (
      <div className="gcs-card">
        <div className="card-body text-center py-4">
          <i className="bi bi-eye text-muted" style={{ fontSize: '2rem' }} aria-hidden="true" />
          <p className="text-muted mt-2 mb-0">
            Move controls are restricted to Commander role.
          </p>
        </div>
      </div>
    )
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const xv = validateCoord(x)
    const yv = validateCoord(y)
    setXErr(xv.error)
    setYErr(yv.error)
    if (xv.value === null || yv.value === null) return

    setSubmitting(true)
    try {
      const result = await sendMove(xv.value, yv.value)
      onCommandSent()
      if (result.success) {
        toast.push(`Navigating to (${xv.value}, ${yv.value})…`, 'success')
        setX('')
        setY('')
      } else {
        toast.push(result.message || 'Move rejected.', 'error')
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : String(err)
      toast.push(`Command failed: ${msg}`, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const reset = async () => {
    setSubmitting(true)
    try {
      const r = await sendReset()
      onCommandSent()
      if (r.success) {
        toast.push('Simulation reset. Robot returned to (0, 0).', 'success')
        onAfterReset()
      } else {
        toast.push(r.message || 'Reset failed.', 'error')
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : String(err)
      toast.push(`Reset failed: ${msg}`, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="gcs-card">
      <div className="gcs-card-header px-3 py-2">
        <i className="bi bi-controller" aria-hidden="true" /> Move Robot
        <span className="badge role-badge-commander ms-2">Commander Only</span>
      </div>
      <div className="card-body">
        <p className="text-muted small mb-3">
          Enter integer coordinates between {GRID_MIN} and {GRID_MAX} to navigate the robot.
        </p>
        <form onSubmit={submit} noValidate>
          <div className="row g-2 mb-3">
            <div className="col-6">
              <label htmlFor="input-x" className="form-label">Target X</label>
              <input
                id="input-x"
                type="number"
                className={`form-control ${xErr ? 'is-invalid' : x ? 'is-valid' : ''}`}
                min={GRID_MIN}
                max={GRID_MAX}
                step={1}
                placeholder={`${GRID_MIN}–${GRID_MAX}`}
                value={x}
                onChange={(e) => setX(e.target.value)}
                required
              />
              {xErr && <div className="invalid-feedback">{xErr}</div>}
            </div>
            <div className="col-6">
              <label htmlFor="input-y" className="form-label">Target Y</label>
              <input
                id="input-y"
                type="number"
                className={`form-control ${yErr ? 'is-invalid' : y ? 'is-valid' : ''}`}
                min={GRID_MIN}
                max={GRID_MAX}
                step={1}
                placeholder={`${GRID_MIN}–${GRID_MAX}`}
                value={y}
                onChange={(e) => setY(e.target.value)}
                required
              />
              {yErr && <div className="invalid-feedback">{yErr}</div>}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-move"
            disabled={disabled}
            aria-label="Move robot to target coordinates"
            title={
              moving ? 'Waiting for robot to stop…' :
              flat ? 'Battery depleted' :
              unreachable ? 'Robot unreachable' : ''
            }
          >
            <i className="bi bi-send-fill me-2" aria-hidden="true" />
            {submitting ? 'SENDING…' : 'MOVE ROBOT'}
          </button>
        </form>

        <div className="mt-3">
          <button
            className="btn btn-sm w-100 btn-reset"
            onClick={reset}
            disabled={submitting}
            aria-label="Reset simulation to initial state"
          >
            <i className="bi bi-arrow-counterclockwise me-1" aria-hidden="true" />
            Reset Simulation
          </button>
        </div>
      </div>
    </div>
  )
}
