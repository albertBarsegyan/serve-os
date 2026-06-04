import ky, { type BeforeErrorState, isHTTPError } from 'ky'
import { getQueryContext } from '#/integrations/tanstack-query/root-provider'

function extractBackendError({ error }: BeforeErrorState) {
  if (isHTTPError(error)) {
    if (typeof error.data === 'object' && error.data !== null && 'message' in error.data) {
      error.message = String(error.data.message)
    }
  }

  return error
}

async function handleUnauthorized({ error }: BeforeErrorState) {
  if (isHTTPError(error) && error.response.status === 401) {
    const { pathname } = window.location
    if (!(pathname.startsWith('/auth') || pathname.startsWith('/customer'))) {
      const { queryClient } = getQueryContext()
      await queryClient.cancelQueries()
      queryClient.clear()
      window.location.href = '/auth/sign-in'
    }
  }

  return error
}

export const clientApiInstance = ky.create({
  prefix: import.meta.env.VITE_API_BASE_URL,
  timeout: 30_000,
  credentials: 'include',
  hooks: {
    beforeError: [extractBackendError, handleUnauthorized],
  },
})
