import ky from 'ky'
import { getApiBaseUrl } from '#/shared/api/env'

/**
 * Configured `ky` instance for the Serve-OS API (`VITE_API_BASE_URL`).
 * Sends `Authorization: Bearer` when a staff session exists.
 */
export const api = ky.create({
  prefix: getApiBaseUrl(),
  timeout: 30_000,
  credentials: 'include',
})
