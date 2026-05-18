import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ApiError } from '../api/http'

interface FromState { from?: { pathname: string } }

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await login(username.trim(), password)
      const dest = (location.state as FromState | null)?.from?.pathname ?? '/'
      navigate(dest, { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="gcs-card auth-card">
      <h1 className="text-center mb-3">
        <i className="bi bi-robot" aria-hidden="true" /> Robot GCS
      </h1>
      <p className="text-center text-muted mb-4">Sign in to the Ground Control Station.</p>
      <form onSubmit={submit} noValidate>
        <div className="mb-3">
          <label htmlFor="login-username" className="form-label">Username</label>
          <input
            id="login-username"
            type="text"
            className="form-control"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="login-password" className="form-label">Password</label>
          <input
            id="login-password"
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        {error && <div className="alert alert-danger py-2" role="alert">{error}</div>}
        <button type="submit" className="btn btn-move mb-3" disabled={busy}>
          {busy ? 'Signing in…' : 'SIGN IN'}
        </button>
      </form>
      <p className="text-center text-muted small mb-0">
        No account? <Link to="/register">Register here</Link>
      </p>
    </div>
  )
}
