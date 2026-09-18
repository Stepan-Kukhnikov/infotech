import { ApiError } from '@/shared/api/errors'

export function applyServerErrors<Field extends string>(
  error: unknown,
  setFieldError: (field: Field, message: string) => void,
  knownFields: readonly Field[],
): string | null {
  if (!(error instanceof ApiError)) {
    return error instanceof Error ? error.message : 'Не удалось сохранить данные'
  }

  if (!error.isValidation || error.fieldErrors.length === 0) {
    return error.message
  }

  const unmatched: string[] = []

  for (const item of error.fieldErrors) {
    const field = item.field
    const message = item.message ?? 'Некорректное значение'

    if (field && (knownFields as readonly string[]).includes(field)) {
      setFieldError(field as Field, message)
    } else {
      unmatched.push(field ? `${field}: ${message}` : message)
    }
  }

  return unmatched.length > 0 ? unmatched.join('; ') : null
}
