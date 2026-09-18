import type { AuthorListParams, BookListParams } from './types'

export const queryKeys = {
  books: {
    all: ['books'] as const,
    lists: () => [...queryKeys.books.all, 'list'] as const,
    list: (params: BookListParams) => [...queryKeys.books.lists(), params] as const,
    details: () => [...queryKeys.books.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.books.details(), id] as const,
  },
  authors: {
    all: ['authors'] as const,
    lists: () => [...queryKeys.authors.all, 'list'] as const,
    list: (params: AuthorListParams) => [...queryKeys.authors.lists(), params] as const,
    details: () => [...queryKeys.authors.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.authors.details(), id] as const,
  },
  reports: {
    all: ['reports'] as const,
    topAuthors: (year: number) => [...queryKeys.reports.all, 'top-authors', year] as const,
  },
} as const
