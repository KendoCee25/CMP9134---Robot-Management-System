import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite dev server proxies API + WebSocket calls to the Express backend on :5000
// so the React app can use same-origin relative URLs (/api/..., /ws/telemetry).
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:5000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
