import { ApiError, defaultMessageFor } from './errors'
import type { ApiEnvelope, ApiErrorEnvelope, ApiErrorItem } from './types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

let tokenProvider: () => string | null = () => null
let unauthorizedHandler: () => void = () => {}

export function setTokenProvider(provider: () => string | null): void {
  tokenProvider = provider
}

export function setUnauthorizedHandler(handler: () => void): void {
  unauthorizedHandler = handler
}

export type QueryValue = string | number | boolean | undefined | null

export function buildQuery(params: Record<string, QueryValue>): string {
  const search = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    search.append(key, String(value))
  }

  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  signal?: AbortSignal
}

async function parseErrorBody(response: Response): Promise<ApiErrorItem[]> {
  try {
    const payload = (await response.json()) as ApiErrorEnvelope
    return Array.isArray(payload.errors) ? payload.errors : []
  } catch {
    return []
  }
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal } = options

  const headers = new Headers({ Accept: 'application/json' })

  const token = tokenProvider()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let payload: BodyInit | undefined
  if (body instanceof FormData) {
    payload = body
  } else if (body !== undefined) {
    headers.set('Content-Type', 'application/json')
    payload = JSON.stringify(body)
  }

  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, { method, headers, body: payload, signal })
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause
    throw new ApiError(0, defaultMessageFor(0))
  }

  if (!response.ok) {
    const fieldErrors = await parseErrorBody(response)
    const message = fieldErrors[0]?.message ?? defaultMessageFor(response.status)
    const error = new ApiError(response.status, message, fieldErrors)

    // 403 не трогаем: пользователь залогинен, просто не его действие
    if (error.isUnauthorized) unauthorizedHandler()

    throw error
  }

  if (response.status === 204) return undefined as T

  const envelope = (await response.json()) as ApiEnvelope<T>
  return envelope.data
}

export const http = {
  get: <T>(path: string, signal?: AbortSignal) => request<T>(path, { method: 'GET', signal }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
