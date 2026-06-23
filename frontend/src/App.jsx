import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import TradesIndex from './pages/Trades/Index'
import TradeCreate from './pages/Trades/Create'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/trades" element={<TradesIndex />} />
        <Route path="/trades/create" element={<TradeCreate />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
