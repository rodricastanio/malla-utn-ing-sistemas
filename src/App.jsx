import { useEffect, useMemo, useRef, useState } from 'react'
import { Home as HomeIcon, LayoutGrid, Network, Calculator, CalendarDays, Search, X } from 'lucide-react'
import { usePlan } from './hooks/usePlan'
import { useAuth } from './hooks/useAuth'
import { useRecordatorios } from './hooks/useRecordatorios'
import Header from './components/Header'
import Home from './components/Home'
import NivelSection from './components/NivelSection'
import ProgressBar from './components/ProgressBar'
import MateriaModal from './components/MateriaModal'
import MateriaCard from './components/MateriaCard'
import PantallaLogin from './components/PantallaLogin'
import GrafoCorrelativas from './components/GrafoCorrelativas'
import Planificador from './components/Planificador'
import Calendario from './components/Calendario'
import { NIVELES, claveNucleo } from './lib/plan'
import './index.css'

const HORAS_REQUERIDAS = { 3: 4, 4: 6, 5: 10 }

const TABS = [
  { id: 'inicio', etiqueta: 'Inicio', icono: HomeIcon },
  { id: 'malla', etiqueta: 'Malla', icono: LayoutGrid },
  { id: 'calendario', etiqueta: 'Calendario', icono: CalendarDays },
  { id: 'planificador', etiqueta: 'Planificador', icono: Calculator },
  { id: 'mapa', etiqueta: 'Mapa', icono: Network },
]

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
  const { user, cargando, esInvitado, signInGoogle, signInEmail, signUpEmail, signOut, entrarComoInvitado } =
    useAuth()
  const { plan, efectivos, alcanzables, fijar, setNota, notas, reset, tema, setTema, accento, setAccento } = usePlan(
    user,
    esInvitado
  )
  const { lista: recordatorios, guardar: guardarRecordatorio, eliminar: eliminarRecordatorio } = useRecordatorios(
    user,
    esInvitado
  )
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState(null)
  const [vista, setVista] = useState('inicio')

  const contenidoRef = useRef(null)
  const indiceActualRef = useRef(0)
  indiceActualRef.current = TABS.findIndex((t) => t.id === vista)

  const navegarA = (id) => {
    const nuevoI = TABS.findIndex((t) => t.id === id)
    const viejoI = indiceActualRef.current
    if (nuevoI === viejoI) return
    const el = contenidoRef.current
    if (!el) {
      setVista(id)
      return
    }
    const dir = nuevoI > viejoI ? 1 : -1
    const ancho = el.offsetWidth || 320
    el.style.transition = 'transform 180ms ease'
    el.style.transform = `translateX(${-dir * ancho}px)`
    setTimeout(() => {
      setVista(TABS[nuevoI].id)
      el.style.transition = 'none'
      el.style.transform = `translateX(${dir * ancho}px)`
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          el.style.transition = 'transform 240ms cubic-bezier(0.32, 0.72, 0, 1)'
          el.style.transform = 'translateX(0)'
        })
      )
    }, 180)
  }

  useEffect(() => {
    const el = contenidoRef.current
    if (!el) return
    const gesto = { activo: false, x: 0, y: 0, bloqueado: false, intent: false }

    const onStart = (e) => {
      if (e.touches.length !== 1) return
      if (e.target.closest('.cal-swipe')) return
      gesto.activo = true
      gesto.bloqueado = false
      gesto.intent = false
      gesto.x = e.touches[0].clientX
      gesto.y = e.touches[0].clientY
      el.style.transition = 'none'
    }

    const onMove = (e) => {
      if (!gesto.activo || gesto.bloqueado) return
      const dx = e.touches[0].clientX - gesto.x
      const dy = e.touches[0].clientY - gesto.y
      if (!gesto.intent) {
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return
        if (Math.abs(dy) > Math.abs(dx)) {
          gesto.bloqueado = true
          return
        }
        gesto.intent = true
      }
      e.preventDefault()
      const umbral = 80
      const d = Math.abs(dx) > umbral ? Math.sign(dx) * (umbral + (Math.abs(dx) - umbral) * 0.35) : dx
      el.style.transform = `translateX(${d}px)`
    }

    const onEnd = () => {
      if (!gesto.activo || gesto.bloqueado) return
      gesto.activo = false
      const dx = parseFloat(el.style.transform.match(/-?\d+(\.\d+)?/)?.[0] ?? 0)
      const ancho = el.offsetWidth || 320
      const viejoI = indiceActualRef.current
      if (Math.abs(dx) > 60) {
        const dir = Math.sign(dx)
        const objetivo = viejoI + (dir > 0 ? -1 : 1)
        if (objetivo < 0 || objetivo >= TABS.length) {
          el.style.transition = 'transform 220ms cubic-bezier(0.32, 0.72, 0, 1)'
          el.style.transform = 'translateX(0)'
          return
        }
        el.style.transition = 'transform 210ms cubic-bezier(0.32, 0.72, 0, 1)'
        el.style.transform = `translateX(${dir * ancho}px)`
        setTimeout(() => {
          setVista(TABS[objetivo].id)
          el.style.transition = 'none'
          el.style.transform = `translateX(${-dir * ancho}px)`
          requestAnimationFrame(() =>
            requestAnimationFrame(() => {
              el.style.transition = 'transform 240ms cubic-bezier(0.32, 0.72, 0, 1)'
              el.style.transform = 'translateX(0)'
            })
          )
        }, 200)
      } else {
        el.style.transition = 'transform 240ms cubic-bezier(0.32, 0.72, 0, 1)'
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

  const nombrePorId = useMemo(() => {
    const mapa = new Map()
    plan.materias_nucleo.forEach((m) => mapa.set(m.id, m.nombre))
    return mapa
  }, [plan])

  const totalNucleo = plan.materias_nucleo.length
  const promosNucleo = plan.materias_nucleo.filter((m) => efectivos[claveNucleo(m.id)] === 3).length

  const confirmarReset = () => {
    if (window.confirm('¿Reiniciar todo el progreso y las notas?')) reset()
  }

  const abrirModal = (materia, keyBase) => setModal({ materia, keyBase })

  if (cargando) return <div className="auth-carga" aria-hidden="true" />

  if (!user && !esInvitado) {
    return (
      <PantallaLogin
        signInGoogle={signInGoogle}
        signInEmail={signInEmail}
        signUpEmail={signUpEmail}
        entrarComoInvitado={entrarComoInvitado}
      />
    )
  }

  return (
    <div className="app">
      <div className="sticky-head">
        <Header
          tema={tema}
          setTema={setTema}
          accento={accento}
          setAccento={setAccento}
          onReset={confirmarReset}
          user={user}
          esInvitado={esInvitado}
          onLogout={signOut}
        />
        {(vista === 'inicio' || vista === 'malla') && (
          <div className="progress-rail">
            <div className="progress-rail-inner">
              <ProgressBar valor={promosNucleo} maximo={totalNucleo} etiqueta="Progreso global" />
            </div>
          </div>
        )}
        <nav className="nav-rail" aria-label="Secciones">
          <div className="nav-rail-inner">
            <div className="segmented">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  className={vista === tab.id ? 'activo' : ''}
                  onClick={() => navegarA(tab.id)}
                  aria-current={vista === tab.id ? 'page' : undefined}
                >
                  <tab.icono size={22} />
                  <span>{tab.etiqueta}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>
      </div>

      <div className="vista-swipe" ref={contenidoRef}>
      {vista === 'inicio' && (
        <Home
          plan={plan}
          efectivos={efectivos}
          alcanzables={alcanzables}
          notas={notas}
          onAbrir={abrirModal}
          irA={navegarA}
        />
      )}

      {vista === 'malla' && (
        <main className="contenido">
          <div className="malla-search">
            <Search size={16} />
            <input
              type="search"
              placeholder="Buscar materia en la malla…"
              value={query}
              onChange={(e) => setQuery(e.target.value.toLowerCase())}
              aria-label="Buscar materia en la malla"
            />
            {query && (
              <button
                className="malla-search-clear"
                onClick={() => setQuery('')}
                aria-label="Limpiar búsqueda"
              >
                <X size={15} />
              </button>
            )}
          </div>

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
      )}

      {vista === 'mapa' && (
        <GrafoCorrelativas
          plan={plan}
          efectivos={efectivos}
          alcanzables={alcanzables}
          query={query}
          onAbrir={abrirModal}
        />
      )}

      {vista === 'planificador' && <Planificador plan={plan} efectivos={efectivos} notas={notas} />}

      {vista === 'calendario' && (
        <Calendario
          plan={plan}
          efectivos={efectivos}
          lista={recordatorios}
          guardar={guardarRecordatorio}
          eliminar={eliminarRecordatorio}
        />
      )}
      </div>

      <footer className="footer">
        <p>
          Seguimiento de plan de estudios — Ingeniería en Sistemas de Información. Tu progreso se
          guarda en tu cuenta y se sincroniza entre tus dispositivos.
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
