import { Moon, Sun, RotateCcw, Search } from 'lucide-react'

export default function Header({ query, setQuery, tema, setTema, onReset }) {
  return (
    <header className="topbar">
      <div className="topbar-brand">
        <img className="topbar-logo" src="img/UTN-LOGO.png" alt="Logo UTN" />
        <div className="topbar-texto">
          <strong>Ingeniería en Sistemas</strong>
          <span>Plan de estudios</span>
        </div>
      </div>

      <div className="topbar-acciones">
        <div className="search">
          <Search size={15} />
          <input
            type="search"
            placeholder="Buscar materia…"
            value={query}
            onChange={(e) => setQuery(e.target.value.toLowerCase())}
            aria-label="Buscar materia"
          />
        </div>

        <button
          className="icon-btn"
          onClick={() => setTema(tema === 'dark' ? 'light' : 'dark')}
          aria-label="Cambiar tema"
          title={tema === 'dark' ? 'Cambiar a claro' : 'Cambiar a oscuro'}
        >
          {tema === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button
          className="icon-btn danger"
          onClick={onReset}
          aria-label="Reiniciar progreso"
          title="Reiniciar progreso"
        >
          <RotateCcw size={18} />
        </button>
      </div>
    </header>
  )
}
