import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronLeft, NotebookPen, Plus, StickyNote, Trash2 } from 'lucide-react'
import { claveElectiva, claveNucleo, horasMateria } from '../lib/plan'

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

const ESTADOS_TAREA = [
  { id: 'pendiente', etiqueta: 'Pendiente' },
  { id: 'curso', etiqueta: 'En curso' },
  { id: 'hecha', etiqueta: 'Completada' },
]

const PPS = {
  id: 'pps',
  nombre: 'Práctica Profesional Supervisada',
  nivel: 5,
  cuatrimestre: null,
  horas_anuales: 0,
  horas_cuatrimestrales: null,
  esPps: true,
}

const etiquetaEstado = (id) => ESTADOS_TAREA.find((e) => e.id === id)?.etiqueta ?? 'Pendiente'

function nuevoId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function formatearRelativo(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const dias = Math.round((hoy - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 86400000)
  if (dias <= 0) return 'Hoy'
  if (dias === 1) return 'Ayer'
  return `${d.getDate()} ${MESES_CORTOS[d.getMonth()]}`
}

const etiquetaPeriodo = (m) => (m.cuatrimestre != null ? `${m.cuatrimestre}º cuatr.` : 'Anual')

function ordenarTareas(tareas) {
  const activas = tareas.filter((t) => t.estado !== 'hecha')
  const hechas = tareas.filter((t) => t.estado === 'hecha')
  return [...activas, ...hechas]
}

function contarEstados(tareas) {
  return {
    pendiente: tareas.filter((t) => t.estado === 'pendiente').length,
    curso: tareas.filter((t) => t.estado === 'curso').length,
    hecha: tareas.filter((t) => t.estado === 'hecha').length,
  }
}

function EstadoPop({ valor, onElegir }) {
  const [pos, setPos] = useState(null)
  const btnRef = useRef(null)
  const wrapRef = useRef(null)

  const cerrar = useCallback(() => setPos(null), [])

  useEffect(() => {
    if (!pos) return undefined
    const fuera = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) cerrar()
    }
    const escape = (e) => {
      if (e.key === 'Escape') cerrar()
    }
    document.addEventListener('mousedown', fuera)
    document.addEventListener('keydown', escape)
    window.addEventListener('resize', cerrar)
    document.addEventListener('scroll', cerrar, true)
    return () => {
      document.removeEventListener('mousedown', fuera)
      document.removeEventListener('keydown', escape)
      window.removeEventListener('resize', cerrar)
      document.removeEventListener('scroll', cerrar, true)
    }
  }, [pos, cerrar])

  const alternar = () => {
    if (pos) {
      cerrar()
      return
    }
    const r = btnRef.current.getBoundingClientRect()
    const ALTO_MENU = 150
    const margen = 10
    const arriba = r.bottom + ALTO_MENU > window.innerHeight - margen && r.top - ALTO_MENU > margen
    const right = Math.max(window.innerWidth - r.right - 2, margen)
    setPos(
      arriba
        ? { arriba: true, right, bottom: window.innerHeight - r.top + 6 }
        : { arriba: false, right, top: r.bottom + 6 }
    )
  }

  const estilo = pos
    ? pos.arriba
      ? { right: pos.right, bottom: pos.bottom }
      : { right: pos.right, top: pos.top }
    : undefined

  return (
    <span className="nt-pop-wrap" ref={wrapRef}>
      <button
        type="button"
        ref={btnRef}
        className={`nt-pill nt-e-${valor}`}
        onClick={alternar}
        aria-haspopup="menu"
        aria-expanded={!!pos}
        aria-label={`Estado: ${etiquetaEstado(valor)}`}
      >
        {etiquetaEstado(valor)}
      </button>
      {pos && (
        <span className="nt-pop" role="menu" style={estilo}>
          {ESTADOS_TAREA.map((e) => (
            <button
              key={e.id}
              type="button"
              role="menuitem"
              className={`nt-opcion${e.id === valor ? ' sel' : ''}`}
              onClick={() => {
                onElegir(e.id)
                cerrar()
              }}
            >
              <span className={`nt-opcion-dot nt-e-${e.id}`} />
              {e.etiqueta}
            </button>
          ))}
        </span>
      )}
    </span>
  )
}

function FilaTarea({ tarea, onToggle, onEstado, onBorrar }) {
  return (
    <li className={`nt-row${tarea.estado === 'hecha' ? ' hecha' : ''}`}>
      <button
        type="button"
        className={`nt-check nt-e-${tarea.estado}`}
        onClick={() => onToggle(tarea)}
        aria-label={tarea.estado === 'hecha' ? 'Marcar como pendiente' : 'Completar tarea'}
      >
        {tarea.estado === 'hecha' && <Check size={13} strokeWidth={3.5} />}
      </button>
      <span className="nt-row-texto">{tarea.texto}</span>
      <EstadoPop valor={tarea.estado} onElegir={(estado) => onEstado(tarea.id, estado)} />
      <button type="button" className="nt-borrar" onClick={() => onBorrar(tarea.id)} aria-label="Eliminar tarea">
        <Trash2 size={13} />
      </button>
    </li>
  )
}

function EditorNota({ materia, nota, onGuardar, onCerrar }) {
  const [texto, setTexto] = useState('')
  const tareas = useMemo(() => ordenarTareas(nota?.tareas ?? []), [nota])
  const conteo = useMemo(() => contarEstados(nota?.tareas ?? []), [nota])
  const total = nota?.tareas?.length ?? 0

  useEffect(() => {
    const manejarTecla = (e) => {
      if (e.key === 'Escape') onCerrar()
    }
    window.addEventListener('keydown', manejarTecla)
    return () => window.removeEventListener('keydown', manejarTecla)
  }, [onCerrar])

  const persistir = (nuevas) =>
    onGuardar({ id: materia.key, tareas: nuevas, actualizada: new Date().toISOString() })

  const agregar = () => {
    const limpio = texto.trim()
    if (!limpio) return
    persistir([...(nota?.tareas ?? []), { id: nuevoId(), texto: limpio, estado: 'pendiente' }])
    setTexto('')
  }

  const cambiarEstado = (id, estado) =>
    persistir((nota?.tareas ?? []).map((t) => (t.id === id ? { ...t, estado } : t)))

  const alternar = (t) => cambiarEstado(t.id, t.estado === 'hecha' ? 'pendiente' : 'hecha')

  const borrar = (id) => persistir((nota?.tareas ?? []).filter((t) => t.id !== id))

  const pct = total > 0 ? (n) => `${Math.max((n / total) * 100, n > 0 ? 8 : 0)}%` : () => '0%'

  return (
    <div className="overlay overlay-oscuro" onClick={onCerrar}>
      <div className="modal modal-nota" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="nt-sheet-head">
          <button type="button" className="nt-back" onClick={onCerrar}>
            <ChevronLeft size={18} />
            Notas
          </button>
          <span className="nt-sheet-fecha">{formatearRelativo(nota?.actualizada)}</span>
        </div>

        <h2 className="nt-sheet-titulo">{materia.m.nombre}</h2>

        <div className="nt-chips">
          <span className={`badge badge-c${materia.m.cuatrimestre ?? 0}`}>{etiquetaPeriodo(materia.m)}</span>
          <span className="badge badge-nivel">Nivel {materia.m.nivel}</span>
          {materia.m.horas_anuales !== 0 && horasMateria(materia.m) && (
            <span className="badge badge-horas">{horasMateria(materia.m)}</span>
          )}
          {total > 0 && (
            <span className="badge badge-cuenta">
              {conteo.hecha} de {total} completadas
            </span>
          )}
        </div>

        {total > 0 && (
          <>
            <div className="nt-progreso" role="img" aria-label={`${conteo.pendiente} pendientes, ${conteo.curso} en curso, ${conteo.hecha} completadas`}>
              <span className="nt-seg nt-e-pendiente" style={{ width: pct(conteo.pendiente) }} />
              <span className="nt-seg nt-e-curso" style={{ width: pct(conteo.curso) }} />
              <span className="nt-seg nt-e-hecha" style={{ width: pct(conteo.hecha) }} />
            </div>
            <div className="nt-leyenda">
              <span>{conteo.pendiente} pendientes</span>
              <span className="dot-curso" /> {conteo.curso} en curso
              <span className="dot-hecha" /> {conteo.hecha} completadas
            </div>
          </>
        )}

        {total === 0 ? (
          <p className="nt-vacio-editor">Sin tareas todavía. Agregá la primera abajo.</p>
        ) : (
          <ul className="nt-lista">
            {tareas.map((t) => (
              <FilaTarea key={t.id} tarea={t} onToggle={alternar} onEstado={cambiarEstado} onBorrar={borrar} />
            ))}
          </ul>
        )}

        <form
          className="nt-add"
          onSubmit={(e) => {
            e.preventDefault()
            agregar()
          }}
        >
          <span className="nt-add-icono">
            <Plus size={16} />
          </span>
          <input
            type="text"
            value={texto}
            placeholder="Agregar una tarea…"
            aria-label="Nueva tarea"
            onChange={(e) => setTexto(e.target.value)}
          />
        </form>
      </div>
    </div>
  )
}

export default function Notas({ plan, efectivos, lista, guardar, irA, portalRef }) {
  const [abiertaKey, setAbiertaKey] = useState(null)

  const cursando = useMemo(() => {
    const todas = [
      ...plan.materias_nucleo.map((m) => ({ m, key: claveNucleo(m.id) })),
      ...plan.materias_electivas.map((m) => ({ m, key: claveElectiva(m.id) })),
      { m: PPS, key: 'pps' },
    ]
    return todas
      .filter(({ key }) => (efectivos[key] ?? 0) === 1)
      .sort((a, b) => a.m.nivel - b.m.nivel || a.m.nombre.localeCompare(b.m.nombre))
  }, [plan, efectivos])

  const porKey = useMemo(() => new Map(lista.map((n) => [n.id, n])), [lista])

  const totales = useMemo(() => {
    let total = 0
    let hechas = 0
    let pendientes = 0
    for (const { key } of cursando) {
      const tareas = porKey.get(key)?.tareas ?? []
      total += tareas.length
      hechas += tareas.filter((t) => t.estado === 'hecha').length
      pendientes += tareas.filter((t) => t.estado !== 'hecha').length
    }
    return { total, hechas, pendientes }
  }, [cursando, porKey])

  const abierta = abiertaKey ? cursando.find((c) => c.key === abiertaKey) : null

  return (
    <section className="nt">
      <div className="nt-head">
        <div>
          <div className="nt-titulo">
            <NotebookPen size={22} />
            <h2>Notas</h2>
          </div>
          <p className="nt-sub">
            Una nota por materia que estás cursando, con tus tasks al día.
            {totales.total > 0 && (
              <>
                {' '}
                Llevás <strong>{totales.hechas}</strong> de <strong>{totales.total}</strong> completadas
                {totales.pendientes > 0 ? ` · ${totales.pendientes} pendientes` : ' · ¡todo listo!'}
              </>
            )}
          </p>
        </div>
      </div>

      {cursando.length === 0 ? (
        <div className="nt-card nt-vacio">
          <span className="nt-vacio-icono">
            <StickyNote size={30} />
          </span>
          <strong>No hay materias cursando</strong>
          <p>Cuando marques materias como “Cursando” en la Malla, aparecen acá como notas con sus tasks.</p>
          <button className="btn btn-primario" onClick={() => irA('malla')}>
            Ir a la malla
          </button>
        </div>
      ) : (
        <div className="nt-grid">
          {cursando.map(({ m, key }) => {
            const nota = porKey.get(key)
            const tareas = ordenarTareas(nota?.tareas ?? [])
            const conteo = contarEstados(nota?.tareas ?? [])
            const visibles = tareas.slice(0, 3)
            const resto = tareas.length - visibles.length
            return (
              <button key={key} type="button" className="nt-card" onClick={() => setAbiertaKey(key)}>
                <span className="nt-card-top">
                  <span className={`nt-card-dot nt-e-${tareas[0]?.estado ?? 'pendiente'}`} />
                  <span className={`badge badge-c${m.cuatrimestre ?? 0}`}>{etiquetaPeriodo(m)}</span>
                  <span className="nt-card-fecha">{formatearRelativo(nota?.actualizada)}</span>
                </span>
                <strong className="nt-card-titulo">{m.nombre}</strong>
                {tareas.length === 0 ? (
                  <span className="nt-prev-vacio">Sin tareas todavía</span>
                ) : (
                  <span className="nt-preview">
                    {visibles.map((t) => (
                      <span key={t.id} className={`nt-prev-item${t.estado === 'hecha' ? ' hecha' : ''}`}>
                        <span className={`nt-mini nt-e-${t.estado}`} />
                        {t.texto}
                      </span>
                    ))}
                    {resto > 0 && <span className="nt-mas">+{resto} más…</span>}
                  </span>
                )}
                <span className="nt-card-foot">
                  {tareas.length === 0 ? (
                    <span className="nt-pill nt-e-pendiente">Sin tareas</span>
                  ) : conteo.pendiente + conteo.curso === 0 ? (
                    <span className="nt-pill nt-e-hecha">Al día</span>
                  ) : (
                    <>
                      {conteo.curso > 0 && <span className="nt-pill nt-e-curso">{conteo.curso} en curso</span>}
                      <span className="nt-pill nt-e-pendiente">{conteo.pendiente + conteo.curso} pendientes</span>
                    </>
                  )}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {abierta && portalRef?.current &&
        createPortal(
          <EditorNota materia={abierta} nota={porKey.get(abierta.key)} onGuardar={guardar} onCerrar={() => setAbiertaKey(null)} />,
          portalRef.current
        )}
    </section>
  )
}
