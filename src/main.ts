import { VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from './app/App.vue'
import { queryClient } from './app/queryClient'
import { router } from './app/router'
import { useAuthStore } from './stores/auth'
import './styles/index.css'

async function bootstrap(): Promise<void> {
  if (import.meta.env.VITE_ENABLE_MOCKS !== 'false') {
    const { startMockServer } = await import('./mocks/browser')
    await startMockServer()
  }

  const app = createApp(App)

  app.use(createPinia())

  useAuthStore().connectHttp()

  app.use(VueQueryPlugin, { queryClient })
  app.use(router)

  app.mount('#app')
}

void bootstrap()
