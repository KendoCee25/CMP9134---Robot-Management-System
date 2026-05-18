/**
 * MoveControl — validation, RBAC, and submit behaviour.
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MoveControl } from './MoveControl'
import { AuthContext } from '../auth/AuthContext'
import type { AuthContextValue } from '../auth/AuthContext'
import { ToastContext } from './toastBus'
import type { Telemetry } from '../types'

vi.mock('../api/robot', () => ({
  sendMove: vi.fn().mockResolvedValue({ success: true, message: 'Navigating to (5, 7)', statusCode: 200 }),
  sendReset: vi.fn().mockResolvedValue({ success: true, message: 'Simulation reset.' }),
}))
import { sendMove } from '../api/robot'

const idleTelemetry: Telemetry = {
  id: 'XR-900',
  position: { x: 0, y: 0 },
  battery: 80,
  status: 'IDLE',
  receivedAt: new Date().toISOString(),
}

function renderWithCtx(opts: { isCommander: boolean; telemetry?: Telemetry | null }) {
  const auth: AuthContextValue = {
    user: opts.isCommander
      ? { username: 'alice', role: 'operator', token: 'tok' }
      : { username: 'bob', role: 'viewer', token: 'tok' },
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    isCommander: opts.isCommander,
  }
  const toast = { push: vi.fn() }
  return render(
    <AuthContext.Provider value={auth}>
      <ToastContext.Provider value={toast}>
        <MoveControl
          telemetry={opts.telemetry ?? idleTelemetry}
          onAfterReset={vi.fn()}
          onCommandSent={vi.fn()}
        />
      </ToastContext.Provider>
    </AuthContext.Provider>,
  )
}

describe('MoveControl', () => {
  it('hides controls and shows a restricted message for Viewers', () => {
    renderWithCtx({ isCommander: false })
    expect(screen.getByText(/restricted to Commander/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /move robot/i })).toBeNull()
  })

  it('rejects out-of-range X and never calls sendMove', async () => {
    const user = userEvent.setup()
    renderWithCtx({ isCommander: true })

    await user.type(screen.getByLabelText(/target x/i), '99')
    await user.type(screen.getByLabelText(/target y/i), '5')
    await user.click(screen.getByRole('button', { name: /move robot/i }))

    expect(screen.getByText(/Must be between 0 and 20/i)).toBeInTheDocument()
    expect(sendMove).not.toHaveBeenCalled()
  })

  it('submits valid coords to sendMove', async () => {
    const user = userEvent.setup()
    renderWithCtx({ isCommander: true })

    await user.type(screen.getByLabelText(/target x/i), '5')
    await user.type(screen.getByLabelText(/target y/i), '7')
    await user.click(screen.getByRole('button', { name: /move robot/i }))

    expect(sendMove).toHaveBeenCalledWith(5, 7)
  })

  it('disables the move button while the robot is MOVING', () => {
    renderWithCtx({
      isCommander: true,
      telemetry: { ...idleTelemetry, status: 'MOVING' },
    })
    expect(screen.getByRole('button', { name: /move robot/i })).toBeDisabled()
  })
})
