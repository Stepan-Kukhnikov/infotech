import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    // Реальный бэкенд (Yii2) обычно живёт на другом порту/домене.
    // Проксируем /api, чтобы в браузере не было CORS и чтобы токен
    // уходил на тот же origin. Включается через VITE_API_PROXY_TARGET.
    proxy: process.env.VITE_API_PROXY_TARGET
      ? {
          '/api': {
            target: process.env.VITE_API_PROXY_TARGET,
            changeOrigin: true,
          },
        }
      : undefined,
  },
})
