import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'

import * as authApi from '../api/authApi'
import { queryKeys } from '../api/queryKeys'
import { AuthContext } from './authStateContext'

export function AuthProvider({ children }) {
  const queryClient = useQueryClient()
  const {
    data,
    error,
    isFetching,
    isLoading,
    refetch,
  } = useQuery({
    queryFn: authApi.getCurrentUser,
    queryKey: queryKeys.auth.me,
    retry: false,
  })

  const user = data?.user || null
  const isUnauthenticated = error?.status === 401

  const value = useMemo(
    () => ({
      authError: isUnauthenticated ? null : error,
      isAuthenticated: Boolean(user),
      isLoading: isLoading || isFetching,
      refreshUser: refetch,
      async logout() {
        try {
          await authApi.logout()
        } finally {
          queryClient.setQueryData(queryKeys.auth.me, { user: null })
        }
      },
      user,
    }),
    [error, isFetching, isLoading, isUnauthenticated, queryClient, refetch, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
