import { QueryClient } from '@tanstack/vue-query'

import { ApiError } from '@/shared/api/errors'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,

      refetchOnWindowFocus: false,

      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          return false
        }
        return failureCount < 2
      },
    },
    mutations: {
      retry: false, // повтор POST создаст вторую книгу
    },
  },
})
