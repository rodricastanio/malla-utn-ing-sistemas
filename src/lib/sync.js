const PENDIENTE_KEY = 'malla-utn-pendiente-sync'

let conectado = typeof navigator === 'undefined' ? true : navigator.onLine
const oyentes = new Set()

export function estaOnline() {
  return conectado
}

export function alCambiarConexion(fn) {
  oyentes.add(fn)
  return () => {
    oyentes.delete(fn)
  }
}

export function marcarPendiente() {
  try {
    localStorage.setItem(PENDIENTE_KEY, '1')
  } catch {
    /* ignorar */
  }
}

export function hayPendiente() {
  try {
    return localStorage.getItem(PENDIENTE_KEY) === '1'
  } catch {
    return false
  }
}

export function limpiarPendiente() {
  try {
    localStorage.removeItem(PENDIENTE_KEY)
  } catch {
    /* ignorar */
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    conectado = true
    oyentes.forEach((fn) => fn(true))
  })
  window.addEventListener('offline', () => {
    conectado = false
    oyentes.forEach((fn) => fn(false))
  })
}
