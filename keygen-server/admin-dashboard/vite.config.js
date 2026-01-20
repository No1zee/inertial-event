import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Use absolute path for Vercel, relative for Electron
  base: process.env.VITE_PLATFORM === 'web' ? '/keygen-admin/' : './'
})
