import { HttpResponse, delay, http } from 'msw'

import type { ApiErrorItem, Book, Pagination } from '@/shared/api/types'

import { authorsOfBook, booksOfAuthor, db, toBookResponse } from './db'

// Мок по book.yaml.
// Выключается через VITE_ENABLE_MOCKS=false.
const BASE = '/api/v1'
const DEMO_USER = { username: 'admin', password: 'admin' }
const TOKEN = 'mock-jwt-token'

function ok<T>(data: T, status = 200) {
  return HttpResponse.json({ success: true, data }, { status })
}

function fail(status: number, errors: ApiErrorItem[]) {
  return HttpResponse.json({ success: false, errors }, { status })
}

function isAuthorized(request: Request): boolean {
  return request.headers.get('Authorization') === `Bearer ${TOKEN}`
}

function paginate<T>(items: T[], page: number, perPage: number): { slice: T[]; meta: Pagination } {
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const current = Math.min(Math.max(page, 1), totalPages)
  const start = (current - 1) * perPage

  return {
    slice: items.slice(start, start + perPage),
    meta: { total, page: current, per_page: perPage, total_pages: totalPages },
  }
}

function readPageParams(url: URL): { page: number; perPage: number } {
  return {
    page: Number(url.searchParams.get('page')) || 1,
    perPage: Number(url.searchParams.get('per-page')) || 20,
  }
}

async function readBookForm(request: Request) {
  const form = await request.formData()

  const authorIds = [...form.getAll('author_ids[]'), ...form.getAll('author_ids')]
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0)

  const cover = form.get('cover')

  return {
    title: String(form.get('title') ?? '').trim(),
    year: Number(form.get('year')),
    description: String(form.get('description') ?? ''),
    isbn: String(form.get('isbn') ?? ''),
    author_ids: authorIds,
    cover: cover instanceof File ? cover : null,
  }
}

function validateBookFields(input: {
  title: string
  year: number
  author_ids: number[]
  isbn: string
}): ApiErrorItem[] {
  const errors: ApiErrorItem[] = []

  if (!input.title) errors.push({ field: 'title', message: 'Название обязательно' })
  if (!Number.isInteger(input.year)) errors.push({ field: 'year', message: 'Год обязателен' })
  if (input.author_ids.length === 0)
    errors.push({ field: 'author_ids', message: 'Укажите хотя бы одного автора' })

  const unknown = input.author_ids.filter((id) => !db.authors.some((author) => author.id === id))
  if (unknown.length > 0)
    errors.push({ field: 'author_ids', message: `Авторы не найдены: ${unknown.join(', ')}` })

  if (input.isbn && db.books.some((book) => book.isbn === input.isbn)) {
    errors.push({ field: 'isbn', message: 'Книга с таким ISBN уже есть в каталоге' })
  }

  return errors
}

function setBookAuthors(bookId: number, authorIds: number[]): void {
  db.bookAuthors = db.bookAuthors.filter((link) => link.book_id !== bookId)
  for (const authorId of authorIds) db.bookAuthors.push({ book_id: bookId, author_id: authorId })
}

export const handlers = [

  http.post(`${BASE}/auth/login`, async ({ request }) => {
    await delay(400)
    const body = (await request.json()) as { username?: string; password?: string }

    if (body.username !== DEMO_USER.username || body.password !== DEMO_USER.password) {
      return fail(401, [{ field: 'password', message: 'Неверный логин или пароль' }])
    }

    return ok({
      token: TOKEN,
      expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
      user: { id: 1, username: DEMO_USER.username, role: 'user' },
    })
  }),

  http.get(`${BASE}/books`, async ({ request }) => {
    await delay(300)
    const url = new URL(request.url)
    const { page, perPage } = readPageParams(url)

    const search = (url.searchParams.get('search') ?? '').trim().toLowerCase()
    const year = Number(url.searchParams.get('year')) || null
    const authorId = Number(url.searchParams.get('author_id')) || null

    let items = db.books.map(toBookResponse)

    if (search) {
      items = items.filter((book) =>
        [book.title, book.description ?? '', book.isbn ?? '']
          .join(' ')
          .toLowerCase()
          .includes(search),
      )
    }
    if (year) items = items.filter((book) => book.year === year)
    if (authorId) {
      items = items.filter((book) => book.authors?.some((author) => author.id === authorId))
    }

    items.sort((a, b) => b.id - a.id)

    const { slice, meta } = paginate(items, page, perPage)
    return ok({ items: slice, pagination: meta })
  }),

  http.get(`${BASE}/books/:id`, async ({ params }) => {
    await delay(200)
    const book = db.books.find((item) => item.id === Number(params.id))
    if (!book) return fail(404, [{ message: 'Книга не найдена' }])
    return ok(toBookResponse(book))
  }),

  http.post(`${BASE}/books`, async ({ request }) => {
    await delay(600)
    if (!isAuthorized(request)) return fail(401, [{ message: 'Требуется авторизация' }])

    const input = await readBookForm(request)
    const errors = validateBookFields(input)
    if (!input.cover) errors.push({ field: 'cover', message: 'Обложка обязательна' })
    if (errors.length > 0) return fail(422, errors)

    const id = db.nextBookId++
    db.books.push({
      id,
      title: input.title,
      year: input.year,
      description: input.description,
      isbn: input.isbn,
      cover_url: input.cover ? URL.createObjectURL(input.cover) : '',
    })
    setBookAuthors(id, input.author_ids)

    const created = db.books.find((book) => book.id === id)!
    return ok(toBookResponse(created), 201)
  }),

  http.put(`${BASE}/books/:id`, async ({ request, params }) => {
    await delay(500)
    if (!isAuthorized(request)) return fail(401, [{ message: 'Требуется авторизация' }])

    const book = db.books.find((item) => item.id === Number(params.id))
    if (!book) return fail(404, [{ message: 'Книга не найдена' }])

    const input = await readBookForm(request)
    const errors = validateBookFields(input).filter(
      (error) => !(error.field === 'isbn' && book.isbn === input.isbn),
    )
    if (!input.cover) errors.push({ field: 'cover', message: 'Обложка обязательна для PUT' })
    if (errors.length > 0) return fail(422, errors)

    book.title = input.title
    book.year = input.year
    book.description = input.description
    book.isbn = input.isbn
    if (input.cover) book.cover_url = URL.createObjectURL(input.cover)
    setBookAuthors(book.id, input.author_ids)

    return ok(toBookResponse(book))
  }),

  http.patch(`${BASE}/books/:id`, async ({ request, params }) => {
    await delay(400)
    if (!isAuthorized(request)) return fail(401, [{ message: 'Требуется авторизация' }])

    const book = db.books.find((item) => item.id === Number(params.id))
    if (!book) return fail(404, [{ message: 'Книга не найдена' }])

    const body = (await request.json()) as Partial<Book> & { author_ids?: number[] }
    const errors: ApiErrorItem[] = []

    if (body.isbn && body.isbn !== book.isbn && db.books.some((item) => item.isbn === body.isbn)) {
      errors.push({ field: 'isbn', message: 'Книга с таким ISBN уже есть в каталоге' })
    }
    if (body.author_ids && body.author_ids.length === 0) {
      errors.push({ field: 'author_ids', message: 'Укажите хотя бы одного автора' })
    }
    if (errors.length > 0) return fail(422, errors)

    if (body.title !== undefined) book.title = body.title
    if (body.year !== undefined) book.year = body.year
    if (body.description !== undefined) book.description = body.description ?? ''
    if (body.isbn !== undefined) book.isbn = body.isbn ?? ''
    if (body.author_ids) setBookAuthors(book.id, body.author_ids)

    return ok(toBookResponse(book))
  }),

  http.delete(`${BASE}/books/:id`, async ({ request, params }) => {
    await delay(400)
    if (!isAuthorized(request)) return fail(401, [{ message: 'Требуется авторизация' }])

    const id = Number(params.id)
    const index = db.books.findIndex((item) => item.id === id)
    if (index === -1) return fail(404, [{ message: 'Книга не найдена' }])

    db.books.splice(index, 1)
    db.bookAuthors = db.bookAuthors.filter((link) => link.book_id !== id)

    return new HttpResponse(null, { status: 204 })
  }),

  http.get(`${BASE}/authors`, async ({ request }) => {
    await delay(250)
    const url = new URL(request.url)
    const { page, perPage } = readPageParams(url)
    const search = (url.searchParams.get('search') ?? '').trim().toLowerCase()

    let items = [...db.authors]
    if (search) items = items.filter((a) => a.full_name.toLowerCase().includes(search))
    items.sort((a, b) => a.full_name.localeCompare(b.full_name, 'ru'))

    const { slice, meta } = paginate(items, page, perPage)
    return ok({ items: slice, pagination: meta })
  }),

  http.get(`${BASE}/authors/:id`, async ({ params }) => {
    await delay(250)
    const author = db.authors.find((item) => item.id === Number(params.id))
    if (!author) return fail(404, [{ message: 'Автор не найден' }])

    return ok({
      ...author,
      books: booksOfAuthor(author.id)
        .map(({ id, title, year }) => ({ id, title, year }))
        .sort((a, b) => b.year - a.year),
    })
  }),

  http.post(`${BASE}/authors`, async ({ request }) => {
    await delay(400)
    if (!isAuthorized(request)) return fail(401, [{ message: 'Требуется авторизация' }])

    const body = (await request.json()) as { full_name?: string }
    const fullName = (body.full_name ?? '').trim()

    if (!fullName) return fail(422, [{ field: 'full_name', message: 'ФИО обязательно' }])
    if (db.authors.some((a) => a.full_name.toLowerCase() === fullName.toLowerCase())) {
      return fail(422, [{ field: 'full_name', message: 'Такой автор уже есть' }])
    }

    const author = { id: db.nextAuthorId++, full_name: fullName }
    db.authors.push(author)
    return ok({ ...author, books: [] }, 201)
  }),

  http.put(`${BASE}/authors/:id`, async ({ request, params }) => {
    await delay(400)
    if (!isAuthorized(request)) return fail(401, [{ message: 'Требуется авторизация' }])

    const author = db.authors.find((item) => item.id === Number(params.id))
    if (!author) return fail(404, [{ message: 'Автор не найден' }])

    const body = (await request.json()) as { full_name?: string }
    const fullName = (body.full_name ?? '').trim()
    if (!fullName) return fail(422, [{ field: 'full_name', message: 'ФИО обязательно' }])

    author.full_name = fullName
    return ok({
      ...author,
      books: booksOfAuthor(author.id).map(({ id, title, year }) => ({ id, title, year })),
    })
  }),

  http.delete(`${BASE}/authors/:id`, async ({ request, params }) => {
    await delay(400)
    if (!isAuthorized(request)) return fail(401, [{ message: 'Требуется авторизация' }])

    const id = Number(params.id)
    const index = db.authors.findIndex((item) => item.id === id)
    if (index === -1) return fail(404, [{ message: 'Автор не найден' }])

    const affected = booksOfAuthor(id).map((book) => book.id)
    db.authors.splice(index, 1)
    db.bookAuthors = db.bookAuthors.filter((link) => link.author_id !== id)

    for (const bookId of affected) {
      if (authorsOfBook(bookId).length === 0) {
        db.books = db.books.filter((book) => book.id !== bookId)
      }
    }

    return new HttpResponse(null, { status: 204 })
  }),

  http.get(`${BASE}/reports/top-authors`, async ({ request }) => {
    await delay(350)
    const url = new URL(request.url)
    const year = Number(url.searchParams.get('year'))

    if (!Number.isInteger(year) || year <= 0) {
      return fail(400, [{ field: 'year', message: 'Параметр year обязателен' }])
    }

    const counts = db.authors
      .map((author) => ({
        author_id: author.id,
        full_name: author.full_name,
        books_count: booksOfAuthor(author.id).filter((book) => book.year === year).length,
      }))
      .filter((item) => item.books_count > 0)
      .sort((a, b) => b.books_count - a.books_count || a.full_name.localeCompare(b.full_name, 'ru'))
      .slice(0, 10)
      .map((item, index) => ({ rank: index + 1, ...item }))

    return ok({ year, items: counts })
  }),

  http.post(`${BASE}/authors/:id/subscriptions`, async ({ request, params }) => {
    await delay(500)

    const authorId = Number(params.id)
    if (!db.authors.some((author) => author.id === authorId)) {
      return fail(404, [{ message: 'Автор не найден' }])
    }

    const body = (await request.json()) as { phone?: string }
    const phone = (body.phone ?? '').trim()

    if (!/^\+7\d{10}$/.test(phone)) {
      return fail(422, [{ field: 'phone', message: 'Телефон должен быть в формате +7XXXXXXXXXX' }])
    }

    const duplicate = db.subscriptions.find(
      (item) => item.author_id === authorId && item.phone === phone,
    )
    if (duplicate) {
      return fail(422, [{ field: 'phone', message: 'Этот номер уже подписан на автора' }])
    }

    const subscription = {
      id: db.nextSubscriptionId++,
      author_id: authorId,
      phone,
      created_at: new Date().toISOString(),
    }
    db.subscriptions.push(subscription)

    return ok(subscription, 201)
  }),
]
