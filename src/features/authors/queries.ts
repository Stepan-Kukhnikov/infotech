import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, toValue } from 'vue'
import type { MaybeRefOrGetter } from 'vue'

import { authorsApi, subscriptionsApi } from '@/shared/api/endpoints'
import { queryKeys } from '@/shared/api/queryKeys'
import type { AuthorInput, AuthorListParams, SubscriptionInput } from '@/shared/api/types'

export function useAuthorsQuery(params: MaybeRefOrGetter<AuthorListParams>) {
  return useQuery({
    queryKey: computed(() => queryKeys.authors.list(toValue(params))),
    queryFn: ({ signal }) => authorsApi.list(toValue(params), signal),
    placeholderData: keepPreviousData,
  })
}

export function useAuthorQuery(id: MaybeRefOrGetter<number>) {
  return useQuery({
    queryKey: computed(() => queryKeys.authors.detail(toValue(id))),
    queryFn: ({ signal }) => authorsApi.byId(toValue(id), signal),
    enabled: computed(() => Number.isFinite(toValue(id)) && toValue(id) > 0),
  })
}

export function useCreateAuthorMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: AuthorInput) => authorsApi.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.authors.lists() })
    },
  })
}

export function useUpdateAuthorMutation(id: MaybeRefOrGetter<number>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: AuthorInput) => authorsApi.update(toValue(id), payload),
    onSuccess: (author) => {
      queryClient.setQueryData(queryKeys.authors.detail(toValue(id)), author)
      void queryClient.invalidateQueries({ queryKey: queryKeys.authors.lists() })
      void queryClient.invalidateQueries({ queryKey: queryKeys.books.all })
    },
  })
}

export function useDeleteAuthorMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => authorsApi.remove(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.authors.detail(id) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.authors.lists() })
      void queryClient.invalidateQueries({ queryKey: queryKeys.books.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.reports.all })
    },
  })
}

export function useSubscribeMutation(authorId: MaybeRefOrGetter<number>) {
  return useMutation({
    mutationFn: (payload: SubscriptionInput) =>
      subscriptionsApi.subscribe(toValue(authorId), payload),
  })
}
