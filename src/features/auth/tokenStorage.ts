import type { AuthUser } from '@/shared/api/types'

const STORAGE_KEY = 'book-catalog.session'

export interface StoredSession {
  token: string
  expiresAt: string
  user: AuthUser
}

export function readSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as Partial<StoredSession>
    if (!parsed.token || !parsed.user || !parsed.expiresAt) return null

    if (isExpired(parsed.expiresAt)) {
      clearSession()
      return null
    }

    return parsed as StoredSession
  } catch {
    clearSession()
    return null
  }
}

export function writeSession(session: StoredSession): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  } catch {
 
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
 
  }
}

export function isExpired(expiresAt: string): boolean {
  const timestamp = Date.parse(expiresAt)
  if (Number.isNaN(timestamp)) return false // невалидная дата — доверяем бэкенду по 401
  return timestamp <= Date.now()
}
