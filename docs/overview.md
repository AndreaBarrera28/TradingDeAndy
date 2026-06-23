# TradingDeAndy — Visión General

## ¿Qué es TradingDeAndy?

TradingDeAndy es un **trading journal** (bitácora de operaciones) diseñado para traders de Forex y CFDs. Permite registrar operaciones, analizar entradas usando conceptos ICT/SMC (Inner Circle Trader / Smart Money Concepts), y hacer seguimiento de la efectividad a lo largo del tiempo.

El sistema permite:
- Registrar entradas con todos los parámetros de una operación (par, dirección, precios, lote, etc.)
- Detectar automáticamente factores de confluencia técnica (barridos de liquidez, rupturas de estructura, order blocks, FVGs, soportes/resistencias)
- Calcular un score de efectividad (0-8) basado en los factores detectados
- Visualizar estadísticas globales: win rate, pips totales, distribución de confianza
- Consultar precios en vivo de 9 pares Forex
- Cerrar operaciones y registrar resultados

## Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Backend | Laravel | ^13.8 |
| Lenguaje PHP | PHP | ^8.3 |
| Frontend #1 (SPA) | React + Vite + React Router | React 19, Vite 8 |
| Frontend #2 (Inertia) | React + Inertia.js + Vite | React 19 |
| CSS | Tailwind CSS | ^4.0 |
| Base de datos | MySQL (producción local) / SQLite (por defecto) | — |
| Autenticación API | Laravel Sanctum | ^4.0 |
| Cliente HTTP | Axios | ^1.18 |
| Build tool | Vite | ^8.0 |

## Estado del Proyecto

El proyecto se encuentra en fase activa de desarrollo. Actualmente existen **dos implementaciones de frontend** que conviven en el mismo repositorio:
1. **SPA independiente** en `frontend/` — la versión más completa y funcional
2. **SPA con Inertia.js** en `resources/js/` — una versión más básica, posiblemente anterior o en transición

## Propósito Principal

Ayudar al trader a:
1. **Registrar** cada operación de forma estructurada
2. **Analizar** la calidad de la entrada mediante detección automática de patrones ICT
3. **Evaluar** la efectividad con métricas objetivas (win rate, pips, score de confluencia)
4. **Aprender** registrando emociones, lecciones y razonamientos de cada operación

## Audiencia

Este proyecto es de uso personal/individual. No está diseñado para multi-usuario ni para producción con alta concurrencia.
