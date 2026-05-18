// Auth context + hook. Lives in a .ts file so it can sit alongside the JSX
// provider without tripping react-refresh's "only export components" rule.

import { createContext, useContext } from 'react'
import type { AuthUser, Role } from '../types'

export interface AuthContextValue {
  user: AuthUser | null
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string, role: Role) => Promise<void>
  logout: () => void
  isCommander: boolean
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
