import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [cargando, setCargando] = useState(() => !!supabase)

  useEffect(() => {
    if (!supabase) {
      setCargando(false)
      return undefined
    }

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setCargando(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_evento, session) => {
      setUser(session?.user ?? null)
      setCargando(false)
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  const signInGoogle = async () => {
    if (!supabase) return new Error('Supabase no está configurado')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    return error
  }

  const signInEmail = async (email, password) => {
    if (!supabase) return new Error('Supabase no está configurado')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error
  }

  const signUpEmail = async (email, password) => {
    if (!supabase) return new Error('Supabase no está configurado')
    const { error } = await supabase.auth.signUp({ email, password })
    return error
  }

  const signOut = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  }

  return { user, cargando, signInGoogle, signInEmail, signUpEmail, signOut }
}
