import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // During local development forward API requests to the backend.
    // In production the client is built with VITE_API_BASE_URL pointing at the
    // deployed backend, so a proxy is only needed here.
    proxy: {
      '/health': 'http://localhost:3000',
      '/auth': 'http://localhost:3000',
      '/organizations': 'http://localhost:3000',
      '/departments': 'http://localhost:3000',
      '/employees': 'http://localhost:3000',
      '/machinery': 'http://localhost:3000',
      '/resources': 'http://localhost:3000',
      '/transfers': 'http://localhost:3000',
      '/events': 'http://localhost:3000',
      '/documents': 'http://localhost:3000',
    },
  },
})
