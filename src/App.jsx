import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import { Home as HomeIcon, LayoutGrid, Network, Calculator, CalendarDays, Search, X } from 'lucide-react'
import { CapacitorUpdater } from '@capgo/capacitor-updater'
import { usePlan } from './hooks/usePlan'
import { useAuth } from './hooks/useAuth'
import { useRecordatorios } from './hooks/useRecordatorios'
import Header from './components/Header'
import Home from './components/Home'
import ProgressBar from './components/ProgressBar'
import MateriaModal from './components/MateriaModal'
import PantallaLogin from './components/PantallaLogin'
import { NIVELES, claveNucleo } from './lib/plan'
import './index.css'

const NivelSection = lazy(() => import('./components/NivelSection'))
const MateriaCard = lazy(() => import('./components/MateriaCard'))
const GrafoCorrelativas = lazy(() => import('./components/GrafoCorrelativas'))
const Planificador = lazy(() => import('./components/Planificador'))
const Calendario = lazy(() => import('./components/Calendario'))

const HORAS_REQUERIDAS = { 3: 4, 4: 6, 5: 10 }

const TRANSICION_TRACK = 'transform 170ms cubic-bezier(0.32, 0.72, 0, 1)'
const DURACION = 170
const anchoVista = (vp) => vp?.offsetWidth || window.innerWidth || 320
const transformarTrack = (vw, dx) => `translateX(${-vw + dx}px)`
const animarTrack = (track, vw, dx) => {
  if (!track) return
  track.style.transition = TRANSICION_TRACK
  track.style.transform = transformarTrack(vw, dx)
}
const restablecerTrack = (vp, track) => {
  if (!track) return
  track.style.transition = 'none'
  track.style.transform = transformarTrack(anchoVista(vp), 0)
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      track.style.transition = TRANSICION_TRACK
      track.style.willChange = ''
    })
  )
}

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
  const [version, setVersion] = useState(null)
  const [vecino, setVecino] = useState(null)

  useEffect(() => {
    if (window.Capacitor?.isNativePlatform()) {
      CapacitorUpdater.getCurrent()
        .then((res) => setVersion(res.current))
        .catch(() => {})
    }
  }, [])

  const viewportRef = useRef(null)
  const trackRef = useRef(null)
  const gesto = useRef({ activo: false, x: 0, y: 0, bloqueado: false, intent: false, dx: 0, vw: 0 })
  const indiceActualRef = useRef(0)
  indiceActualRef.current = TABS.findIndex((t) => t.id === vista)

  const navegarA = (id) => {
    const nuevoI = TABS.findIndex((t) => t.id === id)
    const viejoI = indiceActualRef.current
    if (nuevoI === viejoI) return
    const track = trackRef.current
    const vp = viewportRef.current
    if (!track || !vp) {
      setVista(id)
      return
    }
    const vw = anchoVista(vp)
    const lado = nuevoI > viejoI ? 1 : -1
    const ponerEn = (dx, suave) => {
      track.style.transition = suave ? TRANSICION_TRACK : 'none'
      track.style.transform = transformarTrack(vw, dx)
    }
    track.style.willChange = 'transform'
    ponerEn(0, false)
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        ponerEn(-lado * vw, true)
      })
    )
    setTimeout(() => {
      setVista(id)
      ponerEn(lado * vw, false)
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          ponerEn(0, true)
        })
      )
      setTimeout(() => {
        track.style.willChange = ''
      }, DURACION + 40)
    }, Math.round(DURACION * 0.75))
  }

  useEffect(() => {
    const vp = viewportRef.current
    const track = trackRef.current
    if (!vp || !track) return
    const g = gesto.current

    track.style.transition = 'none'
    track.style.transform = transformarTrack(anchoVista(vp), 0)
    const onResize = () => restablecerTrack(vp, track)

    const onStart = (e) => {
      if (e.touches.length !== 1) return
      if (e.target.closest('.cal-swipe, .grafo-viewport')) return
      g.activo = true
      g.bloqueado = false
      g.intent = false
      g.dx = 0
      g.vw = anchoVista(vp)
      g.x = e.touches[0].clientX
      g.y = e.touches[0].clientY
      track.style.willChange = 'transform'
    }

    const onMove = (e) => {
      if (!g.activo || g.bloqueado) return
      const dx = e.touches[0].clientX - g.x
      const dy = e.touches[0].clientY - g.y
      if (!g.intent) {
        if (Math.abs(dx) < 12 && Math.abs(dy) < 12) return
        // Si el gesto es vertical, es scroll de la página: no lo robamos.
        if (Math.abs(dy) > Math.abs(dx) * 1.25) {
          g.bloqueado = true
          track.style.willChange = ''
          return
        }
        const lado = dx > 0 ? -1 : 1
        const objetivo = indiceActualRef.current + lado
        if (objetivo < 0 || objetivo >= TABS.length) {
          g.bloqueado = true
          track.style.willChange = ''
          return
        }
        g.intent = true
        setVecino({ id: TABS[objetivo].id, lado })
      }
      e.preventDefault()
      const umbral = 80
      const d = Math.abs(dx) > umbral ? Math.sign(dx) * (umbral + (Math.abs(dx) - umbral) * 0.35) : dx
      g.dx = d
      track.style.transform = transformarTrack(g.vw, d)
    }

    const onEnd = () => {
      if (!g.activo) return
      g.activo = false
      if (g.bloqueado) {
        track.style.willChange = ''
        return
      }
      const dx = g.dx
      const vw = g.vw
      const viejoI = indiceActualRef.current
      if (Math.abs(dx) > 60) {
        const lado = dx > 0 ? -1 : 1
        const objetivo = viejoI + lado
        if (objetivo < 0 || objetivo >= TABS.length) {
          animarTrack(track, vw, 0)
          setTimeout(() => {
            setVecino(null)
            track.style.willChange = ''
          }, DURACION + 40)
          return
        }
        const nuevoId = TABS[objetivo].id
        animarTrack(track, vw, -lado * vw)
        setTimeout(() => {
          setVista(nuevoId)
          setVecino(null)
          restablecerTrack(vp, track)
        }, Math.round(DURACION * 0.85))
      } else {
        animarTrack(track, vw, 0)
        setTimeout(() => {
          setVecino(null)
          track.style.willChange = ''
        }, DURACION + 40)
      }
    }

    vp.addEventListener('touchstart', onStart, { passive: true })
    vp.addEventListener('touchmove', onMove, { passive: false })
    vp.addEventListener('touchend', onEnd, { passive: true })
    vp.addEventListener('touchcancel', onEnd, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      vp.removeEventListener('touchstart', onStart)
      vp.removeEventListener('touchmove', onMove)
      vp.removeEventListener('touchend', onEnd)
      vp.removeEventListener('touchcancel', onEnd)
      window.removeEventListener('resize', onResize)
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

  const renderTab = (id) => {
    switch (id) {
      case 'inicio':
        return (
          <Home
            plan={plan}
            efectivos={efectivos}
            alcanzables={alcanzables}
            notas={notas}
            onAbrir={abrirModal}
            irA={navegarA}
          />
        )
      case 'malla':
        return (
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
        )
      case 'mapa':
        return (
          <GrafoCorrelativas
            plan={plan}
            efectivos={efectivos}
            alcanzables={alcanzables}
            query={query}
            onAbrir={abrirModal}
          />
        )
      case 'planificador':
        return <Planificador plan={plan} efectivos={efectivos} notas={notas} />
      case 'calendario':
        return (
          <Calendario
            plan={plan}
            efectivos={efectivos}
            lista={recordatorios}
            guardar={guardarRecordatorio}
            eliminar={eliminarRecordatorio}
          />
        )
      default:
        return null
    }
  }

  const renderConSuspenso = (id) => (
    <Suspense fallback={<div className="vista-suspense" aria-hidden="true" />}>{renderTab(id)}</Suspense>
  )

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

      <div className="vista-swipe" ref={viewportRef}>
        <div className="vista-track" ref={trackRef}>
          <div className="vista-pagina" aria-hidden={vecino?.lado !== -1}>
            {vecino?.lado === -1 && renderConSuspenso(vecino.id)}
          </div>
          <div className="vista-pagina">{renderConSuspenso(vista)}</div>
          <div className="vista-pagina" aria-hidden={vecino?.lado !== 1}>
            {vecino?.lado === 1 && renderConSuspenso(vecino.id)}
          </div>
        </div>
      </div>

      <footer className="footer">
        <p>
          Seguimiento de plan de estudios — Ingeniería en Sistemas de Información. Tu progreso se
          guarda en tu cuenta y se sincroniza entre tus dispositivos.
        </p>
        {version && <span className="footer-version">v{version}</span>}
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
