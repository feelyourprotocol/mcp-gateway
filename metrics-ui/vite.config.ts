import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

import { METRICS_UI_DEV_PORT } from './devServerPort.js'

const devPort = Number(
  process.env.PORT ?? process.env.METRICS_UI_DEV_PORT ?? METRICS_UI_DEV_PORT,
)

export default defineConfig(({ mode }) => ({
  // Served behind nginx at https://…/usage/ (proxy strips prefix to :3001).
  base: mode === 'production' ? '/usage/' : '/',
  plugins: [tailwindcss(), vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: devPort,
    strictPort: true,
    proxy:
      mode === 'live'
        ? {
            '/api': {
              target: 'http://127.0.0.1:3001',
              changeOrigin: true,
            },
          }
        : undefined,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
}))
