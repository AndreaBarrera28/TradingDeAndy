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

### 5. Configuración de Riesgo

```
GET /api/settings
```

**Respuesta (200):**
```json
{
  "account_balance": 5000.00,
  "risk_percentage": 1.0
}
```

```
PUT /api/settings
```

**Body:**
```json
{
  "account_balance": 5000.00,
  "risk_percentage": 1.0
}
```

**Validaciones:**
| Campo | Tipo | Reglas |
|-------|------|--------|
| account_balance | numeric | required, min:0 |
| risk_percentage | numeric | required, min:0.01, max:100 |

**Respuesta (200):** Los valores guardados.

---

### 6. Precios en Vivo

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

### 7. Análisis Técnico

```
GET /api/analyze?pair=EURUSD&direction=buy
```

**Parámetros:**
| Parámetro | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| pair | string | ✅ | Par Forex (ej: EURUSD) |
| direction | string | ❌ | `buy` o `sell` (filtra detección y calcula RR orientado) |

**Respuesta (200) — incluye `risk_analysis`:**
```json
{
  "pair": "EURUSD",
  "current_price": 1.12345,
  "tendency": {
    "direction": "alcista",
    "strength": "fuerte"
  },
  "score": 3,
  "factors": [...],
  "total_factors": 3,
  "recent_candles": [...],
  "risk_analysis": {
    "suggested_sl": 1.12000,
    "suggested_tp": 1.12600,
    "sl_pips": 34.5,
    "tp_pips": 25.5,
    "sl_reason": "Basado en soporte más cercano",
    "tp_reason": "Basado en resistencia más cercana",
    "rr_ratio": 0.74,
    "suggested_lot_size": 0.15,
    "account_balance": 5000.0,
    "risk_percentage": 1.0,
    "max_risk_amount": 50.0,
    "verdict": "mala",
    "verdict_label": {
      "label": "MALA",
      "color": "text-red-400",
      "bg": "bg-red-900/30",
      "msg": "RR desfavorable. Mejor esperar una mejor entrada."
    }
  }
}
```

| Campo risk_analysis | Tipo | Descripción |
|---------------------|------|-------------|
| suggested_sl | float | Stop loss sugerido basado en estructura |
| suggested_tp | float | Take profit sugerido basado en estructura |
| sl_pips | float | Distancia en pips del SL |
| tp_pips | float | Distancia en pips del TP |
| sl_reason | string | Explicación del SL |
| tp_reason | string | Explicación del TP |
| rr_ratio | float | Ratio riesgo/beneficio (TP/SL) |
| suggested_lot_size | float | Lote calculado para arriesgar 1% del saldo |
| account_balance | float/null | Saldo configurado (null si no hay) |
| risk_percentage | float | Porcentaje de riesgo configurado |
| max_risk_amount | float/null | Monto máximo a arriesgar en $ |
| verdict | string | `excelente`, `buena`, `regular`, `mala` |
| verdict_label | object | Label, color y mensaje para mostrar en UI |

**Veredictos:**
| RR Ratio | Veredicto | Mensaje |
|----------|-----------|---------|
| ≥ 2.0 | EXCELENTE | RR muy favorable |
| ≥ 1.5 | BUENA | RR aceptable |
| ≥ 1.0 | REGULAR | RR 1:1 o inferior |
| < 1.0 | MALA | RR desfavorable |

**Error (502):**
```json
{
  "error": "No se pudieron obtener datos"
}
```

**Score:** Se calcula como el número de factores detectados (máximo 8).

**Campo `session` añadido a la respuesta:**
```json
"session": {
  "current_sessions": ["Nueva York", "Londres"],
  "in_ny_session": true,
  "is_weekend": false,
  "ny_status": "activa",
  "hour_et": 10,
  "message": "🗽 Sesión de Nueva York ACTIVA — Buen trading. Te quedan 7 horas de sesión.",
  "alert": "ny_active"
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| current_sessions | array | Sesiones activas actualmente (Asiática, Londres, Nueva York) |
| in_ny_session | bool | True si estamos en horario NY (8:00-17:00 ET, lun-vie) |
| is_weekend | bool | True si es sábado o domingo |
| ny_status | string | `activa`, `cerrada` |
| hour_et | int | Hora actual en ET (0-23) |
| message | string | Mensaje contextual según alerta |
| alert | string | `ny_open`, `ny_active`, `ny_close`, `no_ny`, `warning` |

**Fuente:** Yahoo Finance API (`query1.finance.yahoo.com/v8/finance/chart`).

---

### 8. Sesión de Nueva York

```
GET /api/session
```

**Respuesta (200):**
```json
{
  "current_sessions": ["Nueva York", "Londres"],
  "in_ny_session": true,
  "is_weekend": false,
  "ny_status": "activa",
  "hour_et": 10,
  "message": "🗽 Sesión de Nueva York ACTIVA — Buen trading. Te quedan 7 horas de sesión.",
  "alert": "ny_active"
}
```

Mismos campos que `session` en el análisis técnico. Independiente para usar en Dashboard. Se basa en la hora del servidor convertida a America/New_York.

---

### 9. Señal en Vivo

```
GET /api/signal?pair=EURUSD
```

**Parámetros:**
| Parámetro | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| pair | string | ✅ | Par Forex (ej: EURUSD) |

Analiza el mercado en tiempo real sin necesidad de especificar dirección. Detecta factores alcistas y bajistas por separado y determina la señal predominante.

**Lógica de bias:**
- Si factores alcistas ≥ factores bajistas + 2 → señal de **compra**
- Si factores bajistas ≥ factores alcistas + 2 → señal de **venta**
- Si no hay diferencia suficiente → **sin setup claro**

**Respuesta (200):**
```json
{
  "pair": "EURUSD",
  "current_price": 1.12345,
  "signal": "buy",
  "action": "compra",
  "confidence": "alta",
  "buy_score": 3,
  "sell_score": 1,
  "buy_factors": [
    {"key": "sweep", "label": "Barrida de Liquidez (1H)", "detail": "Barrida de mínimo... → posible reversión alcista"},
    {"key": "bos", "label": "Ruptura de Estructura (1H)", "detail": "Estructura alcista: mínimos ascendentes"},
    {"key": "fvg", "label": "Desequilibrio / FVG", "detail": "FVG alcista: gap de ..."}
  ],
  "sell_factors": [...],
  "total_factors": 3,
  "tendency": {"direction": "alcista", "strength": "fuerte"},
  "risk_analysis": { ... },
  "session": { ... },
  "message": "Señal de COMPRA detectada. El mercado muestra estructura alcista. Revisa el RR antes de entrar."
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| signal | string | `buy`, `sell`, o `neutral` |
| action | string/null | `compra`, `venta`, o null si neutral |
| confidence | string | `alta` (≥3), `media` (2), `baja` (1) |
| buy_score | int | Factores alcistas detectados |
| sell_score | int | Factores bajistas detectados |
| buy_factors | array | Factores que soportan compra |
| sell_factors | array | Factores que soportan venta |
| risk_analysis | object/null | RR, SL/TP sugerido (solo si hay señal clara) |

**Error (502):**
```json
{
  "error": "No se pudieron obtener datos"
}
```

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
