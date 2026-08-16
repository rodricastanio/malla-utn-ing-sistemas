import { useEffect, useMemo, useRef, useState } from 'react'
import { Calculator, TrendingUp, GraduationCap, CalendarDays, Target, Star, Info, HelpCircle } from 'lucide-react'
import {
  promedioActual,
  calcularPromedioObjetivo,
  programarGraduacion,
  contarPlan,
  etiquetaPeriodo,
  cuatrimestreActual,
  cuatrimestresHasta,
} from '../lib/planificador'

const NOMBRE_PPS = 'Práctica Profesional Supervisada'
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

const nombreMateria = (m) => (m.materia ? m.materia.nombre : NOMBRE_PPS)

function HelpTip({ que, ejemplo }) {
  const [abierto, setAbierto] = useState(false)
  const ref = useRef(null)
  const btnRef = useRef(null)

  useEffect(() => {
    if (!abierto) return
    const cerrar = (e) => {
      if (btnRef.current?.contains(e.target)) return
      if (ref.current && !ref.current.contains(e.target)) setAbierto(false)
    }
    const cerrarEscape = (e) => {
      if (e.key === 'Escape') setAbierto(false)
    }
    document.addEventListener('mousedown', cerrar)
    document.addEventListener('keydown', cerrarEscape)
    return () => {
      document.removeEventListener('mousedown', cerrar)
      document.removeEventListener('keydown', cerrarEscape)
    }
  }, [abierto])

  return (
    <span className="ayuda">
      <button
        ref={btnRef}
        type="button"
        className="ayuda-boton"
        aria-label="Qué significa este campo"
        aria-expanded={abierto}
        onClick={() => setAbierto((v) => !v)}
      >
        <HelpCircle size={14} />
      </button>
      {abierto && (
        <span ref={ref} className="ayuda-popover" role="tooltip">
          <span className="ayuda-que">{que}</span>
          {ejemplo && <span className="ayuda-ejemplo">Ej.: {ejemplo}</span>}
        </span>
      )}
    </span>
  )
}

function Campo({ etiqueta, ayuda, children }) {
  return (
    <div className="planif-campo">
      <span className="planif-campo-label">
        {etiqueta}
        {ayuda && <HelpTip que={ayuda.que} ejemplo={ayuda.ejemplo} />}
      </span>
      <span className="planif-campo-control">{children}</span>
    </div>
  )
}

function ModoPromedio({ plan, efectivos, notas }) {
  const actual = cuatrimestreActual()
  const { promedio, cantidad, suma } = useMemo(
    () => promedioActual(efectivos, notas, plan),
    [efectivos, notas, plan]
  )
  const [objetivo, setObjetivo] = useState(7.5)
  const [notaEsperada, setNotaEsperada] = useState(7)
  const [porCuatrimestre, setPorCuatrimestre] = useState(4)
  const [mes, setMes] = useState(actual.cuatri === 2 ? 3 : 9)
  const [anio, setAnio] = useState(actual.cuatri === 2 ? actual.anio + 1 : actual.anio)

  const res = useMemo(
    () =>
      calcularPromedioObjetivo({
        promedio,
        cantidad,
        suma,
        objetivo,
        notaEsperada,
        porCuatrimestre,
        mes,
        anio,
      }),
    [promedio, cantidad, suma, objetivo, notaEsperada, porCuatrimestre, mes, anio]
  )

  const sugeridas = useMemo(() => {
    const n = res.porNota?.n
    if (!n) return []
    const orden = programarGraduacion({ plan, efectivos, maxPorCuatrimestre: 100 })
    return orden.grupos
      .flatMap((g) => g.materias)
      .filter((m) => m.tipo !== 'pps')
      .slice(0, Math.min(n, 12))
  }, [plan, efectivos, res.porNota])

  return (
    <>
      <div className="planif-panel">
        <div className="planif-panel-titulo">Tu objetivo</div>
        <Campo
          etiqueta="Promedio objetivo"
          ayuda={{
            que: 'El promedio que te gustaría tener sobre las materias promocionadas con nota cargada.',
            ejemplo: 'querés recibirte con promedio 8 → poné 8',
          }}
        >
          <input
            type="number"
            min="4"
            max="10"
            step="0.1"
            value={objetivo}
            onChange={(e) => setObjetivo(Number(e.target.value))}
          />
        </Campo>
        <Campo
          etiqueta="Nota esperada"
          ayuda={{
            que: 'Con qué nota estimás aprobar las materias que te faltan. Se usa para saber cuántas necesitás.',
            ejemplo: 'venís aprobando con 6 → poné 6',
          }}
        >
          <input
            type="number"
            min="4"
            max="10"
            step="0.5"
            value={notaEsperada}
            onChange={(e) => setNotaEsperada(Number(e.target.value))}
          />
        </Campo>
        <Campo
          etiqueta="Materias / cuatr."
          ayuda={{
            que: 'Cuántas materias pensás cursar y aprobar por cuatrimestre.',
            ejemplo: '4 → cuatro materias cada cuatrimestre',
          }}
        >
          <input
            type="number"
            min="1"
            max="12"
            step="1"
            value={porCuatrimestre}
            onChange={(e) => setPorCuatrimestre(Number(e.target.value))}
          />
        </Campo>
        <Campo
          etiqueta="Mes objetivo"
          ayuda={{
            que: 'Hasta qué mes querés alcanzar el promedio. Se cuentan los cuatrimestres hasta esa fecha.',
            ejemplo: 'Mar → llegar antes de fin de marzo',
          }}
        >
          <select value={mes} onChange={(e) => setMes(Number(e.target.value))}>
            {MESES.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
        </Campo>
        <Campo
          etiqueta="Año objetivo"
          ayuda={{
            que: 'El año en que querés alcanzar el promedio objetivo.',
            ejemplo: '2027',
          }}
        >
          <input
            type="number"
            min={actual.anio}
            max={actual.anio + 10}
            step="1"
            value={anio}
            onChange={(e) => setAnio(Number(e.target.value))}
          />
        </Campo>
      </div>

      {res.sinNotas ? (
        <div className="planif-aviso warn">
          <Info size={15} />
          <span>Cargá notas en al menos una materia promocionada para poder calcular.</span>
        </div>
      ) : (
        <div className="planif-grid">
          <div className="planif-card">
            <div className="planif-card-head">
              <Target size={16} /> Con nota esperada
            </div>
            {res.porNota.yaAlcanzado ? (
              <p className="planif-detalle ok">
                Ya alcanzás el promedio de <strong>{objetivo}</strong> (tenés {promedio.toFixed(2)}).
              </p>
            ) : res.porNota.imposibleNota ? (
              <p className="planif-detalle error">
                Aprobando de a <strong>{notaEsperada}</strong> no llegás a {objetivo}. Subí la nota esperada o
                bajá el objetivo.
              </p>
            ) : (
              <>
                <div className="planif-valor">
                  {res.porNota.n} <small>materias más</small>
                </div>
                <p className="planif-detalle">
                  Aprobándolas con <strong>{notaEsperada}</strong> llegás a {objetivo} en ≈{' '}
                  {res.porNota.cuatrimestres} cuatr. → <strong>{etiquetaPeriodo(res.porNota.cuatrimestres - 1)}</strong>
                </p>
              </>
            )}
          </div>

          <div className="planif-card">
            <div className="planif-card-head">
              <CalendarDays size={16} /> Para la fecha elegida
            </div>
            {res.porFecha.sinTiempo ? (
              <p className="planif-detalle error">Elegí una fecha futura para poder proyectar.</p>
            ) : res.porFecha.alcanzable ? (
              <>
                <div className="planif-valor">
                  {res.porFecha.notaMinima.toFixed(1)} <small>nota mínima</small>
                </div>
                <p className="planif-detalle">
                  Hasta <strong>{MESES[mes - 1]} {anio}</strong> hay {res.porFecha.cuatrimestres}{' '}
                  cuatrimestres, unas <strong>{res.porFecha.nMax}</strong> materias.
                </p>
                <p className="planif-detalle ok">
                  Aprobándolas con <strong>{res.porFecha.notaMinima.toFixed(1)}</strong> llegás al promedio{' '}
                  <strong>{objetivo}</strong>.
                </p>
              </>
            ) : (
              <p className="planif-detalle error">
                Con {res.porFecha.nMax} materias hasta {MESES[mes - 1]} {anio} necesitarías un promedio de{' '}
                {res.porFecha.notaMinima.toFixed(1)} (más de 10). Ampliá la fecha, subí las materias por
                cuatrimestre o bajá el objetivo.
              </p>
            )}
          </div>
        </div>
      )}

      {sugeridas.length > 0 && (
        <div className="planif-card">
          <div className="planif-card-head">
            <Star size={16} /> Cuáles cursar primero
          </div>
          <ol className="planif-lista">
            {sugeridas.map((m, i) => (
              <li key={m.key} className="planif-item">
                <span className="n">{i + 1}</span>
                <span className="nombre">{nombreMateria(m)}</span>
                <span className={`badge-tipo badge-${m.tipo}`}>{m.tipo}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </>
  )
}

function ModoGraduacion({ plan, efectivos }) {
  const actual = cuatrimestreActual()
  const [submodo, setSubmodo] = useState('ritmo')
  const [ritmo, setRitmo] = useState(4)
  const [anioObjetivo, setAnioObjetivo] = useState(actual.anio + 2)

  const totales = useMemo(
    () => contarPlan(programarGraduacion({ plan, efectivos, maxPorCuatrimestre: 100 }).grupos),
    [plan, efectivos]
  )

  const resultado = useMemo(() => {
    if (submodo === 'ritmo') {
      return {
        modo: 'ritmo',
        ritmo,
        plan: programarGraduacion({ plan, efectivos, maxPorCuatrimestre: ritmo }),
      }
    }
    const nPeriodos = Math.max(1, cuatrimestresHasta(12, anioObjetivo))
    const pace = Math.max(1, Math.ceil(totales.total / nPeriodos))
    const planR = programarGraduacion({ plan, efectivos, maxPorCuatrimestre: pace })
    const fin = planR.grupos[planR.grupos.length - 1]
    return {
      modo: 'anio',
      anioObjetivo,
      nPeriodos,
      pace,
      plan: planR,
      cumple: !!fin && fin.anio <= anioObjetivo,
    }
  }, [submodo, ritmo, anioObjetivo, totales, plan, efectivos])

  const fin = resultado.plan.grupos[resultado.plan.grupos.length - 1]

  const porAnio = useMemo(() => {
    const mapa = {}
    for (const g of resultado.plan.grupos) mapa[g.anio] = (mapa[g.anio] ?? 0) + g.materias.length
    return mapa
  }, [resultado])

  return (
    <>
      <div className="planif-panel">
        <div className="planif-panel-titulo">Tu egreso</div>
        <div className="planif-campo planif-campo-modalidad">
          <span className="planif-campo-label">Modalidad</span>
          <div className="planif-campo-control segmented">
            <button
              className={submodo === 'ritmo' ? 'activo' : ''}
              onClick={() => setSubmodo('ritmo')}
            >
              Por ritmo
            </button>
            <button
              className={submodo === 'anio' ? 'activo' : ''}
              onClick={() => setSubmodo('anio')}
            >
              Por año objetivo
            </button>
          </div>
        </div>
        {submodo === 'ritmo' ? (
          <Campo
            etiqueta="Materias / cuatr."
            ayuda={{
              que: 'Cuántas materias vas a poder sostener por cuatrimestre. Con eso se estima tu fecha de egreso.',
              ejemplo: '4 materias por cuatrimestre → unas 8 por año',
            }}
          >
            <input
              type="number"
              min="1"
              max="12"
              step="1"
              value={ritmo}
              onChange={(e) => setRitmo(Number(e.target.value))}
            />
          </Campo>
        ) : (
          <Campo
            etiqueta="Año objetivo"
            ayuda={{
              que: 'El año en que te gustaría recibirte. Se calcula el ritmo mínimo de materias por cuatrimestre para lograrlo.',
              ejemplo: '2028',
            }}
          >
            <input
              type="number"
              min={actual.anio}
              max={actual.anio + 10}
              step="1"
              value={anioObjetivo}
              onChange={(e) => setAnioObjetivo(Number(e.target.value))}
            />
          </Campo>
        )}
      </div>

      <div className="planif-grid">
        <div className="planif-card">
          <div className="planif-card-head">
            <GraduationCap size={16} /> Materias que te faltan
          </div>
          <div className="planif-valor">
            {totales.total} <small>materias</small>
          </div>
          <p className="planif-detalle">
            <strong>{totales.nucleo}</strong> de núcleo · <strong>{totales.electiva}</strong> electivas ·{' '}
            {totales.pps ? <strong>PPS</strong> : 'PPS completa'}
          </p>
        </div>

        <div className="planif-card">
          <div className="planif-card-head">
            <CalendarDays size={16} /> {resultado.modo === 'ritmo' ? 'Fecha de egreso' : 'Ritmo necesario'}
          </div>
          {resultado.modo === 'ritmo' ? (
            <>
              <div className="planif-valor">{fin ? `${fin.anio} · ${fin.cuatri}º` : '—'}</div>
              <p className="planif-detalle">
                Haciendo <strong>{ritmo}</strong> materias por cuatrimestre (≈{ritmo * 2} por año), estimado.
              </p>
            </>
          ) : (
            <>
              <div className="planif-valor">
                {resultado.pace} <small>materias/cuatr.</small>
              </div>
              <p className="planif-detalle">
                ≈{resultado.pace * 2} por año para recibirte en <strong>{anioObjetivo}</strong>.
              </p>
            </>
          )}
        </div>

        <div className="planif-card">
          <div className="planif-card-head">
            <TrendingUp size={16} /> Totales por año
          </div>
          {Object.keys(porAnio).length === 0 ? (
            <p className="planif-detalle">Sin materias pendientes.</p>
          ) : (
            <p className="planif-detalle">
              {Object.entries(porAnio)
                .map(([a, n]) => `${a}: ${n}`)
                .join(' · ')}
            </p>
          )}
        </div>
      </div>

      {resultado.modo === 'anio' && !resultado.cumple && fin && (
        <div className="planif-aviso warn">
          Con {resultado.pace} materias por cuatrimestre, por correlativas la fecha real estimada es {fin.anio} ·
          {fin.cuatri}º cuatr. Subí el ritmo o apuntá a un año posterior.
        </div>
      )}

      {fin ? (
        <div className="planif-card">
          <div className="planif-card-head">
            <CalendarDays size={16} /> Plan sugerido
          </div>
          <div className="planif-timeline">
            {resultado.plan.grupos.map((g) => (
              <div key={g.periodo} className="planif-periodo">
                <div className="planif-periodo-head">
                  <strong>
                    {g.anio} · {g.cuatri}º cuatr.
                  </strong>
                  <span>
                    {g.materias.length} materia{g.materias.length === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="planif-chips">
                  {g.materias.map((m) => (
                    <span key={m.key} className={`planif-chip chip-${m.tipo}`}>
                      {nombreMateria(m)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="planif-aviso ok">¡Completaste todas las materias del plan!</div>
      )}
    </>
  )
}

export default function Planificador({ plan, efectivos, notas }) {
  const [modo, setModo] = useState('promedio')

  return (
    <section className="planif">
      <div className="planif-head">
        <div>
          <div className="planif-titulo">
            <Calculator size={22} />
            <h2>Planificador</h2>
          </div>
          <p className="planif-sub">
            Calculá cuántas materias necesitás para llegar a un promedio objetivo en una fecha, o proyectá tu
            egreso según el ritmo que puedas sostener.
          </p>
        </div>
        <div className="segmented">
          <button className={modo === 'promedio' ? 'activo' : ''} onClick={() => setModo('promedio')}>
            <TrendingUp size={15} /> Promedio
          </button>
          <button className={modo === 'graduacion' ? 'activo' : ''} onClick={() => setModo('graduacion')}>
            <GraduationCap size={15} /> Graduación
          </button>
        </div>
      </div>

      {modo === 'promedio' ? (
        <ModoPromedio plan={plan} efectivos={efectivos} notas={notas} />
      ) : (
        <ModoGraduacion plan={plan} efectivos={efectivos} />
      )}
    </section>
  )
}
