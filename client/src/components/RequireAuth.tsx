import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../auth/AuthContext'

/** Route guard — redirects to /login when the user is not authenticated. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return <>{children}</>
}
