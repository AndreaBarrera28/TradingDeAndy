# Glosario

Términos y conceptos utilizados en el proyecto TradingDeAndy.

---

## Términos Generales del Proyecto

| Término | Definición |
|---------|-----------|
| **Trade** | Operación de compra o venta en el mercado Forex/CFDs. Cada entrada registrada en el sistema. |
| **Trading Journal** | Bitácora donde se registran todas las operaciones con detalles técnicos y psicológicos. |
| **Entrada** | Sinónimo de trade en el contexto de la aplicación. |
| **Pair** | Par de divisas negociado (ej: EUR/USD, GBP/USD). |

---

## Términos de Trading

| Término | Definición |
|---------|-----------|
| **Buy (Long)** | Operación que apuesta a que el precio subirá. |
| **Sell (Short)** | Operación que apuesta a que el precio bajará. |
| **Entry Price** | Precio al que se abre la operación. |
| **Exit Price** | Precio al que se cierra la operación. |
| **Stop Loss (SL)** | Precio predefinido para cerrar la operación si el mercado va en contra, limitando la pérdida. |
| **Take Profit (TP)** | Precio predefinido para cerrar la operación si el mercado va a favor, asegurando la ganancia. |
| **Lot Size** | Volumen de la operación. 1 lote estándar = 100,000 unidades. |
| **Pips** | Unidad de medida del movimiento de precio en Forex. Generalmente el 4º o 5º decimal. |
| **Win** | Operación que resultó en ganancia. |
| **Loss** | Operación que resultó en pérdida. |
| **Breakeven (BE)** | Operación que no generó ni ganancia ni pérdida. |
| **Win Rate** | Porcentaje de operaciones ganadoras sobre el total de operaciones cerradas. |

---

## Conceptos ICT / Smart Money Concepts (SMC)

| Término | Definición |
|---------|-----------|
| **ICT** | Inner Circle Trader, un trader y educador conocido por desarrollar estos conceptos de análisis técnico. |
| **Smart Money** | Término que se refiere a grandes actores institucionales (bancos, fondos) que mueven el mercado. |
| **Liquidity Sweep (Barrida de Liquidez)** | Movimiento del precio que barre máximos o mínimos anteriores (donde hay liquidez acumulada) y luego revierte. Indica que el smart money está tomando posiciones. |
| **Break of Structure (BOS / Ruptura de Estructura)** | Cuando el precio rompe un máximo o mínimo relevante, indicando un cambio en la tendencia o continuación de la misma. |
| **Order Block (OB / Bloque de Órdenes)** | Vela grande que muestra acumulación de órdenes institucionales. Área donde el smart money ha entrado al mercado. Puede ser alcista (base de un movimiento up) o bajista (base de un movimiento down). |
| **Fair Value Gap (FVG / Desequilibrio)** | Espacio o gap entre 3 velas consecutivas donde no hubo suficiente actividad de precio. Zona que el precio tiende a rellenar (rebalancear). |
| **Support (Soporte)** | Nivel de precio donde históricamente el precio ha rebotado al alza. |
| **Resistance (Resistencia)** | Nivel de precio donde históricamente el precio ha rebotado a la baja. |
| **Confluencia** | Cuando múltiples factores técnicos apuntan en la misma dirección, aumentando la probabilidad de que una operación sea exitosa. |
| **Confluence Score** | Puntuación de 0 a 8 que indica cuántos factores de confluencia se han detectado en una entrada. |

---

## Términos Técnicos del Análisis

| Término | Definición |
|---------|-----------|
| **OHLC** | Open (apertura), High (máximo), Low (mínimo), Close (cierre). Datos de una vela. |
| **Vela/Candle** | Representación de precio en un período de tiempo. Muestra apertura, máximo, mínimo y cierre. |
| **1H** | Período de 1 hora para las velas. El análisis usa este timeframe. |
| **SMA5** | Simple Moving Average de 5 períodos. Media móvil simple de los últimos 5 valores de cierre. |
| **SMA20** | Simple Moving Average de 20 períodos. Media móvil simple de los últimos 20 valores de cierre. |
| **Tendencia** | Dirección general del mercado: alcista (bullish), bajista (bearish) o neutral. |

---

## Términos de Gestión de Riesgo

| Término | Definición |
|---------|-----------|
| **Account Balance** | Saldo actual de la cuenta de trading. Configurable en el Dashboard. |
| **Risk Percentage** | Porcentaje del saldo que se arriesga por operación. Por defecto 1%. |
| **Max Risk Amount** | Monto máximo a arriesgar en dólares. Calculado como `balance × (risk% / 100)`. |
| **Lot Size** | Volumen de la operación. El sistema sugiere un lote que arriesgue exactamente el porcentaje configurado. |
| **Pip Value** | Valor en dólares de 1 pip para 1 lote estándar. Varía según el par (~$10 para la mayoría). |
| **RR Ratio (Risk/Reward)** | Relación entre la ganancia potencial y la pérdida potencial. RR = TP_pips / SL_pips. |
| **Veredicto** | Evaluación del RR: excelente (≥2.0), buena (≥1.5), regular (≥1.0), mala (<1.0). |
| **Position Sizing** | Cálculo del tamaño de posición (lote) para arriesgar exactamente el % deseado del saldo. |

---

## Términos de la Aplicación

| Término | Definición |
|---------|-----------|
| **Status** | Estado del trade: `open` (abierto), `closed` (cerrado), `analyzed` (analizado/cerrado). |
| **Direction** | Dirección de la operación: `buy` (compra/long) o `sell` (venta/short). |
| **Result** | Resultado de la operación: `win` (ganancia), `loss` (pérdida), `breakeven` (empate). |
| **Confluence Factors** | Lista de factores de confluencia detectados en una entrada (sweep, BOS, order block, FVG, etc.). |
| **Setup Notes** | Notas que describen el setup o configuración de la entrada. |
| **Entry Reason** | Razón por la que se tomó la decisión de entrar. |
| **Exit Reason** | Razón por la que se salió de la operación. |
| **Emotions** | Estado emocional durante la operación (calmado, ansioso, confiado, etc.). |
| **Lessons** | Lecciones aprendidas de la operación. |

---

## Integraciones Externas

| Término | Definición |
|---------|-----------|
| **AwesomeAPI** | API gratuita brasileña que proporciona cotizaciones de Forex en tiempo real. |
| **Yahoo Finance API** | API de Yahoo que proporciona datos históricos de mercado, incluyendo OHLC. |

---

## Tecnologías

| Término | Definición |
|---------|-----------|
| **Laravel** | Framework PHP para desarrollo web, usado como backend API. |
| **Sanctum** | Paquete de Laravel para autenticación de APIs y SPAs. |
| **Eloquent ORM** | ORM (Object-Relational Mapping) de Laravel para interactuar con la base de datos. |
| **Inertia.js** | Framework que permite construir SPAs usando React/Vue/Svelte sin necesidad de una API REST separada. |
| **Vite** | Build tool moderno para frontend, usado tanto para el SPA independiente como para el frontend Inertia. |
| **Tailwind CSS** | Framework CSS utility-first para diseño de interfaces. |
| **Axios** | Cliente HTTP basado en promesas para el navegador y Node.js. |
| **React Router** | Librería de enrutamiento para React. |
