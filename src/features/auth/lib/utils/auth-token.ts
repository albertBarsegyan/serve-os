/**
 * Auth token storage utility
 * Manages auth token in localStorage to persist across page reloads
 */

const AUTH_TOKEN_KEY = 'auth_token'

/**
 * Get auth token from localStorage
 * Used to check if user has a valid session
 */
export function getAuthToken(): string | null {
  if (typeof document === 'undefined') {
    return null // Server-side, don't use client-side storage
  }

  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  return token
}

/**
 * Set auth token in localStorage (called after successful login)
 */
export function setAuthToken(token: string | null): void {
  if (typeof document === 'undefined') return // Server-side

  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token)
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY)
  }
}

/**
 * Clear auth token from localStorage (called on logout)
 */
export function clearAuthToken(): void {
  if (typeof document === 'undefined') return // Server-side

  localStorage.removeItem(AUTH_TOKEN_KEY)
}

/**
 * Check if user has an auth token
 * Use before making /me request to avoid unnecessary API calls
 */
export function hasAuthToken(): boolean {
  return getAuthToken() !== null
}
