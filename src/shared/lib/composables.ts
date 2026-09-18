import { onUnmounted, ref, watch } from 'vue'
import type { Ref } from 'vue'

export function useDebouncedRef<T>(source: Ref<T>, delay = 400): Ref<T> {
  const debounced = ref(source.value) as Ref<T>
  let timer: number | undefined

  watch(source, (value) => {
    if (timer) window.clearTimeout(timer)
    timer = window.setTimeout(() => {
      debounced.value = value
    }, delay)
  })

  onUnmounted(() => {
    if (timer) window.clearTimeout(timer)
  })

  return debounced
}

export function useDocumentTitle(title: Ref<string> | (() => string)): void {
  const previous = document.title

  watch(
    typeof title === 'function' ? title : () => title.value,
    (value) => {
      document.title = `${value} — Каталог книг`
    },
    { immediate: true },
  )

  onUnmounted(() => {
    document.title = previous
  })
}
