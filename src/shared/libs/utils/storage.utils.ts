/**
 * SSR-safe wrappers around the browser Storage APIs. TanStack Start renders on the
 * server, where `window`/`localStorage`/`sessionStorage` don't exist — every call here
 * is guarded so storage access is a client-only no-op during SSR instead of a crash.
 */

type StorageKind = 'localStorage' | 'sessionStorage'

function getStorage(kind: StorageKind): Storage | null {
  if (typeof window === 'undefined') {
    return null
  }
  return window[kind]
}

function getItem(kind: StorageKind, key: string): string | null {
  const storage = getStorage(kind)
  if (!storage) return null

  try {
    return storage.getItem(key)
  } catch {
    return null
  }
}

function setItem(kind: StorageKind, key: string, value: string): boolean {
  const storage = getStorage(kind)
  if (!storage) return false

  try {
    storage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

function removeItem(kind: StorageKind, key: string): boolean {
  const storage = getStorage(kind)
  if (!storage) return false

  try {
    storage.removeItem(key)
    return true
  } catch {
    return false
  }
}

export function getLocalStorageItem(key: string): string | null {
  return getItem('localStorage', key)
}

export function setLocalStorageItem(key: string, value: string): boolean {
  return setItem('localStorage', key, value)
}

export function removeLocalStorageItem(key: string): boolean {
  return removeItem('localStorage', key)
}

export function getSessionStorageItem(key: string): string | null {
  return getItem('sessionStorage', key)
}

export function setSessionStorageItem(key: string, value: string): boolean {
  return setItem('sessionStorage', key, value)
}

export function removeSessionStorageItem(key: string): boolean {
  return removeItem('sessionStorage', key)
}
