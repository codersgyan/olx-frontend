'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  /** The raw JWT from POST /signin, or null when signed out. */
  token: string | null
  /**
   * Whether `persist` has finished reading localStorage.
   *
   * This matters more than it looks: the first render happens before rehydration,
   * so without this flag every logged-in user sees a flash of "Sign in" in the
   * navbar on each page load. Consumers must treat `!hasHydrated` as "unknown",
   * not as "signed out".
   */
  hasHydrated: boolean
  setToken: (token: string) => void
  signOut: () => void
  setHasHydrated: (value: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      token: null,
      hasHydrated: false,
      setToken: token => set({ token }),
      signOut: () => set({ token: null }),
      setHasHydrated: value => set({ hasHydrated: value }),
    }),
    {
      name: 'coders-shop-auth',
      // Only the token is persisted. hasHydrated describes *this* page load and
      // would be nonsense to restore — it would read `true` before rehydration
      // had actually happened.
      partialize: state => ({ token: state.token }),
      onRehydrateStorage: () => state => state?.setHasHydrated(true),
    },
  ),
)
