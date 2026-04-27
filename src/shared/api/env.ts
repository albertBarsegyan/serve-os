/** Base URL for REST calls (must end with the API prefix, e.g. http://host:port/api). */
export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL?.trim()
  return raw?.replace(/\/$/, '') ?? ''
}
