import type { Author, Book, Subscription } from '@/shared/api/types'

export interface DbBook {
  id: number
  title: string
  year: number
  description: string
  isbn: string
  cover_url: string
}

export interface DbAuthor {
  id: number
  full_name: string
}

const COVER_COLORS = [
  { cloth: '#2f4858', spine: '#22343f', ink: '#c7d4dd' },
  { cloth: '#4a5240', spine: '#363d2f', ink: '#d5dac9' },
  { cloth: '#6b3a3a', spine: '#4f2a2a', ink: '#e2c9c5' },
  { cloth: '#3d4a6b', spine: '#2c3750', ink: '#ccd4e6' },
  { cloth: '#7a5c33', spine: '#5b4425', ink: '#e6d6bd' },
]

function makeCover(title: string, seed: number): string {
  let hash = seed
  for (const char of title) hash = (hash * 31 + char.charCodeAt(0)) % 9973
  const color = COVER_COLORS[hash % COVER_COLORS.length]!
  const initials = title.slice(0, 2).toUpperCase()
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280">
    <rect width="200" height="280" fill="${color.cloth}"/>
    <rect x="0" y="0" width="12" height="280" fill="${color.spine}"/>
    <rect x="28" y="40" width="144" height="200" fill="none" stroke="${color.ink}" stroke-opacity="0.35"/>
    <text x="100" y="155" font-family="Georgia, serif" font-size="56"
          fill="${color.ink}" text-anchor="middle">${initials}</text>
  </svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

const AUTHOR_NAMES = [
  'Булгаков Михаил Афанасьевич',
  'Достоевский Фёдор Михайлович',
  'Толстой Лев Николаевич',
  'Стругацкий Аркадий Натанович',
  'Стругацкий Борис Натанович',
  'Пелевин Виктор Олегович',
  'Акунин Борис',
  'Лукьяненко Сергей Васильевич',
  'Улицкая Людмила Евгеньевна',
  'Водолазкин Евгений Германович',
  'Иванов Алексей Викторович',
  'Рубина Дина Ильинична',
  'Сорокин Владимир Георгиевич',
  'Быков Дмитрий Львович',
  'Яхина Гузель Шамилевна',
]

const TITLE_PARTS_A = [
  'Тень',
  'Хроники',
  'Возвращение',
  'Последний',
  'Тайна',
  'Дневник',
  'Путь',
  'Город',
  'Эхо',
  'Зеркало',
]

const TITLE_PARTS_B = [
  'забытого дома',
  'северного ветра',
  'стеклянного сада',
  'тихой реки',
  'позднего лета',
  'чужих писем',
  'белой башни',
  'первого снега',
  'длинной ночи',
  'пустого перрона',
]

function createRandom(seed: number) {
  let state = seed
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648
    return state / 2147483648
  }
}

function makeIsbn13(seed: number): string {
  const body = `978${String(5_000_000_000 + seed * 7919).slice(0, 9)}`
  let sum = 0
  for (let i = 0; i < 12; i++) sum += Number(body[i]) * (i % 2 === 0 ? 1 : 3)
  const check = (10 - (sum % 10)) % 10
  return `${body}${check}`
}

export interface Database {
  books: DbBook[]
  authors: DbAuthor[]
  bookAuthors: { book_id: number; author_id: number }[]
  subscriptions: Subscription[]
  nextBookId: number
  nextAuthorId: number
  nextSubscriptionId: number
}

export function seedDatabase(): Database {
  const random = createRandom(42)

  const authors: DbAuthor[] = AUTHOR_NAMES.map((full_name, index) => ({
    id: index + 1,
    full_name,
  }))

  const books: DbBook[] = []
  const bookAuthors: { book_id: number; author_id: number }[] = []

  for (let id = 1; id <= 64; id++) {
    const title = `${TITLE_PARTS_A[id % TITLE_PARTS_A.length]} ${
      TITLE_PARTS_B[(id * 3) % TITLE_PARTS_B.length]
    }`
    const year = 2015 + (id % 11) // 2015..2025

    books.push({
      id,
      title,
      year,
      description:
        'Текст описания сгенерирован для демонстрации интерфейса.',
      isbn: makeIsbn13(id),
      cover_url: makeCover(title, id),
    })

    const primary = 1 + Math.floor(random() * authors.length)
    bookAuthors.push({ book_id: id, author_id: primary })

    if (random() > 0.7) {
      const secondary = 1 + Math.floor(random() * authors.length)
      if (secondary !== primary) bookAuthors.push({ book_id: id, author_id: secondary })
    }
  }

  return {
    books,
    authors,
    bookAuthors,
    subscriptions: [],
    nextBookId: books.length + 1,
    nextAuthorId: authors.length + 1,
    nextSubscriptionId: 1,
  }
}

export const db: Database = seedDatabase()

export function authorsOfBook(bookId: number): Author[] {
  const ids = db.bookAuthors.filter((link) => link.book_id === bookId).map((link) => link.author_id)
  return db.authors.filter((author) => ids.includes(author.id))
}

export function toBookResponse(book: DbBook): Book {
  return {
    ...book,
    authors: authorsOfBook(book.id).map(({ id, full_name }) => ({ id, full_name })),
  }
}

export function booksOfAuthor(authorId: number): DbBook[] {
  const ids = db.bookAuthors
    .filter((link) => link.author_id === authorId)
    .map((link) => link.book_id)
  return db.books.filter((book) => ids.includes(book.id))
}