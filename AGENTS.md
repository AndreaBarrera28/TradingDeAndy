# AGENTS.md — Guía Permanente para Agentes de IA

Este archivo contiene toda la información necesaria para que cualquier agente de IA pueda entender, mantener y extender el proyecto TradingDeAndy correctamente.

---

## Descripción del Proyecto

TradingDeAndy es un **trading journal** (bitácora de operaciones) para traders de Forex y CFDs. Permite registrar operaciones, analizar entradas usando conceptos ICT/SMC (Inner Circle Trader / Smart Money Concepts), consultar precios en vivo y hacer seguimiento de la efectividad a través de métricas estadísticas.

**Propósito principal:** Ayudar al trader a registrar cada operación de forma estructurada, analizar la calidad de la entrada mediante detección automática de patrones, evaluar la efectividad con métricas objetivas, y aprender registrando emociones y lecciones.

**Estado:** Desarrollo activo. Proyecto personal, mono-usuario.

---

## Objetivos

1. **Registro estructurado** de operaciones con todos los parámetros relevantes (par, dirección, precios, lote, etc.)
2. **Análisis técnico automático** usando 5 detectores de patrones ICT/SMC sobre velas de 1 hora
3. **Score de efectividad** (0-8) basado en la cantidad de factores de confluencia detectados
4. **Métricas estadísticas** globales: win rate, pips totales, distribución de confianza
5. **Precios en vivo** de 9 pares Forex mediante API externa
6. **Psicología de trading** registrando emociones y lecciones de cada operación

---

## Tecnologías Utilizadas

### Backend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| PHP | ^8.3 | Lenguaje base |
| Laravel Framework | ^13.8 | Framework backend |
| Laravel Sanctum | ^4.0 | Autenticación de API |
| Laravel Tinker | ^3.0 | REPL interactivo |
| Inertia Laravel | * | Frontend Inertia |
| SettingsController | — | Gestión de saldo y % de riesgo |
| MySQL | 8+ | Base de datos (local) |
| SQLite | — | Base de datos (por defecto/testing) |

### Frontend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| React | ^19.2 | UI library |
| Vite | ^8.0 | Build tool |
| React Router DOM | ^7.18 | Enrutamiento SPA |
| Axios | ^1.18 | Cliente HTTP |
| Tailwind CSS | ^4.0 | Estilos utility-first |

### Frontend Inertia (alternativo)
| Tecnología | Versión |
|------------|---------|
| @inertiajs/react | ^3.4 |
| laravel-vite-plugin | ^3.1 |

### Dev/Herramientas
| Tecnología | Propósito |
|------------|-----------|
| PHPUnit ^12.5 | Tests |
| Laravel Pint ^1.27 | PHP code style |
| ESLint ^10.3 | JS linting |
| Mockery ^1.6 | Mocking para tests |
| Faker ^1.23 | Generación de datos falsos |

---

## Arquitectura

### Diagrama simplificado

```
Navegador (SPA React)
       │
       │ Axios (HTTP/JSON)
       ▼
Laravel API ───→ MySQL/SQLite
       │
       ├──→ AwesomeAPI (precios Forex)
       └──→ Yahoo Finance (datos OHLC)
```

### Stack
- **Monorepo:** Backend + dos frontends en un mismo repositorio
- **API-first:** El backend es una API RESTful consumida por el frontend SPA
- **Dos frontends coexistiendo:** `frontend/` (SPA React puro, versión más completa) y `resources/js/` (SPA Inertia.js, versión básica)
- **Sin capa de servicios:** La lógica de negocio reside directamente en los controladores

### Flujo de datos

1. Usuario interactúa con la SPA React
2. SPA llama a la API Laravel mediante Axios
3. Laravel procesa la request, consulta/escribe en BD mediante Eloquent
4. Para análisis técnico, Laravel consulta Yahoo Finance y procesa velas
5. Para precios en vivo, Laravel consulta AwesomeAPI
6. Respuesta JSON retorna al frontend

---

## Convenciones

### Naming
- **PHP:** clases en PascalCase, métodos/variables en camelCase, tablas/columnas en snake_case
- **JS/React:** componentes en PascalCase, funciones/variables en camelCase, archivos de componentes en PascalCase.jsx, archivos utilitarios en camelCase.js
- **BD:** tablas en plural (`trades`, `users`), columnas descriptivas (`entry_price`, `confluence_score`)

### Estructura de archivos React
- Cada página en su propio archivo dentro de `pages/`
- Componentes compartidos en `components/`
- Lógica de API en `api/`

### Estilo CSS
- Tailwind CSS utility classes exclusivamente (sin CSS personalizado)
- Tema oscuro: `bg-gray-950` fondo, `text-gray-100` texto, `emerald-400` acento
- Tarjetas: `bg-gray-900 rounded-xl border border-gray-800 p-5`

### Commits
- Sin convención estricta definida aún
- Mensajes descriptivos en español o inglés

---

## Reglas de Desarrollo

### Reglas generales
1. NO modificar archivos en `vendor/` ni `node_modules/`
2. NO modificar el `.env` de producción, solo `.env.example`
3. NO commitear credenciales, API keys, ni tokens
4. NO subir archivos generados (build, cache, logs)
5. NO eliminar migraciones existentes sin aprobación
6. NO cambiar versiones de dependencias sin verificar compatibilidad
7. Siempre ejecutar `php artisan migrate` después de crear migraciones
8. Siempre verificar que la build de assets funciona después de cambios en frontend

### Al trabajar con la base de datos
1. Crear NUEVAS migraciones — nunca editar una existente (excepto para rollback en desarrollo)
2. Usar tipos de columna explícitos (`decimal(14,5)`, `tinyint unsigned`)
3. Agregar `nullable()` cuando el campo puede estar vacío
4. Usar `foreignId()` para claves foráneas

### Al trabajar con el frontend
1. Seguir el esquema de colores existente (gray-950/900, emerald, border-gray-800)
2. Usar `onChange` handlers con el patrón `handleChange`
3. No usar TypeScript — todo en JSX
4. No añadir comentarios en JSX ni PHP a menos que sea estrictamente necesario

---

## Agent Rules

Reglas de conducta obligatorias para cualquier agente de IA que trabaje en este proyecto.

### Antes de modificar código, comprender el contexto
- Leer los archivos relevantes antes de editarlos
- Entender cómo se relaciona el cambio con el resto del sistema
- Revisar la documentación existente en `docs/` y `AGENTS.md`
- Identificar dependencias y efectos secundarios del cambio

### Mantener la arquitectura existente
- No cambiar el patrón arquitectónico del proyecto (API-first, monorepo, controladores con lógica inline)
- Si se identifica una mejora arquitectónica, proponerla como议题 antes de implementar
- Respetar la separación actual: controladores con lógica, modelos con Eloquent, frontend con React

### No duplicar lógica
- Antes de escribir código nuevo, buscar si ya existe una función similar
- Extraer lógica repetida a funciones compartidas
- En PHP, usar métodos privados en el controlador si es lógica relacionada
- En JS, crear funciones utilitarias en archivos separados si se usan en múltiples componentes

### Reutilizar servicios existentes
- Para llamadas a APIs externas, usar `Http::` facade de Laravel (ya implementado en los controladores)
- Para acceso a BD, usar Eloquent (modelos `Trade` y `User`)
- Para consultas desde el frontend, añadir funciones al archivo `frontend/src/api/trades.js`
- No crear nuevos clientes HTTP ni nuevas instancias de Axios sin justificación

### No romper compatibilidad
- No cambiar nombres de rutas API existentes (el frontend las consume)
- No cambiar la estructura de respuestas JSON sin actualizar el frontend simultáneamente
- No renombrar columnas de BD sin una migración y actualización de modelos
- No eliminar props de componentes React sin verificar todos los usos
- Al agregar campos opcionales, mantener los existentes funcionales

### Documentar cada cambio importante
- Al agregar un nuevo endpoint, documentarlo en `docs/api.md`
- Al agregar una columna a la BD, documentarla en `docs/database.md`
- Al crear un nuevo componente o página, mencionarlo en `docs/frontend.md`
- Los cambios en lógica de análisis deben reflejarse en `docs/backend.md`

### Mantener actualizados los documentos dentro de /docs
- Cada PR o cambio significativo debe incluir la actualización de docs correspondiente
- Verificar que los ejemplos de API en `docs/api.md` sigan siendo válidos
- Mantener el glosario (`docs/glossary.md`) actualizado con nuevos términos

### Si cambia una arquitectura o flujo, actualizar también AGENTS.md
- `AGENTS.md` es la fuente de verdad para los agentes de IA
- Cualquier cambio en la arquitectura, flujo de datos, o convenciones debe reflejarse aquí
- Mantener sincronizado `AGENTS.md` con la documentación en `docs/`
- Si se añaden/eliminan dependencias, actualizar las tablas de tecnologías

### Actualizar automáticamente docs/ y AGENTS.md ante cambios estructurales
Cada vez que se realice uno de los siguientes cambios, el agente debe actualizar `docs/` y `AGENTS.md` **antes de terminar la tarea**:
- Nueva API (endpoint o ruta) → actualizar `docs/api.md`
- Nueva entidad o modelo → actualizar `docs/backend.md`, `docs/database.md`, `docs/glossary.md`
- Nueva tabla o migración → actualizar `docs/database.md`, `AGENTS.md` (estructura de carpetas si aplica)
- Nueva integración externa → actualizar `docs/backend.md`, `docs/glossary.md`
- Cambio de arquitectura → actualizar `docs/architecture.md`, `AGENTS.md`
- Cambio de autenticación → actualizar `docs/authentication.md`
- Cambio importante de frontend (nueva página, ruta, componente principal) → actualizar `docs/frontend.md`
- Nuevo módulo o directorio → actualizar la estructura de carpetas en `AGENTS.md`

---

## Estructura de Carpetas

```
TradingDeAndy/
├── app/                           # Backend Laravel
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Controller.php        # Clase base abstracta
│   │   │   ├── TradeController.php   # CRUD + stats + prices
│   │   │   ├── AnalysisController.php # Análisis técnico ICT + RR + detección de sesión NY
│   │   │   └── SettingsController.php # Config de riesgo (balance, %)
│   │   └── Middleware/
│   │       └── HandleInertiaRequests.php
│   ├── Models/
│   │   ├── User.php
│   │   └── Trade.php
│   └── Providers/
│       └── AppServiceProvider.php
├── bootstrap/                     # Arranque de Laravel
├── config/                        # Configuración (11 archivos)
├── database/
│   ├── factories/                 # Model factories
│   ├── migrations/                # Migraciones de BD
│   ├── seeders/                   # Database seeders
│   └── database.sqlite            # BD por defecto
├── docs/                          # Documentación del proyecto
├── frontend/                      # SPA React independiente
│   └── src/
│       ├── api/trades.js          # Cliente Axios
│       ├── components/Layout.jsx
│       ├── pages/
│       │   ├── Dashboard.jsx
│       │   └── Trades/
│       │       ├── Index.jsx
│       │       └── Create.jsx
│       ├── App.jsx                # Router
│       ├── main.jsx               # Entry point
│       └── index.css
├── resources/                     # Frontend Inertia + Vistas Blade
│   ├── css/app.css
│   ├── js/
│   │   ├── app.jsx
│   │   ├── Layout.jsx
│   │   └── pages/
│   │       ├── Dashboard.jsx
│   │       └── Trades/
│   │           ├── Index.jsx
│   │           └── Create.jsx
│   └── views/
│       ├── app.blade.php          # Layout Inertia
│       └── welcome.blade.php      # Landing default
├── routes/
│   ├── api.php                    # Rutas API REST
│   ├── web.php                    # Ruta raíz
│   └── console.php                # Comandos Artisan
├── public/                        # Archivos públicos
├── storage/                       # Logs, cache, sesiones
├── tests/                         # Tests PHPUnit
├── .env                           # Variables de entorno
├── .env.example                   # Ejemplo de entorno
├── .gitignore
├── composer.json
├── package.json                   # Dependencias frontend Inertia
├── vite.config.js                 # Vite config unificada
├── phpunit.xml
└── AGENTS.md                      # Este archivo
```

---

## Estándares de Código

### PHP
- PSR-4 autoloading (`App\` → `app/`)
- PSR-12 style (aplicar con `vendor/bin/pint`)
- PHP 8.3 type hints en parámetros y retornos
- Atributos PHP 8 nativos (`#[Fillable]`, `#[Hidden]`)
- Validación inline en controladores (no Form Requests)
- Modelos Eloquent con `$fillable` y `casts()`
- NO usar Services/Repositories (la lógica va en controladores)

### JavaScript/React
- ES Modules (`"type": "module"`)
- Functional components con hooks
- NUNCA usar clases de React
- `export default function` para componentes
- Estados con `useState`, efectos con `useEffect`
- Navegación con `useNavigate`, `useLocation`
- API calls con Axios
- Errores manejados con `try/catch` y `alert()`

### CSS
- Tailwind CSS v4 utility-first
- Sin archivos CSS personalizados
- Sin clases CSS nombradas
- Tema oscuro consistente

### Base de Datos
- Migraciones con nombre descriptivo: `YYYY_MM_DD_HHMMSS_descripcion.php`
- Timestamps automáticos (`created_at`, `updated_at`)
- `nullable()` explícito para campos opcionales
- Enums nativos de MySQL para valores fijos

---

## Cómo Ejecutar el Proyecto

### Requisitos previos
- PHP ^8.3
- Composer 2.x
- Node.js 20+
- NPM 10+
- MySQL 8+ (opcional, por defecto usa SQLite)

### Setup inicial

```bash
# 1. Instalar dependencias PHP
composer install

# 2. Configurar .env
copy .env.example .env   # Windows
php artisan key:generate

# 3. Configurar BD en .env (ejemplo MySQL)
# DB_CONNECTION=mysql
# DB_DATABASE=trading_andy

# 4. Migrar base de datos
php artisan migrate

# 5. Instalar dependencias frontend
npm install --ignore-scripts

# 6. Build de assets (para frontend Inertia)
npm run build
```

### Desarrollo

**Opción 1: Todo en uno**
```bash
composer dev
```
Esto ejecuta: `php artisan serve` + `php artisan queue:listen` + `php artisan pail` + `npm run dev`

**Opción 2: Por separado**
```bash
# Terminal 1 - Backend
php artisan serve

# Terminal 2 - Frontend Inertia (hot reload)
npm run dev

# Terminal 3 - Frontend SPA independiente
cd frontend
npm run dev
```

### Acceso
- API Backend: http://localhost:8000/api
- Frontend Inertia: http://localhost:8000
- Frontend SPA: http://localhost:5173

---

## Cómo Ejecutar Pruebas

```bash
# Tests completos
composer test

# O directamente
php artisan test

# Tests específicos
php artisan test --filter=NombredelTest

# Con PHPUnit directamente
vendor/bin/phpunit
```

**Configuración de testing:** `phpunit.xml` usa SQLite en memoria, array cache, sync queue.

**Nota:** Actualmente no hay tests escritos. La configuración está lista para agregarlos en `tests/Unit/` y `tests/Feature/`.

---

## Cómo Crear Migraciones

```bash
# Crear una nueva migración
php artisan make:migration create_xxx_table
php artisan make:migration add_xxx_to_xxx_table

# Ejecutar migraciones pendientes
php artisan migrate

# Rollback de la última migración
php artisan migrate:rollback

# Ver estado de migraciones
php artisan migrate:status

# Refresh (rollback + migrate)
php artisan migrate:refresh

# Fresh (drop todas las tablas + migrate)
php artisan migrate:fresh
```

**Reglas:**
1. Nombrar la migración con prefijo de fecha + descripción clara
2. NO editar migraciones existentes (crear nuevas para modificaciones)
3. Incluir siempre `up()` y `down()`
4. Probar `migrate:rollback` después de crear para verificar reversibilidad

---

## Cómo Agregar Nuevas Funcionalidades

### Nueva ruta API
1. Agregar ruta en `routes/api.php`
2. Crear método en el controlador correspondiente
3. Si es necesario, crear nuevo controlador en `app/Http/Controllers/`
4. Registrar en `routes/api.php`

### Nueva página en frontend SPA
1. Crear archivo en `frontend/src/pages/`
2. Agregar ruta en `frontend/src/App.jsx`
3. Si necesita datos de API, agregar función en `frontend/src/api/trades.js`

### Nueva funcionalidad de análisis
1. Agregar método detector privado en `AnalysisController.php`
2. Llamar al detector desde el método `detect()`
3. Incrementar el score si se detecta
4. Agregar el factor al array de respuesta

### Nuevo campo en la BD
1. Crear migración para agregar la columna
2. Ejecutar `php artisan migrate`
3. Actualizar `$fillable` y `casts()` en el modelo `Trade`
4. Actualizar validación en `TradeController`
5. Actualizar el formulario en el frontend

### Nueva página en frontend Inertia
1. Crear archivo en `resources/js/pages/`
2. Se carga automáticamente por Inertia (resolución por nombre)
3. Agregar enlace en `resources/js/Layout.jsx`

---

## Flujo Git

### Inicializar repo (si no existe)
```bash
git init
git add .
git commit -m "Initial commit"
```

### Trabajo diario
```bash
# Ver cambios
git status
git diff

# Preparar archivos específicos
git add app/Http/Controllers/TradeController.php
git add frontend/src/pages/Trades/Create.jsx

# Commit
git commit -m "Descripción clara del cambio"

# Ver historial
git log --oneline -10
```

### Reglas Git
- NO commitear `.env`, `vendor/`, `node_modules/`, `storage/`, `public/build/`
- NO commitear archivos de IDE (`.idea/`, `.vscode/`, `.zed/`)
- Mensajes de commit descriptivos en español o inglés
- NO hacer push sin verificar que la build funciona
- NO forzar push (--force) a menos que sea estrictamente necesario

---

## Qué Archivos Nunca Modificar

| Archivo | Razón |
|---------|-------|
| `.env` | Configuración local personal, no se comparte |
| `vendor/` | Dependencias PHP gestionadas por Composer |
| `node_modules/` | Dependencias JS gestionadas por NPM |
| `composer.lock` | Generated by Composer |
| `package-lock.json` | Generated by NPM |
| `.gitignore` | Solo si es necesario agregar/excluir patrones |
| `storage/` | Archivos de runtime (logs, cache, etc.) |
| `public/build/` | Assets compilados por Vite |
| `public/hot` | Archivo generado por Vite en desarrollo |
| `bootstrap/cache/*.php` | Cache de Laravel, se regenera automáticamente |

### Archivos que requieren cuidado
- **Migraciones existentes:** NO editar. Crear nuevas migraciones para cambios.
- **`routes/api.php`:** Las rutas existentes tienen clientes (frontend). Cambiar rutas = actualizar frontend.
- **`config/sanctum.php`:** Configuración de seguridad. Cambios aquí afectan la autenticación.
- **`composer.json`:** Cambiar dependencias con cuidado, verificar compatibilidad con Laravel 13.

---

## Cómo Mantener la Documentación

La documentación vive en `docs/` y sigue esta estructura:

```
docs/
├── overview.md          # Visión general del proyecto
├── architecture.md      # Arquitectura y estructura
├── backend.md           # Backend (controladores, modelos)
├── frontend.md          # Frontend (ambas implementaciones)
├── database.md          # Base de datos (migraciones, esquema)
├── api.md               # Documentación de la API REST
├── authentication.md    # Autenticación (Sanctum)
├── coding-standards.md  # Estándares de código
├── deployment.md        # Despliegue y operaciones
└── glossary.md          # Glosario de términos
```

### Reglas para mantener docs
1. Actualizar `docs/` cuando se agreguen o cambien funcionalidades
2. Mantener `AGENTS.md` sincronizado con la documentación en `docs/`
3. Actualizar ejemplos de API cuando cambien endpoints o formatos de respuesta
4. Actualizar el esquema de BD cuando se agreguen migraciones
5. No documentar código obvio — enfocarse en decisiones, convenciones y flujos
6. Usar español para el contenido (el proyecto es en español)

---

## Notas para el Agente

- El proyecto tiene **DOS frontends**: el principal es `frontend/` (SPA React con React Router). El de `resources/js/` (Inertia) es secundario.
- **No hay autenticación activa** — las rutas API no requieren login.
- **No hay tests escritos** — la configuración de PHPUnit está lista pero vacía.
- El análisis técnico usa datos de **Yahoo Finance** (gratuito, sin API key).
- Los precios en vivo usan **AwesomeAPI** (gratuito, sin API key).
- La lógica de detección de patrones ICT está en `AnalysisController.php` y usa algoritmos simples sobre arrays de velas.
- Para cambios en el frontend SPA, trabajar en `frontend/`. Para el frontend Inertia, trabajar en `resources/js/`.
- `welcome.blade.php` es el template default de Laravel y no se usa en la app real.
