import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Check, ChevronLeft, GripVertical, NotebookPen, Plus, StickyNote, Trash2 } from 'lucide-react'
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

// Siempre persistimos el arreglo agrupado: pendientes → en curso → completadas.
function normalizar(tareas) {
  const grupos = { pendiente: [], curso: [], hecha: [] }
  for (const t of tareas) {
    if (t.estado === 'curso') grupos.curso.push(t)
    else if (t.estado === 'hecha') grupos.hecha.push(t)
    else grupos.pendiente.push(t)
  }
  return [...grupos.pendiente, ...grupos.curso, ...grupos.hecha]
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

function TareaSortable({ tarea, onToggle, onEstado, onBorrar, onRenombrar }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: tarea.id,
  })
  const [editando, setEditando] = useState(false)
  const [texto, setTexto] = useState(tarea.texto)
  const inputRef = useRef(null)

  useEffect(() => {
    if (editando) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editando])

  const cancelar = () => {
    setTexto(tarea.texto)
    setEditando(false)
  }

  const confirmar = () => {
    const limpio = texto.trim()
    if (limpio && limpio !== tarea.texto) onRenombrar(tarea.id, limpio)
    else setTexto(tarea.texto)
    setEditando(false)
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`nt-row${tarea.estado === 'hecha' ? ' hecha' : ''}${isDragging ? ' arrastrando' : ''}`}
    >
      <button
        type="button"
        className="nt-grip"
        {...attributes}
        {...listeners}
        aria-label="Reordenar tarea"
        title="Arrastrar para reordenar"
      >
        <GripVertical size={13} />
      </button>
      <button
        type="button"
        className={`nt-check nt-e-${tarea.estado}`}
        onClick={() => onToggle(tarea)}
        aria-label={tarea.estado === 'hecha' ? 'Marcar como pendiente' : 'Completar tarea'}
      >
        {tarea.estado === 'hecha' && <Check size={13} strokeWidth={3.5} />}
      </button>
      {editando ? (
        <input
          ref={inputRef}
          className="nt-row-input"
          value={texto}
          aria-label="Editar tarea"
          onChange={(e) => setTexto(e.target.value)}
          onBlur={confirmar}
          onKeyDown={(e) => {
            if (e.key === 'Enter') confirmar()
            if (e.key === 'Escape') cancelar()
          }}
        />
      ) : (
        <span className="nt-row-texto" onClick={() => setEditando(true)} title="Clic para editar">
          {tarea.texto}
        </span>
      )}
      <EstadoPop valor={tarea.estado} onElegir={(estado) => onEstado(tarea.id, estado)} />
      <button type="button" className="nt-borrar" onClick={() => onBorrar(tarea.id)} aria-label="Eliminar tarea">
        <Trash2 size={13} />
      </button>
    </li>
  )
}

function ListaSeccion({ titulo, tareas, onReordenar, onToggle, onEstado, onBorrar, onRenombrar }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )
  const ids = useMemo(() => tareas.map((t) => t.id), [tareas])

  const onDragEnd = (e) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const viejo = ids.indexOf(active.id)
    const nuevo = ids.indexOf(over.id)
    if (viejo < 0 || nuevo < 0) return
    onReordenar(arrayMove(tareas, viejo, nuevo).map((t) => t.id))
  }

  return (
    <section className="nt-seccion">
      <div className="nt-seccion-head">
        <span>{titulo}</span>
        <span className="nt-sec-cuenta">{tareas.length}</span>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <ul className="nt-lista">
            {tareas.map((t) => (
              <TareaSortable
                key={t.id}
                tarea={t}
                onToggle={onToggle}
                onEstado={onEstado}
                onBorrar={onBorrar}
                onRenombrar={onRenombrar}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </section>
  )
}

function EditorNota({ materia, nota, onGuardar, onCerrar, enSheet }) {
  const [texto, setTexto] = useState('')
  const tareas = nota?.tareas ?? []
  const pendientes = tareas.filter((t) => t.estado === 'pendiente')
  const cursos = tareas.filter((t) => t.estado === 'curso')
  const hechas = tareas.filter((t) => t.estado === 'hecha')
  const conteo = { pendiente: pendientes.length, curso: cursos.length, hecha: hechas.length }
  const total = tareas.length

  useEffect(() => {
    if (!enSheet) return undefined
    const scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      window.scrollTo(0, scrollY)
    }
  }, [enSheet])

  useEffect(() => {
    if (!enSheet) return undefined
    const manejarTecla = (e) => {
      if (e.key === 'Escape') onCerrar()
    }
    window.addEventListener('keydown', manejarTecla)
    return () => window.removeEventListener('keydown', manejarTecla)
  }, [enSheet, onCerrar])

  const persistir = (nuevas) =>
    onGuardar({ id: materia.key, tareas: normalizar(nuevas), actualizada: new Date().toISOString() })

  const agregar = () => {
    const limpio = texto.trim()
    if (!limpio) return
    persistir([...tareas, { id: nuevoId(), texto: limpio, estado: 'pendiente' }])
    setTexto('')
  }

  const cambiarEstado = (id, estado) =>
    persistir(tareas.map((t) => (t.id === id ? { ...t, estado } : t)))

  const alternar = (t) => cambiarEstado(t.id, t.estado === 'hecha' ? 'pendiente' : 'hecha')

  const borrar = (id) => persistir(tareas.filter((t) => t.id !== id))

  const renombrar = (id, nuevoTexto) =>
    persistir(tareas.map((t) => (t.id === id ? { ...t, texto: nuevoTexto } : t)))

  const reordenar = (estado, nuevaIds) => {
    const grupos = { pendiente: [], curso: [], hecha: [] }
    for (const t of tareas) {
      if (t.estado === 'curso') grupos.curso.push(t)
      else if (t.estado === 'hecha') grupos.hecha.push(t)
      else grupos.pendiente.push(t)
    }
    grupos[estado] = nuevaIds.map((id) => tareas.find((t) => t.id === id)).filter(Boolean)
    persistir([...grupos.pendiente, ...grupos.curso, ...grupos.hecha])
  }

  const pct = total > 0 ? (n) => `${Math.max((n / total) * 100, n > 0 ? 8 : 0)}%` : () => '0%'

  const contenido = (
    <>
      <div className="nt-sheet-head">
        <button type="button" className="nt-back" onClick={onCerrar}>
          <ChevronLeft size={18} />
          {enSheet ? 'Notas' : 'Volver'}
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
        {total > 0 && <span className="badge badge-cuenta">{conteo.hecha} de {total} completadas</span>}
      </div>

      {total > 0 && (
        <>
          <div
            className="nt-progreso"
            role="img"
            aria-label={`${conteo.pendiente} pendientes, ${conteo.curso} en curso, ${conteo.hecha} completadas`}
          >
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

      {total === 0 ? (
        <p className="nt-vacio-editor">Sin tareas todavía. Agregá la primera arriba.</p>
      ) : (
        <div className="nt-secciones">
          {pendientes.length > 0 && (
            <ListaSeccion
              titulo="Pendientes"
              tareas={pendientes}
              onReordenar={(ids) => reordenar('pendiente', ids)}
              onToggle={alternar}
              onEstado={cambiarEstado}
              onBorrar={borrar}
              onRenombrar={renombrar}
            />
          )}
          {cursos.length > 0 && (
            <ListaSeccion
              titulo="En curso"
              tareas={cursos}
              onReordenar={(ids) => reordenar('curso', ids)}
              onToggle={alternar}
              onEstado={cambiarEstado}
              onBorrar={borrar}
              onRenombrar={renombrar}
            />
          )}
          {hechas.length > 0 && (
            <ListaSeccion
              titulo="Completadas"
              tareas={hechas}
              onReordenar={(ids) => reordenar('hecha', ids)}
              onToggle={alternar}
              onEstado={cambiarEstado}
              onBorrar={borrar}
              onRenombrar={renombrar}
            />
          )}
        </div>
      )}
    </>
  )

  if (enSheet) {
    return (
      <div className="overlay nt-sheet-overlay" onClick={onCerrar}>
        <div className="nt-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
          <div className="nt-sheet-grip" />
          {contenido}
        </div>
      </div>
    )
  }

  return (
    <div className="nt-editor" role="dialog" aria-modal="false">
      {contenido}
    </div>
  )
}

export default function Notas({ plan, efectivos, lista, guardar, irA, portalRef }) {
  const [esCompacto, setEsCompacto] = useState(() => window.innerWidth < 900)
  const [seleccionKey, setSeleccionKey] = useState(null)
  const [abiertaKey, setAbiertaKey] = useState(null)

  useEffect(() => {
    const onResize = () => setEsCompacto(window.innerWidth < 900)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

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

  useEffect(() => {
    if (!esCompacto && seleccionKey == null && cursando.length > 0) {
      setSeleccionKey(cursando[0].key)
    }
  }, [esCompacto, seleccionKey, cursando])

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

  const seleccion = seleccionKey ? cursando.find((c) => c.key === seleccionKey) : null
  const abierta = abiertaKey ? cursando.find((c) => c.key === abiertaKey) : null

  const abrir = (key) => {
    if (esCompacto) setAbiertaKey(key)
    else setSeleccionKey(key)
  }

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
        <div className="nt-vacio">
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
        <div className="nt-workbench">
          <aside className="nt-sujetos" aria-label="Materias cursando">
            <div className="nt-sujetos-head">
              <span>Materias cursando</span>
              <span className="nt-sujetos-cuenta">{cursando.length}</span>
            </div>
            <ul className="nt-sujetos-lista">
              {cursando.map(({ m, key }) => {
                const nota = porKey.get(key)
                const tareas = nota?.tareas ?? []
                const hechas = tareas.filter((t) => t.estado === 'hecha').length
                const activas = tareas.length - hechas
                const seleccionada = key === seleccionKey || key === abiertaKey
                const pctSujeto = tareas.length > 0 ? Math.round((hechas / tareas.length) * 100) : 0
                const dotEstado =
                  (tareas.find((t) => t.estado !== 'hecha') ?? tareas[0])?.estado ?? 'pendiente'
                return (
                  <li key={key}>
                    <button
                      type="button"
                      className={`nt-sujeto${seleccionada ? ' sel' : ''}`}
                      onClick={() => abrir(key)}
                      aria-current={seleccionada ? 'true' : undefined}
                    >
                      <span className={`nt-sujeto-dot nt-e-${dotEstado}`} />
                      <span className="nt-sujeto-nombre">{m.nombre}</span>
                      {activas > 0 && <span className="nt-sujeto-cuenta">{activas}</span>}
                      <span className="nt-sujeto-bar">
                        <span style={{ width: `${pctSujeto}%` }} />
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </aside>

          <div className="nt-panel">
            {seleccion ? (
              <EditorNota
                materia={seleccion}
                nota={porKey.get(seleccion.key)}
                onGuardar={guardar}
                onCerrar={() => setSeleccionKey(null)}
                enSheet={false}
              />
            ) : (
              <div className="nt-vacio nt-vacio-panel">
                <span className="nt-vacio-icono">
                  <StickyNote size={30} />
                </span>
                <strong>Elegí una materia</strong>
                <p>Seleccioná una materia de la lista para editar sus tareas.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {abierta &&
        portalRef?.current &&
        createPortal(
          <EditorNota
            materia={abierta}
            nota={porKey.get(abierta.key)}
            onGuardar={guardar}
            onCerrar={() => setAbiertaKey(null)}
            enSheet
          />,
          portalRef.current
        )}
    </section>
  )
}