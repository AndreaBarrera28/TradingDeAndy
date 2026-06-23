# Backend — Laravel 13

## Versiones

- **PHP:** ^8.3
- **Laravel Framework:** ^13.8
- **Laravel Sanctum:** ^4.0 (autenticación API)
- **Inertia Laravel:** * (para el frontend Inertia)

## Estructura del Backend

```
app/
├── Http/
│   ├── Controllers/
│   │   ├── Controller.php
│   │   ├── TradeController.php
│   │   └── AnalysisController.php
│   └── Middleware/
│       └── HandleInertiaRequests.php
├── Models/
│   ├── User.php
│   └── Trade.php
└── Providers/
    └── AppServiceProvider.php
```

## Controladores

### Controller.php (Base)

```php
abstract class Controller
{
    //
}
```

Clase base abstracta de la que heredan todos los controladores. Actualmente vacía, preparada para añadir funcionalidad compartida en el futuro (ej. respuestas JSON estandarizadas).

---

### TradeController.php

Maneja todas las operaciones CRUD sobre trades, más estadísticas y precios en vivo.

#### Métodos

| Método | Ruta | Descripción |
|--------|------|-------------|
| `index()` | `GET /api/trades` | Lista todos los trades ordenados por fecha descendente. Decodifica `confluence_factors` de JSON a array. |
| `store(Request)` | `POST /api/trades` | Crea un nuevo trade con validación completa (15 campos). |
| `update(Request, Trade)` | `PUT /api/trades/{trade}` | Actualiza un trade existente (validación parcial). Usado principalmente para cerrar trades. |
| `stats()` | `GET /api/stats` | Calcula 10 métricas estadísticas. |
| `prices()` | `GET /api/prices` | Obtiene precios en vivo de 9 pares Forex desde AwesomeAPI. |

#### Validaciones (`store`)

| Campo | Reglas |
|-------|--------|
| `status` | `sometimes|in:open,closed,analyzed` |
| `date` | `required|date` |
| `pair` | `required|string|max:10` |
| `direction` | `required|in:buy,sell` |
| `entry_price` | `required|numeric` |
| `exit_price` | `nullable|numeric` |
| `stop_loss` | `nullable|numeric` |
| `take_profit` | `nullable|numeric` |
| `lot_size` | `required|numeric|min:0.01` |
| `result` | `nullable|in:win,loss,breakeven` |
| `pips` | `nullable|numeric` |
| `confluence_score` | `nullable|integer|min:0|max:10` |
| `confluence_factors` | `nullable|array` |
| `confluence_factors.*` | `string` |
| `setup_notes` | `nullable|string` |
| `entry_reason` | `nullable|string` |
| `exit_reason` | `nullable|string` |
| `emotions` | `nullable|string|max:255` |
| `lessons` | `nullable|string` |

#### Método `stats()` — Métricas calculadas

- `total`: Conteo total de trades
- `analyzed`: Trades con status `analyzed`
- `wins`: Trades cerrados con resultado `win`
- `losses`: Trades cerrados con resultado `loss`
- `breakevens`: Trades cerrados con resultado `breakeven`
- `win_rate`: (wins / closedTotal) * 100, redondeado a 1 decimal
- `total_pips`: Suma de pips de trades cerrados/analizados
- `avg_confluence`: Promedio de `confluence_score` (0-8)
- `high_conf_pct`: Porcentaje con score >= 6
- `med_conf_pct`: Porcentaje con score entre 3 y 5
- `low_conf_pct`: Porcentaje con score < 3

#### Método `prices()` — Pares soportados

Obtiene bid, ask y variación porcentual de:
EURUSD, GBPUSD, USDJPY, EURJPY, AUDUSD, USDCAD, NZDUSD, XAUUSD, XAGUSD

Usa la API de AwesomeAPI (`https://economia.awesomeapi.com.br/json/last/`) con código de par en formato `XXX-YYY`.

---

### AnalysisController.php

Realiza análisis técnico automático usando datos de Yahoo Finance.

#### Método `detect(Request)`

**Endpoint:** `GET /api/analyze?pair=EURUSD&direction=buy`

**Nuevo parámetro opcional:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `direction` | string | `buy` o `sell`. Filtra detección de barridas y calcula RR orientado a la dirección. |

Flujo:
1. Recibe el par a analizar
2. Convierte el par a código Yahoo Finance (ej: EURUSD → `EURUSD=X`)
3. Obtiene 120 velas de 1 hora desde Yahoo Finance
4. Ejecuta 5 detectores de patrones ICT
5. Calcula score basado en cuántos factores se detectaron
6. Retorna resultado incluyendo velas recientes, tendencia y factores

#### Mapeo de Pares a Yahoo Finance

| Par | Código Yahoo |
|-----|-------------|
| EURUSD | `EURUSD=X` |
| GBPUSD | `GBPUSD=X` |
| USDJPY | `USDJPY=X` |
| EURJPY | `EURJPY=X` |
| AUDUSD | `AUDUSD=X` |
| USDCAD | `USDCAD=X` |
| NZDUSD | `NZDUSD=X` |
| XAUUSD | `GC=F` |
| XAGUSD | `SI=F` |

#### Detectores de Patrones ICT

##### 1. Liquidity Sweep (Barrida de Liquidez)
- Analiza las últimas 40 velas (20 de lookback + 20 recientes)
- Detecta si el precio barrió un máximo reciente y cerró por debajo (bajista)
- O detecta si barrió un mínimo reciente y cerró por encima (alcista)

##### 2. Break of Structure (Ruptura de Estructura)
- Analiza las últimas 15 velas
- Detecta mínimos ascendentes (estructura alcista) o máximos descendentes (estructura bajista)
- Requiere 3 velas consecutivas confirmando la dirección

##### 3. Order Block (Bloque de Órdenes)
- Analiza las últimas 10 velas
- Detecta patrón: vela grande roja seguida de vela verde fuerte (alcista)
- O vela grande verde seguida de vela roja fuerte (bajista)
- Requiere que la tercera vela confirme la dirección

##### 4. FVG — Fair Value Gap (Desequilibrio)
- Analiza las últimas 15 velas
- Detecta gaps entre 3 velas consecutivas
- Alcista: low de vela 1 > high de vela 3
- Bajista: high de vela 1 < low de vela 3

##### 5. Support/Resistance (Soporte/Resistencia)
- Analiza todas las velas disponibles (al menos 30)
- Usa clustering de precios con umbral de 0.2% para agrupar niveles
- Filtra clusters con al menos 3 toques
- Encuentra el nivel S/R más cercano al precio actual (dentro de 1%)

#### Métodos privados de RR

| Método | Descripción |
|--------|-------------|
| `calculateRiskAnalysis(pair, currentPrice, direction, candles)` | Calcula SL/TP sugerido, pips, lote basado en 1% de riesgo, ratio RR y veredicto. |
| `pipsBetween(price1, price2, pair)` | Calcula distancia en pips entre dos precios según el par. |
| `estimatePipValue(pair, currentPrice)` | Estima el valor en dólares por pip para 1 lote estándar. |
| `verdictLabel(verdict)` | Retorna label, color y mensaje para cada veredicto (excelente/buena/regular/mala). |
| `detectSession()` | Detecta sesión de Nueva York (8-17 ET, lun-vie). Retorna sesiones activas, status, hora ET, alerta y mensaje contextual. |

**Nuevo endpoint:** `GET /api/session` — `AnalysisController::session()`, retorna mismo array que `detectSession()`. Independiente del análisis técnico.

**Incluido en `detect()`:** la respuesta de `/api/analyze` ahora incluye `session` en el JSON de respuesta.

#### Método `signal(Request)`

**Endpoint:** `GET /api/signal?pair=EURUSD`

Analiza el mercado sin requerir dirección. Detecta factores por separado para compra y venta, y determina el bias del mercado.

Flujo:
1. Recibe solo el par a analizar
2. Obtiene 120 velas de 1 hora desde Yahoo Finance
3. Ejecuta los 5 detectores clasificando cada factor como alcista o bajista
4. Si alcistas ≥ bajistas + 2 → señal buy; si bajistas ≥ alcistas + 2 → señal sell; si no → neutral
5. Calcula RR y SL/TP sugerido solo si hay señal clara
6. Retorna factores separados por bias, confianza y mensaje contextual

**Cálculo de riesgo:**
1. Toma el saldo y % de riesgo del usuario
2. Determina SL y TP basados en soportes/resistencias más cercanos
3. Calcula distancia en pips entre precio actual y SL/TP
4. Calcula lote sugerido: `riesgo_máximo / (pips_SL * valor_pip)`
5. Evalúa RR = TP_pips / SL_pips
6. Veredicto: ≥2.0 excelente, ≥1.5 buena, ≥1.0 regular, <1.0 mala

#### Tendencia

Calcula SMA5 y SMA20 de las últimas 20 velas:
- SMA5 > SMA20 y precio > SMA5 → alcista fuerte
- SMA5 > SMA20 → alcista débil
- SMA5 < SMA20 y precio < SMA5 → bajista fuerte
- SMA5 < SMA20 → bajista débil
- Otro → neutral

## Modelos

### Trade (`app/Models/Trade.php`)

```php
class Trade extends Model
{
    protected $fillable = [
        'status', 'date', 'pair', 'direction', 'entry_price', 'exit_price',
        'stop_loss', 'take_profit', 'lot_size', 'result', 'pips',
        'confluence_score', 'confluence_factors', 'setup_notes',
        'entry_reason', 'exit_reason', 'emotions', 'lessons',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'datetime',
            'entry_price' => 'decimal:5',
            'exit_price' => 'decimal:5',
            'stop_loss' => 'decimal:5',
            'take_profit' => 'decimal:5',
            'confluence_score' => 'integer',
            'confluence_factors' => 'array',   // JSON → array automático
        ];
    }
}
```

### User (`app/Models/User.php`)

Modelo estándar de Laravel con campos adicionales para gestión de riesgo:
- Fillable: `name`, `email`, `password`, `account_balance`, `risk_percentage`
- Hidden: `password`, `remember_token`
- Casts: `email_verified_at` → datetime, `password` → hashed, `account_balance` → decimal:2, `risk_percentage` → decimal:2
- Traits: `HasFactory`, `Notifiable`

### SettingsController (`app/Http/Controllers/SettingsController.php`)

Controlador para gestionar la configuración de riesgo del usuario.

| Método | Ruta | Descripción |
|--------|------|-------------|
| `show()` | `GET /api/settings` | Obtiene saldo y % de riesgo. Crea usuario si no existe. |
| `update(Request)` | `PUT /api/settings` | Guarda `account_balance` y `risk_percentage`. |

## Configuración Destacada

### bootstrap/app.php

- Rutas cargadas: web, api, console
- Health check en `/up`
- Middleware Inertia añadido al grupo web
- Excepciones renderizadas como JSON si la petición es a `/api/*`

### Providers

Solo `AppServiceProvider` registrado, ambos métodos (`register`, `boot`) vacíos.

## Middleware

### HandleInertiaRequests.php

Comparte datos de autenticación con las vistas Inertia (usuario logueado).
