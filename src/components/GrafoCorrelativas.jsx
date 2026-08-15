import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ZoomIn, ZoomOut, RotateCcw, Network } from 'lucide-react'
import { construirGrafo, layoutGrafo, ANCHO_NODO, ALTO_NODO } from '../lib/grafo'

const CLASE_ESTADO = ['grafo-e0', 'grafo-e1', 'grafo-e2', 'grafo-e3']
const ETIQUETA_ESTADO = ['Bloqueada', 'Cursando', 'Cursada', 'Promocionada']
const COLOR_ESTADO = ['var(--gris)', 'var(--accento)', 'var(--naranja)', 'var(--verde)']

function partirNombre(nombre) {
  if (nombre.length <= 19) return [nombre]
  const palabras = nombre.split(' ')
  const lineas = []
  let actual = ''
  for (const p of palabras) {
    const prueba = (actual ? `${actual} ` : '') + p
    if (prueba.length <= 19) actual = prueba
    else {
      if (actual) lineas.push(actual)
      actual = p
    }
  }
  if (actual) lineas.push(actual)
  return lineas.slice(0, 2)
}

function curva(a, b) {
  if (a.x === b.x) {
    if (a.y < b.y) {
      const x1 = a.x + ANCHO_NODO / 2
      const y1 = a.y + ALTO_NODO
      const x2 = b.x + ANCHO_NODO / 2
      const y2 = b.y
      const mid = (y1 + y2) / 2
      return `M ${x1} ${y1} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}`
    }
    const x1 = a.x + ANCHO_NODO / 2
    const y1 = a.y
    const x2 = b.x + ANCHO_NODO / 2
    const y2 = b.y + ALTO_NODO
    const mid = (y1 + y2) / 2
    return `M ${x1} ${y1} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}`
  }
  if (a.x < b.x) {
    const x1 = a.x + ANCHO_NODO
    const y1 = a.y + ALTO_NODO / 2
    const x2 = b.x
    const y2 = b.y + ALTO_NODO / 2
    const mx = (x1 + x2) / 2
    return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`
  }
  const x1 = a.x
  const y1 = a.y + ALTO_NODO / 2
  const x2 = b.x + ANCHO_NODO
  const y2 = b.y + ALTO_NODO / 2
  const mx = (x1 + x2) / 2
  return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`
}

export default function GrafoCorrelativas({ plan, efectivos, alcanzables, query, onAbrir }) {
  const grafo = useMemo(() => construirGrafo(plan), [plan])
  const layout = useMemo(() => layoutGrafo(plan), [plan])

  const viewportRef = useRef(null)
  const [view, setView] = useState({ x: 0, y: 0, k: 0.5 })
  const punteros = useRef(new Map())
  const gesto = useRef(null)
  const movidoRef = useRef(false)
  const ultimoTap = useRef(null)
  const [hover, setHover] = useState(null)

  const K_MIN = 0.3
  const K_MAX = 3.2

  const matching = useMemo(() => {
    if (!query) return null
    const s = new Set()
    for (const n of grafo.nodos) {
      if (n.materia.nombre.toLowerCase().includes(query)) s.add(n.key)
    }
    return s
  }, [query, grafo])

  const conectados = useMemo(() => {
    const s = new Set()
    if (!hover) return s
    s.add(hover)
    for (const e of grafo.aristas) {
      if (e.from.key === hover) s.add(e.to.key)
      if (e.to.key === hover) s.add(e.from.key)
    }
    return s
  }, [hover, grafo])

  const ajustar = useCallback(() => {
    const el = viewportRef.current
    if (!el) return
    const w = el.clientWidth
    const h = el.clientHeight
    if (!w || !h) return
    const k = Math.min(1, Math.max(K_MIN, (w - 24) / layout.ancho))
    setView({
      k,
      x: Math.max(0, (layout.ancho - w / k) / 2),
      y: Math.max(0, (layout.alto - h / k) / 2),
    })
  }, [layout])

  const aplicarZoom = useCallback((factor, cx, cy) => {
    setView((v) => {
      const k = Math.min(K_MAX, Math.max(K_MIN, v.k * factor))
      if (cx == null) return { ...v, k }
      const xc = v.x + cx / v.k
      const yc = v.y + cy / v.k
      return { k, x: xc - cx / k, y: yc - cy / k }
    })
  }, [])

  useLayoutEffect(() => {
    ajustar()
  }, [ajustar])

  useEffect(() => {
    window.addEventListener('resize', ajustar)
    return () => window.removeEventListener('resize', ajustar)
  }, [ajustar])

  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const onWheel = (e) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      aplicarZoom(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX - rect.left, e.clientY - rect.top)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [aplicarZoom])

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    punteros.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    movidoRef.current = false
    if (punteros.current.size === 1) {
      gesto.current = {
        tipo: 'pan',
        x: e.clientX,
        y: e.clientY,
        vx: view.x,
        vy: view.y,
      }
    } else if (punteros.current.size === 2) {
      gesto.current = null
      const [a, b] = [...punteros.current.values()]
      gesto.current = {
        tipo: 'pinch',
        dist0: Math.hypot(a.x - b.x, a.y - b.y),
        mx0: (a.x + b.x) / 2,
        my0: (a.y + b.y) / 2,
        vx: view.x,
        vy: view.y,
        k0: view.k,
      }
    }
  }

  const onPointerMove = (e) => {
    const punto = punteros.current.get(e.pointerId)
    if (punto) {
      punto.x = e.clientX
      punto.y = e.clientY
    }
    if (!gesto.current) return
    if (gesto.current.tipo === 'pan') {
      const dx = e.clientX - gesto.current.x
      const dy = e.clientY - gesto.current.y
      if (Math.abs(dx) + Math.abs(dy) > 4) movidoRef.current = true
      setView((v) => ({ ...v, x: gesto.current.vx + dx, y: gesto.current.vy + dy }))
    } else if (punteros.current.size === 2) {
      const [a, b] = [...punteros.current.values()]
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      const mx = (a.x + b.x) / 2
      const my = (a.y + b.y) / 2
      const g = gesto.current
      if (dist > 0 && g.dist0 > 0) {
        movidoRef.current = true
        const k = Math.min(K_MAX, Math.max(K_MIN, g.k0 * (dist / g.dist0)))
        const cx = g.vx + g.mx0 / g.k0
        const cy = g.vy + g.my0 / g.k0
        setView({ k, x: cx - mx / k, y: cy - my / k })
      }
    }
  }

  const onPointerEnd = (e) => {
    const eraUltimo = punteros.current.size <= 1
    punteros.current.delete(e.pointerId)
    if (punteros.current.size < 2) {
      const resto = [...punteros.current.values()][0]
      gesto.current = resto
        ? { tipo: 'pan', x: resto.x, y: resto.y, vx: view.x, vy: view.y }
        : null
    }
    if (!eraUltimo || movidoRef.current || punteros.current.size > 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    const t = document.elementFromPoint(e.clientX, e.clientY)?.closest('.grafo-nodo')
    if (t) {
      ultimoTap.current = null
      const nodo = grafo.nodos.find((n) => n.key === t.dataset.key)
      if (nodo) onAbrir(nodo.materia, nodo.key)
      return
    }
    const ahora = Date.now()
    const prev = ultimoTap.current
    if (
      prev &&
      ahora - prev.tiempo < 300 &&
      Math.hypot(e.clientX - prev.x, e.clientY - prev.y) < 40
    ) {
      ultimoTap.current = null
      aplicarZoom(1.7, e.clientX - rect.left, e.clientY - rect.top)
    } else {
      ultimoTap.current = { x: e.clientX, y: e.clientY, tiempo: ahora }
    }
  }

  const worldTransform = `translate(${view.x}, ${view.y}) scale(${view.k})`

  return (
    <section className="grafo">
      <div className="grafo-head">
        <div>
          <h2 className="grafo-titulo">
            <Network size={22} />
            Mapa de correlativas
          </h2>
          <p className="grafo-sub">
            Arrastrá para mover · pellizcá o usá los botones para acercar · tocá una materia para ver sus
            detalles y correlativas.
          </p>
        </div>
        <div className="grafo-acciones">
          <div className="grafo-controles">
            <button className="grafo-boton" onClick={() => aplicarZoom(1.3)} aria-label="Acercar">
              <ZoomIn size={16} />
            </button>
            <button className="grafo-boton" onClick={() => aplicarZoom(1 / 1.3)} aria-label="Alejar">
              <ZoomOut size={16} />
            </button>
            <button className="grafo-boton" onClick={ajustar} aria-label="Centrar y ajustar">
              <RotateCcw size={15} />
            </button>
          </div>
          <div className="grafo-leyenda">
            <span className="leyenda-item">
              <i className="leyenda-linea cursar" /> Para cursar
            </span>
            <span className="leyenda-item">
              <i className="leyenda-linea aprobar" /> Para aprobar
            </span>
            {ETIQUETA_ESTADO.map((e, i) => (
              <span key={e} className="leyenda-item">
                <i className="leyenda-dot" style={{ background: COLOR_ESTADO[i] }} /> {e}
              </span>
            ))}
            <span className="leyenda-item">
              <i className="leyenda-dot electiva" /> Electiva
            </span>
          </div>
        </div>
      </div>

      <div className="grafo-viewport" ref={viewportRef}>
        <svg
          className="grafo-svg"
          viewBox={`0 0 ${layout.ancho} ${layout.alto}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
        >
          <defs>
            <marker id="flecha-cursar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" />
            </marker>
            <marker id="flecha-aprobar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" />
            </marker>
          </defs>

          <g transform={worldTransform}>
            <g>
              {grafo.aristas.map((e, i) => {
                const a = layout.posiciones[e.from.key]
                const b = layout.posiciones[e.to.key]
                if (!a || !b) return null
                const resaltada = hover != null && (e.from.key === hover || e.to.key === hover)
                const dim =
                  matching != null
                    ? !(matching.has(e.from.key) && matching.has(e.to.key))
                    : hover != null && !resaltada
                return (
                  <path
                    key={i}
                    d={curva(a, b)}
                    className={`grafo-arista ${e.tipo}${resaltada ? ' resaltada' : ''}${dim ? ' dim' : ''}`}
                    markerEnd={`url(#flecha-${e.tipo})`}
                  />
                )
              })}
            </g>

            <g>
              {grafo.nodos.map((nodo) => {
                const pos = layout.posiciones[nodo.key]
                if (!pos) return null
                const estado = efectivos[nodo.key] ?? 0
                const alcanzable = alcanzables[nodo.key] ?? 0
                const dim = matching != null ? !matching.has(nodo.key) : hover != null && !conectados.has(nodo.key)
                const lineas = partirNombre(nodo.materia.nombre)
                const etiqueta = nodo.tipo === 'pps' ? 'PPS' : ETIQUETA_ESTADO[estado]
                return (
                  <g
                    key={nodo.key}
                    data-key={nodo.key}
                    className={[
                      'grafo-nodo',
                      CLASE_ESTADO[estado],
                      nodo.tipo === 'electiva' ? 'electiva' : '',
                      nodo.tipo === 'pps' ? 'pps' : '',
                      alcanzable === 0 ? 'bloqueada' : '',
                      hover === nodo.key ? 'hover' : '',
                      dim ? 'dim' : '',
                      matching?.has(nodo.key) ? 'coincidencia' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    onMouseEnter={() => setHover(nodo.key)}
                    onMouseLeave={() => setHover(null)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onAbrir(nodo.materia, nodo.key)
                      }
                    }}
                    aria-label={nodo.materia.nombre}
                  >
                    <rect width={ANCHO_NODO} height={ALTO_NODO} rx={12} />
                    {lineas.map((l, i) => (
                      <text
                        key={i}
                        className="grafo-nodo-nombre"
                        x={ANCHO_NODO / 2}
                        y={lineas.length === 1 ? ALTO_NODO / 2 - 5 : ALTO_NODO / 2 - 10 + i * 17}
                        textAnchor="middle"
                        dominantBaseline="central"
                      >
                        {l}
                      </text>
                    ))}
                    <text
                      className="grafo-nodo-estado"
                      x={ANCHO_NODO / 2}
                      y={ALTO_NODO - 12}
                      textAnchor="middle"
                      dominantBaseline="central"
                    >
                      {etiqueta}
                    </text>
                  </g>
                )
              })}
            </g>
          </g>
        </svg>
      </div>
    </section>
  )
}
