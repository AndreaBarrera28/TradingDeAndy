import Layout from '../../Layout'
import { Link } from '@inertiajs/react'

export default function TradesIndex({ trades }) {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Diario de Trades</h1>
          <Link
            href="/trades/create"
            className="px-4 py-2 bg-emerald-600 rounded-lg hover:bg-emerald-500 transition text-sm"
          >
            + Nuevo Trade
          </Link>
        </div>

        {trades.length === 0 ? (
          <div className="bg-gray-900 rounded-xl p-12 text-center text-gray-500">
            <p className="text-lg">No hay trades registrados aún</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400">
                  <th className="text-left py-3 px-4">Fecha</th>
                  <th className="text-left py-3 px-4">Par</th>
                  <th className="text-left py-3 px-4">Dirección</th>
                  <th className="text-right py-3 px-4">Entrada</th>
                  <th className="text-right py-3 px-4">Salida</th>
                  <th className="text-right py-3 px-4">Pips</th>
                  <th className="text-right py-3 px-4">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {trades.map(trade => (
                  <tr key={trade.id} className="border-b border-gray-800/50 hover:bg-gray-900/50">
                    <td className="py-3 px-4">{trade.date}</td>
                    <td className="py-3 px-4 font-medium">{trade.pair}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        trade.direction === 'buy' ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'
                      }`}>
                        {trade.direction === 'buy' ? 'BUY' : 'SELL'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono">{trade.entry_price}</td>
                    <td className="py-3 px-4 text-right font-mono">{trade.exit_price}</td>
                    <td className="py-3 px-4 text-right font-mono">{trade.pips ?? '-'}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        trade.result === 'win' ? 'bg-emerald-900/50 text-emerald-400' :
                        trade.result === 'loss' ? 'bg-red-900/50 text-red-400' :
                        'bg-yellow-900/50 text-yellow-400'
                      }`}>
                        {trade.result === 'win' ? 'WIN' : trade.result === 'loss' ? 'LOSS' : 'BE'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}
