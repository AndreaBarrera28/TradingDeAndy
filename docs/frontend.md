# Frontend

El proyecto contiene **dos implementaciones de frontend**. A continuación se documenta cada una.

---

## Frontend #1: SPA React Independiente (`frontend/`)

Esta es la versión principal y más completa del frontend.

### Stack

- **React** ^19.2.6
- **Vite** ^8.0.12
- **React Router DOM** ^7.18.0
- **Axios** ^1.18.0
- **Tailwind CSS** ^4.3.1
- **ESLint** ^10.3.0

### Scripts

```bash
npm run dev      # Inicia servidor de desarrollo (Vite)
npm run build    # Build de producción
npm run lint     # ESLint
npm run preview  # Vista previa del build
```

### Estructura

```
frontend/
├── src/
│   ├── api/
│   │   └── trades.js           # Cliente HTTP (Axios)
│   ├── components/
│   │   └── Layout.jsx          # Layout principal con navegación
│   ├── pages/
│   │   ├── Dashboard.jsx       # Página de inicio / métricas
│   │   └── Trades/
│   │       ├── Index.jsx       # Bitácora / listado de trades
│   │       └── Create.jsx      # Formulario de nuevo trade
│   ├── App.jsx                 # Router (BrowserRouter)
│   ├── main.jsx                # Entry point
│   └── index.css               # Import de Tailwind
├── index.html
├── vite.config.js
├── package.json
├── eslint.config.js
└── public/
```

### API Client (`src/api/trades.js`)

```javascript
import axios from 'axios'
const api = axios.create({ baseURL: '/api' })
```

**Funciones:**

| Función | Método HTTP | Endpoint |
|---------|-------------|----------|
| `getTrades()` | GET | `/api/trades` |
| `getStats()` | GET | `/api/stats` |
| `createTrade(data)` | POST | `/api/trades` |
| `updateTrade(id, data)` | PUT | `/api/trades/{id}` |
| `getPrices()` | GET | `/api/prices` |
| `analyzePair(pair, direction?)` | GET | `/api/analyze?pair={pair}&direction={direction}` |
| `getSettings()` | GET | `/api/settings` |
| `updateSettings(data)` | PUT | `/api/settings` |
| `getSession()` | GET | `/api/session` |

Todas devuelven `response.data` (promesa resuelta).

### Router (`App.jsx`)

```jsx
<BrowserRouter>
  <Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/trades" element={<TradesIndex />} />
    <Route path="/trades/create" element={<TradeCreate />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
</BrowserRouter>
```

### Componentes y Páginas

#### Layout (`components/Layout.jsx`)
- Barra de navegación superior con 3 links: Dashboard, Diario, + Nuevo Trade
- Highlight del link activo (emerald-400)
- Contenedor max-width 6xl, padding consistente
- Fondo gray-950, texto gray-100

#### Dashboard (`pages/Dashboard.jsx`)
- **Configuración de Riesgo:** Sección superior para ingresar saldo de cuenta y porcentaje de riesgo por entrada
  - Input de saldo ($) con step 0.01
  - Input de % de riesgo con step 0.1
  - Botón Guardar que persiste vía API (`PUT /api/settings`)
  - Muestra el riesgo máximo calculado en dólares
  - Autocarga los valores guardados al montar el componente
- 4 tarjetas de métricas principales:
  - Entradas Registradas (total)
  - Efectividad Promedio (avg_confluence / 8)
  - Win Rate (porcentaje)
  - Pips Totales
- **Estado vacío:** Si no hay trades, muestra botón "Registrar primera entrada"
- **Con datos:** Muestra:
  - Barras de distribución de efectividad (Alta/Media/Baja)
  - Tarjetas de trades en análisis y win rate detallado (W/L/BE)
- **Sesión NY:** Banner persistente entre la configuración de riesgo y las métricas. Muestra si NY está activa, cerrada, o es fin de semana. Consulta `GET /api/session` al montar el componente.

#### Trades Index (`pages/Trades/Index.jsx`)
- Tabla con columnas: Fecha, Par, Dirección, Entrada, SL/TP, Efectividad, Resultado
- Badge de confianza: ALTA (verde), MEDIA (amarillo), BAJA (rojo)
- Botón "+ resultado" inline para cerrar trades
- Formulario de cierre inline: precio salida, resultado (win/loss/breakeven), pips
- Ordenado por fecha descendente

#### Trade Create (`pages/Trades/Create.jsx`)
- **Formulario completo con:**
  - Fecha y hora (datetime-local)
  - Par (selector con 9 pares Forex)
  - Dirección (Buy/Sell)
  - Lote
  - Precios: Entrada, Stop Loss, Take Profit (con nudges ▲▼)
  - Precio actual en vivo con botón para auto-rellenar
  - Factores de confluencia (8 checkboxes)
  - Botón "Detectar confluencias" (análisis automático vía API)
  - Score de efectividad en tiempo real (0-8)
  - Badge de confianza (ALTA/MEDIA/BAJA) con color y mensaje
  - Notas del setup, razón de entrada, emociones, lecciones
- **Integración de precio en vivo:**
  - Llama a `getPrices()` al montar el componente
  - Muestra precio actual del par seleccionado
  - Botón para copiar precio actual a entrada/SL/TP
- **Análisis de Riesgo (RR):** Al detectar confluencias, el sistema ahora devuelve `risk_analysis` con:
  - **SL Sugerido:** Basado en soporte/resistencia más cercano, con distancia en pips
  - **TP Sugerido:** Basado en soporte/resistencia más cercano, con distancia en pips
  - **Lote Sugerido:** Calculado para arriesgar exactamente el % configurado del saldo
  - **Ratio RR:** Risk/Reward ratio (1:2.5, 1:1.2, etc.)
  - **Veredicto:** EXCELENTE (≥2.0), BUENA (≥1.5), REGULAR (≥1.0), MALA (<1.0)
  - Los valores de SL, TP y lote se auto-rellenan en el formulario
  - Se reinicia el análisis si cambia el par o la dirección
- **Auto-detección:**
  - Llama a `analyzePair()` con el par y la dirección seleccionada
  - Llena automáticamente factores, notas, SL, TP y lote sugerido
  - Muestra banner de sesión NY (verde si activa, rojo si cerrada, amarillo si próxima a cerrar)
- **Sesión NY:** Datos obtenidos de `result.session` en la respuesta de análisis. Mensaje contextual y hora ET.

### Temas y Estilos

- **Esquema de colores:**
  - Fondo: `bg-gray-950`
  - Texto: `text-gray-100`
  - Acento primario: `emerald-400/600`
  - Acento secundario: `purple-700` (botón de detección)
  - Badges: `emerald-900/40` (ALTA), `yellow-900/40` (MEDIA), `red-900/40` (BAJA)
- **Tipografía:** Sistema (sin fuente personalizada en este frontend)
- **Layout:** Max-width 6xl, padding 6 horizontal, 8 vertical

---

## Frontend #2: SPA Inertia (`resources/js/`)

Esta es una implementación alternativa que usa Inertia.js para servir React desde Laravel.

### Stack

- **React** ^19.2.7
- **Inertia.js React** ^3.4.0
- **Vite** ^8.0.0
- **Tailwind CSS** ^4.0.0
- **Fuente:** Instrument Sans ( Bunny CDN)

### Entry Point

`resources/js/app.jsx` usa `createInertiaApp` con resolución automática de páginas desde `./pages/**/*.jsx`.

### Layout Blade

`resources/views/app.blade.php` es el layout HTML que carga Inertia:
```blade
@viteReactRefresh
@vite('resources/js/app.jsx')
@inertiaHead
@inertia
```

### Componentes

- **Layout.jsx:** Misma estructura que el SPA independiente pero usando `<Link>` de Inertia
- **Dashboard.jsx:** Versión simplificada con 4 StatCards genéricos y enlace a crear trade
- **Trades/Index.jsx y Create.jsx:** Estructuras similares al SPA independiente pero más básicas

### Dependencias (package.json raíz)

```json
{
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "@vitejs/plugin-react": "^6.0.2",
    "laravel-vite-plugin": "^3.1",
    "tailwindcss": "^4.0.0",
    "vite": "^8.0.0",
    "concurrently": "^9.0.1"
  },
  "dependencies": {
    "@inertiajs/react": "^3.4.0",
    "react": "^19.2.7",
    "react-dom": "^19.2.7"
  }
}
```

### Vite Config

`vite.config.js` (raíz) configura:
- Plugin Laravel con input `resources/css/app.css` y `resources/js/app.jsx`
- Plugin React
- Plugin Tailwind CSS v4
- Fuente Instrument Sans via Bunny CDN
- Ignorar vistas compiladas de Laravel en watch

### CSS

`resources/css/app.css`:
```css
@import 'tailwindcss';
@source '../../vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php';
@source '../../storage/framework/views/*.php';
@theme {
    --font-sans: 'Instrument Sans', ui-sans-serif, system-ui, sans-serif, ...;
}
```

---

## Nota sobre los dos frontends

Ambos frontends coexisten en el repositorio pero **no están conectados entre sí**. El SPA independiente (`frontend/`) se sirve con su propio `vite dev` en un puerto diferente, mientras que el Inertia se sirve desde Laravel. El equipo debería decidir cuál mantener y cuál eliminar para evitar confusión y duplicación de esfuerzos.
