// Toast context + useToast hook. Component lives in ToastHost.tsx; this is
// split out so the .tsx file can satisfy react-refresh's "only export
// components" rule.

import { createContext, useContext } from 'react'

export type ToastType = 'success' | 'error' | 'warning'

export interface ToastContextValue {
  push: (message: string, type?: ToastType) => void
}

export const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
