import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

import { authApi } from '@/shared/api/endpoints'
import { setTokenProvider, setUnauthorizedHandler } from '@/shared/api/http'
import type { LoginRequest } from '@/shared/api/types'

import { clearSession, readSession, writeSession } from '@/features/auth/tokenStorage'
import type { StoredSession } from '@/features/auth/tokenStorage'

export const useAuthStore = defineStore('auth', () => {
  const session = ref<StoredSession | null>(readSession())

  const user = computed(() => session.value?.user ?? null)
  const isAuthenticated = computed(() => session.value !== null)

  function logout(): void {
    clearSession()
    session.value = null
  }

  async function login(credentials: LoginRequest): Promise<void> {
    const data = await authApi.login(credentials)
    const next: StoredSession = {
      token: data.token,
      expiresAt: data.expires_at,
      user: data.user,
    }
    writeSession(next)
    session.value = next
  }

  function connectHttp(): void {
    setTokenProvider(() => session.value?.token ?? null)
    setUnauthorizedHandler(() => logout())
  }

  let expiryTimer: number | undefined

  watch(
    session,
    (current) => {
      if (expiryTimer) window.clearTimeout(expiryTimer)
      if (!current) return

      const msLeft = Date.parse(current.expiresAt) - Date.now()
      if (Number.isNaN(msLeft)) return
      if (msLeft <= 0) {
        logout()
        return
      }
      if (msLeft > 2_147_483_647) return

      expiryTimer = window.setTimeout(logout, msLeft)
    },
    { immediate: true },
  )

  return { session, user, isAuthenticated, login, logout, connectHttp }
})
