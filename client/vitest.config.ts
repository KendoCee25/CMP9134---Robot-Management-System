// Vitest configuration — kept separate from vite.config.ts because Vitest
// bundles its own Vite copy, and a single defineConfig that types both
// surfaces collides on the duplicated Vite types.
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: [
        'src/main.tsx',
        'src/App.tsx',
        '**/*.config.*',
        '**/test/**',
        '**/*.d.ts',
      ],
    },
  },
})
