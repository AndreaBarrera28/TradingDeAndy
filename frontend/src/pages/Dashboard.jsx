import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { getStats } from '../api/trades'

const cards = [
  { key: 'total', label: 'Entradas Registradas', color: 'text-blue-400' },
  { key: 'avg_confluence', label: 'Efectividad Promedio', suffix: '/8', color: 'text-emerald-400' },
  { key: 'win_rate', label: 'Win Rate (cerradas)', suffix: '%', color: 'text-yellow-400' },
  { key: 'total_pips', label: 'Pips Totales', suffix: ' pips', color: 'text-purple-400' },
]

export default function Dashboard() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    getStats().then(setStats)
  }, [])

  const highConfidence = stats ? Math.round((stats.wins / Math.max(stats.total, 1)) * 100) : 0

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard de Efectividad</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {cards.map(({ key, label, suffix, color }) => (
            <div key={key} className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <p className="text-gray-400 text-sm">{label}</p>
              <p className={`text-2xl font-bold mt-1 ${color}`}>
                {stats ? `${stats[key]}${suffix || ''}` : '...'}
              </p>
            </div>
          ))}
        </div>

        {stats?.total === 0 && (
          <div className="bg-gray-900 rounded-xl p-12 text-center text-gray-500">
            <p className="text-lg">Aún no has registrado ninguna entrada</p>
            <Link to="/trades/create"
              className="inline-block mt-4 px-6 py-2 bg-emerald-600 rounded-lg hover:bg-emerald-500 transition text-white">
              + Registrar primera entrada
            </Link>
          </div>
        )}

        {stats && stats.total > 0 && (
          <>
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h2 className="text-lg font-semibold mb-4">Distribución de Efectividad</h2>
              <div className="space-y-3">
                <Bar label="Alta confianza (6-8)" pct={stats.high_conf_pct || 0} color="bg-emerald-600" />
                <Bar label="Confianza media (3-5)" pct={stats.med_conf_pct || 0} color="bg-yellow-600" />
                <Bar label="Baja confianza (0-2)" pct={stats.low_conf_pct || 0} color="bg-red-600" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                <p className="text-gray-400 text-sm">Trades en análisis</p>
                <p className="text-2xl font-bold mt-1 text-blue-400">{stats.analyzed || 0}</p>
                <p className="text-xs text-gray-500">entradas en análisis</p>
              </div>
              <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                <p className="text-gray-400 text-sm">Win Rate</p>
                <p className="text-2xl font-bold mt-1 text-emerald-400">{stats.win_rate || 0}%</p>
                <p className="text-xs text-gray-500">{stats.wins}W / {stats.losses}L / {stats.breakevens}BE</p>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}

function Bar({ label, pct, color }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="text-gray-300">{pct}%</span>
      </div>
      <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
