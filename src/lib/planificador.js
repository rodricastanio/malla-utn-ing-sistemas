import { claveNucleo, claveElectiva } from './plan'

export function promedioActual(efectivos, notas, plan) {
  const materias = [...plan.materias_nucleo, ...plan.materias_electivas]
  const conNota = materias.filter((m) => {
    const key = typeof m.id === 'string' ? claveElectiva(m.id) : claveNucleo(m.id)
    return efectivos[key] === 3 && notas[key] != null
  })
  if (conNota.length === 0) return { promedio: null, cantidad: 0, suma: 0 }
  const suma = conNota.reduce((acc, m) => {
    const key = typeof m.id === 'string' ? claveElectiva(m.id) : claveNucleo(m.id)
    return acc + notas[key]
  }, 0)
  return { promedio: suma / conNota.length, cantidad: conNota.length, suma }
}

export function cuatrimestreActual() {
  const ahora = new Date()
  const mes = ahora.getMonth() + 1
  return { anio: ahora.getFullYear(), cuatri: mes >= 8 ? 2 : 1 }
}

function semestreAbsoluto(anio, cuatri) {
  return anio * 2 + (cuatri === 2 ? 1 : 0)
}

export function indicePeriodo(anio, cuatri) {
  const actual = cuatrimestreActual()
  return semestreAbsoluto(anio, cuatri) - semestreAbsoluto(actual.anio, actual.cuatri)
}

export function fechaPeriodo(indice) {
  const actual = cuatrimestreActual()
  const sem = semestreAbsoluto(actual.anio, actual.cuatri) + indice
  return { anio: Math.floor(sem / 2), cuatri: sem % 2 === 0 ? 1 : 2 }
}

export function etiquetaPeriodo(indice) {
  const { anio, cuatri } = fechaPeriodo(indice)
  return `${anio} · ${cuatri}º cuatr.`
}

export function cuatrimestresHasta(mes, anio) {
  const cuatri = mes >= 8 ? 2 : 1
  return Math.max(0, indicePeriodo(anio, cuatri) + 1)
}

export function pendientes(efectivos, plan) {
  const nucleo = plan.materias_nucleo
    .filter((m) => (efectivos[claveNucleo(m.id)] ?? 0) < 3)
    .map((m) => ({ tipo: 'nucleo', key: claveNucleo(m.id), materia: m }))

  const faltantes = {}
  for (const req of plan.electivas_requeridas_por_nivel) {
    const logradas = plan.materias_electivas.reduce((acc, m) => {
      if (m.nivel === req.nivel && (efectivos[claveElectiva(m.id)] ?? 0) === 3) {
        acc += m.horas_anuales ?? 0
      }
      return acc
    }, 0)
    faltantes[req.nivel] = Math.max(0, req.horas_anuales - logradas)
  }

  const electivas = plan.materias_electivas
    .filter((m) => (efectivos[claveElectiva(m.id)] ?? 0) < 3)
    .map((m) => ({ tipo: 'electiva', key: claveElectiva(m.id), materia: m }))

  const pps = (efectivos['pps'] ?? 0) < 3

  return { nucleo, electivas, faltantes, pps }
}

export function calcularPromedioObjetivo({
  promedio,
  cantidad,
  suma,
  objetivo,
  notaEsperada,
  porCuatrimestre,
  mes,
  anio,
}) {
  if (promedio == null || cantidad === 0) {
    return { porNota: null, porFecha: null, sinNotas: true }
  }

  const k = cantidad
  const T = objetivo

  let porNota
  if (promedio >= T) {
    porNota = { n: 0, cuatrimestres: 0, periodo: null, yaAlcanzado: true }
  } else if (notaEsperada > T) {
    const n = Math.max(0, Math.ceil((k * (T - promedio)) / (notaEsperada - T)))
    const cuatrimestres = Math.ceil(n / Math.max(1, porCuatrimestre))
    porNota = {
      n,
      cuatrimestres,
      periodo: cuatrimestres ? fechaPeriodo(cuatrimestres - 1) : null,
      yaAlcanzado: n === 0,
    }
  } else {
    porNota = { imposibleNota: true }
  }

  let porFecha = null
  if (mes != null && anio != null) {
    const c = cuatrimestresHasta(mes, anio)
    const nMax = c * porCuatrimestre
    if (nMax === 0) {
      porFecha = { cuatrimestres: c, nMax: 0, sinTiempo: true }
    } else {
      const gMin = (T * (k + nMax) - suma) / nMax
      porFecha = {
        cuatrimestres: c,
        nMax,
        notaMinima: gMin,
        alcanzable: gMin <= 10.000001,
      }
    }
  }

  return { porNota, porFecha, sinNotas: false }
}

export function programarGraduacion({ plan, efectivos, maxPorCuatrimestre }) {
  const cap = Math.max(1, maxPorCuatrimestre || 1)
  const { nucleo, electivas, faltantes, pps } = pendientes(efectivos, plan)

  const resueltas = new Set()
  for (const m of plan.materias_nucleo) {
    if ((efectivos[claveNucleo(m.id)] ?? 0) >= 2) resueltas.add(claveNucleo(m.id))
  }
  for (const m of plan.materias_electivas) {
    if ((efectivos[claveElectiva(m.id)] ?? 0) >= 2) resueltas.add(claveElectiva(m.id))
  }

  const pool = [
    ...nucleo.map((x) => ({ ...x, slot: x.materia.cuatrimestre })),
    ...electivas.map((x) => ({ ...x, slot: x.materia.cuatrimestre })),
  ]

  const faltan = { ...faltantes }
  const planeadas = new Set()
  const grupos = []

  const puedeCursar = (x) =>
    (x.materia.correlativas_cursar ?? []).every((id) => resueltas.has(claveNucleo(id)))

  for (let t = 0; planeadas.size < pool.length && t < 400; t++) {
    const { anio, cuatri } = fechaPeriodo(t)
    const candidatos = pool.filter(
      (x) =>
        !planeadas.has(x.key) &&
        puedeCursar(x) &&
        (x.slot == null || x.slot === cuatri) &&
        (x.tipo !== 'electiva' || faltan[x.materia.nivel] > 0)
    )

    candidatos.sort((a, b) => {
      if (a.materia.nivel !== b.materia.nivel) return a.materia.nivel - b.materia.nivel
      return (a.materia.correlativas_aprobar ?? []).length - (b.materia.correlativas_aprobar ?? []).length
    })

    const grupo = { periodo: t, anio, cuatri, materias: [] }
    for (const x of candidatos) {
      if (grupo.materias.length >= cap) break
      planeadas.add(x.key)
      grupo.materias.push(x)
      if (x.tipo === 'electiva') faltan[x.materia.nivel] -= x.materia.horas_anuales ?? 0
    }
    if (grupo.materias.length) grupos.push(grupo)
    for (const x of grupo.materias) resueltas.add(x.key)
  }

  if (pps) {
    const ultimo = grupos.length ? grupos[grupos.length - 1].periodo : 0
    grupos.push({
      periodo: ultimo + 1,
      ...fechaPeriodo(ultimo + 1),
      materias: [{ tipo: 'pps', key: 'pps', materia: null }],
    })
  }

  return { grupos, totalPeriodos: grupos.length ? grupos[grupos.length - 1].periodo + 1 : 0 }
}

export function contarPlan(grupos) {
  const cuenta = { nucleo: 0, electiva: 0, pps: 0 }
  for (const g of grupos) {
    for (const m of g.materias) cuenta[m.tipo] = (cuenta[m.tipo] ?? 0) + 1
  }
  return { ...cuenta, total: cuenta.nucleo + cuenta.electiva + cuenta.pps }
}
