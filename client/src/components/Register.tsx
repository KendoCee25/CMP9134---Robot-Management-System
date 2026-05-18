import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ApiError } from '../api/http'
import type { Role } from '../types'

export function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [role, setRole] = useState<Role>('viewer')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setBusy(true)
    try {
      await register(username.trim(), password, role)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="gcs-card auth-card">
      <h1 className="text-center mb-3">
        <i className="bi bi-person-plus" aria-hidden="true" /> Register
      </h1>
      <form onSubmit={submit} noValidate>
        <div className="mb-3">
          <label htmlFor="reg-username" className="form-label">Username</label>
          <input
            id="reg-username"
            type="text"
            className="form-control"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
            minLength={3}
          />
        </div>
        <div className="mb-3">
          <label htmlFor="reg-password" className="form-label">Password</label>
          <input
            id="reg-password"
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
            minLength={6}
          />
          <div className="form-text text-muted">At least 6 characters.</div>
        </div>
        <div className="mb-3">
          <label htmlFor="reg-confirm" className="form-label">Confirm password</label>
          <input
            id="reg-confirm"
            type="password"
            className="form-control"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>
        <fieldset className="mb-3">
          <legend className="form-label fs-6">Role</legend>
          <div className="form-check">
            <input
              type="radio"
              id="role-viewer"
              name="role"
              className="form-check-input"
              checked={role === 'viewer'}
              onChange={() => setRole('viewer')}
            />
            <label htmlFor="role-viewer" className="form-check-label">
              Viewer — read-only access to telemetry and audit log
            </label>
          </div>
          <div className="form-check">
            <input
              type="radio"
              id="role-operator"
              name="role"
              className="form-check-input"
              checked={role === 'operator'}
              onChange={() => setRole('operator')}
            />
            <label htmlFor="role-operator" className="form-check-label">
              Commander — can send movement commands
            </label>
          </div>
        </fieldset>
        {error && <div className="alert alert-danger py-2" role="alert">{error}</div>}
        <button type="submit" className="btn btn-move mb-3" disabled={busy}>
          {busy ? 'Creating account…' : 'CREATE ACCOUNT'}
        </button>
      </form>
      <p className="text-center text-muted small mb-0">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </div>
  )
}
