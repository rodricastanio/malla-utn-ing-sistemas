import { claveNucleo, claveElectiva } from './plan'

export const ANCHO_NODO = 150
export const ALTO_NODO = 60
const COL_X = 210
const ROW_Y = 74
const PAD = 30
const GAP_ELECTIVAS = 26
const MAX_FILAS_NIVEL = 8

export function construirGrafo(plan) {
  const nodos = []
  const porId = new Map()
  const porKey = new Map()

  const agregar = (m, tipo) => {
    const key = tipo === 'electiva' ? claveElectiva(m.id) : claveNucleo(m.id)
    const nodo = { key, tipo, materia: m }
    nodos.push(nodo)
    porId.set(m.id, nodo)
    porKey.set(key, nodo)
  }

  plan.materias_nucleo.forEach((m) => agregar(m, 'nucleo'))
  plan.materias_electivas.forEach((m) => agregar(m, 'electiva'))

  const pps = {
    key: 'pps',
    tipo: 'pps',
    materia: {
      id: 'pps',
      nombre: 'Práctica Profesional Supervisada',
      nivel: 5,
      cuatrimestre: null,
      horas_anuales: 0,
      correlativas_cursar: [],
      correlativas_aprobar: [],
    },
  }
  nodos.push(pps)
  porKey.set('pps', pps)

  const aristas = []
  for (const nodo of nodos) {
    const m = nodo.materia
    for (const id of m.correlativas_cursar ?? []) {
      const from = porId.get(id)
      if (from) aristas.push({ from, to: nodo, tipo: 'cursar' })
    }
    for (const id of m.correlativas_aprobar ?? []) {
      const from = porId.get(id)
      if (from) aristas.push({ from, to: nodo, tipo: 'aprobar' })
    }
  }

  return { nodos, aristas, porKey }
}

function ordenColumnas(a, b) {
  const c1 = a.materia.cuatrimestre ?? 99
  const c2 = b.materia.cuatrimestre ?? 99
  if (c1 !== c2) return c1 - c2
  const i1 = typeof a.materia.id === 'number' ? a.materia.id : 0
  const i2 = typeof b.materia.id === 'number' ? b.materia.id : 0
  return i1 - i2
}

export function layoutGrafo(plan) {
  const columnas = {}
  for (let nivel = 1; nivel <= 6; nivel++) columnas[nivel] = { core: [], electivas: [], pps: [] }

  const { nodos } = construirGrafo(plan)
  for (const nodo of nodos) {
    const nivel = nodo.tipo === 'pps' ? 6 : nodo.materia.nivel
    const col = columnas[nivel] ?? (columnas[nivel] = { core: [], electivas: [], pps: [] })
    col[nodo.tipo === 'electiva' ? 'electivas' : nodo.tipo === 'pps' ? 'pps' : 'core'].push(nodo)
  }

  const altoColumna = (col) => {
    const filas =
      col.core.length + (col.electivas.length ? col.electivas.length + 1 : 0) + col.pps.length
    return filas * ROW_Y
  }

  let altoMax = 0
  for (const nivel in columnas) {
    const alto = altoColumna(columnas[nivel])
    if (alto > altoMax) altoMax = alto
  }

  const posiciones = {}
  for (const nivel in columnas) {
    const col = columnas[nivel]
    if (col.core.length + col.electivas.length + col.pps.length === 0) continue
    col.core.sort(ordenColumnas)
    col.electivas.sort(ordenColumnas)
    const alto = altoColumna(col)
    let y = PAD + (altoMax - alto) / 2
    const x = PAD + (Number(nivel) - 1) * COL_X

    const colocar = (n) => {
      posiciones[n.key] = { x, y, nivel: Number(nivel), tipo: n.tipo }
      y += ROW_Y
    }
    col.core.forEach(colocar)
    if (col.electivas.length) {
      y += GAP_ELECTIVAS
      col.electivas.forEach(colocar)
    }
    col.pps.forEach(colocar)
  }

  const filasMax = Math.max(1, Math.min(MAX_FILAS_NIVEL, Math.ceil(altoMax / ROW_Y)))
  const alto = Math.max(PAD * 2 + filasMax * ROW_Y, altoMax + PAD * 2)
  const ancho = PAD + 5 * COL_X + ANCHO_NODO + PAD

  return { posiciones, ancho, alto }
}
