import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // todo lo que empiece por /api se reenvía al backend
      '/api': {
        target: 'http://localhost:3000', // ⬅️ PUERTO REAL DEL BACKEND
        changeOrigin: true,
        // Si tu backend no tiene prefijo /api y quieres reescribir:
        // rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
