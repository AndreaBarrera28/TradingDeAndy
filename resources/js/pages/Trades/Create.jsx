import { useState } from 'react'
import { router } from '@inertiajs/react'
import Layout from '../../Layout'

const PAIRS = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'NZDUSD', 'XAUUSD', 'XAGUSD']

export default function TradeCreate() {
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 16),
    pair: 'EURUSD',
    direction: 'buy',
    entry_price: '',
    exit_price: '',
    stop_loss: '',
    take_profit: '',
    lot_size: '0.01',
    result: 'win',
    pips: '',
    setup_notes: '',
    entry_reason: '',
    exit_reason: '',
    emotions: '',
    lessons: '',
    confluence_score: 0,
  })
  const [submitting, setSubmitting] = useState(false)

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    router.post('/trades', form, {
      onSuccess: () => {
        setSubmitting(false)
        router.visit('/trades')
      },
      onError: () => {
        setSubmitting(false)
      }
    })
  }

  const inputClass = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
  const labelClass = "block text-sm text-gray-400 mb-1"

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Registrar Trade</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
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
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Dirección</label>
              <select name="direction" value={form.direction} onChange={handleChange} className={inputClass}>
                <option value="buy">Buy (Long)</option>
                <option value="sell">Sell (Short)</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Resultado</label>
              <select name="result" value={form.result} onChange={handleChange} className={inputClass}>
                <option value="win">Win</option>
                <option value="loss">Loss</option>
                <option value="breakeven">Breakeven</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Precio Entrada</label>
              <input type="number" step="0.00001" name="entry_price" value={form.entry_price} onChange={handleChange} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Precio Salida</label>
              <input type="number" step="0.00001" name="exit_price" value={form.exit_price} onChange={handleChange} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Pips</label>
              <input type="number" step="0.1" name="pips" value={form.pips} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Stop Loss</label>
              <input type="number" step="0.00001" name="stop_loss" value={form.stop_loss} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Take Profit</label>
              <input type="number" step="0.00001" name="take_profit" value={form.take_profit} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Lote</label>
              <input type="number" step="0.01" name="lot_size" value={form.lot_size} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Score de Confluencia (0-10)</label>
            <input type="range" min="0" max="10" name="confluence_score" value={form.confluence_score} onChange={handleChange} className="w-full accent-emerald-500" />
            <div className="text-right text-sm text-gray-500">{form.confluence_score}/10</div>
          </div>

          <div>
            <label className={labelClass}>Notas del Setup</label>
            <textarea name="setup_notes" value={form.setup_notes} onChange={handleChange} className={inputClass} rows={3} placeholder="Describe tu setup: estructura 1H, sweep, entrada 5M..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Razón de Entrada</label>
              <textarea name="entry_reason" value={form.entry_reason} onChange={handleChange} className={inputClass} rows={2} placeholder="¿Por qué entraste?" />
            </div>
            <div>
              <label className={labelClass}>Razón de Salida</label>
              <textarea name="exit_reason" value={form.exit_reason} onChange={handleChange} className={inputClass} rows={2} placeholder="¿Por qué saliste?" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Emociones</label>
              <input type="text" name="emotions" value={form.emotions} onChange={handleChange} className={inputClass} placeholder="ej: calmado, ansioso, confiado" />
            </div>
            <div>
              <label className={labelClass}>Lecciones</label>
              <input type="text" name="lessons" value={form.lessons} onChange={handleChange} className={inputClass} placeholder="¿Qué aprendiste?" />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-emerald-600 rounded-lg hover:bg-emerald-500 transition disabled:opacity-50"
            >
              {submitting ? 'Guardando...' : 'Guardar Trade'}
            </button>
            <a
              href="/trades"
              className="px-6 py-2.5 bg-gray-800 rounded-lg hover:bg-gray-700 transition text-center"
            >
              Cancelar
            </a>
          </div>
        </form>
      </div>
    </Layout>
  )
}
