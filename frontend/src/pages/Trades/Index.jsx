import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../../components/Layout'
import { getTrades, updateTrade } from '../../api/trades'

function getConf(score) {
  if (score >= 6) return { label: 'ALTA', color: 'text-emerald-400', bg: 'bg-emerald-900/40' }
  if (score >= 3) return { label: 'MEDIA', color: 'text-yellow-400', bg: 'bg-yellow-900/40' }
  return { label: 'BAJA', color: 'text-red-400', bg: 'bg-red-900/40' }
}

export default function TradesIndex() {
  const [trades, setTrades] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [closeForm, setCloseForm] = useState({ exit_price: '', result: 'win', pips: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { getTrades().then(setTrades) }, [])

  function startClose(trade) {
    setEditingId(trade.id)
    setCloseForm({ exit_price: trade.exit_price || '', result: trade.result || 'win', pips: trade.pips || '' })
  }

  async function handleClose(tradeId) {
    setSaving(true)
    try {
      const payload = {
        status: 'analyzed',
        exit_price: closeForm.exit_price || null,
        result: closeForm.result,
        pips: closeForm.pips || null,
      }
      await updateTrade(tradeId, payload)
      setTrades(prev => prev.map(t => t.id === tradeId ? { ...t, ...payload } : t))
      setEditingId(null)
    } catch { alert('Error al actualizar') }
    setSaving(false)
  }

  const sorted = [...trades].sort((a, b) => new Date(b.date) - new Date(a.date))

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Bitácora de Entradas</h1>
        <Link to="/trades/create"
          className="px-4 py-2 bg-emerald-600 rounded-lg hover:bg-emerald-500 transition text-sm">
          + Nueva Entrada
        </Link>
      </div>

      {sorted.length === 0 ? (
        <div className="bg-gray-900 rounded-xl p-12 text-center text-gray-500">
          <p className="text-lg">Aún no has registrado ninguna entrada</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400">
                <th className="text-left py-3 px-4">Fecha</th>
                <th className="text-left py-3 px-4">Par</th>
                <th className="text-left py-3 px-4">Dir.</th>
                <th className="text-right py-3 px-4">Entrada</th>
                <th className="text-right py-3 px-4">SL / TP</th>
                <th className="text-center py-3 px-4">Efectividad</th>
                <th className="text-right py-3 px-4">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(trade => {
                const conf = getConf(trade.confluence_score)
                return (
                  <tr key={trade.id} className="border-b border-gray-800/50 hover:bg-gray-900/50">
                    <td className="py-3 px-4 whitespace-nowrap">{trade.date?.slice(0, 16).replace('T', ' ')}</td>
                    <td className="py-3 px-4 font-medium">{trade.pair}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        trade.direction === 'buy' ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'
                      }`}>
                        {trade.direction === 'buy' ? 'COMPRA' : 'VENTA'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono">{trade.entry_price}</td>
                    <td className="py-3 px-4 text-right font-mono text-xs text-gray-500">
                      {trade.stop_loss || '—'} / {trade.take_profit || '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${conf.bg} ${conf.color}`}>
                        {conf.label} {trade.confluence_score}/8
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {trade.result ? (
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          trade.result === 'win' ? 'bg-emerald-900/50 text-emerald-400' :
                          trade.result === 'loss' ? 'bg-red-900/50 text-red-400' :
                          'bg-yellow-900/50 text-yellow-400'
                        }`}>
                          {trade.result === 'win' ? 'WIN' : trade.result === 'loss' ? 'LOSS' : 'BE'}
                        </span>
                      ) : (
                        <button onClick={() => startClose(trade)}
                          className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer">
                          + resultado
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {editingId && (
            <div className="mt-4 bg-gray-900 rounded-xl border border-gray-700 p-5">
              <h3 className="text-sm font-semibold mb-3">Agregar resultado de la entrada</h3>
              <div className="grid grid-cols-4 gap-3 items-end">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Precio Salida</label>
                  <input type="number" step="0.00001" value={closeForm.exit_price}
                    onChange={e => setCloseForm(f => ({ ...f, exit_price: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Resultado</label>
                  <select value={closeForm.result}
                    onChange={e => setCloseForm(f => ({ ...f, result: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-emerald-500">
                    <option value="win">✅ Win</option>
                    <option value="loss">❌ Loss</option>
                    <option value="breakeven">➖ Breakeven</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Pips</label>
                  <input type="number" step="0.1" value={closeForm.pips}
                    onChange={e => setCloseForm(f => ({ ...f, pips: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-emerald-500" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleClose(trades.find(t => t.id === editingId)?.id)}
                    disabled={saving}
                    className="px-3 py-1.5 bg-emerald-600 rounded hover:bg-emerald-500 text-sm cursor-pointer disabled:opacity-50">
                    {saving ? '...' : 'Guardar'}
                  </button>
                  <button onClick={() => setEditingId(null)}
                    className="px-3 py-1.5 bg-gray-700 rounded hover:bg-gray-600 text-sm cursor-pointer">
                    X
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Layout>
  )
}
