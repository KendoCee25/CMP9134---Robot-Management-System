// Auth endpoints — register and login.
// Backend returns `{ token, username, role }`; we persist the token in localStorage
// via http.ts and surface user details to AuthContext.

import type { Role } from '../types'
import { request } from './http'

export interface AuthResponse {
  token: string
  username: string
  role: Role
}

export function login(username: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>('/api/login', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ username, password }),
  })
}

export function register(username: string, password: string, role: Role): Promise<AuthResponse> {
  return request<AuthResponse>('/api/register', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ username, password, role }),
  })
}
