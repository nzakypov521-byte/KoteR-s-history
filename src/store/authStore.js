import { create } from 'zustand'
import { supabase } from '../lib/supabase'

const useAuthStore = create((set) => ({
  user:    null,
  isGuest: false,
  loading: true,
  error:   null,

  // Вызывается один раз при старте приложения
  init: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    set({ user: session?.user ?? null, loading: false })

    supabase.auth.onAuthStateChange((_e, session) => {
      set({ user: session?.user ?? null })
    })
  },

  signUp: async (email, password) => {
    set({ error: null })
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) { set({ error: error.message }); throw error }
    return data
  },

  signIn: async (email, password) => {
    set({ error: null })
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { set({ error: error.message }); throw error }
    set({ user: data.user, isGuest: false })
    return data
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, isGuest: false })
  },

  continueAsGuest: () => set({ isGuest: true, loading: false }),

  clearError: () => set({ error: null }),
}))

export default useAuthStore