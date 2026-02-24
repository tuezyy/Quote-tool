import { Outlet, Link, useLocation } from 'react-router-dom'
import { useState } from 'react'

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Collections', to: '/collections' },
  { label: 'Install Only', to: '/install-only' },
  { label: 'Get a Quote', to: '/get-a-quote', highlight: true },
  { label: 'Contact', to: '/contact' },
]

const SERVICE_AREAS = [
  'Orlando', 'Winter Park', 'Apopka', 'Ocoee',
  'Clermont', 'Kissimmee', 'Pine Hills', 'Altamonte Springs',
  'MetroWest', 'Winter Garden', 'Lake Nona',
]

export default function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Top bar */}
      <div className="bg-stone-900 text-stone-300 text-xs py-2 px-4 text-center">
        Licensed & Insured · Orlando & Surrounding Areas · Available 24/7 for Calls ·{' '}
        <a href="tel:+18332017849" className="text-wood-400 hover:text-wood-300 font-medium">
          (833) 201-7849
        </a>
      </div>

      {/* Main nav */}
      <nav className="bg-white border-b border-stone-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 bg-stone-900 rounded flex items-center justify-center">
                <span className="text-wood-400 font-bold text-sm">CO</span>
              </div>
              <div className="leading-tight">
                <div className="text-stone-900 font-bold text-sm">Cabinets of Orlando</div>
                <div className="text-stone-400 text-xs">Central Florida's Cabinet Experts</div>
              </div>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map(link => (
                link.highlight ? (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="ml-4 bg-wood-600 hover:bg-wood-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
                  >
                    {link.label}
                  </Link>
                ) : (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      location.pathname === link.to
                        ? 'text-stone-900 bg-stone-100'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              ))}
              <a
                href="tel:+18332017849"
                className="ml-3 flex items-center gap-1.5 text-stone-700 hover:text-wood-600 text-sm font-medium border border-stone-200 rounded-lg px-3 py-2 hover:border-wood-400 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                (833) 201-7849
              </a>
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded text-stone-600"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-stone-100 bg-white px-4 py-3 flex flex-col gap-1">
            {NAV_LINKS.map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={`px-3 py-2.5 rounded-lg text-sm font-medium ${
                  link.highlight
                    ? 'bg-wood-600 text-white text-center'
                    : location.pathname === link.to
                      ? 'bg-stone-100 text-stone-900'
                      : 'text-stone-600'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <a href="tel:+18332017849" className="text-center text-wood-600 font-semibold py-2 text-sm">
              (833) 201-7849
            </a>
          </div>
        )}
      </nav>

      {/* Page content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-stone-950 text-stone-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-stone-800 rounded flex items-center justify-center">
                  <span className="text-wood-400 font-bold text-sm">CO</span>
                </div>
                <span className="text-white font-bold">Cabinets of Orlando</span>
              </div>
              <p className="text-sm leading-relaxed text-stone-500">
                Central Florida's premier cabinet installer. Licensed, insured, and committed to transforming your kitchen.
              </p>
              <div className="mt-5 flex items-center gap-3">
                <a href="https://www.facebook.com/cabinetsoforlando" target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 bg-stone-800 rounded flex items-center justify-center hover:bg-wood-700 transition-colors">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Services */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Services</h4>
              <ul className="space-y-2 text-sm">
                <li>Kitchen Cabinet Installation</li>
                <li>Bathroom Cabinet Installation</li>
                <li>Countertop Installation</li>
                <li>Install Only (IKEA, Home Depot, Lowe's)</li>
                <li>Small, Medium & Large Kitchens</li>
              </ul>
            </div>

            {/* Service Areas */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Service Areas</h4>
              <div className="grid grid-cols-2 gap-x-2 gap-y-2 text-sm">
                {SERVICE_AREAS.map(area => (
                  <span key={area}>{area}</span>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Contact</h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-wood-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  <a href="tel:+18332017849" className="hover:text-wood-400 transition-colors">(833) 201-7849</a>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-wood-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  <a href="mailto:info@cabinetsoforlando.com" className="hover:text-wood-400 transition-colors">
                    info@cabinetsoforlando.com
                  </a>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-wood-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <span>Available 24/7</span>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-wood-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span>Orlando, FL 32801</span>
                </div>
                <Link to="/get-a-quote" className="mt-2 inline-block bg-wood-600 hover:bg-wood-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                  Get Free Quote
                </Link>
              </div>
            </div>
          </div>

          <div className="border-t border-stone-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-stone-600">
            <span>© {new Date().getFullYear()} Cabinets of Orlando. All rights reserved.</span>
            <div className="flex gap-4">
              <span>Licensed & Insured in Florida</span>
              <Link to="/admin" className="hover:text-stone-400 transition-colors">Admin Login</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
