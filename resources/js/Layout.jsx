import { Link } from '@inertiajs/react'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <nav className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-emerald-400">
            TradingDeAndy
          </Link>
          <div className="flex gap-6 text-sm">
            <Link href="/" className="hover:text-emerald-400 transition">
              Dashboard
            </Link>
            <Link href="/trades" className="hover:text-emerald-400 transition">
              Diario
            </Link>
            <Link href="/trades/create" className="hover:text-emerald-400 transition">
              + Nuevo Trade
            </Link>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
