import { Lock, Loader, BookOpen, BadgeCheck, Info, ArrowUpRight, Check, X } from 'lucide-react'
import { ESTADOS, claveNucleo, horasMateria } from '../lib/plan'

const ICONOS = [Lock, Loader, BookOpen, BadgeCheck]

function ReqItem({ nombre, ok }) {
  return (
    <li className={ok ? 'tooltip-req ok' : 'tooltip-req'}>
      {ok ? <Check size={11} strokeWidth={3} /> : <X size={11} strokeWidth={3} />}
      <span>{nombre}</span>
    </li>
  )
}

export default function MateriaCard({ materia, estado, alcanzable, keyBase, fijar, onAbrir, nombrePorId, efectivos, notas }) {
  const esPps = !!materia.esPps
  const Icono = ICONOS[estado] ?? Lock
  const bloqueada = alcanzable === 0
  const nota = notas?.[keyBase]

  const reqCursar = (materia.correlativas_cursar ?? []).map((id) => ({
    id,
    nombre: nombrePorId?.get(id) ?? `Materia ${id}`,
    ok: (efectivos?.[claveNucleo(id)] ?? 0) >= 2,
  }))
  const reqAprobar = (materia.correlativas_aprobar ?? []).map((id) => ({
    id,
    nombre: nombrePorId?.get(id) ?? `Materia ${id}`,
    ok: (efectivos?.[claveNucleo(id)] ?? 0) >= 2,
  }))

  const promover = () => {
    if (estado === 3) {
      fijar(keyBase, 0)
      return
    }
    if (alcanzable >= 3) fijar(keyBase, 3)
    else onAbrir(materia, keyBase)
  }

  const cursar = () => {
    if (alcanzable === 0) return
    if (estado >= 3) fijar(keyBase, 2)
    else fijar(keyBase, estado === 0 ? 1 : estado === 1 ? 2 : 1)
  }

  return (
    <div
      className={`card card-e${estado}${bloqueada ? ' card-top' : ''}`}
      onClick={promover}
      onContextMenu={(e) => {
        e.preventDefault()
        cursar()
      }}
      role="button"
      tabIndex={0}
      title="Click: promocionar / quitar · Clic derecho: cursar / cursada"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          promover()
        }
      }}
    >
      <div className="card-top">
        <span className={`badge badge-c${materia.cuatrimestre ?? 0}`}>
          {materia.cuatrimestre != null ? `${materia.cuatrimestre}º cuatr.` : esPps ? 'Obligatoria' : 'Anual'}
        </span>
        <div className="card-top-acciones">
          {nota != null && <span className="nota-chip">{nota}</span>}
          <span className="card-horas">{esPps ? '200 hs' : horasMateria(materia)}</span>
          <button
            className="info-btn"
            aria-label="Ver detalles"
            title="Ver detalles y correlativas"
            onClick={(e) => {
              e.stopPropagation()
              onAbrir(materia, keyBase)
            }}
            onContextMenu={(e) => e.stopPropagation()}
          >
            <Info size={14} />
          </button>
        </div>
      </div>

      <h4 className="card-titulo">{materia.nombre}</h4>

      <div className="card-tags">
        {materia.integradora && <span className="tag tag-integradora">Integradora</span>}
        {esPps && <span className="tag tag-pps">PPS</span>}
      </div>

      <div className="card-foot">
        <span className="card-estado">
          <Icono size={14} strokeWidth={2.5} />
          {ESTADOS[estado].etiqueta}
        </span>
        {estado >= 3 ? (
          <span className="done-mark">✓</span>
        ) : bloqueada ? (
          <Lock size={14} className="card-lock" />
        ) : (
          <span className="card-hint">
            <ArrowUpRight size={13} />
          </span>
        )}
      </div>

      <div className="tooltip" role="tooltip">
        <div className="tooltip-head">
          <span className="tooltip-nombre">{materia.nombre}</span>
          <span className={`tooltip-estado e${estado}`}>{ESTADOS[estado].etiqueta}</span>
        </div>
        <div className="tooltip-grupos">
          <div className="tooltip-grupo">
            <strong>Para cursar</strong>
            {reqCursar.length ? (
              <ul>
                {reqCursar.map((r) => (
                  <ReqItem key={r.id} {...r} />
                ))}
              </ul>
            ) : (
              <p className="tooltip-sinreq">Sin requisitos</p>
            )}
          </div>
          <div className="tooltip-grupo">
            <strong>Para aprobar</strong>
            {reqAprobar.length ? (
              <ul>
                {reqAprobar.map((r) => (
                  <ReqItem key={r.id} {...r} />
                ))}
              </ul>
            ) : (
              <p className="tooltip-sinreq">Sin requisitos</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
