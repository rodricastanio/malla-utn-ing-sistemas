# 🎓 Malla UTN — Ingeniería en Sistemas

Seguimiento interactivo del plan de estudios de **Ingeniería en Sistemas de Información** de la **UTN (Universidad Tecnológica Nacional)**. Marcá qué materias estás cursando y cuáles promocionaste: las correlativas se desbloquean solas, proyectás tu egreso y tu progreso se sincroniza entre dispositivos.

![Stack](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)
![Stack](https://img.shields.io/badge/Vite-7-646cff?logo=vite&logoColor=white)
![Stack](https://img.shields.io/badge/Supabase-3ecf8e?logo=supabase&logoColor=white)
![Stack](https://img.shields.io/badge/Vercel-000000?logo=vercel&logoColor=white)

---

## ✨ Funcionalidades

- **Home (dashboard)**: resumen de progreso — materias promocionadas, horas anuales, promedio y PPS — y la sección *"Seguí por acá"* con materias desbloqueadas para arrancar.
- **Malla interactiva** con los 5 niveles de la carrera: núcleo, electivas y PPS (Práctica Profesional Supervisada).
  - **4 estados por materia**: `Bloqueada` · `Cursando` · `Cursada` · `Promocionada`.
    - **Click** → promocionar / quitar estado.
    - **Clic derecho** (o mantener) → cursar / marcar como cursada.
  - **Correlativas automáticas**: una materia se desbloquea al cumplir las correlativas de cursada/aprobación, con desglose en un modal de detalles.
  - **Electivas por horas**: cada nivel exige una cantidad de horas de electivas, con barra de progreso propia.
  - **Búsqueda instantánea** de materias dentro de la Malla.
- **Mapa de correlativas**: vista en **grafo SVG interactivo** (arrastrar para mover, pellizcar para zoom, doble-tap para acercar, botones de zoom y ajustar, leyenda de correlativas y estados).
- **Planificador**: proyectá un **promedio objetivo** (*¿cuánto tengo que sacar?*) y tu **fecha de egreso** (*¿para cuándo me recibo?*), con tarjetas de resultado y ayuda "?" contextual en cada campo.
- **Calendario + recordatorios**: anotá mesas de examen e inscripciones con tipo, materia, fecha y descripción; se guardan por cuenta en Supabase.
- **Notas finales y promedio** por materia.
- **Personalización visual**: modo oscuro/claro automático + **12 colores de acento pastel**, guardados por cuenta y sincronizados entre dispositivos.
- **Login** con Google o email/contraseña + **modo invitado** (sin guardar nada).
- **PWA instalable**: manifest + service worker → funciona **offline** y se puede instalar en el teléfono (Android e iOS).
- **UI estilo Apple**: glassmorphism, animaciones suaves, totalmente responsive y optimizada para móviles (incluye correcciones específicas para iOS/Android).

## 🧱 Stack

| Capa         | Tecnología                                                        |
| ------------ | ----------------------------------------------------------------- |
| Frontend     | **React 19** + **Vite 7** (JSX, sin TypeScript)                   |
| Estilos      | **CSS3** puro con variables de tema, acentos y media queries      |
| Iconos       | [lucide-react](https://lucide.dev/)                               |
| Backend      | **Supabase** (PostgreSQL + Auth + REST API)                       |
| Autenticación| OAuth **Google** + email/contraseña (Supabase Auth, flujo PKCE)   |
| Persistencia | Supabase (nube) + `localStorage`/`sessionStorage` (offline/first paint) |
| PWA          | `manifest.webmanifest` + service worker (`public/sw.js`)          |
| Deploy       | **Vercel** (auto-deploy desde `main`)                             |

## 🚀 Correr localmente

```bash
# 1. Clonar e instalar
git clone https://github.com/rodricastanio/malla-utn-ing-sistemas.git
cd malla-utn-ing-sistemas
npm install

# 2. Configurar variables de entorno (copiar y completar)
cp .env.example .env
#   VITE_SUPABASE_URL=...
#   VITE_SUPABASE_ANON_KEY=...

# 3. Levantar el dev server
npm run dev
```

### Base de datos (Supabase)

Ejecutá el script [`supabase/schema.sql`](supabase/schema.sql) en el SQL Editor de tu proyecto. Crea las tablas y políticas de seguridad (RLS):

- **`perfiles`** — `id` (uuid → `auth.users`), `intentos` (jsonb), `notas` (jsonb), `accento` (text) y `updated_at`. Guarda el progreso, las notas y el color personalizado por cuenta.
- **`recordatorios`** — `id`, `perfil_id`, `titulo`, `materia_id`, `tipo`, `fecha`, `descripcion` y `created_at`. Guarda los recordatorios del Calendario.

```sql
-- Esquema base (id → auth.users, intentos jsonb, notas jsonb, accento text, updated_at)
```

## 📦 Scripts

| Comando           | Descripción                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Dev server con HMR                   |
| `npm run build`   | Build de producción                  |
| `npm run preview` | Previsualizar el build               |
| `npm run lint`    | ESLint                               |

## 🗂️ Estructura del proyecto

```
├── index.html
├── supabase/
│   └── schema.sql          # DDL de perfiles + recordatorios + RLS
├── public/
│   ├── img/                # Logo UTN e íconos PWA (192, 512, apple-touch)
│   ├── manifest.webmanifest# Metadatos PWA (instalable, standalone)
│   └── sw.js               # Service worker (offline + caché segura)
└── src/
    ├── data/plan.json      # Plan de estudios (materias, correlativas, electivas)
    ├── lib/
    │   ├── plan.js         # Lógica de correlativas y estados
    │   ├── planificador.js # Cálculos de promedio objetivo y fecha de egreso
    │   ├── grafo.js        # Construcción y layout del grafo de correlativas
    │   └── supabase.js     # Cliente de Supabase
    ├── hooks/
    │   ├── useAuth.js          # Sesión (Google, email, invitado)
    │   ├── usePlan.js          # Progreso + sync + persistencia + tema/acento
    │   └── useRecordatorios.js # CRUD de recordatorios del Calendario
    └── components/
        ├── App.jsx             # Navegación por pestañas + contenedor
        ├── Header.jsx          # Topbar: tema, acento, cuenta
        ├── Home.jsx            # Dashboard de progreso y sugerencias
        ├── NivelSection.jsx    # Sección por nivel con barra de progreso
        ├── MateriaCard.jsx     # Tarjeta de materia interactiva
        ├── MateriaModal.jsx    # Detalle: correlativas, stepper, nota
        ├── GrafoCorrelativas.jsx # Mapa de correlativas (grafo SVG interactivo)
        ├── Planificador.jsx    # Promedio objetivo + fecha de egreso
        ├── Calendario.jsx      # Calendario mensual con recordatorios
        ├── PantallaLogin.jsx   # Ingreso / registro / invitado
        └── ProgressBar.jsx     # Barra de progreso reutilizable
```

## 🧠 Cómo funciona el desbloqueo

Cada materia declara dos listas de correlativas: **para cursar** y **para aprobar**. El estado efectivo de una materia es el mínimo entre lo que marcaste y lo que permiten sus correlativas, calculado en `src/lib/plan.js`:

```js
// Una correlativa se considera cumplida con estado >= 2 (Cursada o Promocionada)
if (cursar.length !== 0 && !cursar.every((s) => s >= 2)) return 0 // bloqueada
if (aprobar.length !== 0 && !aprobar.every((s) => s >= 2)) return 2 // solo cursable
return 3 // promocionable
```

## ⚡ Optimización de rendimiento

Pensada para correr fluido en celulares de gama baja:

- El **grafo** aplica pan/zoom con `transform` directo al DOM (sin re-render de React por frame), evitando que el compositor de iOS/Android quede en negro y reduciendo el consumo de CPU.
- `backdrop-filter` reducido en mobile y `content-visibility` para no renderizar secciones fuera de pantalla.
- Tooltips solo en dispositivos con hover; toque con feedback `:active` y inputs de 16px (anti-zoom de iOS).
- `color-scheme` declarado (light/dark) para que iOS/Android no pinten controles con colores por defecto.
- Logo optimizado (~1,9 KB), `preconnect` a Supabase y tema aplicado antes del primer paint.

## 📱 PWA y modo offline

La app es una **PWA instalable**: el `manifest.webmanifest` la habilita para "Agregar a pantalla de inicio" y el `service worker` (`public/sw.js`) cachea el app shell para que funcione **sin conexión**. El SW solo cachea respuestas correctas (`ok`), versiona la caché y actualiza el HTML por red (para no quedar con versiones viejas o respuestas de error).

---

Desarrollado con ❤️ para estudiantes de sistemas. Tu progreso, sincronizado.
