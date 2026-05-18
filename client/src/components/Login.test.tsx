/**
 * Login — happy path + error display.
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { Login } from './Login'
import { AuthContext } from '../auth/AuthContext'
import type { AuthContextValue } from '../auth/AuthContext'

function renderWithAuth(login: AuthContextValue['login']) {
  const auth: AuthContextValue = {
    user: null,
    login,
    register: vi.fn(),
    logout: vi.fn(),
    isCommander: false,
  }
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <AuthContext.Provider value={auth}>
        <Login />
      </AuthContext.Provider>
    </MemoryRouter>,
  )
}

describe('Login', () => {
  it('calls login() with the typed credentials', async () => {
    const user = userEvent.setup()
    const login = vi.fn().mockResolvedValue(undefined)
    renderWithAuth(login)

    await user.type(screen.getByLabelText(/username/i), 'alice')
    await user.type(screen.getByLabelText(/password/i), 'secret123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(login).toHaveBeenCalledWith('alice', 'secret123')
  })

  it('shows the error message on failure', async () => {
    const user = userEvent.setup()
    const login = vi.fn().mockRejectedValue(new Error('Invalid username or password.'))
    renderWithAuth(login)

    await user.type(screen.getByLabelText(/username/i), 'alice')
    await user.type(screen.getByLabelText(/password/i), 'wrong')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/invalid/i)
    })
  })
})
