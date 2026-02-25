import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

// ─── Pricing model ─────────────────────────────────────────────────────────────
// Backend math — homeowner never sees linear footage or multipliers

const LAYOUT_LF: Record<string, Record<string, number>> = {
  straight: { small: 10, medium: 13, large: 16 },
  l_shape:  { small: 19, medium: 22, large: 26 },
  u_shape:  { small: 26, medium: 30, large: 36 },
  island:   { small: 34, medium: 40, large: 48 },
}

const PRICE_PER_LF: Record<string, { min: number; max: number }> = {
  'Builder Grade':             { min: 320, max: 400 },
  'Essential & Charm':         { min: 390, max: 490 },
  'Classical & Double Shaker': { min: 450, max: 560 },
  'Slim Shaker':               { min: 480, max: 600 },
  'Frameless High Gloss':      { min: 580, max: 720 },
}

function calcEstimate(layout: string, size: string, collection: string, replacing: boolean, installOnly: boolean) {
  if (installOnly) return { min: 2800, max: 4000, lf: 0 }
  const lf  = LAYOUT_LF[layout]?.[size] ?? 20
  const ppl = PRICE_PER_LF[collection] ?? { min: 400, max: 500 }
  const raw = { min: lf * ppl.min * 1.08, max: lf * ppl.max * 1.08 }   // 8% scribe/filler buffer
  const demo = replacing ? { min: 800, max: 1500 } : { min: 0, max: 0 } // demo/haul-away
  return {
    min: Math.round((raw.min + demo.min) / 100) * 100,
    max: Math.round((raw.max + demo.max) / 100) * 100,
    lf,
  }
}

// ─── Step data ─────────────────────────────────────────────────────────────────
const LAYOUTS = [
  { value: 'straight', label: 'Straight', sub: 'Single wall' },
  { value: 'l_shape',  label: 'L-Shape',  sub: 'Two walls — most common' },
  { value: 'u_shape',  label: 'U-Shape',  sub: 'Three walls' },
  { value: 'island',   label: 'Island',   sub: 'U-shape + center island' },
]
const SIZES = [
  { value: 'small',  label: 'Small',  sub: 'Under 150 sq ft' },
  { value: 'medium', label: 'Medium', sub: '150–250 sq ft' },
  { value: 'large',  label: 'Large',  sub: '250+ sq ft' },
]
const COLLECTIONS = [
  { name: 'Builder Grade',             desc: 'Durable, contractor-grade value',    img: '/images/shaker-white.jpg' },
  { name: 'Essential & Charm',         desc: 'Classic shaker, warm finishes',       img: '/images/shaker-grey.jpg',         tag: 'Most Popular' },
  { name: 'Classical & Double Shaker', desc: 'Raised panels, timeless elegance',    img: '/images/shaker-treasure-chest.jpg' },
  { name: 'Slim Shaker',               desc: 'Modern slim rails, clean lines',       img: '/images/shaker-aston-green.jpg' },
  { name: 'Frameless High Gloss',      desc: 'European style, bold high-gloss',     img: '/images/shaker-iron-black.jpg',    dark: true },
  { name: 'Not Sure Yet',              desc: 'Our team will help you choose',        img: '/images/shaker-smokey-ash.jpg' },
]
const TIMELINES = ['As soon as possible', 'Within 1 month', '1–3 months', '3–6 months', 'Just researching']

// ─── Shared types ──────────────────────────────────────────────────────────────
interface ContactForm { firstName: string; lastName: string; email: string; phone: string; address: string; city: string }
const EMPTY: ContactForm = { firstName: '', lastName: '', email: '', phone: '', address: '', city: '' }

// ─── Layout icons (bird's-eye view) ────────────────────────────────────────────
function LayoutIcon({ value }: { value: string }) {
  const r = { rx: 2, fill: 'currentColor', fillOpacity: 0.12, stroke: 'currentColor', strokeWidth: 1.5 }
  switch (value) {
    case 'straight':
      return <svg viewBox="0 0 64 48" className="w-10 h-10"><rect x="6" y="6" width="52" height="12" {...r}/></svg>
    case 'l_shape':
      return <svg viewBox="0 0 64 64" className="w-10 h-10"><rect x="6" y="6" width="12" height="52" {...r}/><rect x="18" y="6" width="40" height="12" {...r}/></svg>
    case 'u_shape':
      return <svg viewBox="0 0 64 64" className="w-10 h-10"><rect x="6" y="6" width="12" height="52" {...r}/><rect x="6" y="6" width="52" height="12" {...r}/><rect x="46" y="6" width="12" height="52" {...r}/></svg>
    case 'island':
      return <svg viewBox="0 0 64 64" className="w-10 h-10"><rect x="6" y="6" width="12" height="52" {...r}/><rect x="6" y="6" width="52" height="12" {...r}/><rect x="46" y="6" width="12" height="52" {...r}/><rect x="20" y="28" width="24" height="16" {...r}/></svg>
    default: return null
  }
}

// ─── Cabinet door watermark ────────────────────────────────────────────────────
function CabinetDoor({ dark = false }: { dark?: boolean }) {
  const s = dark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.1)'
  return (
    <svg viewBox="0 0 120 140" className="absolute inset-0 w-full h-full" fill="none" aria-hidden>
      <rect x="10" y="10" width="100" height="120" rx="3" stroke={s} strokeWidth="1.5"/>
      <rect x="18" y="18" width="84" height="104" rx="2" stroke={s} strokeWidth="1.5"/>
      <circle cx="60" cy="70" r="5" fill={s}/>
    </svg>
  )
}

// ─── Spinner ───────────────────────────────────────────────────────────────────
function Spinner() {
  return <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
}

// ─── Contact fields ────────────────────────────────────────────────────────────
function ContactFields({ c, onChange }: { c: ContactForm; onChange: (f: ContactForm) => void }) {
  const f = (k: keyof ContactForm) => (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...c, [k]: e.target.value })
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {([['firstName','First Name','John'],['lastName','Last Name','Smith'],['email','Email','john@email.com'],['phone','Phone','(407) 555-0100'],['address','Street Address (optional)','123 Main St'],['city','City (optional)','Orlando']] as [keyof ContactForm,string,string][]).map(([k,label,ph]) => (
        <div key={k}>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">{label}</label>
          <input type={k==='email'?'email':k==='phone'?'tel':'text'} placeholder={ph} value={c[k]} onChange={f(k)}
            className="w-full border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-wood-500 focus:border-transparent"/>
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUILD & PRICE PATH
// ═══════════════════════════════════════════════════════════════════════════════
type BuildStep = 1 | 2 | 3 | 'estimate' | 'contact'

function BuilderPath({ onSuccess }: { onSuccess: (d: any) => void }) {
  const [step, setStep]           = useState<BuildStep>(1)
  const [layout, setLayout]       = useState('')
  const [size, setSize]           = useState('')
  const [replacing, setReplacing] = useState<boolean | null>(null)
  const [installOnly, setInstOnly]= useState<boolean | null>(null)
  const [collection, setCollection] = useState('')
  const [contact, setContact]     = useState<ContactForm>(EMPTY)
  const [timeline, setTimeline]   = useState('')
  const [notes, setNotes]         = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]         = useState('')

  const canStep1 = layout && size
  const canStep2 = replacing !== null && installOnly !== null
  const estimate = (layout && size && collection && replacing !== null && installOnly !== null)
    ? calcEstimate(layout, size, collection, replacing, installOnly)
    : null
  const contactValid = contact.firstName && contact.lastName && contact.email && contact.phone

  const goToEstimate = () => {
    if (installOnly) { setCollection('Not Sure Yet'); setStep('estimate') }
    else setStep(3)
  }

  const submit = async () => {
    setSubmitting(true); setError('')
    try {
      const est = estimate!
      await axios.post('/api/public/quote-request', {
        ...contact, timeline, notes,
        kitchenSize: `${layout}_${size}`,
        collection,
        quoteType: 'estimate',
        items: [],
      })
      onSuccess({ ...contact, estimate: est, layout, size, collection, installOnly })
    } catch { setError('Something went wrong. Please call (833) 201-7849.') }
    finally { setSubmitting(false) }
  }

  return (
    <>
      {/* ── Step 1: Layout + Size ──────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="animate-fade-in">
          <h2 className="text-xl font-bold text-stone-900 mb-1">What is your kitchen layout?</h2>
          <p className="text-stone-400 text-sm mb-5">Pick the shape that best describes your kitchen.</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {LAYOUTS.map(l => (
              <button key={l.value} onClick={() => setLayout(l.value)}
                className={`border-2 rounded-2xl p-4 text-center transition-all flex flex-col items-center gap-2 ${layout===l.value?'border-wood-600 bg-wood-50':'border-stone-200 hover:border-stone-400'}`}>
                <div className={layout===l.value?'text-wood-700':'text-stone-500'}><LayoutIcon value={l.value}/></div>
                <div className="font-bold text-stone-900 text-sm">{l.label}</div>
                <div className="text-xs text-stone-400">{l.sub}</div>
              </button>
            ))}
          </div>

          <p className="text-sm font-bold text-stone-700 mb-3">Rough kitchen size</p>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {SIZES.map(s => (
              <button key={s.value} onClick={() => setSize(s.value)}
                className={`border-2 rounded-2xl p-4 text-center transition-all ${size===s.value?'border-wood-600 bg-wood-50':'border-stone-200 hover:border-stone-400'}`}>
                <div className="font-bold text-stone-900 text-sm">{s.label}</div>
                <div className="text-xs text-stone-400 mt-0.5">{s.sub}</div>
              </button>
            ))}
          </div>

          <div className="flex justify-end">
            <button onClick={() => setStep(2)} disabled={!canStep1}
              className="bg-wood-600 hover:bg-wood-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-semibold px-8 py-2.5 rounded-xl transition-colors">
              Next →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Project type ───────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="animate-fade-in">
          <h2 className="text-xl font-bold text-stone-900 mb-1">Tell us about the project</h2>
          <p className="text-stone-400 text-sm mb-6">Two quick questions and we will calculate your range.</p>

          <div className="mb-6">
            <p className="text-sm font-bold text-stone-700 mb-3">Are you replacing existing cabinets?</p>
            <div className="grid grid-cols-2 gap-3">
              {[{v:true,l:'Yes — replacing',sub:'Demo + haul-away included'},{v:false,l:'No — new construction',sub:'No existing cabinets'}].map(opt => (
                <button key={String(opt.v)} onClick={() => setReplacing(opt.v)}
                  className={`border-2 rounded-2xl p-4 text-left transition-all ${replacing===opt.v?'border-wood-600 bg-wood-50':'border-stone-200 hover:border-stone-400'}`}>
                  <div className="font-bold text-stone-900 text-sm">{opt.l}</div>
                  <div className="text-xs text-stone-400 mt-0.5">{opt.sub}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm font-bold text-stone-700 mb-3">What do you need?</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                {v:false,l:'Cabinets + Installation',sub:'Full project — we supply and install'},
                {v:true, l:'Installation Only',      sub:'You already have cabinets (IKEA, HD, etc.)'},
              ].map(opt => (
                <button key={String(opt.v)} onClick={() => setInstOnly(opt.v)}
                  className={`border-2 rounded-2xl p-4 text-left transition-all ${installOnly===opt.v?'border-wood-600 bg-wood-50':'border-stone-200 hover:border-stone-400'}`}>
                  <div className="font-bold text-stone-900 text-sm">{opt.l}</div>
                  <div className="text-xs text-stone-400 mt-0.5">{opt.sub}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <button onClick={() => setStep(1)} className="text-stone-500 hover:text-stone-700 text-sm font-medium">← Back</button>
            <button onClick={goToEstimate} disabled={!canStep2}
              className="bg-wood-600 hover:bg-wood-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-semibold px-8 py-2.5 rounded-xl transition-colors">
              {installOnly ? 'See My Estimate →' : 'Next →'}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Style/Collection picker (full project only) ────────────────── */}
      {step === 3 && (
        <div className="animate-fade-in">
          <h2 className="text-xl font-bold text-stone-900 mb-1">What cabinet style do you prefer?</h2>
          <p className="text-stone-400 text-sm mb-6">This affects pricing. Not sure? Pick closest match — our team will help refine it.</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            {COLLECTIONS.map(col => {
              return (
                <button key={col.name} onClick={() => { setCollection(col.name); setStep('estimate') }}
                  className={`group relative overflow-hidden rounded-2xl h-40 text-left transition-all hover:shadow-lg hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-wood-500 ${collection===col.name?'ring-2 ring-wood-500':''}`}>
                  <img src={col.img} alt={col.name} className="absolute inset-0 w-full h-full object-cover"/>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"/>
                  {col.tag && <div className="absolute top-3 right-3 bg-wood-500 text-white text-xs font-bold px-2.5 py-1 rounded-full z-10">{col.tag}</div>}
                  <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
                    <div className="font-bold text-sm leading-tight text-white">{col.name}</div>
                    <div className="text-xs mt-0.5 text-stone-300">{col.desc}</div>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="flex justify-start">
            <button onClick={() => setStep(2)} className="text-stone-500 hover:text-stone-700 text-sm font-medium">← Back</button>
          </div>
        </div>
      )}

      {/* ── Estimate reveal ────────────────────────────────────────────────────── */}
      {step === 'estimate' && estimate && (
        <div className="animate-fade-in">
          <div className="text-center mb-8">
            <div className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Based on your selections</div>
            <div className="text-4xl sm:text-5xl font-black text-stone-900 mb-2">
              ${estimate.min.toLocaleString()} – ${estimate.max.toLocaleString()}
            </div>
            <div className="text-stone-500 text-sm">
              {installOnly
                ? 'flat-rate installation · any kitchen layout'
                : `installed · ~${estimate.lf} linear feet · ${replacing ? 'includes demo & haul-away' : 'new construction'}`}
            </div>
            {!installOnly && collection && collection !== 'Not Sure Yet' && (
              <div className="mt-1 text-xs text-stone-400">{collection}</div>
            )}
          </div>

          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 mb-6 text-sm text-stone-600">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-wood-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <div>
                <strong className="text-stone-800">This is an estimate range, not a final quote.</strong> Our team reviews measurements and confirms exact pricing within 2 hours. Most projects land in the middle of this range.
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <button onClick={() => setStep('contact')}
              className="flex-1 bg-wood-600 hover:bg-wood-700 text-white font-bold py-3.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
              Get My Exact Quote →
            </button>
            <a href="tel:+18332017849"
              className="flex-1 border-2 border-stone-300 hover:border-stone-400 text-stone-700 font-semibold py-3.5 rounded-xl text-sm text-center transition-colors">
              Call (833) 201-7849
            </a>
          </div>
          <p className="text-center text-stone-400 text-xs">No obligation. We will confirm exact pricing after a quick measurement walkthrough.</p>

          <div className="mt-6 flex justify-center gap-4 text-xs text-stone-400">
            <button onClick={() => setStep(installOnly ? 2 : 3)} className="hover:text-stone-600 underline underline-offset-2">
              Change selections
            </button>
          </div>
        </div>
      )}

      {/* ── Contact form ───────────────────────────────────────────────────────── */}
      {step === 'contact' && estimate && (
        <div className="animate-fade-in">
          {/* Sticky estimate reminder */}
          <div className="bg-wood-50 border border-wood-200 rounded-2xl px-5 py-3 mb-6 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-wood-700 uppercase tracking-wider">Your Estimate</div>
              <div className="text-xl font-bold text-wood-800">${estimate.min.toLocaleString()} – ${estimate.max.toLocaleString()}</div>
            </div>
            <button onClick={() => setStep('estimate')} className="text-xs text-wood-600 hover:text-wood-800 font-medium border border-wood-200 rounded-lg px-3 py-1.5">
              Edit ↑
            </button>
          </div>

          <h2 className="text-xl font-bold text-stone-900 mb-1">Where should we send your exact quote?</h2>
          <p className="text-stone-500 text-sm mb-5">Our team reviews your selections and confirms final pricing within 2 hours.</p>

          <ContactFields c={contact} onChange={setContact}/>

          <div className="mt-5 mb-4">
            <p className="text-sm font-bold text-stone-700 mb-3">When are you looking to start?</p>
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
            <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Upload photos, share details, or mention any access notes — our team will ask during the follow-up."
              className="w-full border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-wood-500 resize-none"/>
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}

          <div className="flex justify-between items-center">
            <button onClick={() => setStep('estimate')} className="text-stone-500 hover:text-stone-700 font-medium text-sm">← Back</button>
            <button onClick={submit} disabled={!contactValid || !timeline || submitting}
              className="bg-wood-600 hover:bg-wood-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-bold px-8 py-3 rounded-xl transition-colors flex items-center gap-2">
              {submitting ? <><Spinner/>Submitting...</> : 'Submit My Quote Request'}
            </button>
          </div>
          <p className="text-center text-stone-400 text-xs mt-3">No spam. We only contact you about your quote.</p>
        </div>
      )}
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUICK ESTIMATE PATH
// ═══════════════════════════════════════════════════════════════════════════════
const KITCHEN_SIZES = [
  { label: 'Small (10×10)',    value: 'small_10x10',   priceRange: '$7,500–$10,000' },
  { label: 'Medium (12×14)',   value: 'medium_12x14',  priceRange: '$10,500–$14,000' },
  { label: 'Large (15×15+)',   value: 'large_15x15',   priceRange: '$14,500–$19,000' },
  { label: 'Installation Only',value: 'install_only',  priceRange: '$2,800–$4,000' },
  { label: 'Not Sure Yet',     value: 'unknown',       priceRange: "We will figure it out together" },
]
const COLLECTION_NAMES = ['Essential & Charm','Classical & Double Shaker','Slim Shaker','Frameless High Gloss','Builder Grade','Not Sure Yet']

function EstimatePath({ onSuccess }: { onSuccess: (d: any) => void }) {
  const [step, setStep]           = useState<1|2>(1)
  const [kitchenSize, setKSize]   = useState('')
  const [collection, setCollection] = useState('')
  const [timeline, setTimeline]   = useState('')
  const [notes, setNotes]         = useState('')
  const [contact, setContact]     = useState<ContactForm>(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]         = useState('')
  const contactValid = contact.firstName && contact.lastName && contact.email && contact.phone

  const submit = async () => {
    setSubmitting(true); setError('')
    try {
      await axios.post('/api/public/quote-request', { ...contact, kitchenSize, collection, timeline, notes, quoteType: 'estimate' })
      onSuccess({ ...contact, kitchenSize, collection })
    } catch { setError('Something went wrong. Please call (833) 201-7849.') }
    finally { setSubmitting(false) }
  }

  return (
    <>
      {step === 1 && (
        <div className="animate-fade-in">
          <h2 className="text-xl font-bold text-stone-900 mb-1">Tell us about your project</h2>
          <p className="text-stone-400 text-sm mb-6">We will prepare a custom quote and reach out within 2 hours.</p>
          <div className="mb-6">
            <p className="text-sm font-bold text-stone-700 mb-3">Kitchen or bathroom size</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {KITCHEN_SIZES.map(s => (
                <button key={s.value} onClick={() => setKSize(s.value)}
                  className={`border-2 rounded-xl p-4 text-left transition-all ${kitchenSize===s.value?'border-wood-600 bg-wood-50':'border-stone-200 hover:border-stone-400'}`}>
                  <div className="font-semibold text-stone-900 text-sm">{s.label}</div>
                  <div className="text-stone-400 text-xs mt-0.5">{s.priceRange}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="mb-6">
            <p className="text-sm font-bold text-stone-700 mb-3">Cabinet style preference</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {COLLECTION_NAMES.map(c => (
                <button key={c} onClick={() => setCollection(c)}
                  className={`border-2 rounded-xl px-4 py-3 text-left transition-all ${collection===c?'border-wood-600 bg-wood-50':'border-stone-200 hover:border-stone-400'}`}>
                  <span className="font-semibold text-stone-900 text-sm">{c}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="mb-6">
            <p className="text-sm font-bold text-stone-700 mb-3">Timeline</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TIMELINES.map(t => (
                <button key={t} onClick={() => setTimeline(t)}
                  className={`border-2 rounded-xl px-3 py-2.5 text-xs font-medium transition-all ${timeline===t?'border-wood-600 bg-wood-50 text-wood-800':'border-stone-200 text-stone-600 hover:border-stone-400'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={() => setStep(2)} disabled={!kitchenSize || !collection || !timeline}
              className="bg-wood-600 hover:bg-wood-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-semibold px-8 py-2.5 rounded-xl transition-colors">
              Continue →
            </button>
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="animate-fade-in">
          <h2 className="text-xl font-bold text-stone-900 mb-1">Where should we send your quote?</h2>
          <p className="text-stone-500 text-sm mb-5">Our team will review and reach out within 2 business hours.</p>
          <ContactFields c={contact} onChange={setContact}/>
          <div className="mt-4 mb-5">
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Anything else? (optional)</label>
            <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Special requests, renovation details..."
              className="w-full border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-wood-500 resize-none"/>
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}
          <div className="flex justify-between items-center">
            <button onClick={() => setStep(1)} className="text-stone-500 hover:text-stone-700 font-medium text-sm">← Back</button>
            <button onClick={submit} disabled={!contactValid || submitting}
              className="bg-wood-600 hover:bg-wood-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-bold px-8 py-3 rounded-xl transition-colors flex items-center gap-2">
              {submitting ? <><Spinner/>Sending...</> : 'Send My Quote Request'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
type Mode = null | 'estimate' | 'detailed'

export default function GetQuote() {
  const [mode, setMode]           = useState<Mode>(null)
  const [submitted, setSubmitted] = useState(false)
  const [submitData, setSubmitData] = useState<any>(null)
  const handleSuccess = useCallback((d: any) => { setSubmitData(d); setSubmitted(true) }, [])

  if (submitted) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4 py-20">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-stone-900 mb-2">Quote Request Submitted!</h2>
          <p className="text-stone-500 mb-2">Thanks, <strong>{submitData?.firstName}</strong>! We will reach out within 2 hours.</p>
          {submitData?.estimate && (
            <div className="bg-white border border-stone-200 rounded-xl p-4 my-5">
              <div className="text-sm text-stone-500 mb-1">Your estimate range</div>
              <div className="text-2xl font-bold text-wood-700">
                ${submitData.estimate.min.toLocaleString()} – ${submitData.estimate.max.toLocaleString()}
              </div>
              <div className="text-xs text-stone-400 mt-1">Our team will confirm the exact number within 2 hours</div>
            </div>
          )}
          <p className="text-stone-400 text-sm mb-8">Confirmation sent to <strong>{submitData?.email}</strong>.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/" className="border border-stone-300 text-stone-700 font-semibold px-6 py-2.5 rounded-xl text-sm">Back to Home</Link>
            <a href="tel:+18332017849" className="bg-wood-600 hover:bg-wood-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors">Call (833) 201-7849</a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <section className="bg-navy-900 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <nav className="text-xs text-stone-500 mb-4 flex items-center gap-2">
            <Link to="/" className="hover:text-stone-300">Home</Link>
            <span>/</span>
            <span className="text-stone-300">Get a Quote</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Get Your Free <span className="text-wood-400">Cabinet Quote</span>
          </h1>
          <p className="text-stone-400">Licensed & insured · 16+ years · Orlando & Central Florida</p>
        </div>
      </section>

      {/* Value strip */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div><div className="text-2xl font-bold text-stone-900">30–40%</div><div className="text-xs text-stone-500 mt-0.5">Less than big box stores</div></div>
            <div><div className="text-2xl font-bold text-stone-900">2 hrs</div><div className="text-xs text-stone-500 mt-0.5">Quote turnaround</div></div>
            <div><div className="text-2xl font-bold text-stone-900">16+ yrs</div><div className="text-xs text-stone-500 mt-0.5">Licensed in Florida</div></div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {mode === null && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-bold text-stone-900 text-center mb-1">How would you like to quote?</h2>
            <p className="text-stone-500 text-sm text-center mb-8">Either way, our team follows up within 2 hours.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
              <button onClick={() => setMode('detailed')}
                className="border-2 border-wood-500 bg-wood-50 hover:bg-wood-100 rounded-2xl p-6 text-left transition-all relative">
                <div className="absolute top-4 right-4">
                  <span className="bg-wood-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">Recommended</span>
                </div>
                <div className="w-12 h-12 bg-wood-200 rounded-xl flex items-center justify-center mb-4 text-wood-700">
                  <LayoutIcon value="l_shape"/>
                </div>
                <h3 className="font-bold text-stone-900 text-lg mb-1">Build & Price</h3>
                <p className="text-stone-600 text-sm leading-relaxed mb-4">Answer 3 visual questions about your kitchen. See an instant estimate range before you enter any contact info.</p>
                <div className="flex flex-wrap gap-1.5">
                  {['Visual questions', 'Instant range', 'No SKU knowledge needed'].map(t => (
                    <span key={t} className="bg-wood-100 text-wood-700 text-xs px-2 py-1 rounded-full border border-wood-200">{t}</span>
                  ))}
                </div>
              </button>
              <button onClick={() => setMode('estimate')}
                className="border-2 border-stone-200 hover:border-stone-400 bg-white rounded-2xl p-6 text-left transition-all">
                <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                </div>
                <h3 className="font-bold text-stone-900 text-lg mb-1">Quick Estimate</h3>
                <p className="text-stone-600 text-sm leading-relaxed mb-4">Know your kitchen size? Fill in the basics in 2 minutes and we will call you back with a quote.</p>
                <div className="flex flex-wrap gap-1.5">
                  {['2 minutes', 'We call you', 'No commitment'].map(t => (
                    <span key={t} className="bg-stone-100 text-stone-600 text-xs px-2 py-1 rounded-full">{t}</span>
                  ))}
                </div>
              </button>
            </div>
            <p className="text-center text-stone-400 text-sm mt-6">
              Prefer to talk? <a href="tel:+18332017849" className="text-wood-600 font-semibold">(833) 201-7849</a> — available 24/7.
            </p>
          </div>
        )}

        {mode !== null && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setMode(null)} className="text-stone-400 hover:text-stone-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
              <span className={`text-sm font-semibold px-3 py-1 rounded-full ${mode==='estimate'?'bg-stone-900 text-white':'bg-wood-600 text-white'}`}>
                {mode==='estimate' ? 'Quick Estimate' : 'Build & Price'}
              </span>
            </div>
            <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8">
              {mode==='estimate' ? <EstimatePath onSuccess={handleSuccess}/> : <BuilderPath onSuccess={handleSuccess}/>}
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-6 text-xs text-stone-400">
              {['Licensed & Insured','2-Hour Response','Free Estimate','No Obligation'].map(b => (
                <div key={b} className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                  {b}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
