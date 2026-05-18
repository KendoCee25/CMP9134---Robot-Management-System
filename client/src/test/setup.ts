// Vitest setup — extends expect with @testing-library/jest-dom matchers and
// resets the DOM between tests.

import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
  localStorage.clear()
})
