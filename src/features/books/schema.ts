import { z } from 'zod'

import { CURRENT_YEAR, MIN_BOOK_YEAR } from '@/shared/lib/format'

export const MAX_COVER_BYTES = 5 * 1024 * 1024 // 5 МБ
export const ACCEPTED_COVER_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

export function isValidIsbn(raw: string): boolean {
  const value = raw.replace(/[\s-]/g, '').toUpperCase()

  if (/^\d{9}[\dX]$/.test(value)) {
    let sum = 0
    for (let i = 0; i < 10; i++) {
      const char = value[i]!
      const digit = char === 'X' ? 10 : Number(char)
      sum += digit * (10 - i)
    }
    return sum % 11 === 0
  }

  if (/^\d{13}$/.test(value)) {
    let sum = 0
    for (let i = 0; i < 13; i++) {
      sum += Number(value[i]) * (i % 2 === 0 ? 1 : 3)
    }
    return sum % 10 === 0
  }

  return false
}

const coverFileSchema = z
  .instanceof(File, { message: 'Загрузите файл обложки' })
  .refine((file) => file.size > 0, 'Файл пустой')
  .refine((file) => file.size <= MAX_COVER_BYTES, 'Размер обложки не должен превышать 5 МБ')
  .refine(
    (file) => (ACCEPTED_COVER_TYPES as readonly string[]).includes(file.type),
    'Допустимые форматы: JPEG, PNG, WebP',
  )

export function createBookSchema(mode: 'create' | 'edit') {
  return z.object({
    title: z
      .string()
      .trim()
      .min(1, 'Укажите название')
      .max(255, 'Название не длиннее 255 символов'),

    year: z.coerce
      .number({ invalid_type_error: 'Год — это число' })
      .int('Год должен быть целым числом')
      .min(MIN_BOOK_YEAR, `Год не раньше ${MIN_BOOK_YEAR}`)
      .max(CURRENT_YEAR, `Год не позже ${CURRENT_YEAR}`),

    description: z.string().trim().max(5000, 'Описание не длиннее 5000 символов').optional(),

    isbn: z
      .string()
      .trim()
      .optional()
      .refine((value) => !value || isValidIsbn(value), 'Некорректный ISBN (проверьте цифры)'),

    author_ids: z.array(z.number().int().positive()).min(1, 'Выберите хотя бы одного автора'),

    cover: mode === 'create' ? coverFileSchema : coverFileSchema.optional(),
  })
}

export type BookFormValues = z.infer<ReturnType<typeof createBookSchema>>
