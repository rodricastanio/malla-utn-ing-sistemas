import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import plan from '../data/plan.json'
import { calcularEstados } from '../lib/plan'
import { supabase } from '../lib/supabase'

const STORAGE_KEY = 'malla-utn-intentos-v2'
const NOTAS_KEY = 'malla-utn-notas-v2'
const THEME_KEY = 'malla-utn-tema'

function cargar(key) {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignorar */
  }
  return {}
}

function cargarTema() {
  try {
    const guardado = localStorage.getItem(THEME_KEY)
    if (guardado) return guardado
  } catch {
    /* ignorar */
  }
  if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

export function usePlan(user) {
  const [intentos, setIntentos] = useState(() => cargar(STORAGE_KEY))
  const [notas, setNotas] = useState(() => cargar(NOTAS_KEY))
  const [tema, setTema] = useState(cargarTema)

  const userRef = useRef(user)
  userRef.current = user
  const intentosRef = useRef(intentos)
  intentosRef.current = intentos
  const notasRef = useRef(notas)
  notasRef.current = notas
  const sincronizando = useRef(false)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(intentos))
    } catch {
      /* ignorar */
    }
  }, [intentos])

  useEffect(() => {
    try {
      localStorage.setItem(NOTAS_KEY, JSON.stringify(notas))
    } catch {
      /* ignorar */
    }
  }, [notas])

  useEffect(() => {
    document.documentElement.dataset.theme = tema
    try {
      localStorage.setItem(THEME_KEY, tema)
    } catch {
      /* ignorar */
    }
  }, [tema])

  const empujar = useCallback(async (nuevosIntentos, nuevasNotas) => {
    const u = userRef.current
    if (!u || !supabase) return
    await supabase
      .from('perfiles')
      .upsert(
        {
          id: u.id,
          intentos: nuevosIntentos ?? {},
          notas: nuevasNotas ?? {},
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
  }, [])

  useEffect(() => {
    if (!user || !supabase) return undefined
    let activo = true
    sincronizando.current = true
    ;(async () => {
      const { data, error } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()
      if (!activo) return
      sincronizando.current = false
      if (error) return
      const localInt = intentosRef.current
      const localNot = notasRef.current
      if (data) {
        const mergeInt = { ...localInt, ...(data.intentos ?? {}) }
        const mergeNot = { ...localNot, ...(data.notas ?? {}) }
        setIntentos(mergeInt)
        setNotas(mergeNot)
        empujar(mergeInt, mergeNot)
      } else {
        empujar(localInt, localNot)
      }
    })()
    return () => {
      activo = false
    }
  }, [user, empujar])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!sincronizando.current) empujar(intentosRef.current, notasRef.current)
    }, 600)
    return () => clearTimeout(timer)
  }, [intentos, notas, empujar])

  const { efectivos, alcanzables } = useMemo(
    () => calcularEstados(intentos, plan),
    [intentos]
  )

  const fijar = useCallback((key, nivel) => {
    setIntentos((prev) => {
      const siguiente = Math.max(0, Math.min(3, nivel))
      if ((prev[key] ?? 0) === siguiente) return prev
      return { ...prev, [key]: siguiente }
    })
  }, [])

  const setNota = useCallback((key, valor) => {
    setNotas((prev) => {
      const limpio = valor == null || Number.isNaN(valor)
      if (limpio) {
        if (!(key in prev)) return prev
        const copia = { ...prev }
        delete copia[key]
        return copia
      }
      return { ...prev, [key]: valor }
    })
  }, [])

  const reset = useCallback(() => {
    setIntentos({})
    setNotas({})
  }, [])

  return { plan, efectivos, alcanzables, fijar, setNota, notas, reset, tema, setTema }
}
