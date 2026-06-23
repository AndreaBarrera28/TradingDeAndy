import Layout from '../Layout'

export default function Dashboard() {
  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="Trades Totales" value="0" />
          <StatCard label="Win Rate" value="0%" />
          <StatCard label="Racha Actual" value="0" />
          <StatCard label="Profit Factor" value="0.00" />
        </div>
        <div className="bg-gray-900 rounded-xl p-8 text-center text-gray-500">
          <p className="text-lg">Comienza registrando tus primeros trades</p>
          <a
            href="/trades/create"
            className="inline-block mt-4 px-6 py-2 bg-emerald-600 rounded-lg hover:bg-emerald-500 transition text-white"
          >
            + Nuevo Trade
          </a>
        </div>
      </div>
    </Layout>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <p className="text-gray-400 text-sm">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  )
}
