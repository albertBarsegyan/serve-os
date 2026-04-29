/**
 * Auth token storage utility
 * Manages auth token in memory to avoid unnecessary /me requests
 */

const AUTH_TOKEN_KEY = 'auth_token'

// In-memory cache for auth state
let cachedAuthToken: string | null = null

/**
 * Get auth token from memory cache
 * This prevents unnecessary API calls when user is already signed out
 */
export function getAuthToken(): string | null {
  if (typeof document === 'undefined') {
    return null // Server-side, don't use client-side storage
  }

  if (cachedAuthToken === undefined) {
    // Check localStorage as fallback on first load
    const stored = localStorage.getItem(AUTH_TOKEN_KEY)
    cachedAuthToken = stored
  }

  return cachedAuthToken || null
}

/**
 * Set auth token (called after successful login)
 */
export function setAuthToken(token: string | null): void {
  cachedAuthToken = token
  if (typeof document === 'undefined') return

  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token)
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY)
  }
}

/**
 * Check if user has valid auth token
 * Returns true if token exists (likely authenticated)
 * Returns false if no token (definitely not authenticated)
 */
export function hasAuthToken(): boolean {
  return getAuthToken() !== null
}

/**
 * Clear auth token (called on logout)
 */
export function clearAuthToken(): void {
  cachedAuthToken = null
  if (typeof document === 'undefined') return
  localStorage.removeItem(AUTH_TOKEN_KEY)
}

/**
 * Initialize auth token from cookie (on app load)
 * Call this once on app initialization
 */
export function initializeAuthToken(): void {
  if (typeof document === 'undefined') return

  // Check if auth cookie exists
  // If cookie-based auth, we can verify by checking for auth cookie
  const cookieExists = document.cookie
    .split('; ')
    .some((cookie) => {
      // Adjust these cookie names based on your backend
      const name = cookie.split('=')[0]
      return name === 'auth_token' || name === 'token' || name === 'sessionid'
    })

  cachedAuthToken = cookieExists ? 'exists' : null
}
