# 🎓 Malla UTN — Ingeniería en Sistemas

Seguimiento interactivo del plan de estudios de **Ingeniería en Sistemas de Información** de la **UTN (Universidad Tecnológica Nacional)**. Marcá qué materias estás cursando y cuáles promocionaste: las correlativas se desbloquean solas y tu progreso se sincroniza entre dispositivos.

![Stack](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)
![Stack](https://img.shields.io/badge/Vite-7-646cff?logo=vite&logoColor=white)
![Stack](https://img.shields.io/badge/Supabase-3ecf8e?logo=supabase&logoColor=white)
![Stack](https://img.shields.io/badge/Vercel-000000?logo=vercel&logoColor=white)

---

## ✨ Funcionalidades

- **Malla interactiva** con las 5 niveles de la carrera: núcleo, electivas y PPS (Práctica Profesional Supervisada).
- **4 estados por materia**: `Bloqueada` · `Cursando` · `Cursada` · `Promocionada`.
  - **Click** → promocionar / quitar estado.
  - **Clic derecho** (o mantener) → cursar / marcar como cursada.
- **Correlativas automáticas**: una materia se desbloquea cuando cumplís las correlativas de cursada/aprobación, con desglose en un modal de detalles.
- **Electivas por horas**: cada nivel exige una cantidad de horas de electivas, con barra de progreso propia.
- **Notas finales y promedio** por materia.
- **Búsqueda instantánea** de materias.
- **Modo oscuro / claro** con detección automática del sistema y preferencia persistida.
- **Login con Google o email/contraseña** y **sincronización del progreso en la nube** por cuenta.
- **Modo invitado**: explorá toda la malla sin crear cuenta y sin guardar nada.
- **UI estilo Apple**: glassmorphism, animaciones suaves, totalmente responsive y **optimizada para móviles** (scroll fluido y arranque rápido en gama baja).

## 🧱 Stack

| Capa        | Tecnología                                                        |
| ----------- | ----------------------------------------------------------------- |
| Frontend    | **React 19** + **Vite 7** (JSX, sin TypeScript)                   |
| Estilos     | **CSS3** puro con variables de tema y media queries               |
| Iconos      | [lucide-react](https://lucide.dev/)                               |
| Backend     | **Supabase** (PostgreSQL + Auth + REST API)                       |
| Autenticación | OAuth **Google** + email/contraseña (Supabase Auth, flujo PKCE)  |
| Persistencia| Supabase (nube) + `localStorage`/`sessionStorage` (offline/first paint) |
| Deploy      | **Vercel** (auto-deploy desde `main`)                             |

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

Ejecutá el script [`supabase/schema.sql`](supabase/schema.sql) en el SQL Editor de tu proyecto para crear la tabla `perfiles` y sus políticas de seguridad (RLS). El esquema guarda el progreso (`intentos`) y las notas por usuario.

```sql
-- Tabla "perfiles": id (uuid, referencia a auth.users), intentos (jsonb), notas (jsonb), updated_at
```

## 📦 Scripts

| Comando             | Descripción                          |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Dev server con HMR                   |
| `npm run build`     | Build de producción                  |
| `npm run preview`   | Previsualizar el build               |
| `npm run lint`      | ESLint                               |

## 🗂️ Estructura del proyecto

```
├── index.html
├── supabase/
│   └── schema.sql          # DDL de la tabla perfiles + RLS
├── public/
│   └── img/                # Logo UTN
└── src/
    ├── data/plan.json      # Datos del plan de estudios (materias, correlativas)
    ├── lib/plan.js         # Lógica de correlativas y estados
    ├── lib/supabase.js     # Cliente de Supabase
    ├── hooks/
    │   ├── useAuth.js      # Sesión (Google, email, invitado)
    │   └── usePlan.js      # Estado del progreso + sync + persistencia
    └── components/
        ├── Header.jsx          # Topbar con búsqueda, tema y menú de cuenta
        ├── NivelSection.jsx    # Sección por nivel con barra de progreso
        ├── MateriaCard.jsx     # Tarjeta de materia interactiva
        ├── MateriaModal.jsx    # Detalle: correlativas, stepper de estado, nota
        ├── PantallaLogin.jsx   # Pantalla de ingreso / registro / invitado
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

La app está pensada para correr fluido en celulares de gama baja:

- Eliminación de repintados por frame (`background-attachment` reemplazado por capa compositora).
- `backdrop-filter` reducido en mobile y `content-visibility` para no renderizar secciones fuera de pantalla.
- Tooltips renderizados solo en dispositivos con hover.
- Logo optimizado (~1,9 KB) y `preconnect` a Supabase.
- Tema aplicado antes del primer paint (sin parpadeo).

---

Desarrollado con ❤️ para estudiantes de sistemas. Tu progreso, sincronizado.
