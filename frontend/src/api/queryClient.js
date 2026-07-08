import { QueryClient } from '@tanstack/react-query'

function shouldRetry(failureCount, error) {
  if (error?.status && error.status >= 400 && error.status < 500) {
    return false
  }

  return failureCount < 2
}

export const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      retry: false,
    },
    queries: {
      refetchOnWindowFocus: false,
      retry: shouldRetry,
      staleTime: 30_000,
    },
  },
})
