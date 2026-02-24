import { useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

const COLLECTIONS = [
  { name: 'Essential & Charm', skus: 265, badge: 'Most Popular' },
  { name: 'Classical & Double Shaker', skus: 265, badge: '' },
  { name: 'Slim Shaker', skus: 232, badge: 'Trending' },
  { name: 'Frameless High Gloss', skus: 160, badge: 'Premium' },
  { name: 'Builder Grade', skus: 134, badge: 'Best Value' },
  { name: "I'm Not Sure Yet", skus: 0, badge: '' },
]

const KITCHEN_SIZES = [
  { label: 'Small (10×10)', value: 'small_10x10', priceRange: '$7,500–$10,000' },
  { label: 'Medium (12×14)', value: 'medium_12x14', priceRange: '$10,500–$14,000' },
  { label: 'Large (15×15+)', value: 'large_15x15', priceRange: '$14,500–$19,000' },
  { label: 'Installation Only', value: 'install_only', priceRange: '$2,800–$4,000' },
  { label: 'Not Sure', value: 'unknown', priceRange: 'We\'ll help figure it out' },
]

const TIMELINES = [
  'As soon as possible',
  'Within 1 month',
  '1–3 months',
  '3–6 months',
  'Just researching',
]

type Step = 1 | 2 | 3

interface FormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  city: string
  kitchenSize: string
  collection: string
  timeline: string
  notes: string
}

const INIT: FormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  kitchenSize: '',
  collection: '',
  timeline: '',
  notes: '',
}

export default function GetQuote() {
  const [step, setStep] = useState<Step>(1)
  const [form, setForm] = useState<FormData>(INIT)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const update = (field: keyof FormData, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const step1Valid = form.firstName && form.lastName && form.email && form.phone
  const step2Valid = form.kitchenSize && form.collection
  const step3Valid = form.timeline

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    try {
      await axios.post('/api/public/quote-request', form)
      setSubmitted(true)
    } catch {
      setError('Something went wrong. Please call us at (833) 201-7849 or try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4 py-20">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-stone-900 mb-3">Quote Request Received!</h2>
          <p className="text-stone-500 mb-2">
            Thanks, <strong>{form.firstName}</strong>! We'll reach out within 2 business hours.
          </p>
          <p className="text-stone-400 text-sm mb-8">
            A confirmation has been sent to <strong>{form.email}</strong>.
          </p>
          <div className="bg-white border border-stone-200 rounded-xl p-5 text-left mb-6 text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-stone-500">Kitchen Size</span>
              <span className="font-semibold text-stone-800">
                {KITCHEN_SIZES.find(k => k.value === form.kitchenSize)?.label}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Collection</span>
              <span className="font-semibold text-stone-800">{form.collection}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Timeline</span>
              <span className="font-semibold text-stone-800">{form.timeline}</span>
            </div>
            {KITCHEN_SIZES.find(k => k.value === form.kitchenSize) && (
              <div className="pt-2 border-t border-stone-100 flex justify-between">
                <span className="text-stone-500">Estimated Range</span>
                <span className="font-bold text-wood-700">
                  {KITCHEN_SIZES.find(k => k.value === form.kitchenSize)?.priceRange}
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/" className="border border-stone-300 text-stone-700 font-semibold px-6 py-2.5 rounded-xl text-sm">
              Back to Home
            </Link>
            <a href="tel:+18332017849" className="bg-wood-600 hover:bg-wood-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors">
              Call Us Now
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* JSON-LD Quote Request Action */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Get a Free Cabinet Quote — Cabinets of Orlando',
        description: 'Request a free cabinet installation quote for your Central Florida kitchen.',
        mainEntity: {
          '@type': 'Service',
          name: 'Free Cabinet Quote',
          provider: {
            '@type': 'LocalBusiness',
            name: 'Cabinets of Orlando',
            telephone: '+18332017849',
          },
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
            description: 'Free no-obligation estimate',
          },
        },
      })}} />

      {/* Header */}
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
          <p className="text-stone-400">
            Takes 2 minutes. We respond within 2 business hours.
          </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {([1, 2, 3] as Step[]).map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                ${step === s ? 'bg-wood-600 text-white' :
                  step > s ? 'bg-stone-900 text-white' : 'bg-stone-200 text-stone-500'}`}>
                {step > s ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : s}
              </div>
              <span className={`text-sm font-medium hidden sm:inline ${step === s ? 'text-stone-900' : 'text-stone-400'}`}>
                {s === 1 ? 'Your Info' : s === 2 ? 'Project Details' : 'Review & Send'}
              </span>
              {s < 3 && <div className={`flex-1 h-0.5 ${step > s ? 'bg-stone-900' : 'bg-stone-200'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8">

          {/* STEP 1: Contact Info */}
          {step === 1 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-stone-900 mb-1">Your Contact Info</h2>
              <p className="text-stone-500 text-sm mb-6">How should we reach you with your quote?</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">First Name *</label>
                  <input
                    className="w-full border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-wood-500 focus:border-transparent"
                    placeholder="John"
                    value={form.firstName}
                    onChange={e => update('firstName', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">Last Name *</label>
                  <input
                    className="w-full border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-wood-500 focus:border-transparent"
                    placeholder="Smith"
                    value={form.lastName}
                    onChange={e => update('lastName', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">Email *</label>
                  <input
                    type="email"
                    className="w-full border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-wood-500 focus:border-transparent"
                    placeholder="john@email.com"
                    value={form.email}
                    onChange={e => update('email', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">Phone *</label>
                  <input
                    type="tel"
                    className="w-full border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-wood-500 focus:border-transparent"
                    placeholder="(407) 555-0100"
                    value={form.phone}
                    onChange={e => update('phone', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">Street Address</label>
                  <input
                    className="w-full border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-wood-500 focus:border-transparent"
                    placeholder="123 Main St"
                    value={form.address}
                    onChange={e => update('address', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">City</label>
                  <input
                    className="w-full border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-wood-500 focus:border-transparent"
                    placeholder="Orlando"
                    value={form.city}
                    onChange={e => update('city', e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setStep(2)}
                  disabled={!step1Valid}
                  className="bg-wood-600 hover:bg-wood-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-semibold px-8 py-2.5 rounded-xl transition-colors"
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Project Details */}
          {step === 2 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-stone-900 mb-1">Project Details</h2>
              <p className="text-stone-500 text-sm mb-6">Tell us about your kitchen project.</p>

              <div className="mb-6">
                <label className="block text-sm font-bold text-stone-700 mb-3">Kitchen Size *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {KITCHEN_SIZES.map(size => (
                    <button
                      key={size.value}
                      onClick={() => update('kitchenSize', size.value)}
                      className={`border-2 rounded-xl p-4 text-left transition-all ${
                        form.kitchenSize === size.value
                          ? 'border-wood-600 bg-wood-50'
                          : 'border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      <div className="font-semibold text-stone-900 text-sm">{size.label}</div>
                      <div className="text-stone-400 text-xs mt-0.5">{size.priceRange}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold text-stone-700 mb-3">Preferred Collection *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {COLLECTIONS.map(col => (
                    <button
                      key={col.name}
                      onClick={() => update('collection', col.name)}
                      className={`border-2 rounded-xl p-4 text-left transition-all ${
                        form.collection === col.name
                          ? 'border-wood-600 bg-wood-50'
                          : 'border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-stone-900 text-sm">{col.name}</span>
                        {col.badge && (
                          <span className="text-xs bg-wood-600 text-white px-2 py-0.5 rounded-full">{col.badge}</span>
                        )}
                      </div>
                      {col.skus > 0 && (
                        <div className="text-stone-400 text-xs mt-0.5">{col.skus} SKUs available</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <button onClick={() => setStep(1)} className="text-stone-500 hover:text-stone-700 font-medium text-sm">
                  ← Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!step2Valid}
                  className="bg-wood-600 hover:bg-wood-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-semibold px-8 py-2.5 rounded-xl transition-colors"
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Review & Submit */}
          {step === 3 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-stone-900 mb-1">Review & Send</h2>
              <p className="text-stone-500 text-sm mb-6">
                Confirm your details and we'll prepare your quote.
              </p>

              {/* Summary */}
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-5 mb-6 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-stone-500">Name</span>
                  <span className="font-semibold text-stone-900">{form.firstName} {form.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Email</span>
                  <span className="font-semibold text-stone-900">{form.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Phone</span>
                  <span className="font-semibold text-stone-900">{form.phone}</span>
                </div>
                {form.city && (
                  <div className="flex justify-between">
                    <span className="text-stone-500">Location</span>
                    <span className="font-semibold text-stone-900">{form.city}, FL</span>
                  </div>
                )}
                <div className="pt-2 border-t border-stone-200 flex justify-between">
                  <span className="text-stone-500">Kitchen Size</span>
                  <span className="font-semibold text-stone-900">
                    {KITCHEN_SIZES.find(k => k.value === form.kitchenSize)?.label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Collection</span>
                  <span className="font-semibold text-stone-900">{form.collection}</span>
                </div>
                {KITCHEN_SIZES.find(k => k.value === form.kitchenSize)?.priceRange && (
                  <div className="flex justify-between">
                    <span className="text-stone-500">Estimated Range</span>
                    <span className="font-bold text-wood-700">
                      {KITCHEN_SIZES.find(k => k.value === form.kitchenSize)?.priceRange}
                    </span>
                  </div>
                )}
              </div>

              {/* Timeline */}
              <div className="mb-5">
                <label className="block text-sm font-bold text-stone-700 mb-3">
                  When are you looking to start? *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {TIMELINES.map(t => (
                    <button
                      key={t}
                      onClick={() => update('timeline', t)}
                      className={`border-2 rounded-xl px-3 py-2.5 text-xs font-medium transition-all ${
                        form.timeline === t
                          ? 'border-wood-600 bg-wood-50 text-wood-800'
                          : 'border-stone-200 text-stone-600 hover:border-stone-400'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  Anything else? (optional)
                </label>
                <textarea
                  className="w-full border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-wood-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Current cabinet condition, special requests, access instructions..."
                  value={form.notes}
                  onChange={e => update('notes', e.target.value)}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
                  {error}
                </div>
              )}

              <div className="flex justify-between items-center">
                <button onClick={() => setStep(2)} className="text-stone-500 hover:text-stone-700 font-medium text-sm">
                  ← Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!step3Valid || submitting}
                  className="bg-wood-600 hover:bg-wood-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-bold px-8 py-3 rounded-xl transition-colors flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Sending...
                    </>
                  ) : 'Send My Quote Request'}
                </button>
              </div>

              <p className="text-center text-stone-400 text-xs mt-4">
                No spam, no pressure. We'll respond within 2 business hours.
              </p>
            </div>
          )}
        </div>

        {/* Trust badges */}
        <div className="mt-6 flex flex-wrap justify-center gap-6 text-xs text-stone-400">
          {['Licensed & Insured', '2-Hour Response', 'Free Estimate', 'No Obligation'].map(b => (
            <div key={b} className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {b}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
