import { useState, useRef, useEffect } from 'react'
import { Moon, Sun, RotateCcw, Search, LogOut, ChevronDown } from 'lucide-react'

function Avatar({ user }) {
  const url = user.user_metadata?.avatar_url
  const nombre = user.user_metadata?.full_name || user.email || '?'
  const inicial = (nombre[0] || '?').toUpperCase()
  return url ? (
    <img className="avatar-img" src={url} alt="" referrerPolicy="no-referrer" />
  ) : (
    <span className="avatar-inicial">{inicial}</span>
  )
}

export default function Header({ query, setQuery, tema, setTema, onReset, user, onLogout }) {
  const [menuAbierto, setMenuAbierto] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const cerrar = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuAbierto(false)
    }
    document.addEventListener('mousedown', cerrar)
    return () => document.removeEventListener('mousedown', cerrar)
  }, [])

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

        <div className="user-menu" ref={menuRef}>
          <button
            className="user-btn"
            onClick={() => setMenuAbierto((v) => !v)}
            aria-label="Cuenta"
            title="Cuenta"
          >
            <Avatar user={user} />
            <ChevronDown size={14} className={menuAbierto ? 'chevron-abierto' : ''} />
          </button>
          {menuAbierto && (
            <div className="user-dropdown">
              <div className="user-dropdown-info">
                <strong>{user.user_metadata?.full_name || 'Cuenta'}</strong>
                <span>{user.email}</span>
              </div>
              <button className="user-dropdown-item" onClick={onLogout}>
                <LogOut size={15} />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
