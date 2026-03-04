import { useState } from 'react'
import { Link } from 'react-router-dom'

const COLLECTIONS = [
  {
    name: 'Essential Collection',
    bgImg: '/images/kitchens/essential.webp',
    desc: 'Timeless shaker design in 3 clean finishes. The most versatile and affordable full-cabinet collection in our catalog.',
    priceRange: 'Mid-Range · $320–$400 / LF installed',
    badge: '',
    attributes: {
      'Door Style': 'Shaker',
      'Box Construction': 'Plywood',
      'Finish Options': '3 styles',
      'Assembly': 'Pre-assembled',
      'Warranty': 'Limited Lifetime',
    },
    styles: [
      { name: 'Shaker White',   img: '/images/styles/essential-shaker-white.jpg' },
      { name: 'Shaker Gray',    img: '/images/styles/essential-shaker-gray.jpg' },
      { name: 'Shaker Espresso',img: '/images/styles/essential-shaker-espresso.jpg' },
    ],
  },
  {
    name: 'Charm Collection',
    bgImg: '/images/kitchens/charm.webp',
    desc: '8 bold colors — from navy to sage to rustic wood. The most popular collection for homeowners who want personality in the kitchen.',
    priceRange: 'Mid-Range · $390–$490 / LF installed',
    badge: 'Most Popular',
    attributes: {
      'Door Style': 'Shaker',
      'Box Construction': 'Plywood',
      'Finish Options': '8 styles',
      'Assembly': 'Pre-assembled',
      'Warranty': 'Limited Lifetime',
    },
    styles: [
      { name: 'Navy Blue',      img: '/images/styles/charm-navy-blue.jpg' },
      { name: 'Iron Black',     img: '/images/styles/charm-iron-black.jpg' },
      { name: 'Treasure Chest', img: '/images/styles/charm-treasure-chest.jpg' },
      { name: 'Aston Green',    img: '/images/styles/charm-aston-green.jpg' },
      { name: 'Smokey Ash',     img: '/images/styles/charm-smokey-ash.jpg' },
      { name: 'Luna Grey',      img: '/images/styles/charm-luna-grey.jpg' },
      { name: 'Rustic Wood',    img: '/images/styles/charm-rustic-wood.jpg' },
      { name: 'Sage Breeze',    img: '/images/styles/charm-sage-breeze.jpg' },
    ],
  },
  {
    name: 'Slim Shaker',
    bgImg: '/images/kitchens/slim.jpg',
    desc: 'A modern take on shaker with slimmer rails and cleaner lines. Ideal for contemporary kitchens that want understated sophistication.',
    priceRange: 'Mid-Range · $480–$600 / LF installed',
    badge: 'Trending',
    attributes: {
      'Door Style': 'Slim Shaker',
      'Box Construction': 'Plywood',
      'Finish Options': '5 styles',
      'Assembly': 'Pre-assembled',
      'Warranty': 'Limited Lifetime',
    },
    styles: [
      { name: 'Dove White',  img: '/images/styles/slim-dove-white.jpg' },
      { name: 'White Oak',   img: '/images/styles/slim-white-oak.jpg' },
      { name: 'Aston Green', img: '/images/styles/slim-aston-green.jpg' },
      { name: 'Amber Oak',   img: '/images/styles/slim-amber-oak.jpg' },
      { name: 'Iron Black',  img: '/images/styles/slim-iron-black.jpg' },
    ],
  },
  {
    name: 'Double Shaker',
    bgImg: '/images/kitchens/double.webp',
    desc: 'Double-rail shaker profiles deliver a rich, architectural feel. Available in two refined finishes.',
    priceRange: 'Mid-Range · $450–$560 / LF installed',
    badge: '',
    attributes: {
      'Door Style': 'Double Shaker',
      'Box Construction': 'Plywood',
      'Finish Options': '2 styles',
      'Assembly': 'Pre-assembled',
      'Warranty': 'Limited Lifetime',
    },
    styles: [
      { name: 'Smokey Grey', img: '/images/styles/double-smokey-grey.jpg' },
      { name: 'Dove White',  img: '/images/styles/double-dove-white.jpg' },
    ],
  },
  {
    name: 'Classic Style',
    bgImg: '/images/kitchens/builder.webp',
    desc: 'Traditional raised-panel doors that bring warmth and elegance to any kitchen. A timeless look that never goes out of style.',
    priceRange: 'Mid-Range · $450–$560 / LF installed',
    badge: '',
    attributes: {
      'Door Style': 'Raised Panel',
      'Box Construction': 'Plywood',
      'Finish Options': '3 styles',
      'Assembly': 'Pre-assembled',
      'Warranty': 'Limited Lifetime',
    },
    styles: [
      { name: 'Charleston White',    img: '/images/styles/classic-charleston-white.jpg' },
      { name: 'Aspen White',         img: '/images/styles/classic-aspen-white.jpg' },
      { name: 'Aspen Charcoal Gray', img: '/images/styles/classic-aspen-charcoal-gray.jpg' },
    ],
  },
  {
    name: 'Frameless European',
    bgImg: '/images/kitchens/frameless.webp',
    desc: 'Full-access European frameless construction with glass, gloss, and wood-look finishes. For bold, modern kitchens.',
    priceRange: 'Premium · $580–$720 / LF installed',
    badge: 'Premium',
    attributes: {
      'Door Style': 'Flat Panel, Frameless',
      'Box Construction': 'Plywood',
      'Finish Options': '8 styles',
      'Assembly': 'Pre-assembled',
      'Warranty': 'Limited Lifetime',
    },
    styles: [
      { name: 'High Gloss White', img: '/images/styles/frameless-high-gloss-white.jpg' },
      { name: 'High Gloss Gray',  img: '/images/styles/frameless-high-gloss-gray.jpg' },
      { name: 'Crystal Glass',    img: '/images/styles/frameless-crystal-glass.jpg' },
      { name: 'Midnight Glass',   img: '/images/styles/frameless-midnight-glass.jpg' },
      { name: 'Matt Black',       img: '/images/styles/frameless-matt-black.jpg' },
      { name: 'Matt Ivory',       img: '/images/styles/frameless-matt-ivory.jpg' },
      { name: 'Oak Blonde',       img: '/images/styles/frameless-oak-blonde.jpg' },
      { name: 'Oak Shade',        img: '/images/styles/frameless-oak-shade.jpg' },
    ],
  },
  {
    name: 'Builder Grade',
    bgImg: '/images/kitchens/classic.webp',
    desc: 'Reliable cabinets at the best price point in our catalog. Perfect for rental properties, investment flips, and budget-conscious renovations.',
    priceRange: 'Budget-Friendly · $280–$360 / LF installed',
    badge: 'Best Value',
    attributes: {
      'Door Style': 'Flat Panel',
      'Box Construction': 'Particle Board',
      'Finish Options': '3 styles',
      'Assembly': 'Pre-assembled',
      'Warranty': '1-Year',
    },
    styles: [
      { name: 'Floral White',    img: '/images/styles/builder-floral-white.jpg' },
      { name: 'Floral Espresso', img: '/images/styles/builder-floral-espresso.jpg' },
      { name: 'Floral Gray',     img: '/images/styles/builder-floral-gray.jpg' },
    ],
  },
]

const BADGE_COLORS: Record<string, string> = {
  'Most Popular': 'bg-wood-600',
  'Trending':     'bg-slate-700',
  'Premium':      'bg-navy-900',
  'Best Value':   'bg-orange-600',
}

export default function Collections() {
  const [selectedStyle, setSelectedStyle] = useState<{ img: string; name: string; collection: string } | null>(null)

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-navy-900 py-16 overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('/images/hero-bg.png')", backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="text-xs text-stone-500 mb-4 flex items-center gap-2">
            <Link to="/" className="hover:text-stone-300">Home</Link>
            <span>/</span>
            <span className="text-stone-300">Collections</span>
          </nav>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Our Cabinet <span className="text-wood-400">Collections</span>
          </h1>
          <p className="text-stone-400 text-lg max-w-2xl">
            7 collections · 32 door styles. Every finish from builder-grade to European frameless —
            all installed by our licensed Central Florida team.
          </p>
        </div>
      </section>

      {/* Collections grid */}
      <section className="py-14 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {COLLECTIONS.map(col => (
              <div key={col.name} className="rounded-2xl overflow-hidden shadow-sm border border-stone-200 bg-white flex flex-col">

                {/* Kitchen photo header */}
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={col.bgImg}
                    alt={`${col.name} kitchen`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  {col.badge && (
                    <div className="absolute top-3 left-3">
                      <span className={`${BADGE_COLORS[col.badge] ?? 'bg-stone-700'} text-white text-xs font-bold px-2.5 py-1 rounded-full`}>
                        {col.badge}
                      </span>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 p-4">
                    <h2 className="text-white font-bold text-lg leading-tight">{col.name}</h2>
                    <div className="text-stone-300 text-xs mt-0.5">{col.priceRange}</div>
                  </div>
                </div>

                {/* Door swatches */}
                <div className="px-4 pt-4 pb-3 border-b border-stone-100">
                  <div className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2.5">
                    Available Colors · {col.styles.length} styles · <span className="text-wood-500 normal-case font-normal">click to enlarge</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {col.styles.map(s => (
                      <button
                        key={s.name}
                        onClick={() => setSelectedStyle({ img: s.img, name: s.name, collection: col.name })}
                        className="group relative focus:outline-none"
                        title={s.name}
                      >
                        <div className="w-11 h-[3.5rem] bg-stone-400 rounded-lg overflow-hidden border-2 border-stone-200 group-hover:border-wood-400 group-hover:scale-110 transition-all flex items-center justify-center p-0.5">
                          <img src={s.img} alt={s.name} className="h-full w-auto object-contain" />
                        </div>
                        {/* tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 bg-stone-900 text-white text-xs px-2 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          {s.name}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description + specs */}
                <div className="p-4 flex-1 flex flex-col">
                  <p className="text-stone-600 text-sm leading-relaxed mb-4">{col.desc}</p>

                  <div className="space-y-1.5 mb-5">
                    {Object.entries(col.attributes).map(([k, v]) => (
                      <div key={k} className="flex justify-between items-center text-xs border-b border-stone-100 pb-1.5">
                        <span className="text-stone-400">{k}</span>
                        <span className="font-semibold text-stone-700">{v}</span>
                      </div>
                    ))}
                  </div>

                  <Link
                    to="/get-a-quote"
                    className="mt-auto bg-navy-900 hover:bg-navy-800 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors text-center"
                  >
                    Get Quote for {col.name} →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Style lightbox */}
      {selectedStyle && (
        <div
          className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-6"
          onClick={() => setSelectedStyle(null)}
        >
          <div
            className="relative bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-xs"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedStyle(null)}
              className="absolute top-3 right-3 z-10 w-8 h-8 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center text-lg leading-none transition-colors"
            >
              ×
            </button>
            <div className="bg-stone-400 flex items-center justify-center p-8" style={{ height: '280px' }}>
              <img
                src={selectedStyle.img}
                alt={selectedStyle.name}
                className="h-full w-auto object-contain drop-shadow-xl"
              />
            </div>
            <div className="p-5">
              <div className="text-xs text-stone-400 font-medium mb-1 uppercase tracking-wide">{selectedStyle.collection}</div>
              <h3 className="text-lg font-bold text-stone-900 mb-4">{selectedStyle.name}</h3>
              <Link
                to="/get-a-quote"
                onClick={() => setSelectedStyle(null)}
                className="block w-full bg-wood-600 hover:bg-wood-700 text-white font-semibold px-5 py-3 rounded-xl text-sm transition-colors text-center"
              >
                Get Quote in This Style →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* CTA */}
      <section className="relative py-16 bg-navy-900 overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('/images/after-2.jpeg')", backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="relative max-w-3xl mx-auto px-4 text-center">
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
