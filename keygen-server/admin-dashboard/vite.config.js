import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/keygen-admin/' // Ensure absolute paths for Vercel sub-directory
})
