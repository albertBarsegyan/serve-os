import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

let context:
  | {
      queryClient: QueryClient
    }
  | undefined

export function getQueryContext() {
  if (context) {
    return context
  }

  const queryClient = new QueryClient()

  context = {
    queryClient,
  }

  return context
}

export default function TanStackQueryProvider({ children }: { children: ReactNode }) {
  const { queryClient } = getQueryContext()

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
