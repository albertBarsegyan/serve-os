import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

let context:
  | {
      queryClient: QueryClient
    }
  | undefined

export function getQueryContext() {
  // client — singleton, persists across navigations
  if (typeof document !== 'undefined') {
    context ??= createContext()

    return context
  }

  return createContext()
}

function createContext() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnReconnect: true,
        refetchOnMount: true,
      },
      mutations: {
        retry: 0,
      },
    },
  })
  return { queryClient }
}

export default function TanStackQueryProvider({ children }: Readonly<{ children: ReactNode }>) {
  const { queryClient } = getQueryContext()

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
