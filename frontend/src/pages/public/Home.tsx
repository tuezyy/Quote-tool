import { Link } from 'react-router-dom'

const SERVICES = [
  {
    name: 'Kitchen Cabinet Installation',
    size: 'All Sizes',
    minPrice: 7500,
    maxPrice: 19000,
    description: "Full kitchen cabinet installation from small 10×10 kitchens to large open-concept layouts. IKEA, Home Depot, Lowe's, or custom cabinets.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    name: 'Bathroom Cabinet Installation',
    size: 'Vanity & Storage',
    minPrice: 1200,
    maxPrice: 4500,
    description: 'Vanity cabinets, linen towers, and bathroom storage. We install all brands and custom pieces.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    name: 'Countertop Installation',
    size: 'Kitchen & Bath',
    minPrice: 800,
    maxPrice: 3500,
    description: 'Professional countertop installation for kitchens and bathrooms. Granite, quartz, laminate, and more.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
  },
  {
    name: 'Install Only',
    size: 'IKEA · Home Depot · Lowe\'s',
    minPrice: 2800,
    maxPrice: 4000,
    description: 'Already bought your cabinets? We install them. We work with IKEA, Home Depot, Lowe\'s, and any custom supplier.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
]

const COLLECTIONS = [
  {
    name: 'Essential & Charm',
    styles: 'SA, IB, AG, SW, GR, SE, NB, TC',
    skus: 265,
    description: 'Timeless designs with clean lines — the perfect balance of value and style.',
    color: 'bg-amber-50 border-amber-200',
    badge: 'Most Popular',
  },
  {
    name: 'Classical & Double Shaker',
    styles: 'AW, AC, CW, DDW, DSG',
    skus: 265,
    description: 'Traditional elegance with raised panels and decorative details.',
    color: 'bg-stone-50 border-stone-200',
    badge: '',
  },
  {
    name: 'Slim Shaker',
    styles: 'SDW, SWO, SAG',
    skus: 232,
    description: 'Modern minimalism with sleek profiles — perfect for contemporary kitchens.',
    color: 'bg-slate-50 border-slate-200',
    badge: 'Trending',
  },
  {
    name: 'Frameless High Gloss',
    styles: 'HW, HG',
    skus: 160,
    description: 'European-style frameless boxes with a high-gloss finish for a luxurious look.',
    color: 'bg-zinc-50 border-zinc-200',
    badge: 'Premium',
  },
  {
    name: 'Builder Grade',
    styles: 'FW, FG, FE',
    skus: 134,
    description: 'Solid, reliable cabinets at the best price point — great for rentals and flips.',
    color: 'bg-orange-50 border-orange-200',
    badge: 'Best Value',
  },
]

const FAQS = [
  {
    q: 'How much does kitchen cabinet installation cost in Orlando?',
    a: 'Cabinet installation in Orlando typically ranges from $7,500 to $19,000 depending on kitchen size. Small kitchens (10×10) run $7,500–$10,000, medium kitchens (12×14) run $10,500–$14,000, and large kitchens (15×15+) run $14,500–$19,000. Installation-only services (customer supplies cabinets) start at $2,800.',
  },
  {
    q: 'Do you install cabinets from IKEA, Home Depot, or Lowe\'s?',
    a: 'Yes — this is one of our most popular services. If you\'ve already purchased cabinets from IKEA, Home Depot, Lowe\'s, or any other supplier, we handle the professional installation. Just bring your cabinets, we\'ll handle the rest. Installation-only pricing starts at $2,800.',
  },
  {
    q: 'How long does cabinet installation take?',
    a: 'Most kitchen cabinet installations take 2–4 days. A small kitchen typically takes 1–2 days, while larger or more complex layouts may take 3–5 days. We provide a precise timeline during your free estimate.',
  },
  {
    q: 'Are you licensed and insured in Florida?',
    a: 'Yes. Cabinets of Orlando is fully licensed and insured in the state of Florida. We carry general liability insurance and all required state contractor licenses. We have 16+ years of experience serving Orlando and surrounding areas.',
  },
  {
    q: 'What areas do you serve?',
    a: 'We serve Orlando and surrounding areas including Winter Park, Lake Nona, Kissimmee, Oviedo, Apopka, Clermont, Pine Hills, and MetroWest.',
  },
  {
    q: 'Do you install bathroom cabinets and countertops?',
    a: 'Yes. In addition to kitchen cabinets, we install bathroom vanity cabinets, linen towers, and bathroom storage units. We also handle countertop installation for both kitchens and bathrooms.',
  },
  {
    q: 'What cabinet brands and collections do you carry?',
    a: 'We carry 5 collections with over 1,044 SKUs: Essential & Charm (265 products), Classical & Double Shaker (265 products), Slim Shaker (232 products), Frameless High Gloss (160 products), and Builder Grade (134 products). Every collection includes wall cabinets, base cabinets, tall cabinets, and specialty pieces.',
  },
]

const SERVICE_AREAS = [
  'Orlando', 'Winter Park', 'Apopka', 'Ocoee',
  'Clermont', 'Kissimmee', 'Pine Hills', 'Altamonte Springs',
  'MetroWest', 'Winter Garden', 'Lake Nona',
]

export default function Home() {
  return (
    <div>
      {/* JSON-LD FAQ Schema */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: FAQS.map(faq => ({
          '@type': 'Question',
          name: faq.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.a,
          },
        })),
      })}} />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/hero-bg.png" alt="Beautiful kitchen by Cabinets of Orlando" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-navy-900/70" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-wood-500/20 border border-wood-500/30 rounded-full px-4 py-1.5 mb-6">
              <div className="w-2 h-2 bg-wood-400 rounded-full animate-pulse" />
              <span className="text-wood-300 text-xs font-semibold tracking-wide uppercase">
                Central Florida's Cabinet Experts
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6">
              Orlando's Premier{' '}
              <span className="text-wood-400">Cabinet Installer</span>
            </h1>
            <p className="text-lg md:text-xl text-stone-300 max-w-2xl mb-8 leading-relaxed">
              Professional cabinet installation in Orlando and surrounding areas. We install IKEA, Home Depot, Lowe's, and custom cabinets — kitchens, bathrooms, and countertops.
              Licensed, insured, and trusted for 16+ years.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/get-a-quote"
                className="bg-wood-500 hover:bg-wood-600 text-white font-bold px-8 py-3.5 rounded-xl text-base transition-all hover:scale-105 shadow-lg shadow-wood-900/30"
              >
                Get Your Free Quote
              </Link>
              <Link
                to="/collections"
                className="border border-white/30 hover:border-white/60 text-white font-semibold px-8 py-3.5 rounded-xl text-base transition-all backdrop-blur-sm"
              >
                Browse Collections
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="bg-navy-800 border-b border-navy-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: '1,044+', label: 'Cabinet SKUs' },
              { value: '5', label: 'Collections' },
              { value: 'Licensed', label: '& Insured in Florida' },
              { value: '16+', label: 'Years in Business' },
            ].map(stat => (
              <div key={stat.value} className="text-center">
                <div className="text-2xl font-bold text-wood-400">{stat.value}</div>
                <div className="text-xs text-stone-400 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES & PRICING */}
      <section className="relative py-20 bg-white overflow-hidden" id="services">
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "url('/images/kitchen-1.jpeg')", backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">
              Transparent Pricing
            </h2>
            <p className="text-stone-500 text-lg max-w-xl mx-auto">
              No surprises. Honest quotes upfront. Every project includes removal of old cabinets and full professional installation.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {SERVICES.map((service) => (
              <div key={service.name} className="border border-stone-200 rounded-2xl p-6 hover:border-wood-400 hover:shadow-md transition-all group">
                <div className="w-12 h-12 bg-stone-100 group-hover:bg-wood-50 rounded-xl flex items-center justify-center text-stone-600 group-hover:text-wood-600 transition-colors mb-4">
                  {service.icon}
                </div>
                <div className="text-xs text-stone-400 font-medium mb-1">{service.size}</div>
                <h3 className="font-bold text-stone-900 mb-2">{service.name}</h3>
                <p className="text-stone-500 text-sm mb-4 leading-relaxed">{service.description}</p>
                <div className="pt-4 border-t border-stone-100">
                  <div className="text-xs text-stone-400 mb-0.5">Starting from</div>
                  <div className="text-xl font-bold text-stone-900">
                    ${service.minPrice.toLocaleString()}
                    <span className="text-sm font-normal text-stone-400">
                      {' '}– ${service.maxPrice.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link to="/get-a-quote"
              className="inline-block bg-wood-600 hover:bg-wood-700 text-white font-bold px-8 py-3.5 rounded-xl transition-all hover:scale-105">
              Get Your Exact Quote →
            </Link>
          </div>
        </div>
      </section>

      {/* COLLECTIONS PREVIEW */}
      <section className="relative py-20 bg-stone-50 overflow-hidden" id="collections">
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "url('/images/shaker-white.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">
              5 Premium Collections
            </h2>
            <p className="text-stone-500 text-lg max-w-xl mx-auto">
              Over 1,044 cabinet SKUs across 5 distinct collections. Every style, every budget.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {COLLECTIONS.map((col) => (
              <Link
                key={col.name}
                to="/collections"
                className={`border-2 ${col.color} rounded-2xl p-6 hover:shadow-md transition-all group relative`}
              >
                {col.badge && (
                  <span className="absolute top-4 right-4 bg-wood-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                    {col.badge}
                  </span>
                )}
                <h3 className="font-bold text-stone-900 text-lg mb-1 group-hover:text-wood-700 transition-colors">
                  {col.name}
                </h3>
                <p className="text-stone-500 text-sm mb-3 leading-relaxed">{col.description}</p>
                <div className="flex items-center justify-between text-xs text-stone-400">
                  <span>{col.skus} products</span>
                  <span className="text-stone-300">Styles: {col.styles}</span>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link to="/collections" className="text-wood-600 hover:text-wood-700 font-semibold inline-flex items-center gap-1.5">
              View All Collections
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="relative py-20 bg-white overflow-hidden">
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: "url('/images/after-2.jpeg')", backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">How It Works</h2>
            <p className="text-stone-500 text-lg">Simple. Fast. Professional.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-0.5 bg-stone-200" />
            {[
              {
                step: '01',
                title: 'Get Your Free Quote',
                desc: 'Fill out our quick form with your kitchen size and style preferences. We respond within 2 hours.',
              },
              {
                step: '02',
                title: 'On-Site Estimate',
                desc: 'We visit your home, take exact measurements, and walk you through collection options.',
              },
              {
                step: '03',
                title: 'Professional Installation',
                desc: 'Our licensed crew handles everything — demo, delivery, and full installation.',
              },
            ].map((step) => (
              <div key={step.step} className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-navy-900 rounded-2xl flex items-center justify-center mb-5 relative z-10">
                  <span className="text-wood-400 font-bold text-xl">{step.step}</span>
                </div>
                <h3 className="font-bold text-stone-900 text-lg mb-2">{step.title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed max-w-xs">{step.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link to="/get-a-quote"
              className="bg-navy-900 hover:bg-navy-800 text-white font-bold px-8 py-3.5 rounded-xl transition-all">
              Start Your Project →
            </Link>
          </div>
        </div>
      </section>

      {/* SERVICE AREAS */}
      <section className="relative py-16 bg-stone-50 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "url('/images/hero-bg.png')", backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-stone-900 mb-3">
              Serving All of Central Florida
            </h2>
            <p className="text-stone-500">From Orlando to the surrounding communities.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {SERVICE_AREAS.map(area => (
              <span
                key={area}
                className="bg-white border border-stone-200 text-stone-700 text-sm px-4 py-2 rounded-full"
              >
                {area}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative py-20 bg-white overflow-hidden" id="faq">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "url('/images/kitchen-3.jpeg')", backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-stone-900 mb-3">Frequently Asked Questions</h2>
            <p className="text-stone-500">Everything you need to know before getting started.</p>
          </div>
          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <details key={i} className="border border-stone-200 rounded-xl group">
                <summary className="flex items-center justify-between p-5 cursor-pointer list-none font-semibold text-stone-900 hover:text-wood-700">
                  {faq.q}
                  <svg className="w-5 h-5 text-stone-400 group-open:rotate-180 transition-transform flex-shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* BEFORE / AFTER GALLERY */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">Before & After</h2>
            <p className="text-stone-500 text-lg max-w-xl mx-auto">Real kitchens transformed by our team in Orlando.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { before: '/images/before-1.jpeg', after: '/images/after-1.jpeg' },
              { before: '/images/before-2.jpeg', after: '/images/after-2.jpeg' },
              { before: '/images/before-3.jpeg', after: '/images/after-3.jpeg' },
            ].map((pair, i) => (
              <div key={i} className="rounded-2xl overflow-hidden border border-stone-200 shadow-sm">
                <div className="grid grid-cols-2">
                  <div className="relative">
                    <img src={pair.before} alt="Before installation" className="w-full h-48 object-cover"/>
                    <div className="absolute bottom-2 left-2 bg-stone-900/70 text-white text-xs font-semibold px-2 py-1 rounded">Before</div>
                  </div>
                  <div className="relative">
                    <img src={pair.after} alt="After installation" className="w-full h-48 object-cover"/>
                    <div className="absolute bottom-2 right-2 bg-wood-500/90 text-white text-xs font-semibold px-2 py-1 rounded">After</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6 max-w-2xl mx-auto">
            <div className="rounded-2xl overflow-hidden border border-stone-200 shadow-sm">
              <img src="/images/kitchen-1.jpeg" alt="Kitchen cabinet installation Orlando" className="w-full h-52 object-cover"/>
            </div>
            <div className="rounded-2xl overflow-hidden border border-stone-200 shadow-sm">
              <img src="/images/kitchen-3.jpeg" alt="Kitchen cabinet installation Central Florida" className="w-full h-52 object-cover"/>
            </div>
          </div>
          <div className="text-center mt-10">
            <Link to="/get-a-quote"
              className="inline-block bg-wood-500 hover:bg-wood-600 text-white font-bold px-8 py-3.5 rounded-xl transition-all hover:scale-105">
              Get a Quote for Your Kitchen →
            </Link>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative py-20 bg-navy-900 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.12]" style={{ backgroundImage: "url('/images/after-3.jpeg')", backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Kitchen?
          </h2>
          <p className="text-stone-400 text-lg mb-8 max-w-xl mx-auto">
            Get a free estimate from Orlando's most trusted cabinet installer. No pressure, no obligation.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/get-a-quote"
              className="bg-wood-600 hover:bg-wood-700 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all hover:scale-105 shadow-lg shadow-wood-900/30">
              Get Free Quote
            </Link>
            <a href="tel:+18332017849"
              className="border border-stone-600 hover:border-white text-stone-300 hover:text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all">
              (833) 201-7849
            </a>
          </div>
          <p className="text-stone-600 text-sm mt-6">Available 24/7 · Licensed & Insured · 16+ Years Experience</p>
        </div>
      </section>
    </div>
  )
}
