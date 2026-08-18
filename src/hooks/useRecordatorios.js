import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { alCambiarConexion, marcarPendiente, limpiarPendiente } from '../lib/sync'

const STORAGE_KEY = 'malla-utn-recordatorios-v2'
const SUFIXO_INVITADO = '-invitado'

function ordenar(lista) {
  return [...lista].sort((a, b) => {
    if (a.fecha !== b.fecha) return a.fecha < b.fecha ? -1 : 1
    return (a.titulo || '').localeCompare(b.titulo || '')
  })
}

function cargar(esInvitado) {
  const store = esInvitado ? sessionStorage : localStorage
  try {
    const raw = store.getItem(esInvitado ? STORAGE_KEY + SUFIXO_INVITADO : STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignorar */
  }
  return []
}

export function useRecordatorios(user, esInvitado = false) {
  const [lista, setLista] = useState(() => cargar(esInvitado))
  const [reintento, setReintento] = useState(0)

  const userRef = useRef(user)
  userRef.current = user
  const esInvitadoRef = useRef(esInvitado)
  const listaRef = useRef(lista)
  listaRef.current = lista
  const sincronizando = useRef(false)

  useEffect(() => {
    if (esInvitadoRef.current === esInvitado) return
    esInvitadoRef.current = esInvitado
    setLista(cargar(esInvitado))
  }, [esInvitado])

  useEffect(() => {
    const store = esInvitadoRef.current ? sessionStorage : localStorage
    try {
      store.setItem(
        esInvitadoRef.current ? STORAGE_KEY + SUFIXO_INVITADO : STORAGE_KEY,
        JSON.stringify(lista)
      )
    } catch {
      /* ignorar */
    }
  }, [lista])

  const empujar = useCallback(async (items) => {
    const u = userRef.current
    if (!u || !supabase) return
    try {
      const rows = items.map((r) => ({
        id: r.id,
        perfil_id: u.id,
        titulo: r.titulo,
        materia_id: r.materia_id || null,
        tipo: r.tipo || 'otro',
        color: r.color || null,
        fecha: r.fecha,
        descripcion: r.descripcion || '',
      }))
      if (rows.length) {
        const { error } = await supabase.from('recordatorios').upsert(rows, { onConflict: 'id' })
        if (error) {
          marcarPendiente()
          return
        }
      }
      const ids = rows.map((r) => r.id)
      if (ids.length) {
        const { error } = await supabase
          .from('recordatorios')
          .delete()
          .filter('id', 'not.in', `(${ids.join(',')})`)
        if (error) {
          marcarPendiente()
          return
        }
      } else {
        const { error } = await supabase.from('recordatorios').delete().eq('perfil_id', u.id)
        if (error) {
          marcarPendiente()
          return
        }
      }
      limpiarPendiente()
    } catch {
      marcarPendiente()
    }
  }, [])

  useEffect(() => {
    if (!user || !supabase) return undefined
    let activo = true
    ;(async () => {
      try {
        const { data, error } = await supabase.from('recordatorios').select('*')
        if (!activo) return
        if (error) {
          marcarPendiente()
          return
        }
        limpiarPendiente()
        sincronizando.current = true
        const porId = new Map((data ?? []).map((r) => [r.id, r]))
        listaRef.current.forEach((r) => porId.set(r.id, r))
        setLista(ordenar([...porId.values()]))
      } catch {
        marcarPendiente()
      } finally {
        if (activo) sincronizando.current = false
      }
    })()
    return () => {
      activo = false
    }
  }, [user, reintento])

  useEffect(
    () =>
      alCambiarConexion((conectado) => {
        if (conectado && userRef.current && supabase) setReintento((n) => n + 1)
      }),
    []
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!sincronizando.current) empujar(listaRef.current)
    }, 600)
    return () => clearTimeout(timer)
  }, [lista, empujar])

  const guardar = useCallback((record) => {
    setLista((prev) => {
      const idx = prev.findIndex((r) => r.id === record.id)
      const copia = idx >= 0 ? [...prev] : [...prev, record]
      if (idx >= 0) copia[idx] = record
      return ordenar(copia)
    })
  }, [])

  const eliminar = useCallback((id) => {
    setLista((prev) => prev.filter((r) => r.id !== id))
  }, [])

  return { lista, guardar, eliminar }
}
