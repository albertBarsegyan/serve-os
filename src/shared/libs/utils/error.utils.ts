import { showError } from '../hooks/toast'

export interface ApiError {
  status?: number
  message: string
  details?: unknown
}

export function isError(error: unknown): error is Error {
  return error instanceof Error
}

export function isApiError(error: unknown): error is { status?: number; message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  )
}

export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message
  }

  if (isApiError(error)) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  return 'An unexpected error occurred'
}

export function handleRouteError(error: unknown): void {
  const message = getErrorMessage(error)

  if (import.meta.env.DEV) {
    console.error('Route Error:', error)
  }

  showError(message)
}

export function handleQueryError(error: unknown): void {
  const message = getErrorMessage(error)

  if (import.meta.env.DEV) {
    console.error('Query Error:', error)
  }

  showError(message)
}

export function createErrorHandler(onError?: (error: unknown) => void) {
  return (error: unknown) => {
    handleRouteError(error)
    onError?.(error)
  }
}
