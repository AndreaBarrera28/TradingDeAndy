# Coding Standards

Este documento describe las convenciones de código utilizadas en el proyecto.

---

## PHP

### Estilo
- **PSR-4** para autoloading (`App\` → `app/`)
- **PSR-12** para estilo de código (seguido por defecto en Laravel)
- Herramienta: **Laravel Pint** (`laravel/pint`) disponible como devDependency

### Convenciones

| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| Namespaces | `App\Http\Controllers`, `App\Models` | |
| Nombres de clases | PascalCase | `TradeController`, `AnalysisController` |
| Nombres de métodos | camelCase | `store()`, `detectLiquiditySweep()` |
| Nombres de variables | camelCase | `$validated`, `$currentPrice` |
| Nombres de tablas | snake_case plural | `trades`, `users` |
| Nombres de columnas | snake_case | `entry_price`, `lot_size` |
| Propiedades de modelo | snake_case en `$fillable` | `'stop_loss'`, `'take_profit'` |

### Tipado
- PHP 8.3 con type hints en parámetros y retornos
- Atributos nativos de PHP 8 (`#[Fillable]`, `#[Hidden]`)

```php
public function store(Request $request): JsonResponse
{
    //
}

private function detectLiquiditySweep(array $candles): array
{
    //
}
```

### Validación
- Reglas de validación inline en los controladores
- No se usan Form Requests

### Eloquent
- Modelos con `$fillable` (mass assignment protection)
- Casts definidos con el método `casts()` (PHP 8 atributos para `Fillable`/`Hidden`)
- JSON cast para `confluence_factors` (array automático)
- No se usan scopes, accesores o mutadores

---

## JavaScript / React

### Estilo
- **ESLint** configurado (solo en `frontend/`)
- **ES Modules** (`"type": "module"` en package.json)

### Convenciones

| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| Nombres de componentes | PascalCase | `TradeCreate`, `Layout` |
| Nombres de funciones | camelCase | `getTrades()`, `handleSubmit()` |
| Nombres de variables | camelCase | `currentPrice`, `confluenceFactors` |
| Nombres de archivos | PascalCase para componentes | `Dashboard.jsx`, `Create.jsx` |
| Nombres de archivos | camelCase para utilidades | `trades.js` |
| Extensiones de React | `.jsx` | (no `.tsx` — no hay TypeScript) |

### Hooks
- `useState`, `useEffect` para estado y efectos
- `useNavigate`, `useLocation`, `useParams` de React Router
- No se usan custom hooks

### Estructura de Componentes
```jsx
export default function ComponentName() {
  const [state, setState] = useState(null)

  useEffect(() => {
    // side effects
  }, [])

  function handleAction() {
    // event handlers
  }

  return (
    // JSX
  )
}
```

### API Calls
```javascript
import axios from 'axios'
const api = axios.create({ baseURL: '/api' })

export function getTrades() {
  return api.get('/trades').then(r => r.data)
}
```

### Manejo de Errores
- Try/catch en operaciones asíncronas
- Alert() para errores (sin UI de errores dedicada)

---

## CSS / Tailwind

- **Tailwind CSS v4** utility-first
- Sin archivos CSS personalizados (excepto `index.css` con `@import 'tailwindcss'`)
- Sin clases CSS nombradas (todo inline con utilidades)

### Esquema de Colores Consistente

| Propósito | Clase |
|-----------|-------|
| Fondo principal | `bg-gray-950` |
| Fondo de tarjeta | `bg-gray-900` |
| Borde de tarjeta | `border-gray-800` |
| Texto principal | `text-gray-100` |
| Texto secundario | `text-gray-400`, `text-gray-500` |
| Acento primario | `emerald-400` (texto), `emerald-600` (bg) |
| Badge ALTA | `bg-emerald-900/40 text-emerald-400` |
| Badge MEDIA | `bg-yellow-900/40 text-yellow-400` |
| Badge BAJA | `bg-red-900/40 text-red-400` |
| Compra | `bg-emerald-900/50 text-emerald-400` |
| Venta | `bg-red-900/50 text-red-400` |

---

## Base de Datos

- Migraciones con nombres descriptivos en inglés
- Columnas con tipos explícitos (`decimal(14,5)`, `tinyint unsigned`)
- `created_at` / `updated_at` automáticos (timestamps)
- `nullable()` explícito cuando aplica
- Enums nativos de MySQL para campos con valores fijos

---

## Control de Versión

- **Git** (`.gitignore` configurado)
- Archivos ignorados: `node_modules/`, `vendor/`, `.env`, `storage/`, `*.log`
- Sin convención de commits definida (no hay commits en el proyecto)

---

## Lo que NO se usa

| Tecnología | Nota |
|-----------|------|
| TypeScript | Todo el frontend es JSX plano |
| Tests | PHPUnit configurado pero sin tests |
| Form Requests | Validación inline en controladores |
| Services/Repositories | Lógica en controladores |
| DTOs/Value Objects | No implementados |
| Storybook | No implementado |
| CI/CD | No configurado |
| Prettier | Solo ESLint |
