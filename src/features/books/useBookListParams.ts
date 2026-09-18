import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { LocationQueryRaw } from 'vue-router'

import type { BookListParams } from '@/shared/api/types'

const PER_PAGE = 12

function readNumber(value: unknown): number | undefined {
  if (typeof value !== 'string' || !value) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value ? value : undefined
}

export function useBookListParams() {
  const route = useRoute()
  const router = useRouter()

  const params = computed<BookListParams>(() => ({
    page: readNumber(route.query.page) ?? 1,
    perPage: PER_PAGE,
    search: readString(route.query.search),
    year: readNumber(route.query.year),
    author_id: readNumber(route.query.author_id),
  }))

  const isFiltered = computed(() =>
    Boolean(params.value.search || params.value.year || params.value.author_id),
  )

  function update(patch: Record<string, string | number | undefined>): void {
    const next: LocationQueryRaw = { ...route.query }

    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined || value === '') delete next[key]
      else next[key] = String(value)
    }

    // смена фильтра всегда возвращает на первую страницу
    if (!('page' in patch)) delete next.page

    const navigate = 'page' in patch ? router.push : router.replace
    void navigate({ query: next })
  }

  function reset(): void {
    void router.replace({ query: {} })
  }

  return { params, update, reset, isFiltered }
}
