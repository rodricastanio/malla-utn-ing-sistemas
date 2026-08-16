import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

// Genera dist/sw-precache.json con los assets hasheados para que el service
// worker los pueda cachear al instalar (offline total desde la primera carga).
function precacheManifest() {
  return {
    name: 'precache-manifest',
    apply: 'build',
    closeBundle() {
      const dist = join(import.meta.dirname, 'dist')
      const assets = readdirSync(join(dist, 'assets'))
        .filter((f) => !f.endsWith('.map'))
        .map((f) => `/assets/${f}`)
      writeFileSync(join(dist, 'sw-precache.json'), JSON.stringify({ assets }))
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react(), precacheManifest()],
})
