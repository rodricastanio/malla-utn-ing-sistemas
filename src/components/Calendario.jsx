import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Plus, Pencil, Trash2, X, Bell } from 'lucide-react'
import { claveNucleo, claveElectiva } from '../lib/plan'

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]
const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

const TIPOS = {
  mesa: { nombre: 'Mesa de examen', color: 'violeta' },
  inscripcion: { nombre: 'Inscripción', color: 'azul' },
  entrega: { nombre: 'Entrega', color: 'naranja' },
  otro: { nombre: 'Otro', color: 'gris' },
}

const COLORES = [
  { id: 'tomate', hex: '#d50000' },
  { id: 'flamenco', hex: '#e67c73' },
  { id: 'mostaza', hex: '#f6bf26' },
  { id: 'mandarina', hex: '#f4511e' },
  { id: 'lima', hex: '#33b679' },
  { id: 'albahaca', hex: '#0b8043' },
  { id: 'aguamarina', hex: '#039be5' },
  { id: 'azul', hex: '#3f51b5' },
  { id: 'lavanda', hex: '#7986cb' },
  { id: 'uva', hex: '#8e24aa' },
  { id: 'gris', hex: '#616161' },
]

const COLOR_MAP = Object.fromEntries(COLORES.map((c) => [c.id, c.hex]))
const COLORES_DEFAULT = { violeta: '#af52de', azul: '#007aff', naranja: '#ff9500', gris: '#8e8e93' }

function hoyISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function diffDias(iso) {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const [y, m, d] = iso.split('-').map(Number)
  const target = new Date(y, m - 1, d)
  return Math.round((target - hoy) / 86400000)
}

function formatear(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${MESES_CORTOS[m - 1]} ${y}`
}

function etiquetaVencimiento(iso) {
  const dias = diffDias(iso)
  if (dias === 0) return 'Hoy'
  if (dias === 1) return 'Mañana'
  if (dias < 0) return `Vencido · ${formatear(iso)}`
  if (dias < 8) return `En ${dias} días`
  return formatear(iso)
}

function nuevoId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function SelectPersonalizado({ valor, opciones, onCambio, ariaLabel }) {
  const [abierto, setAbierto] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!abierto) return
    const cerrar = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setAbierto(false)
    }
    const cerrarEscape = (e) => {
      if (e.key === 'Escape') setAbierto(false)
    }
    document.addEventListener('mousedown', cerrar)
    document.addEventListener('keydown', cerrarEscape)
    return () => {
      document.removeEventListener('mousedown', cerrar)
      document.removeEventListener('keydown', cerrarEscape)
    }
  }, [abierto])

  const actual = opciones.find((o) => o.valor === valor)

  return (
    <span className="cal-select" ref={ref}>
      <button
        type="button"
        className="cal-select-btn"
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-label={ariaLabel}
        onClick={() => setAbierto((v) => !v)}
      >
        <span>{actual?.etiqueta ?? '—'}</span>
        <ChevronDown size={15} />
      </button>
      {abierto && (
        <ul className="cal-select-lista" role="listbox">
          {opciones.map((o) => (
            <li key={o.valor}>
              <button
                type="button"
                role="option"
                aria-selected={o.valor === valor}
                className={o.valor === valor ? 'sel' : ''}
                onClick={() => {
                  onCambio(o.valor)
                  setAbierto(false)
                }}
              >
                {o.etiqueta}
              </button>
            </li>
          ))}
        </ul>
      )}
    </span>
  )
}

function EditorRecordatorio({ record, materias, sinMaterias, onGuardar, onEliminar, onCerrar }) {
  const [titulo, setTitulo] = useState(record?.titulo ?? '')
  const [tipo, setTipo] = useState(record?.tipo ?? 'otro')
  const [color, setColor] = useState(record?.color ?? '')
  const [materiaId, setMateriaId] = useState(record?.materia_id ?? '')
  const [fecha, setFecha] = useState(record?.fecha ?? hoyISO())
  const [descripcion, setDescripcion] = useState(record?.descripcion ?? '')

  useEffect(() => {
    const manejarTecla = (e) => {
      if (e.key === 'Escape') onCerrar()
    }
    window.addEventListener('keydown', manejarTecla)
    return () => window.removeEventListener('keydown', manejarTecla)
  }, [onCerrar])

  const valido = titulo.trim().length > 0 && fecha

  const guardar = () => {
    if (!valido) return
    onGuardar({
      id: record?.id ?? nuevoId(),
      titulo: titulo.trim(),
      tipo,
      color: color || null,
      materia_id: materiaId || null,
      fecha,
      descripcion: descripcion.trim(),
    })
    onCerrar()
  }

  return (
    <div className="overlay" onClick={onCerrar}>
      <div className="modal modal-recordatorio" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className="modal-close" onClick={onCerrar} aria-label="Cerrar">
          <X size={18} />
        </button>

        <h2 className="modal-titulo">{record ? 'Editar recordatorio' : 'Nuevo recordatorio'}</h2>

        <div className="cal-form">
          <label className="cal-form-campo">
            <span>Título</span>
            <input
              type="text"
              value={titulo}
              autoFocus
              placeholder="Ej.: Mesa final de Física I"
              onChange={(e) => setTitulo(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') guardar()
              }}
            />
          </label>

          <div className="cal-form-fila">
            <label className="cal-form-campo">
              <span>Tipo</span>
              <SelectPersonalizado
                valor={tipo}
                opciones={Object.entries(TIPOS).map(([id, t]) => ({ valor: id, etiqueta: t.nombre }))}
                onCambio={setTipo}
                ariaLabel="Tipo de recordatorio"
              />
            </label>

            <label className="cal-form-campo">
              <span>Fecha</span>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </label>
          </div>

          <label className="cal-form-campo">
            <span>Color</span>
            <div className="cal-color-picker">
              {COLORES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`cal-color-swatch${color === c.id ? ' sel' : ''}`}
                  style={{ background: c.hex }}
                  onClick={() => setColor(color === c.id ? '' : c.id)}
                  aria-label={c.id}
                  title={c.id}
                />
              ))}
            </div>
          </label>

          <label className="cal-form-campo">
            <span>Materia (opcional)</span>
            <SelectPersonalizado
              valor={materiaId}
              opciones={[{ valor: '', etiqueta: '— Sin materia —' }, ...materias.map((m) => ({ valor: m.id, etiqueta: m.nombre }))]}
              onCambio={setMateriaId}
              ariaLabel="Materia del recordatorio"
            />
            {sinMaterias && (
              <span className="cal-form-nota">
                No tenés materias en curso. Marcá alguna como “Cursando” en la Malla.
              </span>
            )}
          </label>

          <label className="cal-form-campo">
            <span>Descripción (opcional)</span>
            <textarea
              value={descripcion}
              rows="3"
              placeholder="Ej.: Llevar DNI y la libreta."
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </label>
        </div>

        <div className="modal-acciones">
          {record && (
            <button
              className="btn btn-peligro"
              onClick={() => {
                onEliminar(record.id)
                onCerrar()
              }}
            >
              <Trash2 size={15} /> Eliminar
            </button>
          )}
          <span className="modal-acciones-gap" />
          <button className="btn" onClick={onCerrar}>
            Cancelar
          </button>
          <button className="btn btn-primario" disabled={!valido} onClick={guardar}>
            {record ? 'Guardar cambios' : 'Crear'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Calendario({ plan, efectivos, lista, guardar, eliminar, portalRef }) {
  const hoy = hoyISO()
  const hoyDate = new Date()
  const [mesVista, setMesVista] = useState({ anio: hoyDate.getFullYear(), mes: hoyDate.getMonth() + 1 })
  const [seleccionado, setSeleccionado] = useState(null)
  const [editando, setEditando] = useState(null)

  const materias = useMemo(
    () => [
      ...plan.materias_nucleo.map((m) => ({
        id: String(m.id),
        nombre: m.nombre,
        key: claveNucleo(m.id),
      })),
      ...plan.materias_electivas.map((m) => ({ id: m.id, nombre: m.nombre, key: claveElectiva(m.id) })),
      { id: 'pps', nombre: 'Práctica Profesional Supervisada', key: 'pps' },
    ],
    [plan]
  )

  const materiasCursando = useMemo(
    () => materias.filter((m) => (efectivos[m.key] ?? 0) === 1),
    [materias, efectivos]
  )

  const nombrePorId = useMemo(() => {
    const mapa = new Map(materias.map((m) => [m.id, m.nombre]))
    return mapa
  }, [materias])

  const porFecha = useMemo(() => {
    const mapa = new Map()
    for (const r of lista) {
      if (!mapa.has(r.fecha)) mapa.set(r.fecha, [])
      mapa.get(r.fecha).push(r)
    }
    return mapa
  }, [lista])

  const celdas = useMemo(() => {
    const primero = new Date(mesVista.anio, mesVista.mes - 1, 1)
    const offset = (primero.getDay() + 6) % 7
    const inicio = new Date(mesVista.anio, mesVista.mes - 1, 1 - offset)
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + i)
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      return {
        iso,
        dia: d.getDate(),
        enMes: d.getMonth() === mesVista.mes - 1,
        esHoy: iso === hoy,
      }
    })
  }, [mesVista, hoy])

  const proximos = lista.filter((r) => diffDias(r.fecha) >= 0)
  const vencidos = lista.filter((r) => diffDias(r.fecha) < 0)
  const delDia = seleccionado ? porFecha.get(seleccionado) ?? [] : []

  const opcionesMateria = useMemo(() => {
    if (editando?.materia_id && !materiasCursando.some((m) => m.id === editando.materia_id)) {
      return [
        ...materiasCursando,
        { id: editando.materia_id, nombre: nombrePorId.get(editando.materia_id) ?? 'Materia', key: '' },
      ]
    }
    return materiasCursando
  }, [editando, materiasCursando, nombrePorId])

  const irMes = (delta) =>
    setMesVista(({ anio, mes }) => {
      const t = anio * 12 + (mes - 1) + delta
      return { anio: Math.floor(t / 12), mes: (t % 12) + 1 }
    })

  const tarjetaRef = useRef(null)
  const arrastre = useRef({ activo: false, startX: 0, dx: 0 })
  const irMesRef = useRef(irMes)
  irMesRef.current = irMes

  useEffect(() => {
    const el = tarjetaRef.current
    if (!el) return

    const onStart = (e) => {
      if (e.touches.length !== 1) return
      arrastre.current = {
        activo: true,
        horizontal: false,
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        dx: 0,
      }
      el.style.transition = 'none'
      el.style.transform = 'translateX(0)'
      el.style.willChange = 'transform'
    }

    const onMove = (e) => {
      const a = arrastre.current
      if (!a.activo) return
      const dx = e.touches[0].clientX - a.startX
      const dy = e.touches[0].clientY - a.startY
      if (!a.horizontal) {
        // Gestos verticales = scroll de la página, no los robamos.
        if (Math.abs(dy) > Math.abs(dx) * 1.2 && Math.abs(dy) > 8) {
          a.activo = false
          el.style.willChange = ''
          return
        }
        if (Math.abs(dx) < 8) return
        a.horizontal = true
      }
      const umbral = 90
      const d = Math.abs(dx) > umbral ? Math.sign(dx) * (umbral + (Math.abs(dx) - umbral) * 0.35) : dx
      a.dx = d
      el.style.transform = `translateX(${d}px)`
      e.preventDefault()
    }

    const onEnd = () => {
      const a = arrastre.current
      a.activo = false
      el.style.willChange = ''
      if (!a.horizontal) return
      const dx = a.dx
      const ancho = el.offsetWidth || 320
      el.style.transition = 'transform 180ms cubic-bezier(0.32, 0.72, 0, 1)'
      if (Math.abs(dx) > 60) {
        const dir = Math.sign(dx)
        el.style.transform = `translateX(${dir * ancho}px)`
        setTimeout(() => {
          irMesRef.current(dir > 0 ? -1 : 1)
          el.style.transition = 'none'
          el.style.transform = `translateX(${-dir * ancho}px)`
          requestAnimationFrame(() => {
            el.style.transition = 'transform 180ms cubic-bezier(0.32, 0.72, 0, 1)'
            el.style.transform = 'translateX(0)'
          })
        }, 150)
      } else {
        el.style.transform = 'translateX(0)'
      }
    }

    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd, { passive: true })
    el.addEventListener('touchcancel', onEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
      el.removeEventListener('touchcancel', onEnd)
    }
  }, [])

  const abrirNuevo = () => setEditando({ fecha: seleccionado ?? hoy })

  return (
    <section className="cal">
      <div className="cal-head">
        <div>
          <div className="cal-titulo">
            <CalendarDays size={22} />
            <h2>Calendario</h2>
          </div>
          <p className="cal-sub">
            Recordatorios de mesas, inscripciones y entregas. Tocá un día para ver sus vencimientos.
          </p>
        </div>
        <button className="btn btn-primario" onClick={abrirNuevo}>
          <Plus size={15} /> Nuevo recordatorio
        </button>
      </div>

      <div className="cal-grid">
        <div className="cal-card cal-swipe" ref={tarjetaRef}>
          <div className="cal-mes-head">
            <button className="cal-nav" onClick={() => irMes(-1)} aria-label="Mes anterior">
              <ChevronLeft size={18} />
            </button>
            <div className="cal-mes-titulo">
              <strong>
                {MESES[mesVista.mes - 1]} {mesVista.anio}
              </strong>
              <button className="cal-hoy" onClick={() => setMesVista({ anio: hoyDate.getFullYear(), mes: hoyDate.getMonth() + 1 })}>
                Hoy
              </button>
            </div>
            <button className="cal-nav" onClick={() => irMes(1)} aria-label="Mes siguiente">
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="cal-semana">
            {DIAS.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          <div className="cal-dias">
            {celdas.map((c) => {
              const recs = porFecha.get(c.iso) ?? []
              return (
                <button
                  key={c.iso}
                  className={[
                    'cal-dia',
                    c.enMes ? '' : 'fuera',
                    c.esHoy ? 'hoy' : '',
                    seleccionado === c.iso ? 'seleccionado' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => setSeleccionado(seleccionado === c.iso ? null : c.iso)}
                >
                  <span className="cal-dia-num">{c.dia}</span>
                  {recs.length > 0 && (
                    <span className="cal-puntos">
                      {recs.slice(0, 3).map((r) => {
                        const cHex = COLOR_MAP[r.color] || COLORES_DEFAULT[TIPOS[r.tipo]?.color] || COLORES_DEFAULT.gris
                        return (
                          <span
                            key={r.id}
                            className="cal-punto"
                            style={{ background: cHex }}
                          />
                        )
                      })}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="cal-lateral">
          <div className="cal-card">
            <div className="cal-card-head">
              <Bell size={15} /> Próximos vencimientos
            </div>
            {proximos.length === 0 && vencidos.length === 0 ? (
              <p className="cal-vacio">Todavía no tenés recordatorios. Creá el primero con el botón de arriba.</p>
            ) : proximos.length === 0 ? (
              <p className="cal-vacio">No hay vencimientos próximos. ¡Tranquilidad!</p>
            ) : (
              <ul className="cal-lista">
                {proximos.slice(0, 12).map((r) => (
                  <CalItem
                    key={r.id}
                    record={r}
                    nombrePorId={nombrePorId}
                    onEditar={() => setEditando(r)}
                    onEliminar={() => eliminar(r.id)}
                  />
                ))}
                {proximos.length > 12 && (
                  <li className="cal-mas">
                    +{proximos.length - 12} más adelante
                  </li>
                )}
              </ul>
            )}
          </div>

          {vencidos.length > 0 && (
            <div className="cal-card">
              <div className="cal-card-head vencido">
                <CalendarDays size={15} /> Vencidos
              </div>
              <ul className="cal-lista">
                {vencidos.map((r) => (
                  <CalItem
                    key={r.id}
                    record={r}
                    nombrePorId={nombrePorId}
                    onEditar={() => setEditando(r)}
                    onEliminar={() => eliminar(r.id)}
                  />
                ))}
              </ul>
            </div>
          )}

          {seleccionado && (
            <div className="cal-card">
              <div className="cal-card-head">
                <CalendarDays size={15} /> {formatear(seleccionado)}
                <button className="cal-agregar-dia" onClick={abrirNuevo} aria-label="Agregar recordatorio a este día">
                  <Plus size={14} />
                </button>
              </div>
              {delDia.length === 0 ? (
                <p className="cal-vacio">Sin vencimientos en este día.</p>
              ) : (
                <ul className="cal-lista">
                  {delDia.map((r) => (
                    <CalItem
                      key={r.id}
                      record={r}
                      nombrePorId={nombrePorId}
                      onEditar={() => setEditando(r)}
                      onEliminar={() => eliminar(r.id)}
                    />
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      {editando && portalRef?.current && createPortal(
        <EditorRecordatorio
          record={editando.id ? editando : null}
          materias={opcionesMateria}
          sinMaterias={materiasCursando.length === 0}
          onGuardar={(r) => guardar({ ...editando, ...r })}
          onEliminar={eliminar}
          onCerrar={() => setEditando(null)}
        />,
        portalRef.current
      )}
    </section>
  )
}

function CalItem({ record, nombrePorId, onEditar, onEliminar }) {
  const tipo = TIPOS[record.tipo] ?? TIPOS.otro
  const materia = record.materia_id ? nombrePorId.get(record.materia_id) : null
  const cHex = COLOR_MAP[record.color] || COLORES_DEFAULT[tipo.color] || COLORES_DEFAULT.gris
  return (
    <li className="cal-item">
      <span className="cal-item-borde" style={{ background: cHex }} />
      <div className="cal-item-texto">
        <strong>{record.titulo}</strong>
        <span>
          {tipo.nombre}
          {materia ? ` · ${materia}` : ''}
        </span>
        {record.descripcion && <span className="cal-item-desc">{record.descripcion}</span>}
      </div>
      <div className="cal-item-der">
        <span className={`cal-item-fecha${diffDias(record.fecha) < 0 ? ' vencido' : ''}`}>
          {etiquetaVencimiento(record.fecha)}
        </span>
        <div className="cal-item-acciones">
          <button onClick={onEditar} aria-label="Editar">
            <Pencil size={13} />
          </button>
          <button onClick={onEliminar} aria-label="Eliminar">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </li>
  )
}
