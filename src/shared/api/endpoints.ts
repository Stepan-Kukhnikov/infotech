import { buildQuery, http } from './http'
import type {
  Author,
  AuthorInput,
  AuthorListParams,
  AuthorShort,
  Book,
  BookFormPayload,
  BookInput,
  BookListParams,
  LoginData,
  LoginRequest,
  PaginatedData,
  Subscription,
  SubscriptionInput,
  TopAuthorsData,
} from './types'

function toBookFormData(payload: BookFormPayload): FormData {
  const form = new FormData()

  form.append('title', payload.title)
  form.append('year', String(payload.year))
  if (payload.description) form.append('description', payload.description)
  if (payload.isbn) form.append('isbn', payload.isbn)
  // Yii2 собирает повторяющиеся author_ids[] в массив
  for (const id of payload.author_ids) form.append('author_ids[]', String(id))
  form.append('cover', payload.cover)

  return form
}

export const authApi = {
  login: (credentials: LoginRequest) => http.post<LoginData>('/auth/login', credentials),
}

export const booksApi = {
  list: (params: BookListParams, signal?: AbortSignal) =>
    http.get<PaginatedData<Book>>(
      `/books${buildQuery({
        page: params.page,
        'per-page': params.perPage, // в ответе per_page, в запросе per-page — так в спеке
        author_id: params.author_id,
        year: params.year,
        search: params.search,
      })}`,
      signal,
    ),

  byId: (id: number, signal?: AbortSignal) => http.get<Book>(`/books/${id}`, signal),

  create: (payload: BookFormPayload) => http.post<Book>('/books', toBookFormData(payload)),

  replace: (id: number, payload: BookFormPayload) =>
    http.put<Book>(`/books/${id}`, toBookFormData(payload)),

  update: (id: number, payload: BookInput) => http.patch<Book>(`/books/${id}`, payload),

  remove: (id: number) => http.delete<void>(`/books/${id}`),
}

export const authorsApi = {
  list: (params: AuthorListParams, signal?: AbortSignal) =>
    http.get<PaginatedData<AuthorShort>>(
      `/authors${buildQuery({
        page: params.page,
        'per-page': params.perPage,
        search: params.search,
      })}`,
      signal,
    ),

  byId: (id: number, signal?: AbortSignal) => http.get<Author>(`/authors/${id}`, signal),

  create: (payload: AuthorInput) => http.post<Author>('/authors', payload),

  update: (id: number, payload: AuthorInput) => http.put<Author>(`/authors/${id}`, payload),

  remove: (id: number) => http.delete<void>(`/authors/${id}`),
}

export const reportsApi = {
  topAuthors: (year: number, signal?: AbortSignal) =>
    http.get<TopAuthorsData>(`/reports/top-authors${buildQuery({ year })}`, signal),
}

export const subscriptionsApi = {
  subscribe: (authorId: number, payload: SubscriptionInput) =>
    http.post<Subscription>(`/authors/${authorId}/subscriptions`, payload),
}
