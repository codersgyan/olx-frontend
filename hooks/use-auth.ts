'use client'

import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, apiFetch } from '@/lib/api/client'
import type { Me, SigninResponse, SignupResponse } from '@/lib/api/types'
import { useAuthStore } from '@/store/auth-store'

export const meQueryKey = ['me'] as const

export interface SignInInput {
  email: string
  password: string
}

export interface SignUpInput extends SignInInput {
  name: string
}

/**
 * The signed-in user, or null when signed out.
 *
 * `isResolved` is what callers should branch on, not `isPending`: the query is
 * disabled while the auth store rehydrates, and a disabled query reports
 * `isPending` forever. Rendering "Sign in" on `isPending` would therefore stick
 * for logged-out users but flash for logged-in ones.
 */
export function useMe() {
  const token = useAuthStore(state => state.token)
  const hasHydrated = useAuthStore(state => state.hasHydrated)
  const signOut = useAuthStore(state => state.signOut)

  const query = useQuery({
    queryKey: meQueryKey,
    queryFn: () => apiFetch<Me>('/me', { token }),
    enabled: hasHydrated && Boolean(token),
    retry: false,
    staleTime: 5 * 60_000,
  })

  // A 401 means the token is expired or its user is gone. Dropping it here is
  // what stops every later request from making the same doomed round trip.
  const isUnauthenticated = query.error instanceof ApiError && query.error.status === 401
  useEffect(() => {
    if (isUnauthenticated) signOut()
  }, [isUnauthenticated, signOut])

  return {
    ...query,
    me: query.data ?? null,
    isSignedIn: Boolean(query.data),
    // Resolved once we know the answer either way: no token at all, or a
    // finished request for one.
    isResolved: hasHydrated && (!token || query.isSuccess || query.isError),
  }
}

export function useSignIn() {
  const setToken = useAuthStore(state => state.setToken)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: SignInInput) =>
      apiFetch<SigninResponse>('/signin', { method: 'POST', body: input }),
    onSuccess: async data => {
      setToken(data.token)
      // The token changed, so anything scoped to a user is now wrong. Reset
      // rather than invalidate: the previous user's listings must not be shown
      // while the refetch is in flight.
      queryClient.removeQueries({ queryKey: ['my-listings'] })
      await queryClient.invalidateQueries({ queryKey: meQueryKey })
    },
  })
}

/**
 * Creates the account and signs into it.
 *
 * POST /signup returns only `{id, created_at}` — no token — so a second call is
 * the only way to end up with a session. Chaining them here rather than in the
 * form keeps "signed up" and "signed in" a single outcome the UI can await.
 */
export function useSignUp() {
  const setToken = useAuthStore(state => state.setToken)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ name, email, password }: SignUpInput) => {
      await apiFetch<SignupResponse>('/signup', {
        method: 'POST',
        body: { name, email, password },
      })
      return apiFetch<SigninResponse>('/signin', {
        method: 'POST',
        body: { email, password },
      })
    },
    onSuccess: async data => {
      setToken(data.token)
      queryClient.removeQueries({ queryKey: ['my-listings'] })
      await queryClient.invalidateQueries({ queryKey: meQueryKey })
    },
  })
}

/** Drops the session and every cached response tied to it. */
export function useSignOut() {
  const signOut = useAuthStore(state => state.signOut)
  const queryClient = useQueryClient()

  return () => {
    signOut()
    queryClient.clear()
  }
}
