import { Link } from 'react-router-dom'
import { useBusiness } from '../../context/BusinessContext'

const RETAILERS = [
  { name: 'IKEA', desc: 'SEKTION, AXSTAD, BODBYN and all IKEA kitchen systems' },
  { name: 'Home Depot', desc: 'Hampton Bay, Hton Bay, Kraftmaid, and all Home Depot brands' },
  { name: "Lowe's", desc: 'Diamond, Allen + Roth, and all Lowe\'s cabinet lines' },
  { name: 'Custom Suppliers', desc: 'Any cabinet brand or custom millwork from any supplier' },
]

const STEPS = [
  {
    step: '01',
    title: 'You Buy the Cabinets',
    desc: 'Purchase cabinets from IKEA, Home Depot, Lowe\'s, or any supplier. Have them delivered to your home.',
  },
  {
    step: '02',
    title: 'We Give You a Quote',
    desc: 'Tell us your kitchen size and cabinet brand. We give you a flat install price — no surprises.',
  },
  {
    step: '03',
    title: 'We Show Up and Install',
    desc: 'Our licensed crew handles everything — demo of old cabinets, precise installation, and cleanup.',
  },
]

const FAQS = [
  {
    q: 'Do you install IKEA SEKTION cabinets?',
    a: 'Yes. We install all IKEA kitchen cabinet systems including SEKTION, AXSTAD, BODBYN, EKESTAD, and all other IKEA lines. We have extensive experience with IKEA\'s assembly and installation process.',
  },
  {
    q: 'What does installation-only cost?',
    a: 'Cabinet installation-only pricing starts at $2,800 and goes up to $4,000 depending on your kitchen size, number of cabinets, and layout complexity. We provide a firm quote before any work begins.',
  },
  {
    q: 'Do I need to assemble IKEA cabinets first?',
    a: 'No. Our crew handles full assembly and installation of flat-pack cabinets like IKEA. Just have the boxes at your home and we take care of the rest.',
  },
  {
    q: 'Do you remove old cabinets before installing new ones?',
    a: 'Yes, demolition and haul-away of old cabinets is included in our installation service. We remove, haul away, and then install your new cabinets in one visit.',
  },
  {
    q: 'Do you install bathroom vanity cabinets too?',
    a: 'Yes. We install bathroom vanity cabinets, linen towers, and all bathroom storage cabinets from any retailer.',
  },
  {
    q: 'What areas do you serve?',
    a: 'We serve Orlando, Winter Park, Apopka, Ocoee, Clermont, Kissimmee, Pine Hills, Altamonte Springs, MetroWest, Winter Garden, and Lake Nona.',
  },
]

export default function InstallOnly() {
  const business = useBusiness()
  const phoneDigits = (business.phone || '18332017849').replace(/\D/g, '')
  const phoneHref = `tel:+${phoneDigits}`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `Cabinet Installation Only — ${business.city || 'Orlando'}`,
    description: `Professional cabinet installation service for homeowners who have already purchased cabinets from IKEA, Home Depot, Lowe's, or any custom supplier. Serving ${business.city || 'Orlando'} and surrounding areas.`,
    provider: {
      '@type': 'LocalBusiness',
      name: business.name,
      telephone: `+${phoneDigits}`,
      email: business.email,
      url: business.website,
    },
        areaServed: ['Orlando, FL', 'Winter Park, FL', 'Apopka, FL', 'Ocoee, FL', 'Clermont, FL', 'Kissimmee, FL'],
        offers: {
          '@type': 'Offer',
          priceSpecification: {
            '@type': 'PriceSpecification',
            minPrice: '2800',
            maxPrice: '4000',
            priceCurrency: 'USD',
          },
        },
        mainEntityOfPage: {
          '@type': 'FAQPage',
          mainEntity: FAQS.map(f => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        },
      };

  return (
    <div>
      {/* JSON-LD Schema */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero — targeted at IKEA/HD buyers */}
      <section className="bg-stone-950 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <nav className="text-xs text-stone-500 mb-4 flex items-center gap-2">
              <Link to="/" className="hover:text-stone-300">Home</Link>
              <span>/</span>
              <span className="text-stone-300">Install Only</span>
            </nav>
            <div className="inline-flex items-center gap-2 bg-wood-600/20 border border-wood-600/30 rounded-full px-4 py-1.5 mb-5">
              <span className="text-wood-400 text-xs font-semibold uppercase tracking-wide">
                Already Bought Your Cabinets?
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-5">
              We Install Cabinets<br />
              <span className="text-wood-400">You Already Bought</span>
            </h1>
            <p className="text-stone-400 text-lg mb-8 max-w-2xl leading-relaxed">
              Got cabinets from <strong className="text-stone-300">IKEA, Home Depot, or Lowe's</strong>?
              We handle the full installation — assembly, demo of old cabinets, haul-away, and precise installation.
              Flat-rate pricing starting at $2,800.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/get-a-quote"
                className="bg-wood-600 hover:bg-wood-700 text-white font-bold px-8 py-4 rounded-xl text-base transition-all hover:scale-105 shadow-lg shadow-wood-900/30">
                Get Install Quote →
              </Link>
              <a href={phoneHref}
                className="border border-stone-600 hover:border-stone-400 text-stone-300 hover:text-white font-semibold px-8 py-4 rounded-xl text-base transition-all">
                {business.phone || '(833) 201-7849'}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Price banner */}
      <section className="bg-wood-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="text-white">
                <span className="font-bold text-2xl">$2,800 – $4,000</span>
                <span className="text-wood-200 text-sm ml-2">flat-rate installation</span>
              </div>
              <div className="hidden md:block w-px h-8 bg-wood-500" />
              <div className="text-wood-200 text-sm hidden md:block">
                Includes demo · haul-away · full installation · cleanup
              </div>
            </div>
            <Link to="/get-a-quote"
              className="bg-white text-wood-700 font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-wood-50 transition-colors">
              Get My Install Quote
            </Link>
          </div>
        </div>
      </section>

      {/* Retailers we work with */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-stone-900 mb-3">
              We Install Cabinets From Any Retailer
            </h2>
            <p className="text-stone-500">
              No matter where you bought them — we install them right.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {RETAILERS.map(r => (
              <div key={r.name} className="border-2 border-stone-200 hover:border-wood-400 rounded-2xl p-6 transition-all group">
                <div className="text-xl font-bold text-stone-900 group-hover:text-wood-700 mb-2 transition-colors">
                  {r.name}
                </div>
                <p className="text-stone-500 text-sm leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's included */}
      <section className="py-16 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-stone-900 mb-5">
                Everything Included in Your Install Price
              </h2>
              <p className="text-stone-500 mb-8 leading-relaxed">
                No hidden fees. One flat price covers everything from removing your old cabinets to the final cleanup.
              </p>
              <div className="space-y-3">
                {[
                  'Removal & demo of existing cabinets',
                  'Haul-away of all old materials',
                  'Assembly of flat-pack cabinets (IKEA, etc.)',
                  'Precise leveling and installation',
                  'Securing to wall studs',
                  'Door and drawer adjustment',
                  'Full cleanup when done',
                ].map(item => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-stone-700 text-sm font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-stone-950 rounded-2xl p-8">
              <h3 className="text-white font-bold text-xl mb-6">Pricing at a Glance</h3>
              <div className="space-y-4">
                {[
                  { label: 'Small Kitchen (10×10)', price: '$2,800 – $3,200' },
                  { label: 'Medium Kitchen (12×14)', price: '$3,200 – $3,600' },
                  { label: 'Large Kitchen (15×15+)', price: '$3,600 – $4,000' },
                  { label: 'Bathroom Vanity', price: 'Call for pricing' },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center py-3 border-b border-stone-800">
                    <span className="text-stone-400 text-sm">{row.label}</span>
                    <span className="text-wood-400 font-bold text-sm">{row.price}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 text-stone-500 text-xs">
                Final price depends on cabinet count, layout complexity, and access.
                All quotes are firm before work begins.
              </div>
              <Link to="/get-a-quote"
                className="mt-6 block bg-wood-600 hover:bg-wood-700 text-white font-bold py-3 rounded-xl text-center text-sm transition-colors">
                Get Your Exact Quote
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-stone-900 text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map(s => (
              <div key={s.step} className="text-center">
                <div className="w-14 h-14 bg-stone-950 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-wood-400 font-bold text-lg">{s.step}</span>
                </div>
                <h3 className="font-bold text-stone-900 mb-2">{s.title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-stone-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-stone-900 text-center mb-8">Common Questions</h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <details key={i} className="border border-stone-200 rounded-xl group bg-white">
                <summary className="flex items-center justify-between p-5 cursor-pointer list-none font-semibold text-stone-900 hover:text-wood-700 text-sm">
                  {faq.q}
                  <svg className="w-4 h-4 text-stone-400 group-open:rotate-180 transition-transform flex-shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-5 pb-5 text-stone-500 text-sm leading-relaxed border-t border-stone-100 pt-4">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-stone-950">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Already Have Your Cabinets? Let's Install Them.
          </h2>
          <p className="text-stone-400 mb-8">
            Orlando's most trusted cabinet installation crew. Licensed, insured, 16+ years experience.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/get-a-quote"
              className="bg-wood-600 hover:bg-wood-700 text-white font-bold px-8 py-4 rounded-xl transition-all hover:scale-105">
              Get Install Quote →
            </Link>
            <a href={phoneHref}
              className="border border-stone-700 hover:border-white text-stone-300 hover:text-white font-semibold px-8 py-4 rounded-xl transition-all">
              {business.phone || '(833) 201-7849'}
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
