/**
 * useTelemetry — tests for the connection state machine.
 *
 * Mocks `window.WebSocket` and the `/api/status` fetch so the hook can be
 * driven through its WS-primary → polling-fallback → signal-lost path
 * deterministically.
 */

import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useTelemetry } from './useTelemetry'

// --- WebSocket mock --------------------------------------------------------

interface FakeSocket {
  readyState: number
  onopen: ((ev: Event) => void) | null
  onmessage: ((ev: { data: string }) => void) | null
  onerror: ((ev: Event) => void) | null
  onclose: ((ev: Event) => void) | null
  close: () => void
  send: (msg: string) => void
}

let createdSockets: FakeSocket[] = []

class FakeWebSocket implements FakeSocket {
  static readonly CONNECTING = 0
  static readonly OPEN = 1
  static readonly CLOSING = 2
  static readonly CLOSED = 3

  readyState = 0
  onopen: ((ev: Event) => void) | null = null
  onmessage: ((ev: { data: string }) => void) | null = null
  onerror: ((ev: Event) => void) | null = null
  onclose: ((ev: Event) => void) | null = null

  constructor(public url: string) {
    createdSockets.push(this)
  }

  send() { /* no-op */ }

  close() {
    this.readyState = FakeWebSocket.CLOSED
    if (this.onclose) this.onclose(new Event('close'))
  }

  _open() {
    this.readyState = FakeWebSocket.OPEN
    if (this.onopen) this.onopen(new Event('open'))
  }

  _message(data: object) {
    if (this.onmessage) this.onmessage({ data: JSON.stringify(data) })
  }
}

beforeEach(() => {
  createdSockets = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(globalThis as any).WebSocket = FakeWebSocket
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('useTelemetry', () => {
  it('starts in `connecting` and moves to `connected` on first WS message', async () => {
    const { result } = renderHook(() => useTelemetry(true))

    expect(result.current.connection).toBe('connecting')
    expect(createdSockets).toHaveLength(1)

    await act(async () => {
      createdSockets[0]._open()
      createdSockets[0]._message({
        id: 'XR-900',
        position: { x: 3, y: 4 },
        battery: 87,
        status: 'IDLE',
      })
    })

    expect(result.current.connection).toBe('connected')
    expect(result.current.telemetry?.position).toEqual({ x: 3, y: 4 })
    expect(result.current.telemetry?.status).toBe('IDLE')
  })

  it('transitions to `reconnecting` when the WebSocket closes', async () => {
    const { result } = renderHook(() => useTelemetry(true))

    // Mock /api/status so the polling fallback that fires on close has
    // something predictable to do.
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ id: 'XR-900', position: { x: 0, y: 0 }, battery: 100, status: 'UNREACHABLE' }),
        { status: 200 },
      ),
    )

    await act(async () => {
      createdSockets[0]._open()
      createdSockets[0]._message({
        id: 'XR-900',
        position: { x: 1, y: 1 },
        battery: 90,
        status: 'IDLE',
      })
    })
    expect(result.current.connection).toBe('connected')

    await act(async () => {
      createdSockets[0].close()
    })
    expect(['reconnecting', 'lost']).toContain(result.current.connection)
  })

  it('emits `lost` after consecutive polling failures', async () => {
    // waitFor and our polling rely on real wall-clock ticks here.
    vi.useRealTimers()

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ id: 'XR-900', position: { x: 0, y: 0 }, battery: 0, status: 'UNREACHABLE' }),
        { status: 200 },
      ),
    )

    const { result } = renderHook(() => useTelemetry(true))

    await act(async () => {
      createdSockets[0].close()
    })

    await waitFor(
      () => expect(result.current.connection).toBe('lost'),
      { timeout: 4000 },
    )
  }, 10000)
})
