import { useQuery } from '@tanstack/vue-query'
import { computed, toValue } from 'vue'
import type { MaybeRefOrGetter } from 'vue'

import { reportsApi } from '@/shared/api/endpoints'
import { queryKeys } from '@/shared/api/queryKeys'
import { CURRENT_YEAR, MIN_BOOK_YEAR } from '@/shared/lib/format'

export function useTopAuthorsQuery(year: MaybeRefOrGetter<number>) {
  return useQuery({
    queryKey: computed(() => queryKeys.reports.topAuthors(toValue(year))),
    queryFn: ({ signal }) => reportsApi.topAuthors(toValue(year), signal),
    enabled: computed(() => {
      const value = toValue(year)
      return Number.isInteger(value) && value >= MIN_BOOK_YEAR && value <= CURRENT_YEAR
    }),
    staleTime: 5 * 60 * 1000,
  })
}
