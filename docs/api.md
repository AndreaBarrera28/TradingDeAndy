# API REST

## Base URL

```
http://localhost:8000/api
```

## Autenticación

Actualmente las rutas **no tienen middleware de autenticación** activo. Sanctum está configurado pero no aplicado a las rutas. Esto significa que cualquier petición a la API es aceptada.

Para proteger las rutas en el futuro, añadir el middleware `auth:sanctum` en `routes/api.php`.

---

## Endpoints

### 1. Listar Trades

```
GET /api/trades
```

**Respuesta (200):**
```json
[
  {
    "id": 1,
    "status": "analyzed",
    "date": "2026-06-20T14:30:00.000000Z",
    "pair": "EURUSD",
    "direction": "buy",
    "entry_price": "1.12345",
    "exit_price": "1.12450",
    "stop_loss": "1.12000",
    "take_profit": "1.12600",
    "lot_size": "0.10",
    "result": "win",
    "pips": "10.5",
    "confluence_score": 6,
    "confluence_factors": ["sweep", "bos", "orderblock"],
    "setup_notes": "Análisis automático del mercado...",
    "entry_reason": "Ruptura de estructura alcista",
    "exit_reason": null,
    "emotions": "calmado",
    "lessons": "Esperar confirmación",
    "created_at": "2026-06-20T14:30:00.000000Z",
    "updated_at": "2026-06-20T14:30:00.000000Z"
  }
]
```

Los trades se devuelven ordenados por `date` descendente. `confluence_factors` se decodifica de JSON a array automáticamente.

---

### 2. Crear Trade

```
POST /api/trades
```

**Body (JSON):**
```json
{
  "status": "analyzed",
  "date": "2026-06-20T14:30",
  "pair": "EURUSD",
  "direction": "buy",
  "entry_price": 1.12345,
  "exit_price": null,
  "stop_loss": 1.12000,
  "take_profit": 1.12600,
  "lot_size": 0.01,
  "result": null,
  "pips": null,
  "confluence_score": 5,
  "confluence_factors": ["sweep", "bos"],
  "setup_notes": "Notas...",
  "entry_reason": "Razón...",
  "emotions": "calmado",
  "lessons": "Lección..."
}
```

**Respuesta (201):**
```json
{
  "id": 1,
  "status": "analyzed",
  ...
}
```

**Validaciones:**
| Campo | Tipo | Obligatorio |
|-------|------|-------------|
| date | date | ✅ |
| pair | string, max:10 | ✅ |
| direction | in:buy,sell | ✅ |
| entry_price | numeric | ✅ |
| lot_size | numeric, min:0.01 | ✅ |
| status | in:open,closed,analyzed | ❌ (default: "analyzed") |
| exit_price | numeric | ❌ |
| stop_loss | numeric | ❌ |
| take_profit | numeric | ❌ |
| result | in:win,loss,breakeven | ❌ |
| pips | numeric | ❌ |
| confluence_score | integer, 0-10 | ❌ |
| confluence_factors | array | ❌ |
| setup_notes | string | ❌ |
| entry_reason | string | ❌ |
| exit_reason | string | ❌ |
| emotions | string, max:255 | ❌ |
| lessons | string | ❌ |

---

### 3. Actualizar Trade

```
PUT /api/trades/{id}
```

Mismas validaciones que `store` pero todos los campos son `sometimes` (actualización parcial).

**Uso principal:** Cerrar un trade enviando `exit_price`, `result` y `pips`:

```json
{
  "status": "analyzed",
  "exit_price": 1.12450,
  "result": "win",
  "pips": 10.5
}
```

**Respuesta (200):** El trade actualizado con `fresh()`.

---

### 4. Estadísticas

```
GET /api/stats
```

**Respuesta (200):**
```json
{
  "total": 25,
  "analyzed": 20,
  "wins": 15,
  "losses": 5,
  "breakevens": 5,
  "win_rate": 60.0,
  "total_pips": 152.3,
  "avg_confluence": 4.5,
  "high_conf_pct": 40,
  "med_conf_pct": 35,
  "low_conf_pct": 25
}
```

**Respuesta vacía (sin trades):**
```json
{
  "total": 0,
  "analyzed": 0,
  "wins": 0,
  "losses": 0,
  "breakevens": 0,
  "win_rate": 0,
  "total_pips": 0,
  "avg_confluence": 0,
  "high_conf_pct": 0,
  "med_conf_pct": 0,
  "low_conf_pct": 0
}
```

**Cálculos:**
- `win_rate`: (wins / trades cerrados con resultado) × 100, 1 decimal
- `total_pips`: suma de pips de trades con status closed/analyzed
- `avg_confluence`: promedio de confluence_score
- `high_conf_pct`: % con score ≥ 6
- `med_conf_pct`: % con score 3-5
- `low_conf_pct`: % con score < 3

---

### 5. Precios en Vivo

```
GET /api/prices
```

**Respuesta (200):**
```json
{
  "EURUSD": {
    "bid": 1.1234,
    "ask": 1.1236,
    "var": 0.05
  },
  "GBPUSD": {
    "bid": 1.2567,
    "ask": 1.2569,
    "var": -0.12
  },
  ...
}
```

**Fuente:** [AwesomeAPI](https://economia.awesomeapi.com.br) — cotizaciones gratuitas de Forex.

**Pares consultados:** EURUSD, GBPUSD, USDJPY, EURJPY, AUDUSD, USDCAD, NZDUSD, XAUUSD, XAGUSD

**Error:** Si la API externa falla, devuelve `{}` con status 200.

---

### 6. Análisis Técnico

```
GET /api/analyze?pair=EURUSD
```

**Parámetros:**
| Parámetro | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| pair | string | ✅ | Par Forex (ej: EURUSD) |

**Respuesta (200):**
```json
{
  "pair": "EURUSD",
  "current_price": 1.12345,
  "tendency": {
    "direction": "alcista",
    "strength": "fuerte"
  },
  "score": 3,
  "factors": [
    {
      "key": "sweep",
      "label": "Barrida de Liquidez (1H)",
      "detail": "Barrida de máximo 1.12450 → reversión bajista"
    },
    {
      "key": "bos",
      "label": "Ruptura de Estructura (1H)",
      "detail": "Estructura alcista: mínimos ascendentes"
    },
    {
      "key": "fvg",
      "label": "Desequilibrio / FVG",
      "detail": "FVG alcista: gap de 1.12200 a 1.12250"
    }
  ],
  "total_factors": 3,
  "recent_candles": [
    {
      "time": 1687000000,
      "open": 1.12300,
      "high": 1.12350,
      "low": 1.12280,
      "close": 1.12330
    }
  ]
}
```

**Error (502):**
```json
{
  "error": "No se pudieron obtener datos"
}
```

**Score:** Se calcula como el número de factores detectados (máximo 8).

**Fuente:** Yahoo Finance API (`query1.finance.yahoo.com/v8/finance/chart`).

---

## Manejo de Errores

Todas las rutas devuelven JSON. Las excepciones se renderizan como JSON automáticamente para peticiones a `/api/*` (configurado en `bootstrap/app.php`).

| Código | Significado |
|--------|-------------|
| 200 | OK |
| 201 | Creado (store) |
| 422 | Error de validación |
| 502 | Error de API externa (AnalysisController) |
| 404 | No encontrado (model binding) |

---

## Notas de Desarrollo

- Las rutas no están agrupadas con prefijo `api/` en el archivo de rutas (se añade automáticamente por Laravel por estar en `routes/api.php`)
- No hay rate limiting aplicado
- No hay versionado de API
- No hay documentación OpenAPI/Swagger
