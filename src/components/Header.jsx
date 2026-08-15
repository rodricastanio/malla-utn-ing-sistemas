import { useState, useRef, useEffect } from 'react'
import { Moon, Sun, RotateCcw, LogOut, ChevronDown, User, Palette, Check } from 'lucide-react'

const ACENTOS = [
  { id: 'azul', nombre: 'Azul', color: '#007aff' },
  { id: 'celeste', nombre: 'Celeste', color: '#2f9ce0' },
  { id: 'lila', nombre: 'Lila', color: '#8e5fd7' },
  { id: 'rosa', nombre: 'Rosa pastel', color: '#e0649a' },
  { id: 'verdeAgua', nombre: 'Verde agua', color: '#2fb59a' },
  { id: 'amarillo', nombre: 'Amarillo pastel', color: '#d9a521' },
  { id: 'turquesa', nombre: 'Turquesa', color: '#12b0c9' },
  { id: 'menta', nombre: 'Menta', color: '#2ec27e' },
  { id: 'coral', nombre: 'Coral', color: '#e2554d' },
  { id: 'fucsia', nombre: 'Fucsia', color: '#d6459b' },
  { id: 'naranja', nombre: 'Naranja', color: '#e08a2e' },
  { id: 'violeta', nombre: 'Violeta', color: '#7b5cd6' },
]

function Avatar({ user, esInvitado }) {
  if (esInvitado || !user) {
    return (
      <span className="avatar-inicial">
        <User size={15} />
      </span>
    )
  }
  const url = user.user_metadata?.avatar_url
  const nombre = user.user_metadata?.full_name || user.email || '?'
  const inicial = (nombre[0] || '?').toUpperCase()
  return url ? (
    <img className="avatar-img" src={url} alt="" referrerPolicy="no-referrer" />
  ) : (
    <span className="avatar-inicial">{inicial}</span>
  )
}

export default function Header({ tema, setTema, accento, setAccento, onReset, user, esInvitado, onLogout }) {
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [paletaAbierta, setPaletaAbierta] = useState(false)
  const menuRef = useRef(null)
  const paletaRef = useRef(null)

  useEffect(() => {
    const cerrar = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuAbierto(false)
    }
    document.addEventListener('mousedown', cerrar)
    return () => document.removeEventListener('mousedown', cerrar)
  }, [])

  useEffect(() => {
    if (!paletaAbierta) return
    const cerrar = (e) => {
      if (paletaRef.current && !paletaRef.current.contains(e.target)) setPaletaAbierta(false)
    }
    const cerrarEscape = (e) => {
      if (e.key === 'Escape') setPaletaAbierta(false)
    }
    document.addEventListener('mousedown', cerrar)
    document.addEventListener('keydown', cerrarEscape)
    return () => {
      document.removeEventListener('mousedown', cerrar)
      document.removeEventListener('keydown', cerrarEscape)
    }
  }, [paletaAbierta])

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
        <button
          className="icon-btn"
          onClick={() => setTema(tema === 'dark' ? 'light' : 'dark')}
          aria-label="Cambiar tema"
          title={tema === 'dark' ? 'Cambiar a claro' : 'Cambiar a oscuro'}
        >
          {tema === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="acento-menu" ref={paletaRef}>
          <button
            className="icon-btn"
            onClick={() => setPaletaAbierta((v) => !v)}
            aria-label="Personalizar color"
            title="Personalizar color"
            aria-expanded={paletaAbierta}
          >
            <Palette size={18} />
          </button>
          {paletaAbierta && (
            <div className="acento-popover">
              <div className="acento-titulo">
                <strong>Personalizar</strong>
                <span>Color de acento</span>
              </div>
              <div className="acento-swatches">
                {ACENTOS.map((a) => (
                  <button
                    key={a.id}
                    className={`acento-swatch${accento === a.id ? ' activo' : ''}`}
                    onClick={() => {
                      setAccento(a.id)
                      setPaletaAbierta(false)
                    }}
                    title={a.nombre}
                    aria-label={a.nombre}
                  >
                    <span className="acento-color" style={{ backgroundColor: a.color }}>
                      {accento === a.id && <Check size={13} strokeWidth={3} />}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

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
              {esInvitado ? (
                <div className="user-dropdown-info">
                  <strong>Invitado</strong>
                  <span>Podés explorar sin guardar nada</span>
                </div>
              ) : (
                <div className="user-dropdown-info">
                  <strong>{user?.user_metadata?.full_name || 'Cuenta'}</strong>
                  <span>{user?.email}</span>
                </div>
              )}
              <button className="user-dropdown-item" onClick={onLogout}>
                <LogOut size={15} />
                {esInvitado ? 'Salir del modo invitado' : 'Cerrar sesión'}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
