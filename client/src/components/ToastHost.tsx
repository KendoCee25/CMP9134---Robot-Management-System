/**
 * ToastHost — global notification bus.
 *
 * Implements the Observer pattern on the frontend: components publish events via
 * `useToast().push(...)` and a single host subscriber renders them. The hook +
 * context live in toastBus.ts so this file can stay JSX-only.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ToastContext } from './toastBus'
import type { ToastType } from './toastBus'

interface Toast {
  id: number
  message: string
  type: ToastType
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const idRef = useRef(0)
  const timersRef = useRef<Map<number, number>>(new Map())

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id))
    const handle = timersRef.current.get(id)
    if (handle) {
      window.clearTimeout(handle)
      timersRef.current.delete(id)
    }
  }, [])

  const push = useCallback(
    (message: string, type: ToastType = 'success') => {
      const id = ++idRef.current
      setToasts((current) => [...current, { id, message, type }])
      const handle = window.setTimeout(() => dismiss(id), 4000)
      timersRef.current.set(id, handle)
    },
    [dismiss],
  )

  useEffect(() => {
    const timers = timersRef.current
    return () => {
      timers.forEach((h) => window.clearTimeout(h))
      timers.clear()
    }
  }, [])

  const value = useMemo(() => ({ push }), [push])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-container position-fixed bottom-0 end-0 p-3" aria-live="polite" aria-atomic="true">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="alert"
            className={`toast show align-items-center border-0 toast-${t.type}`}
          >
            <div className="d-flex">
              <div className="toast-body fw-semibold">{t.message}</div>
              <button
                type="button"
                className="btn-close btn-close-white me-2 m-auto"
                aria-label="Close notification"
                onClick={() => dismiss(t.id)}
              />
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
