# Arquitectura del Proyecto

## Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                    Cliente (Navegador)                    │
│  ┌──────────────────┐   ┌──────────────────────────┐    │
│  │  SPA React (1)   │   │  SPA Inertia React (2)   │    │
│  │  frontend/        │   │  resources/js/           │    │
│  │  localhost:5173   │   │  servido por Laravel     │    │
│  └────────┬─────────┘   └────────────┬─────────────┘    │
│           │                          │                    │
└───────────┼──────────────────────────┼────────────────────┘
            │        HTTP/JSON         │
            ▼                          ▼
┌──────────────────────────────────────────────────────────┐
│                Laravel Backend (localhost:8000)           │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ Routes   │  │ Controllers  │  │ Middleware         │  │
│  │ api.php  │→│ TradeCtrl    │  │ Sanctum            │  │
│  │ web.php  │  │ AnalysisCtrl │  │ HandleInertia      │  │
│  └──────────┘  └──────┬───────┘  └───────────────────┘  │
│                       │                                   │
│  ┌────────────────────▼───────────────────────────────┐  │
│  │              Models (Eloquent ORM)                  │  │
│  │  ┌─────────┐  ┌──────────┐                         │  │
│  │  │ User    │  │ Trade    │                         │  │
│  │  └─────────┘  └──────────┘                         │  │
│  └────────────────────┬───────────────────────────────┘  │
│                       │                                   │
│  ┌────────────────────▼───────────────────────────────┐  │
│  │              Database (MySQL/SQLite)                │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │        Integraciones Externas                       │  │
│  │  ┌──────────────┐  ┌──────────────────┐           │  │
│  │  │ AwesomeAPI   │  │ Yahoo Finance    │           │  │
│  │  │ (precios FX) │  │ (datos OHLC)     │           │  │
│  │  └──────────────┘  └──────────────────┘           │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

## Estructura de Directorios

```
TradingDeAndy/
│
├── app/                           # Código backend (Laravel)
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Controller.php         # Clase base abstracta
│   │   │   ├── TradeController.php    # CRUD + stats + prices
│   │   │   └── AnalysisController.php # Análisis técnico ICT
│   │   └── Middleware/
│   │       └── HandleInertiaRequests.php
│   ├── Models/
│   │   ├── User.php
│   │   └── Trade.php
│   └── Providers/
│       └── AppServiceProvider.php
│
├── bootstrap/                      # Arranque de Laravel
│   ├── app.php
│   ├── providers.php
│   └── cache/
│
├── config/                         # 11 archivos de configuración
│   ├── app.php
│   ├── auth.php
│   ├── cache.php
│   ├── database.php
│   ├── filesystems.php
│   ├── logging.php
│   ├── mail.php
│   ├── queue.php
│   ├── sanctum.php
│   ├── services.php
│   └── session.php
│
├── database/
│   ├── factories/
│   ├── migrations/                 # 8 migraciones
│   ├── seeders/
│   └── database.sqlite             # BD por defecto
│
├── frontend/                       # SPA React independiente
│   ├── src/
│   │   ├── api/
│   │   │   └── trades.js           # Cliente Axios
│   │   ├── components/
│   │   │   └── Layout.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   └── Trades/
│   │   │       ├── Index.jsx
│   │   │       └── Create.jsx
│   │   ├── App.jsx                 # Router principal
│   │   ├── main.jsx                # Entry point
│   │   └── index.css               # Tailwind imports
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── resources/                      # Frontend Inertia + Vistas Blade
│   ├── css/
│   │   └── app.css
│   ├── js/
│   │   ├── app.jsx                 # Entry point Inertia
│   │   ├── Layout.jsx
│   │   └── pages/
│   │       ├── Dashboard.jsx
│   │       └── Trades/
│   │           ├── Index.jsx
│   │           └── Create.jsx
│   └── views/
│       ├── app.blade.php           # Layout para Inertia
│       └── welcome.blade.php       # Landing page por defecto
│
├── routes/
│   ├── api.php                     # Rutas de la API REST
│   ├── web.php                     # Ruta raíz web
│   └── console.php                 # Comandos Artisan
│
├── public/                         # Archivos públicos
├── storage/                        # Logs, cache, sesiones
├── tests/                          # Tests PHPUnit (vacíos)
├── vendor/                         # Dependencias PHP
├── node_modules/                   # Dependencias JS (raíz)
│
├── composer.json
├── package.json                    # Dependencias frontend Inertia
├── vite.config.js                  # Config Vite unificada
└── .env                            # Variables de entorno
```

## Decisiones Arquitectónicas Clave

### 1. Monorepo con dos frontends
El proyecto contiene dos implementaciones de frontend. La versión en `frontend/` es la más completa y activa, mientras que `resources/js/` usa Inertia.js y está más esbozada. Esto sugiere que el proyecto está en migración o refactorización.

### 2. API-first
El backend expone una API RESTful (rutas en `routes/api.php`) que es consumida por el frontend SPA. La única ruta web (`/`) devuelve un JSON simple.

### 3. Dark theme consistente
Ambos frontends usan el mismo esquema de colores (fondo gray-950, acentos emerald, tipografía Instrument Sans).

### 4. Sin capa de servicios
La lógica de negocio reside directamente en los controladores, sin una capa de servicios o repositorios separada. Esto es adecuado para un proyecto pequeño pero podría escalar mal.

### 5. Integraciones externas directas
Las llamadas a APIs externas (AwesomeAPI, Yahoo Finance) se hacen desde los controladores mediante `Http::` facade, sin clientes ni adaptadores separados.
