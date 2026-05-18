// AuthProvider — wires localStorage-persisted JWT into the React tree.
//
// The initial user is resolved synchronously from localStorage via a lazy
// useState initializer so there is no "loading" flash on first render.

import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { getToken, setToken } from '../api/http'
import * as authApi from '../api/auth'
import type { AuthUser, Role } from '../types'
import { AuthContext } from './AuthContext'
import type { AuthContextValue } from './AuthContext'

function decodeJwt(token: string): { sub?: string; role?: Role } | null {
  try {
    const [, payload] = token.split('.')
    if (!payload) return null
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json)
  } catch {
    return null
  }
}

function userFromToken(token: string): AuthUser | null {
  const claims = decodeJwt(token)
  if (!claims?.sub || !claims.role) return null
  return { username: claims.sub, role: claims.role, token }
}

function initialUser(): AuthUser | null {
  const token = getToken()
  return token ? userFromToken(token) : null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(initialUser)

  const login = useCallback(async (username: string, password: string) => {
    const res = await authApi.login(username, password)
    setToken(res.token)
    setUser({ username: res.username, role: res.role, token: res.token })
  }, [])

  const register = useCallback(async (username: string, password: string, role: Role) => {
    const res = await authApi.register(username, password, role)
    setToken(res.token)
    setUser({ username: res.username, role: res.role, token: res.token })
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      login,
      register,
      logout,
      isCommander: user?.role === 'operator',
    }),
    [user, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
