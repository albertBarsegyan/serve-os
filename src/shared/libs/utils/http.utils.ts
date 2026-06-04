type UnknownRecord = Record<string, unknown>

const isRecord = (value: unknown): value is UnknownRecord =>
  value !== null && typeof value === 'object'

const getNested = (obj: unknown, path: string[]): unknown | undefined => {
  let current: unknown = obj

  for (const key of path) {
    if (isRecord(current) && key in current) {
      current = current[key]
    } else {
      return undefined
    }
  }

  return current
}

export const getResponseErrorMessage = (error: unknown): string => {
  const normalize = (value: unknown): string | null => {
    if (!value && value !== '' && value !== 0) {
      return null
    }

    if (typeof value === 'string') {
      const trimmed = value.trim()
      return trimmed.length > 0 ? trimmed : null
    }

    if (Array.isArray(value)) {
      const parts = value
        .map((item) => {
          if (typeof item === 'string') {
            return item.trim()
          }

          if (isRecord(item) && typeof item.message === 'string') {
            return item.message.trim()
          }

          try {
            return JSON.stringify(item)
          } catch {
            return String(item)
          }
        })
        .filter(Boolean)

      return parts.length > 0 ? parts.join('; ') : null
    }

    if (isRecord(value)) {
      if (typeof value.message === 'string') {
        return value.message.trim()
      }

      if (Array.isArray(value.errors)) {
        return normalize(value.errors)
      }

      if (isRecord(value.error)) {
        const nested = value.error.message ?? value.error.errors
        const normalized = normalize(nested)

        if (normalized) {
          return normalized
        }
      }
    }

    return null
  }

  // Ky's beforeError hook sets error.message to the backend message before throwing.
  // TanStack server function errors are serialized/deserialized preserving error.message.
  const candidates: unknown[] = [
    getNested(error, ['message']),
    typeof error === 'string' ? error : undefined,
    error instanceof Error ? error.message : undefined,
  ]

  for (const candidate of candidates) {
    const normalized = normalize(candidate)

    if (normalized) {
      return normalized
    }
  }

  try {
    if (
      isRecord(error) &&
      typeof error.toString === 'function' &&
      error.toString !== Object.prototype.toString
    ) {
      return error.toString()
    }
  } catch {
    // ignore
  }

  return 'An error occurred'
}
