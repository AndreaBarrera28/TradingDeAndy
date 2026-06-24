import { useState } from 'react'
import Layout from '../components/Layout'
import { getSignal } from '../api/trades'

const PAIRS = ['EURUSD', 'GBPUSD', 'USDJPY', 'EURJPY', 'AUDUSD', 'USDCAD', 'NZDUSD', 'XAUUSD', 'XAGUSD']

const CONFIDENCE_STYLES = {
  alta: { color: 'text-emerald-400', bg: 'bg-emerald-900/30 border-emerald-700' },
  media: { color: 'text-yellow-400', bg: 'bg-yellow-900/30 border-yellow-700' },
  baja: { color: 'text-gray-400', bg: 'bg-gray-800 border-gray-700' },
}

function SignalBadge({ signal, confidence }) {
  if (signal === 'buy') {
    return (
      <div className={`text-center p-6 rounded-xl border ${CONFIDENCE_STYLES[confidence].bg}`}>
        <div className="text-5xl mb-2">📈</div>
        <div className={`text-3xl font-bold ${CONFIDENCE_STYLES[confidence].color}`}>COMPRA</div>
        <div className="text-sm text-gray-400 mt-1">Confianza: <span className={CONFIDENCE_STYLES[confidence].color}>{confidence}</span></div>
      </div>
    )
  }
  if (signal === 'sell') {
    return (
      <div className={`text-center p-6 rounded-xl border ${CONFIDENCE_STYLES[confidence].bg}`}>
        <div className="text-5xl mb-2">📉</div>
        <div className={`text-3xl font-bold ${CONFIDENCE_STYLES[confidence].color}`}>VENTA</div>
        <div className="text-sm text-gray-400 mt-1">Confianza: <span className={CONFIDENCE_STYLES[confidence].color}>{confidence}</span></div>
      </div>
    )
  }
  return (
    <div className="text-center p-6 rounded-xl border bg-gray-800 border-gray-700">
      <div className="text-5xl mb-2">⏸️</div>
      <div className="text-2xl font-bold text-gray-400">SIN SETUP</div>
      <div className="text-sm text-gray-500 mt-1">No hay factores de confluencia claros</div>
    </div>
  )
}

function FactorList({ title, factors, color }) {
  if (!factors || factors.length === 0) return null
  return (
    <div>
      <h3 className={`text-sm font-semibold mb-2 ${color}`}>{title} ({factors.length})</h3>
      <ul className="space-y-1">
        {factors.map((f, i) => (
          <li key={i} className="text-xs text-gray-300 bg-gray-800/50 rounded-lg px-3 py-2">
            <span className="font-medium">{f.label}:</span> {f.detail}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Signal() {
  const [pair, setPair] = useState('EURUSD')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  async function handleAnalyze() {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await getSignal(pair)
      setResult(data)
    } catch {
      setError('Error al obtener señal. ¿php artisan serve está corriendo?')
    }
    setLoading(false)
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Señal en Vivo</h1>
        <p className="text-sm text-gray-500">
          Escanea el mercado al instante. Solo elige el par y obtén una señal de compra o venta basada en estructura ICT de 1H.
        </p>

        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm text-gray-400 mb-1">Par</label>
              <select value={pair} onChange={e => setPair(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-emerald-500">
                {PAIRS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <button onClick={handleAnalyze} disabled={loading}
              className="px-6 py-2 bg-emerald-600 rounded-lg hover:bg-emerald-500 transition disabled:opacity-50 cursor-pointer text-sm whitespace-nowrap">
              {loading ? 'Analizando...' : '🔍 Obtener Señal'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-700 rounded-xl p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {result && (
          <>
            <SignalBadge signal={result.signal} confidence={result.confidence} />

            <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
              <p className="text-sm text-gray-300">{result.message}</p>
              <div className="flex gap-4 mt-3 text-xs text-gray-500">
                <span>Precio actual: <span className="text-gray-300 font-mono">{result.current_price}</span></span>
                <span>Tendencia: <span className="text-gray-300">{result.tendency.direction} ({result.tendency.strength})</span></span>
              </div>
            </div>

            {result.entry_zone && (
              <div className="bg-gray-900 rounded-xl border border-emerald-800/50 p-5">
                <h2 className="text-sm font-semibold text-emerald-400 mb-3">📍 Zona de Entrada Sugerida</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                    <p className="text-gray-500 text-xs">Entrada en</p>
                    <p className="text-emerald-400 font-mono font-bold text-lg">{result.entry_zone.price}</p>
                    <p className="text-gray-500 text-xs capitalize">{result.entry_zone.type}</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                    <p className="text-gray-500 text-xs">Rango desde</p>
                    <p className="text-gray-300 font-mono font-semibold">{result.entry_zone.from}</p>
                    <p className="text-gray-500 text-xs">zona baja</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                    <p className="text-gray-500 text-xs">Rango hasta</p>
                    <p className="text-gray-300 font-mono font-semibold">{result.entry_zone.to}</p>
                    <p className="text-gray-500 text-xs">zona alta</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                    <p className="text-gray-500 text-xs">Basado en</p>
                    <p className="text-emerald-400 font-semibold text-xs">{result.entry_zone.reason}</p>
                  </div>
                </div>
              </div>
            )}

            {(result.buy_factors?.length > 0 || result.sell_factors?.length > 0) && (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4">
                <h2 className="text-lg font-semibold">Factores Detectados</h2>
                <div className="grid grid-cols-2 gap-4">
                  <FactorList title="📈 ALCISTAS" factors={result.buy_factors} color="text-emerald-400" />
                  <FactorList title="📉 BAJISTAS" factors={result.sell_factors} color="text-red-400" />
                </div>
              </div>
            )}

            {result.risk_analysis && (
              <div className={`rounded-xl border p-5 ${result.risk_analysis.verdict_label.bg}`}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold">Análisis de Riesgo</h2>
                  <span className={`text-xl font-bold ${result.risk_analysis.verdict_label.color}`}>
                    {result.risk_analysis.verdict_label.label} · 1:{result.risk_analysis.rr_ratio}
                  </span>
                </div>
                <p className={`text-sm mb-3 ${result.risk_analysis.verdict_label.color}`}>
                  {result.risk_analysis.verdict_label.msg}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="bg-gray-900/50 rounded-lg p-3 text-center">
                    <p className="text-gray-500 text-xs">SL Estimado</p>
                    <p className="text-red-400 font-mono font-semibold">{result.risk_analysis.suggested_sl}</p>
                    <p className="text-gray-500 text-xs">({result.risk_analysis.sl_pips} pips)</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-3 text-center">
                    <p className="text-gray-500 text-xs">TP Estimado</p>
                    <p className="text-emerald-400 font-mono font-semibold">{result.risk_analysis.suggested_tp}</p>
                    <p className="text-gray-500 text-xs">({result.risk_analysis.tp_pips} pips)</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-3 text-center">
                    <p className="text-gray-500 text-xs">Lote Sugerido</p>
                    <p className="text-blue-400 font-bold text-lg">{result.risk_analysis.suggested_lot_size}</p>
                    {result.risk_analysis.max_risk_amount && (
                      <p className="text-gray-500 text-xs">riesgo: ${result.risk_analysis.max_risk_amount}</p>
                    )}
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-3 text-center">
                    <p className="text-gray-500 text-xs">Risk/Reward</p>
                    <p className="text-purple-400 font-bold text-lg">1:{result.risk_analysis.rr_ratio}</p>
                    <p className="text-gray-500 text-xs">{result.risk_analysis.sl_pips}/{result.risk_analysis.tp_pips} pips</p>
                  </div>
                </div>
                {result.risk_analysis.account_balance && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Basado en saldo de ${result.risk_analysis.account_balance} · Arriesgando {result.risk_analysis.risk_percentage}% (${result.risk_analysis.max_risk_amount}) por entrada
                  </p>
                )}
              </div>
            )}

            {result.session && (
              <div className={`rounded-xl border p-4 ${
                result.session.alert === 'ny_open' || result.session.alert === 'ny_active'
                  ? 'bg-emerald-900/20 border-emerald-700'
                  : result.session.alert === 'ny_close'
                  ? 'bg-yellow-900/20 border-yellow-700'
                  : 'bg-red-900/20 border-red-700'
              }`}>
                <div className="flex items-start gap-3">
                  <span className="text-lg shrink-0">
                    {result.session.in_ny_session ? '🗽' : '⛔'}
                  </span>
                  <div>
                    <p className="text-sm font-medium">
                      {result.session.in_ny_session
                        ? `Sesión NY activa — ${result.session.current_sessions.join(' / ')}`
                        : `Fuera de sesión NY — ${result.session.current_sessions.join(' / ') || 'Mercados cerrados'}`
                      }
                    </p>
                    <p className={`text-xs mt-1 ${
                      result.session.in_ny_session ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {result.session.message}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}