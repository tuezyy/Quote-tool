import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Collection { id: string; name: string; totalProducts: number; styles: {id:string;name:string;code:string}[] }
interface Product { id: string; itemCode: string; description: string; category: string; width: number|null; height: number|null; depth: number|null; msrp: number; customerPrice: number; collectionId: string }
interface CartItem extends Product { qty: number }

// ─── Constants ────────────────────────────────────────────────────────────────
const KITCHEN_SIZES = [
  { label: 'Small (10×10)', value: 'small_10x10', priceRange: '$7,500–$10,000' },
  { label: 'Medium (12×14)', value: 'medium_12x14', priceRange: '$10,500–$14,000' },
  { label: 'Large (15×15+)', value: 'large_15x15', priceRange: '$14,500–$19,000' },
  { label: 'Installation Only', value: 'install_only', priceRange: '$2,800–$4,000' },
  { label: 'Not Sure', value: 'unknown', priceRange: "We'll help figure it out" },
]
const COLLECTION_NAMES = ['Essential & Charm','Classical & Double Shaker','Slim Shaker','Frameless High Gloss','Builder Grade',"I'm Not Sure Yet"]
const TIMELINES = ['As soon as possible','Within 1 month','1–3 months','3–6 months','Just researching']
const INSTALL_ESTIMATE = { min: 2800, max: 4000 }

// ─── Shared contact form ──────────────────────────────────────────────────────
interface ContactForm { firstName: string; lastName: string; email: string; phone: string; address: string; city: string }
const EMPTY_CONTACT: ContactForm = { firstName:'', lastName:'', email:'', phone:'', address:'', city:'' }

function ContactStep({ form, onChange, onNext }: { form: ContactForm; onChange: (f: ContactForm) => void; onNext: () => void }) {
  const valid = form.firstName && form.lastName && form.email && form.phone
  const f = (k: keyof ContactForm) => (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...form, [k]: e.target.value })
  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-bold text-stone-900 mb-1">Your Contact Info</h2>
      <p className="text-stone-500 text-sm mb-6">So we can send your quote.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {([['firstName','First Name','John'],['lastName','Last Name','Smith'],['email','Email','john@email.com'],['phone','Phone','(407) 555-0100'],['address','Street Address','123 Main St'],['city','City','Orlando']] as [keyof ContactForm, string, string][]).map(([k, label, ph]) => (
          <div key={k}>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">{label}{['firstName','lastName','email','phone'].includes(k) ? ' *' : ''}</label>
            <input type={k==='email'?'email':k==='phone'?'tel':'text'} placeholder={ph} value={form[k]} onChange={f(k)}
              className="w-full border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-wood-500 focus:border-transparent" />
          </div>
        ))}
      </div>
      <div className="flex justify-end mt-6">
        <button onClick={onNext} disabled={!valid}
          className="bg-wood-600 hover:bg-wood-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-semibold px-8 py-2.5 rounded-xl transition-colors">
          Continue →
        </button>
      </div>
    </div>
  )
}

// ─── ESTIMATE path (simple) ───────────────────────────────────────────────────
function EstimatePath({ onSuccess }: { onSuccess: (f: any) => void }) {
  const [step, setStep] = useState<1|2|3>(1)
  const [contact, setContact] = useState<ContactForm>(EMPTY_CONTACT)
  const [kitchenSize, setKitchenSize] = useState('')
  const [collection, setCollection] = useState('')
  const [timeline, setTimeline] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    setSubmitting(true); setError('')
    try {
      await axios.post('/api/public/quote-request', { ...contact, kitchenSize, collection, timeline, notes, quoteType: 'estimate' })
      onSuccess({ ...contact, kitchenSize, collection })
    } catch { setError('Something went wrong. Call us at (833) 201-7849.') }
    finally { setSubmitting(false) }
  }

  return (
    <>
      {step === 1 && <ContactStep form={contact} onChange={setContact} onNext={() => setStep(2)} />}

      {step === 2 && (
        <div className="animate-fade-in">
          <h2 className="text-xl font-bold text-stone-900 mb-1">Project Details</h2>
          <p className="text-stone-500 text-sm mb-6">Tell us about your kitchen.</p>
          <div className="mb-6">
            <label className="block text-sm font-bold text-stone-700 mb-3">Kitchen Size *</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {KITCHEN_SIZES.map(s => (
                <button key={s.value} onClick={() => setKitchenSize(s.value)}
                  className={`border-2 rounded-xl p-4 text-left transition-all ${kitchenSize===s.value?'border-wood-600 bg-wood-50':'border-stone-200 hover:border-stone-400'}`}>
                  <div className="font-semibold text-stone-900 text-sm">{s.label}</div>
                  <div className="text-stone-400 text-xs mt-0.5">{s.priceRange}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-bold text-stone-700 mb-3">Preferred Collection *</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {COLLECTION_NAMES.map(c => (
                <button key={c} onClick={() => setCollection(c)}
                  className={`border-2 rounded-xl p-4 text-left transition-all ${collection===c?'border-wood-600 bg-wood-50':'border-stone-200 hover:border-stone-400'}`}>
                  <span className="font-semibold text-stone-900 text-sm">{c}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-between mt-6">
            <button onClick={() => setStep(1)} className="text-stone-500 hover:text-stone-700 font-medium text-sm">← Back</button>
            <button onClick={() => setStep(3)} disabled={!kitchenSize || !collection}
              className="bg-wood-600 hover:bg-wood-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-semibold px-8 py-2.5 rounded-xl transition-colors">
              Continue →
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="animate-fade-in">
          <h2 className="text-xl font-bold text-stone-900 mb-1">Almost Done</h2>
          <p className="text-stone-500 text-sm mb-6">When are you looking to start?</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-5">
            {TIMELINES.map(t => (
              <button key={t} onClick={() => setTimeline(t)}
                className={`border-2 rounded-xl px-3 py-2.5 text-xs font-medium transition-all ${timeline===t?'border-wood-600 bg-wood-50 text-wood-800':'border-stone-200 text-stone-600 hover:border-stone-400'}`}>
                {t}
              </button>
            ))}
          </div>
          <div className="mb-5">
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Anything else? (optional)</label>
            <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Special requests, access info..."
              className="w-full border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-wood-500 focus:border-transparent resize-none" />
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}
          <div className="flex justify-between items-center">
            <button onClick={() => setStep(2)} className="text-stone-500 hover:text-stone-700 font-medium text-sm">← Back</button>
            <button onClick={submit} disabled={!timeline || submitting}
              className="bg-wood-600 hover:bg-wood-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-bold px-8 py-3 rounded-xl transition-colors flex items-center gap-2">
              {submitting ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Sending...</> : 'Send My Quote Request'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}

// ─── DETAILED BUILDER path ────────────────────────────────────────────────────
function BuilderPath({ onSuccess }: { onSuccess: (f: any) => void }) {
  const [step, setStep] = useState<1|2|3|4>(1)
  const [contact, setContact] = useState<ContactForm>(EMPTY_CONTACT)
  const [collections, setCollections] = useState<Collection[]>([])
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [activeCategory, setActiveCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [timeline, setTimeline] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Load collections
  useEffect(() => {
    axios.get('/api/public/collections').then(r => setCollections(r.data.collections || []))
  }, [])

  // Load products when collection selected
  useEffect(() => {
    if (!selectedCollection) return
    setLoadingProducts(true)
    setActiveCategory('All')
    setSearch('')
    Promise.all([
      axios.get('/api/public/products', { params: { collectionId: selectedCollection.id, limit: 200 } }),
      axios.get('/api/public/categories', { params: { collectionId: selectedCollection.id } }),
    ]).then(([pRes, cRes]) => {
      setProducts(pRes.data.products || [])
      setCategories(cRes.data || [])
    }).finally(() => setLoadingProducts(false))
  }, [selectedCollection])

  const filteredProducts = products.filter(p => {
    const matchCat = activeCategory === 'All' || p.category === activeCategory
    const matchSearch = !search || p.itemCode.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id)
      if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { ...product, qty: 1 }]
    })
  }

  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) setCart(prev => prev.filter(i => i.id !== id))
    else setCart(prev => prev.map(i => i.id === id ? { ...i, qty } : i))
  }

  const cartTotal = cart.reduce((sum, i) => sum + i.customerPrice * i.qty, 0)
  const grandMin = cartTotal + INSTALL_ESTIMATE.min
  const grandMax = cartTotal + INSTALL_ESTIMATE.max

  const submit = async () => {
    setSubmitting(true); setError('')
    try {
      await axios.post('/api/public/quote-request', {
        ...contact,
        kitchenSize: 'custom_builder',
        collection: selectedCollection?.name ?? '',
        timeline,
        notes,
        quoteType: 'detailed',
        items: cart.map(i => ({ productId: i.id, itemCode: i.itemCode, description: i.description, qty: i.qty, customerPrice: i.customerPrice })),
      })
      onSuccess({ ...contact, cart, cartTotal })
    } catch { setError('Something went wrong. Call us at (833) 201-7849.') }
    finally { setSubmitting(false) }
  }

  return (
    <>
      {step === 1 && <ContactStep form={contact} onChange={setContact} onNext={() => setStep(2)} />}

      {/* Step 2: Pick collection */}
      {step === 2 && (
        <div className="animate-fade-in">
          <h2 className="text-xl font-bold text-stone-900 mb-1">Choose Your Collection</h2>
          <p className="text-stone-500 text-sm mb-6">Pick the cabinet style you want to build your quote from.</p>
          {collections.length === 0 ? (
            <div className="text-center py-8 text-stone-400">Loading collections...</div>
          ) : (
            <div className="space-y-3">
              {collections.map(col => (
                <button key={col.id} onClick={() => { setSelectedCollection(col); setStep(3) }}
                  className={`w-full border-2 rounded-xl p-4 text-left transition-all flex items-center justify-between ${selectedCollection?.id===col.id?'border-wood-600 bg-wood-50':'border-stone-200 hover:border-wood-400'}`}>
                  <div>
                    <div className="font-bold text-stone-900">{col.name}</div>
                    <div className="text-xs text-stone-400 mt-0.5">{col.totalProducts} products available</div>
                  </div>
                  <svg className="w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                  </svg>
                </button>
              ))}
            </div>
          )}
          <div className="flex justify-between mt-6">
            <button onClick={() => setStep(1)} className="text-stone-500 hover:text-stone-700 font-medium text-sm">← Back</button>
          </div>
        </div>
      )}

      {/* Step 3: Product catalog + cart */}
      {step === 3 && (
        <div className="animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-stone-900">Build Your Quote</h2>
              <p className="text-stone-500 text-xs mt-0.5">{selectedCollection?.name}</p>
            </div>
            <button onClick={() => setStep(4)} disabled={cart.length === 0}
              className="bg-wood-600 hover:bg-wood-700 disabled:bg-stone-200 disabled:text-stone-400 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors flex items-center gap-2">
              <span>Review ({cart.length})</span>
              {cart.length > 0 && <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">${cartTotal.toLocaleString('en-US', {maximumFractionDigits:0})}</span>}
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-3 flex-wrap">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by code or description..."
              className="flex-1 min-w-0 border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wood-500" />
          </div>
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {['All', ...categories].map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${activeCategory===cat?'bg-stone-900 text-white':'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
                {cat}
              </button>
            ))}
          </div>

          {/* Products grid */}
          {loadingProducts ? (
            <div className="text-center py-12 text-stone-400">Loading products...</div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-stone-400 text-sm">No products match your search.</div>
              ) : filteredProducts.map(product => {
                const inCart = cart.find(i => i.id === product.id)
                return (
                  <div key={product.id} className="flex items-center justify-between border border-stone-200 rounded-xl px-4 py-3 hover:border-stone-300 transition-colors">
                    <div className="flex-1 min-w-0 mr-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-stone-500">{product.itemCode}</span>
                        <span className="text-xs text-stone-400 hidden sm:inline">{product.category}</span>
                      </div>
                      <div className="text-sm text-stone-800 leading-tight mt-0.5 truncate">{product.description}</div>
                      {(product.width || product.height) && (
                        <div className="text-xs text-stone-400 mt-0.5">
                          {[product.width && `${product.width}"W`, product.height && `${product.height}"H`, product.depth && `${product.depth}"D`].filter(Boolean).join(' × ')}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <div className="font-bold text-stone-900 text-sm">${product.customerPrice.toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2})}</div>
                        <div className="text-xs text-stone-400 line-through">${product.msrp.toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2})}</div>
                      </div>
                      {inCart ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => updateQty(product.id, inCart.qty - 1)}
                            className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-700 font-bold text-sm transition-colors">−</button>
                          <span className="w-6 text-center text-sm font-bold text-stone-900">{inCart.qty}</span>
                          <button onClick={() => updateQty(product.id, inCart.qty + 1)}
                            className="w-7 h-7 rounded-lg bg-wood-600 hover:bg-wood-700 flex items-center justify-center text-white font-bold text-sm transition-colors">+</button>
                        </div>
                      ) : (
                        <button onClick={() => addToCart(product)}
                          className="w-7 h-7 rounded-lg bg-stone-900 hover:bg-stone-700 flex items-center justify-center text-white font-bold text-sm transition-colors">+</button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {cart.length > 0 && (
            <div className="mt-4 border-t border-stone-200 pt-4 flex items-center justify-between">
              <div className="text-sm text-stone-500">{cart.reduce((s,i)=>s+i.qty,0)} items · <span className="font-bold text-stone-900">${cartTotal.toLocaleString('en-US',{maximumFractionDigits:0})} cabinets</span></div>
              <button onClick={() => setStep(4)}
                className="bg-wood-600 hover:bg-wood-700 text-white font-bold px-5 py-2 rounded-xl text-sm transition-colors">
                Review Quote →
              </button>
            </div>
          )}

          <div className="flex justify-start mt-4">
            <button onClick={() => setStep(2)} className="text-stone-500 hover:text-stone-700 font-medium text-sm">← Change Collection</button>
          </div>
        </div>
      )}

      {/* Step 4: Review + submit */}
      {step === 4 && (
        <div className="animate-fade-in">
          <h2 className="text-xl font-bold text-stone-900 mb-1">Review Your Quote</h2>
          <p className="text-stone-500 text-sm mb-4">{cart.length} products selected from {selectedCollection?.name}</p>

          {/* Cart items */}
          <div className="border border-stone-200 rounded-xl overflow-hidden mb-5">
            <div className="max-h-56 overflow-y-auto divide-y divide-stone-100">
              {cart.map(item => (
                <div key={item.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex-1 min-w-0 mr-3">
                    <div className="font-mono text-xs text-stone-500">{item.itemCode}</div>
                    <div className="text-sm text-stone-800 truncate">{item.description}</div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQty(item.id, item.qty-1)} className="w-6 h-6 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center justify-center">−</button>
                      <span className="w-5 text-center text-sm font-bold">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, item.qty+1)} className="w-6 h-6 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center justify-center">+</button>
                    </div>
                    <div className="text-sm font-bold text-stone-900 w-20 text-right">
                      ${(item.customerPrice * item.qty).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-stone-50 border-t border-stone-200 px-4 py-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Cabinets subtotal</span>
                <span className="font-semibold text-stone-900">${cartTotal.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Installation estimate</span>
                <span className="text-stone-600">${INSTALL_ESTIMATE.min.toLocaleString()} – ${INSTALL_ESTIMATE.max.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-base border-t border-stone-200 pt-2 mt-2">
                <span className="text-stone-900">Estimated Total</span>
                <span className="text-wood-700">${grandMin.toLocaleString()} – ${grandMax.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="mb-5">
            <label className="block text-sm font-bold text-stone-700 mb-3">When are you looking to start? *</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TIMELINES.map(t => (
                <button key={t} onClick={() => setTimeline(t)}
                  className={`border-2 rounded-xl px-3 py-2.5 text-xs font-medium transition-all ${timeline===t?'border-wood-600 bg-wood-50 text-wood-800':'border-stone-200 text-stone-600 hover:border-stone-400'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Anything else? (optional)</label>
            <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Current kitchen layout, access notes..."
              className="w-full border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-wood-500 resize-none" />
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}

          <div className="flex justify-between items-center">
            <button onClick={() => setStep(3)} className="text-stone-500 hover:text-stone-700 font-medium text-sm">← Back</button>
            <button onClick={submit} disabled={!timeline || submitting}
              className="bg-wood-600 hover:bg-wood-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-bold px-8 py-3 rounded-xl transition-colors flex items-center gap-2">
              {submitting ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Submitting...</> : 'Submit My Quote Request'}
            </button>
          </div>
          <p className="text-center text-stone-400 text-xs mt-3">Our team will review and confirm pricing within 2 hours.</p>
        </div>
      )}
    </>
  )
}

// ─── Main GetQuote component ──────────────────────────────────────────────────
type Mode = null | 'estimate' | 'detailed'

export default function GetQuote() {
  const [mode, setMode] = useState<Mode>(null)
  const [submitted, setSubmitted] = useState(false)
  const [submitData, setSubmitData] = useState<any>(null)

  const handleSuccess = useCallback((data: any) => {
    setSubmitData(data)
    setSubmitted(true)
  }, [])

  if (submitted) {
    const isDetailed = submitData?.cart
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4 py-20">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-stone-900 mb-3">
            {isDetailed ? 'Quote Request Submitted!' : 'Estimate Request Received!'}
          </h2>
          <p className="text-stone-500 mb-2">Thanks, <strong>{submitData?.firstName}</strong>! We'll reach out within 2 hours.</p>
          {isDetailed && submitData?.cartTotal > 0 && (
            <div className="bg-white border border-stone-200 rounded-xl p-4 my-5 text-sm">
              <div className="flex justify-between mb-2">
                <span className="text-stone-500">Cabinets ({submitData.cart?.length} items)</span>
                <span className="font-semibold">${submitData.cartTotal.toLocaleString('en-US',{maximumFractionDigits:0})}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-stone-500">Estimated Total (with install)</span>
                <span className="font-bold text-wood-700">
                  ${(submitData.cartTotal + INSTALL_ESTIMATE.min).toLocaleString()} – ${(submitData.cartTotal + INSTALL_ESTIMATE.max).toLocaleString()}
                </span>
              </div>
            </div>
          )}
          <p className="text-stone-400 text-sm mb-8">Confirmation sent to <strong>{submitData?.email}</strong>.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/" className="border border-stone-300 text-stone-700 font-semibold px-6 py-2.5 rounded-xl text-sm">Back to Home</Link>
            <a href="tel:+18332017849" className="bg-wood-600 hover:bg-wood-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors">Call Us Now</a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <section className="bg-stone-950 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <nav className="text-xs text-stone-500 mb-4 flex items-center gap-2">
            <Link to="/" className="hover:text-stone-300">Home</Link>
            <span>/</span>
            <span className="text-stone-300">Get a Quote</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Get Your Free <span className="text-wood-400">Cabinet Quote</span>
          </h1>
          <p className="text-stone-400">Licensed & insured · 16+ years · Orlando & surrounding areas</p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

        {/* Path selector */}
        {mode === null && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-bold text-stone-900 text-center mb-2">How can we help you?</h2>
            <p className="text-stone-500 text-sm text-center mb-8">Choose the option that best fits where you are in the process.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

              {/* Estimate */}
              <button onClick={() => setMode('estimate')}
                className="border-2 border-stone-200 hover:border-wood-500 rounded-2xl p-6 text-left transition-all group hover:shadow-md">
                <div className="w-12 h-12 bg-stone-100 group-hover:bg-wood-50 rounded-xl flex items-center justify-center mb-4 transition-colors">
                  <svg className="w-6 h-6 text-stone-600 group-hover:text-wood-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                </div>
                <h3 className="font-bold text-stone-900 text-lg mb-1">Quick Estimate</h3>
                <p className="text-stone-500 text-sm leading-relaxed mb-4">I know my kitchen size and want a ballpark number. Takes 2 minutes.</p>
                <div className="flex flex-wrap gap-1.5">
                  {['Fast','General pricing','We follow up'].map(t => (
                    <span key={t} className="bg-stone-100 text-stone-600 text-xs px-2.5 py-1 rounded-full">{t}</span>
                  ))}
                </div>
              </button>

              {/* Detailed builder */}
              <button onClick={() => setMode('detailed')}
                className="border-2 border-stone-200 hover:border-wood-500 rounded-2xl p-6 text-left transition-all group hover:shadow-md relative">
                <div className="absolute top-4 right-4">
                  <span className="bg-wood-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full">Most Accurate</span>
                </div>
                <div className="w-12 h-12 bg-stone-100 group-hover:bg-wood-50 rounded-xl flex items-center justify-center mb-4 transition-colors">
                  <svg className="w-6 h-6 text-stone-600 group-hover:text-wood-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                  </svg>
                </div>
                <h3 className="font-bold text-stone-900 text-lg mb-1">Build Your Quote</h3>
                <p className="text-stone-500 text-sm leading-relaxed mb-4">I know my cabinet needs. Browse our catalog, pick exact pieces, and get a real itemized quote.</p>
                <div className="flex flex-wrap gap-1.5">
                  {['Itemized pricing','Real SKUs','Instant total'].map(t => (
                    <span key={t} className="bg-wood-50 text-wood-700 text-xs px-2.5 py-1 rounded-full border border-wood-200">{t}</span>
                  ))}
                </div>
              </button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-stone-400 text-sm">Not sure? <a href="tel:+18332017849" className="text-wood-600 font-semibold hover:text-wood-700">(833) 201-7849</a> — we'll help.</p>
            </div>
          </div>
        )}

        {/* Progress indicator when a mode is selected */}
        {mode !== null && (
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setMode(null)} className="text-stone-400 hover:text-stone-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold px-3 py-1 rounded-full ${mode==='estimate'?'bg-stone-900 text-white':'bg-wood-600 text-white'}`}>
                {mode === 'estimate' ? 'Quick Estimate' : 'Build Your Quote'}
              </span>
            </div>
          </div>
        )}

        {/* Form card */}
        {mode !== null && (
          <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8">
            {mode === 'estimate'
              ? <EstimatePath onSuccess={handleSuccess} />
              : <BuilderPath onSuccess={handleSuccess} />
            }
          </div>
        )}

        {/* Trust badges */}
        {mode !== null && (
          <div className="mt-6 flex flex-wrap justify-center gap-6 text-xs text-stone-400">
            {['Licensed & Insured','2-Hour Response','Free Estimate','No Obligation'].map(b => (
              <div key={b} className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                {b}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
