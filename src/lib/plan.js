export const ESTADOS = [
  { nivel: 0, etiqueta: 'Bloqueada', corta: 'Bloq.' },
  { nivel: 1, etiqueta: 'Cursando', corta: 'Cursando' },
  { nivel: 2, etiqueta: 'Cursada', corta: 'Cursada' },
  { nivel: 3, etiqueta: 'Promocionada', corta: 'Promocionada' },
]

export const claveNucleo = (id) => `n-${id}`
export const claveElectiva = (id) => `e-${id}`

function resolver(efectivos, ids) {
  return (ids ?? []).map((id) => efectivos[claveNucleo(id)] ?? 0)
}

function alcanzarNivel(efectivos, m) {
  let r = 0
  const cursar = resolver(efectivos, m.correlativas_cursar)
  const aprobar = resolver(efectivos, m.correlativas_aprobar)

  if (cursar.length === 0 || cursar.every((s) => s >= 3)) r = 1
  if (r === 1) {
    r = 2
    if (aprobar.length === 0 || aprobar.every((s) => s >= 3)) r = 3
  }
  return r
}

export function calcularEstados(intentos, plan) {
  const materias = [
    ...plan.materias_nucleo.map((m) => ({ key: claveNucleo(m.id), m })),
    ...plan.materias_electivas.map((m) => ({ key: claveElectiva(m.id), m })),
    {
      key: 'pps',
      m: {
        id: 'pps',
        nombre: 'Práctica Profesional Supervisada',
        nivel: 5,
        horas_anuales: 0,
        horas_cuatrimestrales: null,
        cuatrimestre: null,
        integradora: false,
        correlativas_cursar: [],
        correlativas_aprobar: [],
        esPps: true,
      },
    },
  ]

  const efectivos = {}
  const alcanzables = {}

  let cambio = true
  while (cambio) {
    cambio = false
    for (const { key, m } of materias) {
      const alc = alcanzarNivel(efectivos, m)
      const ef = Math.min(intentos[key] ?? 0, alc)
      if ((efectivos[key] ?? 0) !== ef || (alcanzables[key] ?? 0) !== alc) {
        cambio = true
      }
      efectivos[key] = ef
      alcanzables[key] = alc
    }
  }

  return { efectivos, alcanzables }
}

export function horasMateria(m) {
  if (m.cuatrimestre != null && m.horas_cuatrimestrales != null) {
    return `${m.horas_cuatrimestrales} hs`
  }
  return m.horas_anuales != null ? `${m.horas_anuales} hs` : ''
}

export const NIVELES = [
  { numero: 1, nombre: 'Primer nivel' },
  { numero: 2, nombre: 'Segundo nivel' },
  { numero: 3, nombre: 'Tercer nivel' },
  { numero: 4, nombre: 'Cuarto nivel' },
  { numero: 5, nombre: 'Quinto nivel' },
]

export const ORDEN_NIVELES = {
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
}
