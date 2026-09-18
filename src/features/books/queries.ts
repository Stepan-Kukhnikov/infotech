import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, toValue } from 'vue'
import type { MaybeRefOrGetter } from 'vue'

import { booksApi } from '@/shared/api/endpoints'
import { queryKeys } from '@/shared/api/queryKeys'
import type { BookFormPayload, BookInput, BookListParams } from '@/shared/api/types'

export function useBooksQuery(params: MaybeRefOrGetter<BookListParams>) {
  return useQuery({
    queryKey: computed(() => queryKeys.books.list(toValue(params))),
    queryFn: ({ signal }) => booksApi.list(toValue(params), signal),
    placeholderData: keepPreviousData,
  })
}

export function useBookQuery(id: MaybeRefOrGetter<number>) {
  return useQuery({
    queryKey: computed(() => queryKeys.books.detail(toValue(id))),
    queryFn: ({ signal }) => booksApi.byId(toValue(id), signal),
    enabled: computed(() => Number.isFinite(toValue(id)) && toValue(id) > 0),
  })
}

export function useCreateBookMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: BookFormPayload) => booksApi.create(payload),
    onSuccess: (book) => {
      queryClient.setQueryData(queryKeys.books.detail(book.id), book)
      void queryClient.invalidateQueries({ queryKey: queryKeys.books.lists() })
      void queryClient.invalidateQueries({ queryKey: queryKeys.authors.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.reports.all })
    },
  })
}

export function useUpdateBookMutation(id: MaybeRefOrGetter<number>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: BookFormPayload | BookInput) =>
      'cover' in payload && payload.cover instanceof File
        ? booksApi.replace(toValue(id), payload as BookFormPayload)
        : booksApi.update(toValue(id), payload as BookInput),
    onSuccess: (book) => {
      queryClient.setQueryData(queryKeys.books.detail(book.id), book)
      void queryClient.invalidateQueries({ queryKey: queryKeys.books.lists() })
      void queryClient.invalidateQueries({ queryKey: queryKeys.authors.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.reports.all })
    },
  })
}

export function useDeleteBookMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => booksApi.remove(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.books.detail(id) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.books.lists() })
      void queryClient.invalidateQueries({ queryKey: queryKeys.authors.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.reports.all })
    },
  })
}
