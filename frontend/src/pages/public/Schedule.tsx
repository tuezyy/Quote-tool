import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

function getNext14Weekdays(): { date: string; label: string }[] {
  const days: { date: string; label: string }[] = []
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  // Start tomorrow
  d.setDate(d.getDate() + 1)

  while (days.length < 14) {
    const dow = d.getDay() // 0=Sun, 6=Sat
    if (dow > 0 && dow < 6) {
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      const date = `${yyyy}-${mm}-${dd}`
      const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      days.push({ date, label })
    }
    d.setDate(d.getDate() + 1)
  }
  return days
}

export default function Schedule() {
  const [searchParams] = useSearchParams()
  const prefillQuote = searchParams.get('quote') || ''
  const prefillName = searchParams.get('name') || ''

  const [step, setStep] = useState<'date' | 'time' | 'contact' | 'success'>('date')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [slots, setSlots] = useState<{ value: string; label: string }[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [form, setForm] = useState({
    firstName: prefillName.split(' ')[0] || '',
    lastName: prefillName.split(' ').slice(1).join(' ') || '',
    phone: '',
    email: '',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const weekdays = getNext14Weekdays()

  useEffect(() => {
    if (!selectedDate) return
    setSlotsLoading(true)
    fetch(`/api/public/slots?date=${selectedDate}`)
      .then(r => r.json())
      .then(data => {
        setSlots(data.slots || [])
        setSlotsLoading(false)
      })
      .catch(() => {
        setSlots([])
        setSlotsLoading(false)
      })
  }, [selectedDate])

  const handleDateSelect = (date: string) => {
    setSelectedDate(date)
    setSelectedTime('')
    setStep('time')
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
    setStep('contact')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/public/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          quoteNumber: prefillQuote,
          date: selectedDate,
          time: selectedTime,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Booking failed')
      setStep('success')
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please call (833) 201-7849.')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedDateLabel = weekdays.find(d => d.date === selectedDate)?.label || ''
  const selectedTimeLabel = slots.find(s => s.value === selectedTime)?.label || ''

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-stone-800">Schedule Your Free Measurement</h1>
          <p className="text-stone-500 mt-2">20–30 minutes. No obligation. We come to you.</p>
        </div>

        {/* Progress */}
        {step !== 'success' && (
          <div className="flex items-center justify-center gap-2 mb-8 text-sm">
            {(['date', 'time', 'contact'] as const).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-semibold text-xs
                  ${step === s ? 'bg-wood-600 text-white' :
                    (['date', 'time', 'contact'].indexOf(step) > i) ? 'bg-wood-200 text-wood-800' :
                    'bg-stone-200 text-stone-400'}`}>
                  {i + 1}
                </div>
                <span className={step === s ? 'text-wood-700 font-medium' : 'text-stone-400'}>
                  {s === 'date' ? 'Pick a Date' : s === 'time' ? 'Pick a Time' : 'Your Info'}
                </span>
                {i < 2 && <span className="text-stone-300 mx-1">›</span>}
              </div>
            ))}
          </div>
        )}

        {/* Step: Date */}
        {step === 'date' && (
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
            <h2 className="font-semibold text-stone-700 mb-4">Choose a day</h2>
            <div className="grid grid-cols-2 gap-2">
              {weekdays.map(({ date, label }) => (
                <button
                  key={date}
                  onClick={() => handleDateSelect(date)}
                  className="py-3 px-4 rounded-xl border border-stone-200 text-left hover:border-wood-500 hover:bg-wood-50 transition-colors text-sm font-medium text-stone-700"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: Time */}
        {step === 'time' && (
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
            <button onClick={() => setStep('date')} className="text-wood-600 text-sm mb-4 flex items-center gap-1">
              ← {selectedDateLabel}
            </button>
            <h2 className="font-semibold text-stone-700 mb-4">Choose a time</h2>
            {slotsLoading ? (
              <div className="text-center py-8 text-stone-400">Loading available times...</div>
            ) : slots.length === 0 ? (
              <div className="text-center py-8 text-stone-500">
                No slots available on this day. Please pick another date.
                <br />
                <button onClick={() => setStep('date')} className="mt-3 text-wood-600 underline text-sm">
                  Go back
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {slots.map(slot => (
                  <button
                    key={slot.value}
                    onClick={() => handleTimeSelect(slot.value)}
                    className="py-3 px-4 rounded-xl border border-stone-200 hover:border-wood-500 hover:bg-wood-50 transition-colors text-sm font-semibold text-stone-700"
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step: Contact */}
        {step === 'contact' && (
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
            <button onClick={() => setStep('time')} className="text-wood-600 text-sm mb-4 flex items-center gap-1">
              ← {selectedDateLabel} at {selectedTimeLabel}
            </button>
            <h2 className="font-semibold text-stone-700 mb-4">Confirm your info</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">First Name *</label>
                  <input
                    required
                    value={form.firstName}
                    onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                    className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-wood-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">Last Name</label>
                  <input
                    value={form.lastName}
                    onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                    className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-wood-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Phone *</label>
                <input
                  required
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="(321) 555-0100"
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-wood-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-wood-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Anything we should know?</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Gate code, parking, dogs, etc."
                  rows={2}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-wood-500 resize-none"
                />
              </div>

              {error && (
                <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-wood-600 hover:bg-wood-700 text-white font-semibold transition-colors disabled:opacity-50"
              >
                {submitting ? 'Booking...' : `Confirm Measurement — ${selectedDateLabel} at ${selectedTimeLabel}`}
              </button>

              <p className="text-xs text-stone-400 text-center">
                We'll send a confirmation text to your phone.
              </p>
            </form>
          </div>
        )}

        {/* Success */}
        {step === 'success' && (
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-stone-800 mb-2">You're all set!</h2>
            <p className="text-stone-600 mb-1">
              Your free measurement is scheduled for
            </p>
            <p className="text-wood-700 font-semibold text-lg mb-4">
              {selectedDateLabel} at {selectedTimeLabel}
            </p>
            <p className="text-stone-500 text-sm">
              We sent a confirmation text to your phone. See you then!
            </p>
            <a href="/" className="mt-6 inline-block text-wood-600 underline text-sm">
              Back to homepage
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
