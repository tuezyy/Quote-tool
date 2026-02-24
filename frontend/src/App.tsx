import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'

// Public layout + pages
import PublicLayout from './components/public/PublicLayout'
import Home from './pages/public/Home'
import Collections from './pages/public/Collections'
import GetQuote from './pages/public/GetQuote'
import Contact from './pages/public/Contact'
import InstallOnly from './pages/public/InstallOnly'

// Admin layout + pages
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

  return (
    <Routes>
      {/* Public routes — always accessible */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/collections" element={<Collections />} />
        <Route path="/get-a-quote" element={<GetQuote />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/install-only" element={<InstallOnly />} />
      </Route>

      {/* Login */}
      <Route path="/login" element={<Login />} />

      {/* Admin routes — require auth */}
      <Route
        path="/admin"
        element={token ? <Layout /> : <Navigate to="/login" replace />}
      >
        <Route index element={<Dashboard />} />
        <Route path="quotes/new" element={<NewQuote />} />
        <Route path="quotes/:id" element={<QuoteDetail />} />
        <Route path="quotes" element={<Quotes />} />
        <Route path="customers" element={<Customers />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Legacy admin redirects (in case bookmarks exist) */}
      <Route path="/quotes" element={<Navigate to="/admin/quotes" replace />} />
      <Route path="/quotes/new" element={<Navigate to="/admin/quotes/new" replace />} />
      <Route path="/customers" element={<Navigate to="/admin/customers" replace />} />
      <Route path="/settings" element={<Navigate to="/admin/settings" replace />} />

      {/* 404 fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
