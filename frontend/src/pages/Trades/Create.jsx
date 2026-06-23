import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import { createTrade, getPrices, analyzePair } from '../../api/trades'

const PAIRS = ['EURUSD', 'GBPUSD', 'USDJPY', 'EURJPY', 'AUDUSD', 'USDCAD', 'NZDUSD', 'XAUUSD', 'XAGUSD']

const CONFLUENCE_FACTORS = [
  { key: 'sweep', label: 'Barrida de Liquidez (1H)' },
  { key: 'bos', label: 'Ruptura de Estructura (1H)' },
  { key: 'orderblock', label: 'Order Block / Zona de Oferta' },
  { key: 'fvg', label: 'Desequilibrio / FVG' },
  { key: 'fibonacci', label: 'Nivel Fibonacci' },
  { key: 'snr', label: 'Soporte / Resistencia' },
  { key: 'trendline', label: 'Línea de Tendencia' },
  { key: 'pattern', label: 'Doble Suelo/Techo (5M)' },
]

const inputClass = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
const labelClass = "block text-sm text-gray-400 mb-1"

function PriceInput({ label, name, value, onChange, step = '0.00001', required, currentPrice, onUseCurrent }) {
  function nudge(delta) {
    const base = currentPrice ? parseFloat(currentPrice) : (parseFloat(value) || 0)
    const newVal = base + delta * parseFloat(step)
    onChange({ target: { name, value: newVal.toFixed(5) } })
  }

  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="flex gap-1">
        <input type="number" step={step} name={name} value={value} onChange={onChange} className={inputClass} required={required} placeholder="ej: 1.14573" />
        <div className="flex flex-col gap-0.5">
          <button type="button" title="Subir" onClick={() => nudge(1)} className="px-2 py-0.5 bg-gray-700 rounded-t hover:bg-gray-600 text-xs cursor-pointer leading-none">▲</button>
          <button type="button" title="Bajar" onClick={() => nudge(-1)} className="px-2 py-0.5 bg-gray-700 rounded-b hover:bg-gray-600 text-xs cursor-pointer leading-none">▼</button>
        </div>
      </div>
      {currentPrice && onUseCurrent && (
        <button type="button" onClick={onUseCurrent} className="text-xs text-emerald-500 hover:text-emerald-400 mt-0.5 cursor-pointer">
          ← usar precio actual ({currentPrice})
        </button>
      )}
    </div>
  )
}

function getConfidence(score) {
  if (score >= 6) return { level: 'ALTA', color: 'text-emerald-400', bg: 'bg-emerald-900/30 border-emerald-700', icon: '🟢', msg: 'Puedes entrar con confianza. Buena confluencia detectada.' }
  if (score >= 3) return { level: 'MEDIA', color: 'text-yellow-400', bg: 'bg-yellow-900/30 border-yellow-700', icon: '🟡', msg: 'Confluencia parcial. Evalúa el riesgo antes de entrar.' }
  return { level: 'BAJA', color: 'text-red-400', bg: 'bg-red-900/30 border-red-700', icon: '🔴', msg: 'Poca confluencia. Reconsidera la entrada o espera más confirmación.' }
}

export default function TradeCreate() {
  const navigate = useNavigate()
  const [prices, setPrices] = useState({})
  const [priceLoading, setPriceLoading] = useState(true)
  const [priceError, setPriceError] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const [riskAnalysis, setRiskAnalysis] = useState(null)
  const [session, setSession] = useState(null)
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 16),
    pair: 'EURUSD',
    direction: 'buy',
    entry_price: '',
    stop_loss: '',
    take_profit: '',
    lot_size: '0.01',
    confluence_score: 0,
    confluence_factors: [],
    setup_notes: '',
    entry_reason: '',
    emotions: '',
    lessons: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const confidence = getConfidence(form.confluence_score)
  const currentPrice = prices[form.pair]

  useEffect(() => {
    getPrices()
      .then(data => { setPrices(data); setPriceLoading(false) })
      .catch(() => { setPriceError(true); setPriceLoading(false) })
  }, [])

  useEffect(() => {
    setRiskAnalysis(null)
  }, [form.pair, form.direction])

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    if (type === 'checkbox') {
      const factors = checked
        ? [...form.confluence_factors, value]
        : form.confluence_factors.filter(f => f !== value)
      setForm(prev => ({ ...prev, confluence_factors: factors, confluence_score: factors.length }))
    } else {
      setForm(prev => ({ ...prev, [name]: value }))
    }
  }

  async function handleAutoDetect() {
    setDetecting(true)
    setRiskAnalysis(null)
    try {
      const result = await analyzePair(form.pair, form.direction)
      const detectedKeys = result.factors.map(f => f.key)
      setForm(prev => ({
        ...prev,
        confluence_factors: detectedKeys,
        confluence_score: result.score,
        setup_notes: `Análisis automático del mercado:\n` +
          result.factors.map(f => `• ${f.label}: ${f.detail}`).join('\n') +
          `\n\nTendencia: ${result.tendency.direction} (${result.tendency.strength})` +
          `\nPrecio actual: ${result.current_price}` +
          (result.risk_analysis?.rr_ratio
            ? `\nRR: 1:${result.risk_analysis.rr_ratio} · Lote sugerido: ${result.risk_analysis.suggested_lot_size}`
            : ''),
      }))
      if (result.risk_analysis) {
        setRiskAnalysis(result.risk_analysis)
        setForm(prev => ({
          ...prev,
          stop_loss: String(result.risk_analysis.suggested_sl),
          take_profit: String(result.risk_analysis.suggested_tp),
          lot_size: String(result.risk_analysis.suggested_lot_size),
        }))
      }
      if (result.session) {
        setSession(result.session)
      }
    } catch {
      alert('Error al analizar. ¿php artisan serve está corriendo?')
    }
    setDetecting(false)
  }

  function setPrice(name) {
    const p = prices[form.pair]
    if (p) setForm(prev => ({ ...prev, [name]: String(p.bid) }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await createTrade({ ...form, status: 'analyzed' })
      navigate('/trades')
    } catch { setSubmitting(false) }
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Registrar Entrada</h1>
        <p className="text-sm text-gray-500 mb-6">Analiza tu entrada y descubre su efectividad antes de operar</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* CONFIDENCE BADGE */}
          <div className={`rounded-xl border p-5 text-center ${confidence.bg}`}>
            <div className={`text-4xl font-bold ${confidence.color}`}>
              {confidence.icon} {confidence.level}
            </div>
            <div className="text-lg font-semibold mt-1 text-gray-300">
              Efectividad: {form.confluence_score}/8
            </div>
            <p className={`text-sm mt-2 ${confidence.color}`}>{confidence.msg}</p>
          </div>

          {/* RISK ANALYSIS */}
          {riskAnalysis && (
            <div className={`rounded-xl border p-5 ${riskAnalysis.verdict_label.bg}`}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Análisis de Riesgo</h2>
                <span className={`text-xl font-bold ${riskAnalysis.verdict_label.color}`}>
                  {riskAnalysis.verdict_label.label} · 1:{riskAnalysis.rr_ratio}
                </span>
              </div>
              <p className={`text-sm mb-3 ${riskAnalysis.verdict_label.color}`}>
                {riskAnalysis.verdict_label.msg}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="bg-gray-900/50 rounded-lg p-3 text-center">
                  <p className="text-gray-500 text-xs">SL Sugerido</p>
                  <p className="text-red-400 font-mono font-semibold">{riskAnalysis.suggested_sl}</p>
                  <p className="text-gray-500 text-xs">({riskAnalysis.sl_pips} pips)</p>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-3 text-center">
                  <p className="text-gray-500 text-xs">TP Sugerido</p>
                  <p className="text-emerald-400 font-mono font-semibold">{riskAnalysis.suggested_tp}</p>
                  <p className="text-gray-500 text-xs">({riskAnalysis.tp_pips} pips)</p>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-3 text-center">
                  <p className="text-gray-500 text-xs">Lote Sugerido</p>
                  <p className="text-blue-400 font-bold text-lg">{riskAnalysis.suggested_lot_size}</p>
                  {riskAnalysis.max_risk_amount && (
                    <p className="text-gray-500 text-xs">riesgo: ${riskAnalysis.max_risk_amount}</p>
                  )}
                </div>
                <div className="bg-gray-900/50 rounded-lg p-3 text-center">
                  <p className="text-gray-500 text-xs">Risk/Reward</p>
                  <p className="text-purple-400 font-bold text-lg">1:{riskAnalysis.rr_ratio}</p>
                  <p className="text-gray-500 text-xs">{riskAnalysis.sl_pips}/{riskAnalysis.tp_pips} pips</p>
                </div>
              </div>
              {riskAnalysis.account_balance && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Basado en saldo de ${riskAnalysis.account_balance} · Arriesgando {riskAnalysis.risk_percentage}% (${riskAnalysis.max_risk_amount}) por entrada
                </p>
              )}
            </div>
          )}

          {/* SESSION BANNER */}
          {session && (
            <div className={`rounded-xl border p-4 ${
              session.alert === 'ny_open' || session.alert === 'ny_active'
                ? 'bg-emerald-900/20 border-emerald-700'
                : session.alert === 'ny_close'
                ? 'bg-yellow-900/20 border-yellow-700'
                : 'bg-red-900/20 border-red-700'
            }`}>
              <div className="flex items-start gap-3">
                <span className="text-lg shrink-0">
                  {session.in_ny_session ? '🗽' : '⛔'}
                </span>
                <div>
                  <p className="text-sm font-medium">
                    {session.in_ny_session
                      ? `Sesión NY activa — ${session.current_sessions.join(' / ')}`
                      : `Fuera de sesión NY — ${session.current_sessions.join(' / ') || 'Mercados cerrados'}`
                    }
                  </p>
                  <p className={`text-xs mt-1 ${
                    session.in_ny_session ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {session.message}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Fecha y Hora</label>
              <input type="datetime-local" name="date" value={form.date} onChange={handleChange} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Par</label>
              <select name="pair" value={form.pair} onChange={handleChange} className={inputClass}>
                {PAIRS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              {priceLoading && <p className="text-xs text-gray-500 mt-1">Cargando precio...</p>}
              {priceError && <p className="text-xs text-red-400 mt-1">No se pudo obtener precio. ¿php artisan serve corriendo?</p>}
              {currentPrice && (
                <p className="text-xs text-gray-500 mt-1">
                  Precio actual: <span className="text-emerald-400 font-mono">{currentPrice.bid}</span>
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Dirección</label>
              <select name="direction" value={form.direction} onChange={handleChange} className={inputClass}>
                <option value="buy">Buy (Long) — alcista</option>
                <option value="sell">Sell (Short) — bajista</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Lote</label>
              <input type="number" step="0.01" name="lot_size" value={form.lot_size} onChange={handleChange} className={inputClass} placeholder="0.01" />
              {riskAnalysis && (
                <p className="text-xs text-emerald-500 mt-0.5">Sugerido: {riskAnalysis.suggested_lot_size}</p>
              )}
            </div>
          </div>

          <p className="text-xs text-gray-500 -mt-4 mb-2">
            Precio con <strong>punto</strong> (ej: 1.14573). ▲▼ ajustan desde el precio actual.
          </p>

          <div className="grid grid-cols-3 gap-4">
            <PriceInput label="Precio Entrada" name="entry_price" value={form.entry_price} onChange={handleChange} required currentPrice={currentPrice?.bid} onUseCurrent={() => setPrice('entry_price')} />
            <PriceInput label="Stop Loss" name="stop_loss" value={form.stop_loss} onChange={handleChange} currentPrice={currentPrice?.bid} onUseCurrent={() => setPrice('stop_loss')} />
            <PriceInput label="Take Profit" name="take_profit" value={form.take_profit} onChange={handleChange} currentPrice={currentPrice?.bid} onUseCurrent={() => setPrice('take_profit')} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={labelClass}>Factores de Confluencia — Efectividad de la entrada</label>
              <button type="button" onClick={handleAutoDetect} disabled={detecting}
                className="text-xs px-3 py-1 bg-purple-700 rounded hover:bg-purple-600 transition disabled:opacity-50 cursor-pointer">
                {detecting ? 'Analizando...' : '⚡ Detectar confluencias'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-2">Selecciona los factores que aplican o usa el análisis automático</p>
            <div className="grid grid-cols-2 gap-2">
              {CONFLUENCE_FACTORS.map(f => (
                <label key={f.key}
                  className={`flex items-center gap-2 cursor-pointer text-sm rounded-lg px-3 py-2 border transition ${
                    form.confluence_factors.includes(f.key)
                      ? 'border-emerald-600 bg-emerald-900/20'
                      : 'border-gray-800 bg-gray-900 hover:border-gray-600'
                  }`}>
                  <input type="checkbox" value={f.key} checked={form.confluence_factors.includes(f.key)} onChange={handleChange} className="accent-emerald-500" />
                  {f.label}
                </label>
              ))}
            </div>
            <div className="text-right text-sm mt-2 text-gray-400">
              Factores activos: <span className="text-emerald-400 font-bold">{form.confluence_score}/8</span>
            </div>
          </div>

          <div>
            <label className={labelClass}>Notas del Setup</label>
            <textarea name="setup_notes" value={form.setup_notes} onChange={handleChange} className={inputClass} rows={3} placeholder="Resultado del análisis automático..." />
          </div>

          <div>
            <label className={labelClass}>Razón de Entrada</label>
            <textarea name="entry_reason" value={form.entry_reason} onChange={handleChange} className={inputClass} rows={2} placeholder="¿Por qué decidiste tomar esta entrada?" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Emociones</label>
              <input type="text" name="emotions" value={form.emotions} onChange={handleChange} className={inputClass} placeholder="calmado, ansioso, confiado" />
            </div>
            <div>
              <label className={labelClass}>Lecciones</label>
              <input type="text" name="lessons" value={form.lessons} onChange={handleChange} className={inputClass} placeholder="¿Qué aprendiste?" />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="submit" disabled={submitting}
              className="flex-1 py-3 bg-emerald-600 rounded-lg hover:bg-emerald-500 transition disabled:opacity-50 cursor-pointer font-semibold text-lg">
              {submitting ? 'Guardando...' : `✓ Registrar entrada (${confidence.level})`}
            </button>
            <button type="button" onClick={() => navigate('/trades')}
              className="px-6 py-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition cursor-pointer">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
