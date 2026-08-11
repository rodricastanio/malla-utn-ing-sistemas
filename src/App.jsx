import { useMemo, useState } from 'react'
import { GraduationCap, BadgeCheck, Clock3, TrendingUp } from 'lucide-react'
import { usePlan } from './hooks/usePlan'
import Header from './components/Header'
import NivelSection from './components/NivelSection'
import ProgressBar from './components/ProgressBar'
import MateriaModal from './components/MateriaModal'
import MateriaCard from './components/MateriaCard'
import { NIVELES, claveNucleo, claveElectiva } from './lib/plan'
import './index.css'

const HORAS_REQUERIDAS = { 3: 4, 4: 6, 5: 10 }

const PPS_MATERIA = {
  id: 'pps',
  nombre: 'Práctica Profesional Supervisada',
  nivel: 5,
  cuatrimestre: null,
  horas_anuales: 0,
  horas_cuatrimestrales: null,
  correlativas_cursar: [],
  correlativas_aprobar: [],
  integradora: false,
  esPps: true,
}

export default function App() {
  const { plan, efectivos, alcanzables, fijar, setNota, notas, reset, tema, setTema } = usePlan()
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState(null)

  const nombrePorId = useMemo(() => {
    const mapa = new Map()
    plan.materias_nucleo.forEach((m) => mapa.set(m.id, m.nombre))
    return mapa
  }, [plan])

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

  const confirmarReset = () => {
    if (window.confirm('¿Reiniciar todo el progreso y las notas?')) reset()
  }

  const abrirModal = (materia, keyBase) => setModal({ materia, keyBase })

  const resumen = (
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
  )

  return (
    <div className="app">
      <Header query={query} setQuery={setQuery} tema={tema} setTema={setTema} onReset={confirmarReset} />

      <div className="hero">
        <p className="hero-eyebrow">UTN · Ingeniería en Sistemas de Información</p>
        <h1 className="hero-titulo">
          Plan de estudios
          <span className="hero-grad">interactivo</span>
        </h1>
        <p className="hero-sub">
          Seguí tu avance: marcá lo que cursás y lo que promocionás. Las correlativas se desbloquean solas.
        </p>
        <ProgressBar valor={promosNucleo} maximo={totalNucleo} etiqueta="Progreso global" />
        {resumen}
      </div>

      <main className="contenido">
        {NIVELES.map((n) => {
          const nucleo = plan.materias_nucleo.filter((m) => m.nivel === n.numero)
          const electivas = plan.materias_electivas.filter((m) => m.nivel === n.numero)
          return (
            <NivelSection
              key={n.numero}
              nivel={n.numero}
              nombre={n.nombre}
              nucleo={nucleo}
              electivas={electivas.length ? electivas : undefined}
              horasElectivasRequeridas={HORAS_REQUERIDAS[n.numero] ?? 0}
              efectivos={efectivos}
              alcanzables={alcanzables}
              fijar={fijar}
              onAbrir={abrirModal}
              nombrePorId={nombrePorId}
              notas={notas}
              query={query}
            />
          )
        })}

        <section className="nivel pps">
          <div className="nivel-head">
            <h2 className="nivel-titulo">
              <span className="nivel-num">✓</span>
              Práctica Profesional Supervisada
            </h2>
          </div>
          <p className="pps-texto">
            200 horas de práctica profesional. Acreditala cuando completes tus horas.
          </p>
          <div className="cards-grid">
            <MateriaCard
              materia={PPS_MATERIA}
              keyBase="pps"
              estado={efectivos['pps'] ?? 0}
              alcanzable={alcanzables['pps'] ?? 0}
              fijar={fijar}
              onAbrir={abrirModal}
              nombrePorId={nombrePorId}
              efectivos={efectivos}
              notas={notas}
            />
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>
          Seguimiento de plan de estudios — Ingeniería en Sistemas de Información. Tu progreso se guarda en este
          navegador.
        </p>
      </footer>

      {modal && (
        <MateriaModal
          materia={modal.materia}
          keyBase={modal.keyBase}
          estado={efectivos[modal.keyBase] ?? 0}
          alcanzable={alcanzables[modal.keyBase] ?? 0}
          efectivos={efectivos}
          fijar={fijar}
          onCerrar={() => setModal(null)}
          nombrePorId={nombrePorId}
          nota={notas?.[modal.keyBase]}
          setNota={setNota}
        />
      )}
    </div>
  )
}
