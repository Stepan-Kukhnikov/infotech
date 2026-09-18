import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastKind = 'success' | 'error'

export interface Toast {
  id: number
  kind: ToastKind
  message: string
}

const AUTO_DISMISS_MS = 4000

export const useToastStore = defineStore('toasts', () => {
  const toasts = ref<Toast[]>([])
  let nextId = 1

  function dismiss(id: number): void {
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }

  function notify(kind: ToastKind, message: string): void {
    const id = nextId++
    toasts.value.push({ id, kind, message })
    window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS)
  }

  return { toasts, notify, dismiss }
})
