import { Link } from 'react-router-dom'

const SERVICE_AREAS = [
  'Orlando', 'Winter Park', 'Apopka', 'Ocoee',
  'Clermont', 'Kissimmee', 'Pine Hills', 'Altamonte Springs',
  'MetroWest', 'Winter Garden', 'Lake Nona',
]

export default function Contact() {
  return (
    <div>
      {/* JSON-LD Contact Schema */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'ContactPage',
        name: 'Contact Cabinets of Orlando',
        mainEntity: {
          '@type': 'LocalBusiness',
          name: 'Cabinets of Orlando',
          telephone: '+18332017849',
          email: 'info@cabinetsoforlando.com',
          address: {
            '@type': 'PostalAddress',
            addressLocality: 'Orlando',
            addressRegion: 'FL',
            postalCode: '32801',
            addressCountry: 'US',
          },
          openingHoursSpecification: [{
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],
            opens: '00:00',
            closes: '23:59',
          }],
          areaServed: SERVICE_AREAS.map(a => ({ '@type': 'City', name: a.includes('FL') ? a : `${a}, FL` })),
        },
      })}} />

      {/* Header */}
      <section className="bg-stone-950 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="text-xs text-stone-500 mb-4 flex items-center gap-2">
            <Link to="/" className="hover:text-stone-300">Home</Link>
            <span>/</span>
            <span className="text-stone-300">Contact</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Contact <span className="text-wood-400">Cabinets of Orlando</span>
          </h1>
          <p className="text-stone-400 text-lg">
            Ready to start your kitchen transformation? We're here to help.
          </p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

            {/* Contact Info */}
            <div>
              <h2 className="text-2xl font-bold text-stone-900 mb-8">Get in Touch</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-wood-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-1">Phone</div>
                    <a href="tel:+18332017849" className="text-xl font-bold text-stone-900 hover:text-wood-600 transition-colors">
                      (833) 201-7849
                    </a>
                    <div className="text-stone-500 text-sm mt-0.5">Call or text anytime during business hours</div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-wood-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-1">Email</div>
                    <a href="mailto:info@cabinetsoforlando.com"
                      className="text-lg font-semibold text-stone-900 hover:text-wood-600 transition-colors">
                      info@cabinetsoforlando.com
                    </a>
                    <div className="text-stone-500 text-sm mt-0.5">We respond within 2 business hours</div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-wood-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-1">Business Hours</div>
                    <div className="text-stone-900 font-semibold">24/7 for Calls & Inquiries</div>
                    <div className="text-stone-500 text-sm mt-0.5">Installations: Mon–Sat during business hours</div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-wood-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-1">Location</div>
                    <div className="text-stone-900 font-semibold">Orlando, FL 32801</div>
                    <div className="text-stone-500 text-sm mt-0.5">Serving all of Central Florida</div>
                  </div>
                </div>
              </div>

              {/* License/Trust */}
              <div className="mt-10 bg-stone-50 border border-stone-200 rounded-2xl p-6">
                <h3 className="font-bold text-stone-900 mb-3">Licensed & Fully Insured</h3>
                <p className="text-stone-500 text-sm leading-relaxed">
                  Cabinets of Orlando is a fully licensed contractor in the state of Florida carrying
                  general liability insurance. All installations are performed by our trained, experienced crew.
                </p>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {['Licensed in FL', 'General Liability', 'Workers Comp', 'Bonded'].map(b => (
                    <div key={b} className="flex items-center gap-2 text-sm text-stone-600">
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {b}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right side — CTA + service areas */}
            <div className="space-y-6">
              {/* Quick quote CTA */}
              <div className="bg-stone-950 rounded-2xl p-8 text-center">
                <div className="w-14 h-14 bg-wood-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-wood-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Get a Free Quote</h3>
                <p className="text-stone-400 text-sm mb-6">
                  Fill out our 2-minute form and get a detailed quote within 2 hours.
                </p>
                <Link to="/get-a-quote"
                  className="block bg-wood-600 hover:bg-wood-700 text-white font-bold py-3 rounded-xl transition-colors text-sm">
                  Start Your Free Quote →
                </Link>
                <div className="mt-4">
                  <a href="tel:+18332017849"
                    className="block border border-stone-700 hover:border-stone-500 text-stone-300 font-medium py-3 rounded-xl transition-colors text-sm">
                    Or Call (833) 201-7849
                  </a>
                </div>
              </div>

              {/* Service Areas */}
              <div className="border border-stone-200 rounded-2xl p-6">
                <h3 className="font-bold text-stone-900 mb-4">Service Areas</h3>
                <div className="grid grid-cols-2 gap-2">
                  {SERVICE_AREAS.map(area => (
                    <div key={area} className="flex items-center gap-2 text-sm text-stone-600">
                      <div className="w-1.5 h-1.5 bg-wood-500 rounded-full flex-shrink-0" />
                      {area}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-stone-400 mt-4">
                  Don't see your city? Call us — we may still be able to serve your area.
                </p>
              </div>

              {/* Social */}
              <div className="border border-stone-200 rounded-2xl p-6">
                <h3 className="font-bold text-stone-900 mb-4">Follow Us</h3>
                <a
                  href="https://www.facebook.com/cabinetsoforlando"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-stone-700 hover:text-blue-600 transition-colors"
                >
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Facebook</div>
                    <div className="text-xs text-stone-400">@cabinetsoforlando</div>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
