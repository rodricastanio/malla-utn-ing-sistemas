import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const INVITADO_KEY = 'malla-utn-invitado'

function leerInvitado() {
  try {
    return sessionStorage.getItem(INVITADO_KEY) === '1'
  } catch {
    return false
  }
}

function guardarInvitado(valor) {
  try {
    if (valor) sessionStorage.setItem(INVITADO_KEY, '1')
    else sessionStorage.removeItem(INVITADO_KEY)
  } catch {
    /* ignorar */
  }
}

export function useAuth() {
  const [user, setUser] = useState(null)
  const [cargando, setCargando] = useState(() => !!supabase)
  const [esInvitado, setEsInvitado] = useState(leerInvitado)

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

  const entrarComoInvitado = () => {
    setEsInvitado(true)
    guardarInvitado(true)
  }

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
    setEsInvitado(false)
    guardarInvitado(false)
    if (!supabase) return
    await supabase.auth.signOut()
  }

  return { user, cargando, esInvitado, signInGoogle, signInEmail, signUpEmail, signOut, entrarComoInvitado }
}
