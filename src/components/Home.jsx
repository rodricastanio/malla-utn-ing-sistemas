import { ArrowRight, BadgeCheck, CalendarDays, Calculator, Clock3, GraduationCap, LayoutGrid, Network, TrendingUp } from 'lucide-react'
import { claveNucleo, claveElectiva } from '../lib/plan'

const SECCIONES = [
  { id: 'malla', icono: LayoutGrid, titulo: 'Malla', desc: 'Marcá tu avance materia por materia; las correlativas se desbloquean solas.' },
  { id: 'mapa', icono: Network, titulo: 'Mapa de correlativas', desc: 'Vista en grafo de las dependencias entre materias.' },
  { id: 'planificador', icono: Calculator, titulo: 'Planificador', desc: 'Proyectá un promedio objetivo y estimá tu fecha de egreso.' },
  { id: 'calendario', icono: CalendarDays, titulo: 'Calendario', desc: 'Recordatorios de mesas de examen e inscripciones.' },
]

const etiquetaPeriodo = (m) => (m.cuatrimestre != null ? `${m.cuatrimestre}º cuatr.` : 'Anual')

export default function Home({ plan, efectivos, alcanzables, notas, onAbrir, irA }) {
  const totalNucleo = plan.materias_nucleo.length
  const promosNucleo = plan.materias_nucleo.filter((m) => efectivos[claveNucleo(m.id)] === 3).length
  const horasPromos = plan.materias_nucleo.reduce((acc, m) => {
    if (efectivos[claveNucleo(m.id)] === 3) acc += m.horas_anuales ?? 0
    return acc
  }, 0)
  const horasTotales = plan.materias_nucleo.reduce((acc, m) => acc + (m.horas_anuales ?? 0), 0)
  const pps = efectivos['pps'] === 3

  const conNota = [...plan.materias_nucleo, ...plan.materias_electivas].filter((m) => {
    const key = typeof m.id === 'string' ? claveElectiva(m.id) : claveNucleo(m.id)
    return efectivos[key] === 3 && notas[key] != null
  })
  const promedio = conNota.length
    ? conNota.reduce((acc, m) => {
        const key = typeof m.id === 'string' ? claveElectiva(m.id) : claveNucleo(m.id)
        return acc + notas[key]
      }, 0) / conNota.length
    : null

  const sugeridos = [...plan.materias_nucleo]
    .map((m) => ({ m, key: claveNucleo(m.id) }))
    .concat(plan.materias_electivas.map((m) => ({ m, key: claveElectiva(m.id) })))
    .filter(({ key }) => (alcanzables[key] ?? 0) > 0 && (efectivos[key] ?? 0) === 0)
    .sort(
      (a, b) =>
        a.m.nivel - b.m.nivel ||
        (b.m.correlativas_aprobar?.length ?? 0) - (a.m.correlativas_aprobar?.length ?? 0) ||
        (b.m.horas_anuales ?? 0) - (a.m.horas_anuales ?? 0)
    )
    .slice(0, 4)

  return (
    <div className="home">
      <section className="hero home-hero">
        <p className="hero-eyebrow">UTN · Ingeniería en Sistemas de Información</p>
        <h1 className="hero-titulo">
          Tu progreso
          <span className="hero-grad">en un vistazo</span>
        </h1>
        <p className="hero-sub">
          Seguí tu avance, desbloqueá correlativas y proyectá tu egreso. Todo sincronizado en tu cuenta.
        </p>
        <div className="hero-stats">
          <div className="stat">
            <BadgeCheck size={18} />
            <span>
              <strong>
                {promosNucleo} / {totalNucleo}
              </strong>{' '}
              materias
            </span>
          </div>
          <div className="stat">
            <Clock3 size={18} />
            <span>
              <strong>{horasPromos}</strong> / {horasTotales} hs anuales
            </span>
          </div>
          <div className="stat">
            <TrendingUp size={18} />
            <span>
              <strong>{promedio != null ? promedio.toFixed(1) : '—'}</strong> promedio
              {conNota.length > 0 && ` (${conNota.length})`}
            </span>
          </div>
          <div className="stat">
            <GraduationCap size={18} />
            <span>
              <strong>{pps ? 'Completa' : 'Pendiente'}</strong> PPS
            </span>
          </div>
        </div>
      </section>

      {sugeridos.length > 0 && (
        <section className="home-seccion">
          <div className="home-seccion-head">
            <h2>Seguí por acá</h2>
            <span>Desbloqueadas y sin empezar</span>
          </div>
          <div className="home-sugeridos">
            {sugeridos.map(({ m, key }) => (
              <button key={key} className="home-sugerido" onClick={() => onAbrir(m, key)}>
                <span className={`badge badge-c${m.cuatrimestre ?? 0}`}>{etiquetaPeriodo(m)}</span>
                <strong>{m.nombre}</strong>
                <span className="home-sugerido-nivel">Nivel {m.nivel}</span>
                <ArrowRight size={15} />
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="home-seccion">
        <div className="home-seccion-head">
          <h2>Secciones</h2>
        </div>
        <div className="home-grid">
          {SECCIONES.map((seccion) => (
            <button key={seccion.id} className="home-card" onClick={() => irA(seccion.id)}>
              <span className="home-card-icono">
                <seccion.icono size={20} />
              </span>
              <span className="home-card-texto">
                <strong>{seccion.titulo}</strong>
                <small>{seccion.desc}</small>
              </span>
              <ArrowRight size={16} className="home-card-flecha" />
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
