export const getResponseErrorMessage = (error: unknown): string => {
  // Helper to safely extract nested property
  const getNestedMessage = (obj: unknown, ...keys: string[]): string | null => {
    let current = obj
    for (const key of keys) {
      if (typeof current === 'object' && current !== null && key in current) {
        current = (current as Record<string, unknown>)[key]
      } else {
        return null
      }
    }
    return typeof current === 'string' ? current : null
  }

  const message =
    getNestedMessage(error, 'data', 'message') ??
    getNestedMessage(error, 'response', 'data', 'message') ??
    (error instanceof Error ? error.message : null)

  return message ?? 'An error occurred'
}
