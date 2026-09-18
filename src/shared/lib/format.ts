import type { AuthorShort } from '@/shared/api/types'

export function formatAuthors(authors: AuthorShort[] | undefined): string {
  if (!authors || authors.length === 0) return 'Автор не указан'
  return authors.map((author) => author.full_name).join(', ')
}

export function pluralizeBooks(count: number): string {
  const mod100 = Math.abs(count) % 100
  const mod10 = mod100 % 10

  if (mod100 >= 11 && mod100 <= 14) return `${count} книг`
  if (mod10 === 1) return `${count} книга`
  if (mod10 >= 2 && mod10 <= 4) return `${count} книги`
  return `${count} книг`
}

export function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, '')

  if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))) {
    return `+7${digits.slice(1)}`
  }
  if (digits.length === 10) {
    return `+7${digits}`
  }
  return null
}

export const CURRENT_YEAR = new Date().getFullYear()
export const MIN_BOOK_YEAR = 1450 // до печатного станка книг с годом выпуска не бывает
