import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CapacitorUpdater } from '@capgo/capacitor-updater'
import './index.css'
import App from './App.jsx'

const nativo = window.Capacitor?.isNativePlatform()

// Capgo Live Updates: confirma que el bundle cargó bien (evita rollbacks).
if (nativo) {
  CapacitorUpdater.notifyAppReady().catch(() => {})
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Dentro de Capacitor (APK) los assets van embebidos: no hace falta service worker.
if ('serviceWorker' in navigator && !nativo) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}
