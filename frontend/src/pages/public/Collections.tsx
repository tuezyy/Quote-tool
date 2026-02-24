import { Link } from 'react-router-dom'

const COLLECTIONS = [
  {
    name: 'Essential & Charm',
    slug: 'essential-charm',
    skus: 265,
    styles: ['SA', 'IB', 'AG', 'SW', 'GR', 'SE', 'NB', 'TC'],
    description: 'The perfect blend of timeless design and everyday affordability. Clean lines, solid construction, and a wide variety of door styles make Essential & Charm the most versatile collection in our catalog.',
    attributes: {
      'Door Style': 'Full Overlay',
      'Box Construction': 'Plywood',
      'Finish Options': '8 styles',
      'Cabinet Types': 'Wall, Base, Tall, Specialty, Vanity',
      'Assembly': 'Pre-assembled',
      'Warranty': 'Limited Lifetime',
    },
    priceRange: 'Mid-Range',
    badge: 'Most Popular',
    badgeColor: 'bg-wood-600',
    borderColor: 'border-amber-300',
    bgColor: 'bg-amber-50',
  },
  {
    name: 'Classical & Double Shaker',
    slug: 'classical-double-shaker',
    skus: 265,
    styles: ['AW', 'AC', 'CW', 'DDW', 'DSG'],
    description: 'Traditional raised-panel doors and double shaker profiles that bring warmth and elegance to any kitchen. A perennial favorite for homeowners who want a classic, timeless look.',
    attributes: {
      'Door Style': 'Raised Panel & Double Shaker',
      'Box Construction': 'Plywood',
      'Finish Options': '5 styles',
      'Cabinet Types': 'Wall, Base, Tall, Specialty, Vanity',
      'Assembly': 'Pre-assembled',
      'Warranty': 'Limited Lifetime',
    },
    priceRange: 'Mid-Range',
    badge: '',
    badgeColor: '',
    borderColor: 'border-stone-300',
    bgColor: 'bg-stone-50',
  },
  {
    name: 'Slim Shaker',
    slug: 'slim-shaker',
    skus: 232,
    styles: ['SDW', 'SWO', 'SAG'],
    description: 'A modern take on the classic shaker style with slimmer profiles and cleaner lines. Ideal for contemporary kitchens seeking understated sophistication.',
    attributes: {
      'Door Style': 'Slim Shaker Profile',
      'Box Construction': 'Plywood',
      'Finish Options': '3 styles',
      'Cabinet Types': 'Wall, Base, Tall, Specialty, Vanity',
      'Assembly': 'Pre-assembled',
      'Warranty': 'Limited Lifetime',
    },
    priceRange: 'Mid-Range',
    badge: 'Trending',
    badgeColor: 'bg-slate-700',
    borderColor: 'border-slate-300',
    bgColor: 'bg-slate-50',
  },
  {
    name: 'Frameless High Gloss',
    slug: 'frameless-high-gloss',
    skus: 160,
    styles: ['HW', 'HG'],
    description: 'European-style frameless construction with a mirror-like high gloss finish. Clean, bold, and luxurious — for kitchens that make a statement.',
    attributes: {
      'Door Style': 'Flat Panel, Frameless',
      'Box Construction': 'Plywood',
      'Finish Options': '2 styles (White & Graphite)',
      'Cabinet Types': 'Wall, Base, Tall, Specialty',
      'Assembly': 'Pre-assembled',
      'Warranty': 'Limited Lifetime',
    },
    priceRange: 'Premium',
    badge: 'Premium',
    badgeColor: 'bg-zinc-800',
    borderColor: 'border-zinc-300',
    bgColor: 'bg-zinc-50',
  },
  {
    name: 'Builder Grade',
    slug: 'builder-grade',
    skus: 134,
    styles: ['FW', 'FG', 'FE'],
    description: 'Solid, dependable cabinets at the best price point in our catalog. Ideal for rental properties, investment flips, or budget-conscious renovations without sacrificing quality.',
    attributes: {
      'Door Style': 'Flat Panel',
      'Box Construction': 'Particle Board',
      'Finish Options': '3 styles',
      'Cabinet Types': 'Wall, Base, Tall',
      'Assembly': 'Pre-assembled',
      'Warranty': '1-Year',
    },
    priceRange: 'Budget-Friendly',
    badge: 'Best Value',
    badgeColor: 'bg-orange-600',
    borderColor: 'border-orange-200',
    bgColor: 'bg-orange-50',
  },
]

const CATEGORIES = [
  {
    name: 'Wall Cabinets',
    desc: 'Mounted above countertops for storage and display.',
    icon: '🗄️',
  },
  {
    name: 'Base Cabinets',
    desc: 'Floor-level cabinets that anchor the kitchen layout.',
    icon: '🪵',
  },
  {
    name: 'Tall Cabinets',
    desc: 'Full-height pantry and utility cabinets.',
    icon: '📦',
  },
  {
    name: 'Specialty Cabinets',
    desc: 'Corner units, lazy susans, pull-outs and more.',
    icon: '⚙️',
  },
  {
    name: 'Vanity Cabinets',
    desc: 'Designed for bathroom vanity applications.',
    icon: '🪞',
  },
]

export default function Collections() {
  return (
    <div>
      {/* JSON-LD Product Catalog Schema */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Cabinet Collections — Cabinets of Orlando',
        numberOfItems: 5,
        itemListElement: COLLECTIONS.map((col, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'Product',
            name: col.name,
            description: col.description,
            brand: { '@type': 'Brand', name: 'Cabinets of Orlando' },
            offers: {
              '@type': 'Offer',
              availability: 'https://schema.org/InStock',
              priceCurrency: 'USD',
              seller: { '@type': 'Organization', name: 'Cabinets of Orlando' },
            },
          },
        })),
      })}} />

      {/* Hero */}
      <section className="bg-stone-950 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <nav className="text-xs text-stone-500 mb-4 flex items-center gap-2">
              <Link to="/" className="hover:text-stone-300">Home</Link>
              <span>/</span>
              <span className="text-stone-300">Collections</span>
            </nav>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Our Cabinet <span className="text-wood-400">Collections</span>
            </h1>
            <p className="text-stone-400 text-lg">
              5 collections. 1,044+ SKUs. Every style, every budget.
              Browse our full catalog and request a free quote when you're ready.
            </p>
          </div>
        </div>
      </section>

      {/* Category Types */}
      <section className="bg-stone-900 border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-wrap gap-3 justify-center">
            {CATEGORIES.map(cat => (
              <div key={cat.name} className="flex items-center gap-2 bg-stone-800 rounded-full px-4 py-2">
                <span className="text-base">{cat.icon}</span>
                <span className="text-stone-300 text-sm font-medium">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Collections List */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {COLLECTIONS.map((col, index) => (
            <div
              key={col.name}
              className={`border-2 ${col.borderColor} ${col.bgColor} rounded-2xl overflow-hidden`}
            >
              <div className="p-8 md:p-10">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">
                        Collection {index + 1} of 5
                      </span>
                      {col.badge && (
                        <span className={`${col.badgeColor} text-white text-xs font-semibold px-2.5 py-0.5 rounded-full`}>
                          {col.badge}
                        </span>
                      )}
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-stone-900">{col.name}</h2>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-stone-900">{col.skus}</div>
                    <div className="text-xs text-stone-500">Available SKUs</div>
                  </div>
                </div>

                <p className="text-stone-600 text-base leading-relaxed mb-8 max-w-3xl">
                  {col.description}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Attributes */}
                  <div>
                    <h3 className="text-sm font-bold text-stone-700 uppercase tracking-wide mb-3">
                      Product Attributes
                    </h3>
                    <div className="space-y-2">
                      {Object.entries(col.attributes).map(([key, val]) => (
                        <div key={key} className="flex justify-between items-center py-1.5 border-b border-stone-200/60">
                          <span className="text-sm text-stone-500">{key}</span>
                          <span className="text-sm font-semibold text-stone-800">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Styles */}
                  <div>
                    <h3 className="text-sm font-bold text-stone-700 uppercase tracking-wide mb-3">
                      Available Styles
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {col.styles.map(style => (
                        <span key={style}
                          className="bg-white border border-stone-300 text-stone-700 text-sm font-mono font-semibold px-3 py-1.5 rounded-lg">
                          {style}
                        </span>
                      ))}
                    </div>
                    <div className="bg-white border border-stone-200 rounded-xl p-4">
                      <div className="text-xs text-stone-400 mb-1">Price Range</div>
                      <div className="font-bold text-stone-900">{col.priceRange}</div>
                      <div className="text-xs text-stone-400 mt-2">
                        Price varies by kitchen size and number of cabinets. Get a quote for your exact project.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link to="/get-a-quote"
                    className="bg-stone-950 hover:bg-stone-800 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all">
                    Get Quote for {col.name} →
                  </Link>
                  <a href="tel:+18332017849"
                    className="border border-stone-300 hover:border-stone-500 text-stone-600 hover:text-stone-900 font-semibold px-6 py-2.5 rounded-xl text-sm transition-all">
                    Call for Pricing
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories Detail */}
      <section className="py-16 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-stone-900 mb-8 text-center">
            Cabinet Types Available Across All Collections
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {CATEGORIES.map(cat => (
              <div key={cat.name} className="bg-white border border-stone-200 rounded-xl p-5 text-center">
                <div className="text-3xl mb-3">{cat.icon}</div>
                <div className="font-bold text-stone-900 text-sm mb-1">{cat.name}</div>
                <div className="text-stone-500 text-xs leading-relaxed">{cat.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-stone-950">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Found Your Style? Let's Get You a Price.
          </h2>
          <p className="text-stone-400 mb-8">
            Tell us your kitchen size and preferred collection — we'll send you a detailed quote within 2 hours.
          </p>
          <Link to="/get-a-quote"
            className="bg-wood-600 hover:bg-wood-700 text-white font-bold px-8 py-4 rounded-xl text-base transition-all hover:scale-105 inline-block">
            Get Your Free Quote
          </Link>
        </div>
      </section>
    </div>
  )
}
