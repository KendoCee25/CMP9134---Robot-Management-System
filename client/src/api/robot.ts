// Typed wrappers for the robot endpoints exposed by the Express backend.
// Backend proxies these to the Virtual Robot container.

import type { AuditEntry, MoveResult, Telemetry } from '../types'
import { request } from './http'

interface RobotStatusResponse {
  id: string
  position: { x: number; y: number }
  battery: number
  status: Telemetry['status']
}

export async function fetchStatus(): Promise<Telemetry> {
  const data = await request<RobotStatusResponse>('/api/status', { timeoutMs: 4000 })
  return { ...data, receivedAt: new Date().toISOString() }
}

export function sendMove(x: number, y: number): Promise<MoveResult> {
  return request<MoveResult>('/api/move', {
    method: 'POST',
    body: JSON.stringify({ x, y }),
  })
}

export function sendReset(): Promise<{ success: boolean; message: string }> {
  return request('/api/reset', { method: 'POST' })
}

export function fetchAuditLog(): Promise<AuditEntry[]> {
  return request<AuditEntry[]>('/api/audit')
}
