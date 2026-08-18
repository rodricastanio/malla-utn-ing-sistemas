import { useEffect } from 'react'
import { X, Lock, Loader, BookOpen, BadgeCheck, CalendarDays, Star } from 'lucide-react'
import { ESTADOS, claveNucleo, horasMateria } from '../lib/plan'

const ICONO_ESTADO = [Lock, Loader, BookOpen, BadgeCheck]

function ListaCorrelativas({ titulo, ids, nombrePorId, efectivos }) {
  if (!ids || ids.length === 0) {
    return (
      <div className="modal-grupo">
        <h5>{titulo}</h5>
        <p className="modal-vacio">Sin requisitos</p>
      </div>
    )
  }
  return (
    <div className="modal-grupo">
      <h5>{titulo}</h5>
      <ul className="correl-list">
        {ids.map((id) => {
          const estado = efectivos[claveNucleo(id)] ?? 0
          const ok = estado >= 2
          const Icono = ICONO_ESTADO[estado] ?? Lock
          return (
            <li key={id} className={ok ? 'correl ok' : 'correl'}>
              <Icono size={15} strokeWidth={2.5} />
              <span>{nombrePorId.get(id) ?? `Materia ${id}`}</span>
              {ok && <span className="correl-check">✓</span>}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default function MateriaModal({
  materia,
  keyBase,
  estado,
  alcanzable,
  efectivos,
  fijar,
  onCerrar,
  nombrePorId,
  nota,
  setNota,
}) {
  useEffect(() => {
    const manejarTecla = (e) => {
      if (e.key === 'Escape') onCerrar()
    }
    window.addEventListener('keydown', manejarTecla)
    return () => window.removeEventListener('keydown', manejarTecla)
  }, [onCerrar])

  const esPps = !!materia.esPps

  return (
    <div className="overlay" onClick={onCerrar}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className="modal-close" onClick={onCerrar} aria-label="Cerrar">
          <X size={18} />
        </button>

        <div className="modal-head">
          <span className={`badge badge-c${materia.cuatrimestre ?? 0}`}>
            {materia.cuatrimestre != null
              ? `${materia.cuatrimestre}º cuatr.`
              : esPps
                ? 'Práctica Profesional'
                : 'Anual'}
          </span>
          <span className="modal-horas">{esPps ? '200 hs' : horasMateria(materia)}</span>
        </div>

        <h2 className="modal-titulo">{materia.nombre}</h2>

        <div className="modal-chips">
          {materia.integradora && (
            <span className="tag tag-integradora">
              <Star size={12} /> Integradora
            </span>
          )}
          <span className="modal-chip">
            <CalendarDays size={13} />
            Nivel {materia.nivel}
          </span>
        </div>

        <div className="modal-stepper">
          {ESTADOS.map((e) => {
            const activo = estado === e.nivel
            const habilitado = e.nivel <= alcanzable
            const Icono = ICONO_ESTADO[e.nivel] ?? Lock
            const bajandoDePromo = estado === 3 && e.nivel < 3 && nota != null
            return (
              <button
                key={e.nivel}
                className={`step step-${e.nivel}${activo ? ' activo' : ''}`}
                disabled={!habilitado || activo}
                onClick={() => {
                  if (bajandoDePromo && !window.confirm('Esta materia tiene nota cargada. Si bajás el estado se va a eliminar la nota. ¿Continuar?')) return
                  fijar(keyBase, e.nivel)
                }}
              >
                <Icono size={16} strokeWidth={2.5} />
                <span>{e.etiqueta}</span>
              </button>
            )
          })}
        </div>

        <div className="modal-nota">
          <label htmlFor={`nota-${keyBase}`}>Nota final</label>
          <div className="modal-nota-input">
            <input
              id={`nota-${keyBase}`}
              type="number"
              min="1"
              max="10"
              step="0.5"
              placeholder="—"
              disabled={estado < 3}
              value={nota ?? ''}
              onChange={(e) => {
                const v = e.target.value
                if (v === '') {
                  if (nota != null && !window.confirm('¿Seguro que querés eliminar la nota?')) return
                  setNota(keyBase, null)
                  return
                }
                const n = Math.max(1, Math.min(10, parseFloat(v)))
                setNota(keyBase, Number.isNaN(n) ? null : n)
              }}
            />
          </div>
          {estado < 3 ? (
            <span className="nota-hint">La nota se puede cargar cuando la materia esté promocionada.</span>
          ) : (
            <span className="nota-hint ok">Promocionada — cargá tu nota (1 a 10).</span>
          )}
        </div>

        <div className="modal-correlativas">
          <ListaCorrelativas
            titulo="Para cursar (correlativas de cursada)"
            ids={materia.correlativas_cursar}
            nombrePorId={nombrePorId}
            efectivos={efectivos}
          />
          <ListaCorrelativas
            titulo="Para aprobar (correlativas de aprobación)"
            ids={materia.correlativas_aprobar}
            nombrePorId={nombrePorId}
            efectivos={efectivos}
          />
        </div>
      </div>
    </div>
  )
}
