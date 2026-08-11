import { useEffect, useState } from 'react'
import { Mail, Lock, UserPlus, LogIn, Eye } from 'lucide-react'

export default function PantallaLogin({ signInGoogle, signInEmail, signUpEmail, entrarComoInvitado }) {
  const [modo, setModo] = useState('entrar')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [mensaje, setMensaje] = useState(null)
  const [ocupado, setOcupado] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const err = params.get('error')
    if (err) {
      const desc = params.get('error_description')
      setError(desc ? `${err}: ${desc}` : err)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const limpiar = () => {
    setError(null)
    setMensaje(null)
  }

  const conGoogle = async () => {
    setOcupado(true)
    limpiar()
    const err = await signInGoogle()
    if (err) {
      setError(err.message || 'No se pudo iniciar sesión con Google.')
      setOcupado(false)
    }
  }

  const enviar = async (e) => {
    e.preventDefault()
    setOcupado(true)
    limpiar()
    const err =
      modo === 'entrar' ? await signInEmail(email, password) : await signUpEmail(email, password)
    setOcupado(false)
    if (err) {
      setError(err.message || 'No se pudo completar la operación.')
      return
    }
    if (modo === 'registrar') {
      setMensaje('Cuenta creada. Revisá tu correo para confirmarla y luego ingresá.')
      setModo('entrar')
    }
  }

  return (
    <div className="pantalla-login">
      <div className="pantalla-login-card">
        <img className="pantalla-login-logo" src="img/UTN-LOGO.png" alt="Logo UTN" />

        <h1 className="pantalla-login-titulo">Plan de estudios</h1>
        <p className="pantalla-login-sub">
          Ingeniería en Sistemas de Información — Ingresá para ver tu malla y que tu progreso se
          sincronice entre tus dispositivos.
        </p>

        <button className="btn-google" onClick={conGoogle} disabled={ocupado}>
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            />
            <path
              fill="#FBBC05"
              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            />
          </svg>
          Continuar con Google
        </button>

        <div className="login-divisor">
          <span>o</span>
        </div>

        <form className="login-form" onSubmit={enviar}>
          <label className="login-campo">
            <Mail size={16} />
            <input
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>
          <label className="login-campo">
            <Lock size={16} />
            <input
              type="password"
              placeholder="Contraseña"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
            />
          </label>

          {error && <p className="login-error">{error}</p>}
          {mensaje && <p className="login-mensaje">{mensaje}</p>}

          <button className="btn-login" type="submit" disabled={ocupado}>
            {modo === 'entrar' ? <LogIn size={16} /> : <UserPlus size={16} />}
            {modo === 'entrar' ? 'Entrar' : 'Registrarme'}
          </button>
        </form>

        <p className="login-cambio">
          {modo === 'entrar' ? (
            <>
              ¿No tenés cuenta?{' '}
              <button type="button" onClick={() => setModo('registrar')}>
                Registrate
              </button>
            </>
          ) : (
            <>
              ¿Ya tenés cuenta?{' '}
              <button type="button" onClick={() => setModo('entrar')}>
                Iniciá sesión
              </button>
            </>
          )}
        </p>

        <div className="login-divisor">
          <span>o</span>
        </div>

        <button className="btn-invitado" onClick={entrarComoInvitado}>
          <Eye size={16} />
          Explorar como invitado
        </button>
        <p className="login-invitado-hint">Sin cuenta y sin guardar nada: solo para chusmear.</p>
      </div>

      <p className="pantalla-login-pie">UTN · Ingeniería en Sistemas de Información</p>
    </div>
  )
}
