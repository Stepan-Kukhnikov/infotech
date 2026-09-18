import type { ApiErrorItem } from './types'

export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: ApiErrorItem[]

  constructor(status: number, message: string, fieldErrors: ApiErrorItem[] = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }

  get isUnauthorized(): boolean {
    return this.status === 401
  }

  get isValidation(): boolean {
    return this.status === 422
  }
}

const DEFAULT_MESSAGES: Record<number, string> = {
  0: 'Не удалось связаться с сервером. Проверьте подключение к сети.',
  400: 'Некорректный запрос.',
  401: 'Нужно войти в систему.',
  403: 'Недостаточно прав для этого действия.',
  404: 'Запись не найдена.',
  422: 'Проверьте правильность заполнения формы.',
  500: 'Ошибка на сервере. Попробуйте позже.',
}

export function defaultMessageFor(status: number): string {
  return DEFAULT_MESSAGES[status] ?? `Ошибка запроса (${status}).`
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return 'Произошла неизвестная ошибка.'
}
