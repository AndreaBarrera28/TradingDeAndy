import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { getStats, getSettings, updateSettings, getSession } from '../api/trades'

const cards = [
  { key: 'total', label: 'Entradas Registradas', color: 'text-blue-400' },
  { key: 'avg_confluence', label: 'Efectividad Promedio', suffix: '/8', color: 'text-emerald-400' },
  { key: 'win_rate', label: 'Win Rate (cerradas)', suffix: '%', color: 'text-yellow-400' },
  { key: 'total_pips', label: 'Pips Totales', suffix: ' pips', color: 'text-purple-400' },
]

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [balance, setBalance] = useState('')
  const [riskPct, setRiskPct] = useState('1.0')
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  const [session, setSession] = useState(null)

  useEffect(() => {
    getStats().then(setStats)
    getSettings().then(s => {
      setBalance(s.account_balance ? String(s.account_balance) : '')
      setRiskPct(String(s.risk_percentage))
    })
    getSession().then(setSession)
  }, [])

  async function handleSaveSettings() {
    setSavingSettings(true)
    try {
      await updateSettings({
        account_balance: parseFloat(balance) || 0,
        risk_percentage: parseFloat(riskPct) || 1.0,
      })
      setSettingsSaved(true)
      setTimeout(() => setSettingsSaved(false), 2500)
    } catch { alert('Error al guardar configuración') }
    setSavingSettings(false)
  }

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard de Efectividad</h1>

        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <h2 className="text-lg font-semibold mb-3">Configuración de Riesgo</h2>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm text-gray-400 mb-1">Saldo de la Cuenta ($)</label>
              <input type="number" step="0.01" min="0" value={balance}
                onChange={e => setBalance(e.target.value)}
                placeholder="ej: 5000"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-emerald-500" />
            </div>
            <div className="w-32">
              <label className="block text-sm text-gray-400 mb-1">Riesgo por entrada</label>
              <div className="flex items-center gap-1">
                <input type="number" step="0.1" min="0.01" max="100" value={riskPct}
                  onChange={e => setRiskPct(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-emerald-500" />
                <span className="text-gray-400 text-sm">%</span>
              </div>
            </div>
            <button onClick={handleSaveSettings} disabled={savingSettings}
              className="px-4 py-2 bg-emerald-600 rounded-lg hover:bg-emerald-500 transition disabled:opacity-50 cursor-pointer text-sm whitespace-nowrap">
              {savingSettings ? 'Guardando...' : settingsSaved ? '✓ Guardado' : 'Guardar'}
            </button>
          </div>
          {parseFloat(balance) > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              Riesgo máximo por operación: <span className="text-emerald-400 font-semibold">${(parseFloat(balance) * parseFloat(riskPct) / 100).toFixed(2)}</span>
              {' '}({riskPct}% de ${parseFloat(balance).toFixed(2)})
            </p>
          )}
        </div>

        {/* NY SESSION BANNER */}
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
                {session.in_ny_session && (
                  <p className="text-xs text-gray-500 mt-1">
                    Hora ET: {String(session.hour_et).padStart(2, '0')}:00 · Sesión NY cierra a las 17:00 ET
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

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
