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

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
        staleTime: 30 * 1000, // 30s: avoids refetch spam
        gcTime: 5 * 60 * 1000, // 5 min cache retention (formerly cacheTime)
        refetchOnReconnect: true,
        refetchOnMount: true,
      },
      mutations: {
        retry: 0,
      },
    },
  })

  context = {
    queryClient,
  }

  return context
}

export default function TanStackQueryProvider({ children }: { children: ReactNode }) {
  const { queryClient } = getQueryContext()

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
