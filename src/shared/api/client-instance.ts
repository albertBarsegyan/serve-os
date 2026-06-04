import ky, { type BeforeErrorState, isHTTPError } from 'ky'

function extractBackendError({ error }: BeforeErrorState) {
  if (isHTTPError(error)) {
    if (typeof error.data === 'object' && error.data !== null && 'message' in error.data) {
      error.message = String(error.data.message)
    }
  }

  return error
}

export const clientApiInstance = ky.create({
  prefix: import.meta.env.VITE_API_BASE_URL,
  timeout: 30_000,
  credentials: 'include',
  hooks: {
    beforeError: [extractBackendError],
  },
})
