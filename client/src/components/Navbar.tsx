import { useAuth } from '../auth/AuthContext'

export function Navbar() {
  const { user, logout, isCommander } = useAuth()
  const roleClass = isCommander ? 'role-badge-commander' : 'role-badge-viewer'

  return (
    <nav className="navbar navbar-expand-lg gcs-navbar" aria-label="Main navigation">
      <div className="container-fluid px-4">
        <a className="navbar-brand" href="#dashboard" aria-label="Robot Ground Control Station home">
          <i className="bi bi-robot" aria-hidden="true" /> Robot GCS
        </a>
        <ul className="navbar-nav me-auto d-flex flex-row gap-3">
          <li className="nav-item">
            <a className="nav-link active" href="#dashboard" aria-current="page">
              <i className="bi bi-speedometer2" aria-hidden="true" /> Dashboard
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="#audit-log">
              <i className="bi bi-journal-text" aria-hidden="true" /> Audit Log
            </a>
          </li>
        </ul>
        <div className="d-flex align-items-center gap-2 text-light">
          <span className="text-muted small">Logged in as:</span>
          <strong>{user?.username}</strong>
          <span className={`badge ${roleClass}`}>{user?.role?.toUpperCase()}</span>
          <button className="btn btn-sm btn-outline-secondary ms-2" onClick={logout}>
            <i className="bi bi-box-arrow-right" aria-hidden="true" /> Logout
          </button>
        </div>
      </div>
    </nav>
  )
}
