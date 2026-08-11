import { useCallback, useEffect, useMemo, useState } from 'react'
import plan from '../data/plan.json'
import { calcularEstados } from '../lib/plan'

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

export function usePlan() {
  const [intentos, setIntentos] = useState(() => cargar(STORAGE_KEY))
  const [notas, setNotas] = useState(() => cargar(NOTAS_KEY))
  const [tema, setTema] = useState(cargarTema)

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
