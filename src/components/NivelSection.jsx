import { Sparkles } from 'lucide-react'
import MateriaCard from './MateriaCard'
import ProgressBar from './ProgressBar'

export default function NivelSection({
  nivel,
  nombre,
  nucleo,
  electivas,
  horasElectivasRequeridas,
  efectivos,
  alcanzables,
  fijar,
  onAbrir,
  nombrePorId,
  notas,
  query,
}) {
  const promosNucleo = nucleo.filter((m) => efectivos[`n-${m.id}`] === 3)

  const electivasFiltradas = (electivas ?? []).filter((m) => !query || m.nombre.toLowerCase().includes(query))
  const nucleoFiltrado = nucleo.filter((m) => !query || m.nombre.toLowerCase().includes(query))

  const horasElectivasLogradas = (electivas ?? []).reduce((acc, m) => {
    if (efectivos[`e-${m.id}`] === 3) acc += m.horas_anuales ?? 0
    return acc
  }, 0)

  if (nucleoFiltrado.length === 0 && electivasFiltradas.length === 0) return null

  return (
    <section className="nivel">
      <div className="nivel-head">
        <h2 className="nivel-titulo">
          <span className="nivel-num">{nivel}</span>
          {nombre}
        </h2>
        <ProgressBar
          valor={promosNucleo.length}
          maximo={nucleo.length}
          etiqueta={`${nivel}º nivel`}
        />
      </div>

      <div className="cards-grid">
        {nucleoFiltrado.map((m) => (
          <MateriaCard
            key={m.id}
            materia={m}
            keyBase={`n-${m.id}`}
            estado={efectivos[`n-${m.id}`] ?? 0}
            alcanzable={alcanzables[`n-${m.id}`] ?? 0}
            fijar={fijar}
            onAbrir={onAbrir}
            nombrePorId={nombrePorId}
            efectivos={efectivos}
            notas={notas}
          />
        ))}
      </div>

      {electivas && electivas.length > 0 && (
        <div className="electivas">
          <div className="electivas-head">
            <h3 className="electivas-titulo">
              <Sparkles size={16} />
              Electivas
            </h3>
            {horasElectivasRequeridas > 0 && (
              <ProgressBar
                valor={horasElectivasLogradas}
                maximo={horasElectivasRequeridas}
                etiqueta="Horas de electivas"
              />
            )}
          </div>
          <div className="cards-grid">
            {electivasFiltradas.map((m) => (
              <MateriaCard
                key={m.id}
                materia={m}
                keyBase={`e-${m.id}`}
                estado={efectivos[`e-${m.id}`] ?? 0}
                alcanzable={alcanzables[`e-${m.id}`] ?? 0}
                fijar={fijar}
                onAbrir={onAbrir}
                nombrePorId={nombrePorId}
                efectivos={efectivos}
                notas={notas}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
