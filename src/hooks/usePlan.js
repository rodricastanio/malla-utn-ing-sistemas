import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import plan from '../data/plan.json'
import { calcularEstados } from '../lib/plan'
import { supabase } from '../lib/supabase'
import { alCambiarConexion, marcarPendiente, limpiarPendiente } from '../lib/sync'

const STORAGE_KEY = 'malla-utn-intentos-v2'
const NOTAS_KEY = 'malla-utn-notas-v2'
const THEME_KEY = 'malla-utn-tema'
const ACENTO_KEY = 'malla-utn-accento'
const SUFIXO_INVITADO = '-invitado'

function cargar(key, esInvitado) {
  const store = esInvitado ? sessionStorage : localStorage
  try {
    const raw = store.getItem(esInvitado ? key + SUFIXO_INVITADO : key)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignorar */
  }
  return {}
}

function guardar(key, valor, esInvitado) {
  const store = esInvitado ? sessionStorage : localStorage
  try {
    store.setItem(esInvitado ? key + SUFIXO_INVITADO : key, JSON.stringify(valor))
  } catch {
    /* ignorar */
  }
}

function cargarTema() {
  let tema
  try {
    tema = localStorage.getItem(THEME_KEY)
  } catch {
    /* ignorar */
  }
  if (!tema) {
    if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      tema = 'dark'
    } else {
      tema = 'light'
    }
  }
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = tema
  }
  return tema
}

function cargarAcento() {
  let acento
  try {
    acento = localStorage.getItem(ACENTO_KEY)
  } catch {
    /* ignorar */
  }
  if (!acento) acento = 'azul'
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.accento = acento
  }
  return acento
}

export function usePlan(user, esInvitado = false) {
  const [intentos, setIntentos] = useState(() => cargar(STORAGE_KEY, esInvitado))
  const [notas, setNotas] = useState(() => cargar(NOTAS_KEY, esInvitado))
  const [tema, setTema] = useState(cargarTema)
  const [accento, setAccento] = useState(cargarAcento)
  const [reintento, setReintento] = useState(0)

  const userRef = useRef(user)
  userRef.current = user
  const intentosRef = useRef(intentos)
  intentosRef.current = intentos
  const notasRef = useRef(notas)
  notasRef.current = notas
  const sincronizando = useRef(false)
  const cargadoRef = useRef(false)
  const accentoRef = useRef(accento)
  const temaRef = useRef(tema)
  const esInvitadoRef = useRef(esInvitado)

  const empujar = useCallback(async (nuevosIntentos, nuevasNotas, nuevoAcento, nuevoTema) => {
    const u = userRef.current
    if (!u || !supabase) return
    try {
      const { error } = await supabase
        .from('perfiles')
        .upsert(
          {
            id: u.id,
            intentos: nuevosIntentos ?? {},
            notas: nuevasNotas ?? {},
            accento: nuevoAcento ?? accentoRef.current ?? null,
            tema: nuevoTema ?? temaRef.current ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )
      if (error) {
        marcarPendiente()
        return
      }
      limpiarPendiente()
    } catch {
      marcarPendiente()
    }
  }, [])

  useEffect(() => {
    if (esInvitadoRef.current === esInvitado) return
    esInvitadoRef.current = esInvitado
    setIntentos(cargar(STORAGE_KEY, esInvitado))
    setNotas(cargar(NOTAS_KEY, esInvitado))
  }, [esInvitado])

  useEffect(() => {
    guardar(STORAGE_KEY, intentos, esInvitadoRef.current)
  }, [intentos])

  useEffect(() => {
    guardar(NOTAS_KEY, notas, esInvitadoRef.current)
  }, [notas])

  useEffect(() => {
    document.documentElement.dataset.theme = tema
    temaRef.current = tema
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', tema === 'dark' ? '#000000' : '#f2f2f7')
    try {
      localStorage.setItem(THEME_KEY, tema)
    } catch {
      /* ignorar */
    }
    if (cargadoRef.current && user && supabase) {
      empujar(intentosRef.current, notasRef.current, accentoRef.current, tema)
    }
  }, [tema, user, empujar])

  useEffect(() => {
    document.documentElement.dataset.accento = accento
    try {
      localStorage.setItem(ACENTO_KEY, accento)
    } catch {
      /* ignorar */
    }
    if (cargadoRef.current && user && supabase) {
      empujar(intentosRef.current, notasRef.current, accento)
    }
  }, [accento, user, empujar])

  useEffect(() => {
    if (!user || !supabase) return undefined
    let activo = true
    sincronizando.current = true
    cargadoRef.current = false
    ;(async () => {
      try {
        const { data, error } = await supabase
          .from('perfiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()
        if (!activo) return
        if (error) {
          marcarPendiente()
          return
        }
        limpiarPendiente()
        const localInt = intentosRef.current
        const localNot = notasRef.current
        if (data) {
          const mergeInt = { ...(data.intentos ?? {}), ...localInt }
          const mergeNot = { ...(data.notas ?? {}), ...localNot }
          setIntentos(mergeInt)
          setNotas(mergeNot)
          if (data.accento) {
            accentoRef.current = data.accento
            setAccento(data.accento)
          }
          if (data.tema) {
            temaRef.current = data.tema
            setTema(data.tema)
          }
          empujar(mergeInt, mergeNot, accentoRef.current, temaRef.current)
        } else {
          empujar(localInt, localNot, accentoRef.current)
        }
      } catch {
        marcarPendiente()
      } finally {
        if (activo) {
          sincronizando.current = false
          cargadoRef.current = true
        }
      }
    })()
    return () => {
      activo = false
    }
  }, [user, empujar, reintento])

  useEffect(
    () =>
      alCambiarConexion((conectado) => {
        if (conectado && userRef.current && supabase) setReintento((n) => n + 1)
      }),
    []
  )

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
      if (prev[key] === 3 && siguiente < 3 && notasRef.current[key] != null) {
        setNotas((prevNotas) => {
          if (!(key in prevNotas)) return prevNotas
          const copia = { ...prevNotas }
          delete copia[key]
          return copia
        })
      }
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

  return { plan, efectivos, alcanzables, fijar, setNota, notas, reset, tema, setTema, accento, setAccento }
}
