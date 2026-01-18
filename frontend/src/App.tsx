import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import NewQuote from './pages/NewQuote'
import Quotes from './pages/Quotes'
import QuoteDetail from './pages/QuoteDetail'
import Customers from './pages/Customers'
import Settings from './pages/Settings'

function App() {
  const { token } = useAuthStore()

  if (!token) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="quotes/new" element={<NewQuote />} />
        <Route path="quotes/:id" element={<QuoteDetail />} />
        <Route path="quotes" element={<Quotes />} />
        <Route path="customers" element={<Customers />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
