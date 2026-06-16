import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/',
  plugins: [react()],
  server: {
    port: 8771,
    proxy: {
      '/boss/api': {
        target: 'http://localhost:8770',
        changeOrigin: true,
      }
    }
  }
})
