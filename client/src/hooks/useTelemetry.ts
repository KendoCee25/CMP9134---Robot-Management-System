/**
 * useTelemetry — resilient telemetry stream for the GCS dashboard.
 *
 * Transport strategy (matches docs/API_ANALYSIS.md "Key Design Implications"):
 *   1. PRIMARY:  WebSocket (`/ws/telemetry`) for 1Hz push updates — low latency.
 *   2. FALLBACK: HTTP polling (`/api/status`) when WS is unavailable.
 *   3. RETRY:    Exponential backoff (1s → 2s → 4s → … capped at 30s) on every
 *                failure. After `LOST_THRESHOLD` consecutive failed retries the
 *                state moves to `lost` so the UI can show a "Signal Lost" banner.
 *
 * Design-pattern notes:
 *   - This hook is an Observer subscriber: the WebSocket pushes telemetry frames
 *     and the hook re-renders on each message.
 *   - The transport switch (WS ↔ polling) is a small state machine encapsulated
 *     entirely inside the hook so consumers see only `{ telemetry, connection }`.
 */

import { useEffect, useRef, useState } from 'react'
import { fetchStatus } from '../api/robot'
import type { ConnectionState, Telemetry } from '../types'
import { getToken } from '../api/http'

const POLL_INTERVAL_MS = 1000
const BACKOFF_BASE_MS = 1000
const BACKOFF_CAP_MS = 30_000
const LOST_THRESHOLD = 3

interface UseTelemetryResult {
  telemetry: Telemetry | null
  connection: ConnectionState
  /** True if the last received telemetry is older than 2 polling intervals. */
  stale: boolean
}

function backoffDelay(attempt: number): number {
  return Math.min(BACKOFF_CAP_MS, BACKOFF_BASE_MS * 2 ** attempt)
}

function wsUrl(): string {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const token = getToken()
  const qs = token ? `?token=${encodeURIComponent(token)}` : ''
  return `${proto}//${window.location.host}/ws/telemetry${qs}`
}

export function useTelemetry(enabled: boolean): UseTelemetryResult {
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null)
  const [connection, setConnection] = useState<ConnectionState>('connecting')
  const [stale, setStale] = useState(false)

  // All long-lived state lives in refs so cleanup is reliable.
  const wsRef = useRef<WebSocket | null>(null)
  const pollTimerRef = useRef<number | null>(null)
  const reconnectTimerRef = useRef<number | null>(null)
  const attemptRef = useRef(0)
  const failuresRef = useRef(0)
  const cancelledRef = useRef(false)
  const lastRxRef = useRef<number>(0)

  useEffect(() => {
    if (!enabled) return
    cancelledRef.current = false

    const clearTimers = () => {
      if (pollTimerRef.current !== null) {
        window.clearInterval(pollTimerRef.current)
        pollTimerRef.current = null
      }
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }
    }

    const stopWs = () => {
      if (wsRef.current) {
        wsRef.current.onopen = null
        wsRef.current.onmessage = null
        wsRef.current.onerror = null
        wsRef.current.onclose = null
        try { wsRef.current.close() } catch { /* ignore */ }
        wsRef.current = null
      }
    }

    const recordSample = (data: Telemetry) => {
      lastRxRef.current = Date.now()
      failuresRef.current = 0
      attemptRef.current = 0
      setTelemetry(data)
      setStale(false)
      setConnection('connected')
    }

    const handleFailure = () => {
      failuresRef.current += 1
      setConnection(failuresRef.current >= LOST_THRESHOLD ? 'lost' : 'reconnecting')
    }

    const startPolling = () => {
      if (pollTimerRef.current !== null) return
      const tick = async () => {
        if (cancelledRef.current) return
        try {
          const data = await fetchStatus()
          if (data.status === 'UNREACHABLE') {
            handleFailure()
          } else {
            recordSample(data)
          }
        } catch {
          handleFailure()
        }
      }
      void tick()
      pollTimerRef.current = window.setInterval(tick, POLL_INTERVAL_MS)
    }

    const stopPolling = () => {
      if (pollTimerRef.current !== null) {
        window.clearInterval(pollTimerRef.current)
        pollTimerRef.current = null
      }
    }

    const openWs = () => {
      stopWs()
      setConnection(failuresRef.current === 0 ? 'connecting' : 'reconnecting')
      let ws: WebSocket
      try {
        ws = new WebSocket(wsUrl())
      } catch {
        handleFailure()
        scheduleRetry()
        return
      }
      wsRef.current = ws

      ws.onopen = () => {
        // WS up — stop polling fallback.
        stopPolling()
      }
      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data) as Telemetry
          recordSample({ ...data, receivedAt: new Date().toISOString() })
        } catch {
          // ignore non-JSON frames (pings etc.)
        }
      }
      ws.onerror = () => {
        // Browsers fire error before close; defer handling to onclose.
      }
      ws.onclose = () => {
        if (cancelledRef.current) return
        handleFailure()
        // Start polling fallback immediately so UI keeps updating.
        startPolling()
        scheduleRetry()
      }
    }

    const scheduleRetry = () => {
      if (reconnectTimerRef.current !== null) return
      const delay = backoffDelay(attemptRef.current)
      attemptRef.current += 1
      reconnectTimerRef.current = window.setTimeout(() => {
        reconnectTimerRef.current = null
        if (!cancelledRef.current) openWs()
      }, delay)
    }

    // Detect staleness: if no sample for >2s, surface it to the UI.
    const staleTimer = window.setInterval(() => {
      if (lastRxRef.current && Date.now() - lastRxRef.current > 2 * POLL_INTERVAL_MS) {
        setStale(true)
      }
    }, POLL_INTERVAL_MS)

    openWs()

    return () => {
      cancelledRef.current = true
      window.clearInterval(staleTimer)
      clearTimers()
      stopWs()
    }
  }, [enabled])

  return { telemetry, connection, stale }
}
