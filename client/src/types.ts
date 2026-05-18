// Shared TypeScript types for the Robot GCS frontend.
// Mirrors the contract defined in docs/API_ANALYSIS.md.

export type RobotStatus =
  | 'IDLE'
  | 'MOVING'
  | 'LOW_BATTERY'
  | 'STUCK'
  | 'UNREACHABLE'

export interface Telemetry {
  id: string
  position: { x: number; y: number }
  battery: number
  status: RobotStatus
  /** ISO timestamp this telemetry was received on the client. */
  receivedAt: string
}

export type Role = 'viewer' | 'operator'

export interface AuthUser {
  username: string
  role: Role
  token: string
}

/** Connection state machine for the telemetry transport (WS + polling fallback). */
export type ConnectionState =
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'lost'

export interface AuditEntry {
  id: string
  timestamp: string
  username: string
  role: Role
  command: 'MOVE' | 'RESET'
  target?: { x: number; y: number } | null
  outcome: 'SUCCESS' | 'ERROR'
  detail?: string | null
  /** Robot status snapshot captured at command time — see brief "safety auditing". */
  robotStatus?: RobotStatus | null
  robotPosition?: { x: number; y: number } | null
  robotBattery?: number | null
}

export interface MoveResult {
  success: boolean
  message: string
  statusCode: number
}
