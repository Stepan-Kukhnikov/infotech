

export interface ApiEnvelope<T> {
  success: boolean
  data: T
}

export interface ApiErrorItem {
  field?: string
  message?: string
}

export interface ApiErrorEnvelope {
  success: false
  errors?: ApiErrorItem[]
}

export interface Pagination {
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface PaginatedData<T> {
  items: T[]
  pagination: Pagination
}

export interface LoginRequest {
  username: string
  password: string
}

export type UserRole = 'user' | 'guest'

export interface AuthUser {
  id: number
  username: string
  role: UserRole
}

export interface LoginData {
  token: string
  expires_at: string
  user: AuthUser
}

export interface AuthorShort {
  id: number
  full_name: string
}

export interface BookShort {
  id: number
  title: string
  year: number
}

export interface Book {
  id: number
  title: string
  year: number
  description?: string
  isbn?: string
  cover_url?: string
  authors?: AuthorShort[]
}

export interface Author {
  id: number
  full_name: string
  books?: BookShort[]
}

export interface BookInput {
  title?: string
  year?: number
  description?: string
  isbn?: string
  author_ids?: number[]
}

export interface BookFormPayload {
  title: string
  year: number
  description?: string
  isbn?: string
  author_ids: number[]
  cover: File
}

export interface AuthorInput {
  full_name: string
}

export interface TopAuthor {
  rank: number
  author_id: number
  full_name: string
  books_count: number
}

export interface TopAuthorsData {
  year: number
  items: TopAuthor[]
}

export interface BookListParams {
  page?: number
  perPage?: number
  author_id?: number
  year?: number
  search?: string
}

export interface AuthorListParams {
  page?: number
  perPage?: number
  search?: string
}

export interface SubscriptionInput {
  phone: string
}

export interface Subscription {
  id: number
  author_id: number
  phone: string
  created_at: string
}
