import { Link, useLocation } from 'react-router-dom'

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/trades', label: 'Diario' },
  { to: '/trades/create', label: '+ Nuevo Trade' },
]

export default function Layout({ children }) {
  const { pathname } = useLocation()

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <nav className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-emerald-400">
            TradingDeAndy
          </Link>
          <div className="flex gap-6 text-sm">
            {links.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`transition ${
                  pathname === link.to
                    ? 'text-emerald-400'
                    : 'text-gray-400 hover:text-emerald-400'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
