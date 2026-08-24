import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { alCambiarConexion, marcarPendiente, limpiarPendiente } from '../lib/sync'

const STORAGE_KEY = 'malla-utn-notas-materia-v1'
const SUFIXO_INVITADO = '-invitado'

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

export function useNotasMaterias(user, esInvitado = false) {
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
      const rows = items.map((n) => ({
        id: n.id,
        perfil_id: u.id,
        tareas: n.tareas ?? [],
        updated_at: n.actualizada || new Date().toISOString(),
      }))
      if (rows.length) {
        const { error } = await supabase.from('notas_materia').upsert(rows, { onConflict: 'id' })
        if (error) {
          marcarPendiente()
          return
        }
      }
      const ids = items.map((n) => n.id)
      if (ids.length) {
        const { error } = await supabase
          .from('notas_materia')
          .delete()
          .filter('perfil_id', 'eq', u.id)
          .filter('id', 'not.in', `(${ids.join(',')})`)
        if (error) {
          marcarPendiente()
          return
        }
      } else {
        const { error } = await supabase.from('notas_materia').delete().eq('perfil_id', u.id)
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
        const { data, error } = await supabase.from('notas_materia').select('*')
        if (!activo) return
        if (error) {
          marcarPendiente()
          return
        }
        limpiarPendiente()
        sincronizando.current = true
        const porId = new Map((data ?? []).map((r) => [
          r.id,
          { id: r.id, tareas: r.tareas ?? [], actualizada: r.updated_at },
        ]))
        for (const n of listaRef.current) porId.set(n.id, n)
        setLista([...porId.values()])
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

  const guardar = useCallback((nota) => {
    setLista((prev) => {
      if (!nota.tareas || nota.tareas.length === 0) {
        return prev.filter((n) => n.id !== nota.id)
      }
      const idx = prev.findIndex((n) => n.id === nota.id)
      const copia = idx >= 0 ? [...prev] : [...prev, nota]
      if (idx >= 0) copia[idx] = nota
      return copia
    })
  }, [])

  return { lista, guardar }
}
