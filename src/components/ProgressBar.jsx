export default function ProgressBar({ valor, maximo, etiqueta }) {
  const pct = maximo > 0 ? Math.min(100, (valor / maximo) * 100) : 0

  return (
    <div className="progress">
      <div className="progress-head">
        <span className="progress-label">{etiqueta}</span>
        <span className="progress-value">
          {valor} / {maximo}
        </span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
