import { useState, useCallback, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useBusiness } from '../../context/BusinessContext'
// KitchenPlannerCanvas removed — floor plan feature paused for rebuild

// ─── Pricing model ─────────────────────────────────────────────────────────────

const PRICE_PER_LF: Record<string, { min: number; max: number }> = {
  'Builder Grade':        { min: 350, max: 480 },
  'Essential Collection': { min: 470, max: 640 },
  'Charm Collection':     { min: 520, max: 700 },
  'Double Shaker':        { min: 540, max: 730 },
  'Classic Style':        { min: 540, max: 740 },
  'Slim Shaker':          { min: 550, max: 760 },
  'Frameless European':   { min: 750, max: 1020 },
}

type WallsState = { a: number; b: number; c: number; island: number }

function wallsToLF(layout: string, walls: WallsState): number {
  switch (layout) {
    case 'straight': return walls.a
    case 'galley':   return walls.a + walls.b
    case 'l_shape':  return walls.a + walls.b
    case 'u_shape':  return walls.a + walls.b + walls.c
    case 'island':   return walls.a + walls.b + walls.c + walls.island
    default:         return 0
  }
}

function lfToSize(layout: string, lf: number): 'small' | 'medium' | 'large' {
  switch (layout) {
    case 'straight': return lf < 12 ? 'small' : lf <= 16 ? 'medium' : 'large'
    case 'galley':   return lf < 16 ? 'small' : lf <= 20 ? 'medium' : 'large'
    case 'l_shape':  return lf < 19 ? 'small' : lf <= 24 ? 'medium' : 'large'
    case 'u_shape':  return lf < 27 ? 'small' : lf <= 32 ? 'medium' : 'large'
    case 'island':   return lf < 35 ? 'small' : lf <= 42 ? 'medium' : 'large'
    default:         return 'medium'
  }
}

function calcEstimate(lf: number, collection: string, replacing: boolean, installOnly: boolean) {
  if (installOnly) return { min: 2800, max: 4000, lf: 0 }
  const ppl = PRICE_PER_LF[collection] ?? { min: 400, max: 500 }
  const raw = { min: lf * ppl.min * 1.08, max: lf * ppl.max * 1.08 }
  const demo = replacing ? { min: 800, max: 1500 } : { min: 0, max: 0 }
  return {
    min: Math.round((raw.min + demo.min) / 100) * 100,
    max: Math.round((raw.max + demo.max) / 100) * 100,
    lf,
  }
}

// ─── Step data ─────────────────────────────────────────────────────────────────
const LAYOUTS = [
  { value: 'straight', label: 'Straight', sub: 'Single wall' },
  { value: 'galley',   label: 'Galley',   sub: 'Two parallel walls' },
  { value: 'l_shape',  label: 'L-Shape',  sub: 'Two walls at a corner' },
  { value: 'u_shape',  label: 'U-Shape',  sub: 'Three walls' },
  { value: 'island',   label: 'Island',   sub: 'U-shape + center island' },
]
const COLLECTIONS = [
  { name: 'Essential Collection', desc: '3 colors — White, Gray, Espresso',      img: '/images/styles/essential-shaker-white.jpg' },
  { name: 'Charm Collection',     desc: '8 colors — navy, greens, wood tones',   img: '/images/styles/charm-rustic-wood.jpg', tag: 'Most Popular' },
  { name: 'Slim Shaker',          desc: '5 finishes — modern slim rail',          img: '/images/styles/slim-dove-white.jpg' },
  { name: 'Double Shaker',        desc: '2 finishes — double-rail profile',       img: '/images/styles/double-dove-white.jpg' },
  { name: 'Classic Style',        desc: '3 finishes — raised panel, traditional', img: '/images/styles/classic-aspen-white.jpg' },
  { name: 'Frameless European',   desc: '8 finishes — glass, gloss, wood-look',   img: '/images/styles/frameless-crystal-glass.jpg' },
  { name: 'Builder Grade',        desc: '3 finishes — best value',               img: '/images/styles/builder-floral-white.jpg' },
  { name: 'Not Sure Yet',         desc: 'Our team will help you choose',          img: '/images/styles/charm-smokey-ash.jpg' },
]

const COLLECTION_STYLES: Record<string, Array<{ name: string; img: string }>> = {
  'Essential Collection': [
    { name: 'Shaker White',   img: '/images/styles/essential-shaker-white.jpg' },
    { name: 'Shaker Gray',    img: '/images/styles/essential-shaker-gray.jpg' },
    { name: 'Shaker Espresso',img: '/images/styles/essential-shaker-espresso.jpg' },
  ],
  'Charm Collection': [
    { name: 'Navy Blue',      img: '/images/styles/charm-navy-blue.jpg' },
    { name: 'Iron Black',     img: '/images/styles/charm-iron-black.jpg' },
    { name: 'Treasure Chest', img: '/images/styles/charm-treasure-chest.jpg' },
    { name: 'Aston Green',    img: '/images/styles/charm-aston-green.jpg' },
    { name: 'Smokey Ash',     img: '/images/styles/charm-smokey-ash.jpg' },
    { name: 'Luna Grey',      img: '/images/styles/charm-luna-grey.jpg' },
    { name: 'Rustic Wood',    img: '/images/styles/charm-rustic-wood.jpg' },
    { name: 'Sage Breeze',    img: '/images/styles/charm-sage-breeze.jpg' },
  ],
  'Slim Shaker': [
    { name: 'Slim Dove White', img: '/images/styles/slim-dove-white.jpg' },
    { name: 'Slim White Oak',  img: '/images/styles/slim-white-oak.jpg' },
    { name: 'Slim Aston Green',img: '/images/styles/slim-aston-green.jpg' },
    { name: 'Slim Amber Oak',  img: '/images/styles/slim-amber-oak.jpg' },
    { name: 'Slim Iron Black', img: '/images/styles/slim-iron-black.jpg' },
  ],
  'Double Shaker': [
    { name: 'Double Smokey Grey', img: '/images/styles/double-smokey-grey.jpg' },
    { name: 'Double Dove White',  img: '/images/styles/double-dove-white.jpg' },
  ],
  'Classic Style': [
    { name: 'Charleston White',    img: '/images/styles/classic-charleston-white.jpg' },
    { name: 'Aspen White',         img: '/images/styles/classic-aspen-white.jpg' },
    { name: 'Aspen Charcoal Gray', img: '/images/styles/classic-aspen-charcoal-gray.jpg' },
  ],
  'Frameless European': [
    { name: 'High Gloss White', img: '/images/styles/frameless-high-gloss-white.jpg' },
    { name: 'High Gloss Gray',  img: '/images/styles/frameless-high-gloss-gray.jpg' },
    { name: 'Crystal Glass',    img: '/images/styles/frameless-crystal-glass.jpg' },
    { name: 'Midnight Glass',   img: '/images/styles/frameless-midnight-glass.jpg' },
    { name: 'Matt Black',       img: '/images/styles/frameless-matt-black.jpg' },
    { name: 'Matt Ivory',       img: '/images/styles/frameless-matt-ivory.jpg' },
    { name: 'Oak Blonde',       img: '/images/styles/frameless-oak-blonde.jpg' },
    { name: 'Oak Shade',        img: '/images/styles/frameless-oak-shade.jpg' },
  ],
  'Builder Grade': [
    { name: 'Floral White',    img: '/images/styles/builder-floral-white.jpg' },
    { name: 'Floral Espresso', img: '/images/styles/builder-floral-espresso.jpg' },
    { name: 'Floral Gray',     img: '/images/styles/builder-floral-gray.jpg' },
  ],
}
const TIMELINES = ['As soon as possible', 'Within 1 month', '1–3 months', '3–6 months', 'Just researching']

// ─── Shared types ──────────────────────────────────────────────────────────────
interface ContactForm { firstName: string; lastName: string; email: string; phone: string; address: string; city: string }
const EMPTY: ContactForm = { firstName: '', lastName: '', email: '', phone: '', address: '', city: '' }

interface VisionResult {
  layout: string
  walls: WallsState
  cabinetCount: number
  replacing: boolean
  confidence: 'high' | 'medium' | 'low'
  notes: string
  photoCount?: number
}

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
    case 'galley':
      return <svg viewBox="0 0 64 64" className="w-10 h-10"><rect x="6" y="6" width="52" height="10" {...r}/><rect x="6" y="48" width="52" height="10" {...r}/></svg>
    case 'island':
      return <svg viewBox="0 0 64 64" className="w-10 h-10"><rect x="6" y="6" width="12" height="52" {...r}/><rect x="6" y="6" width="52" height="12" {...r}/><rect x="46" y="6" width="12" height="52" {...r}/><rect x="20" y="28" width="24" height="16" {...r}/></svg>
    default: return null
  }
}

// ─── Labeled wall diagram (SVG) ────────────────────────────────────────────────
function WallDiagram({ layout, walls }: { layout: string; walls: WallsState }) {
  const T = 12   // wall thickness px
  const fill = '#d4c9bc'
  const stroke = '#a09585'
  const lbl = '#7c6f64'
  const ft = (n: number) => n > 0 ? `${n} ft` : '?'

  if (layout === 'straight') {
    return (
      <svg viewBox="0 0 200 70" className="w-48 h-16">
        <rect x="10" y="28" width="180" height={T} fill={fill} stroke={stroke} strokeWidth="1.5" rx="2"/>
        <text x="100" y="20" textAnchor="middle" fontSize="11" fill={lbl} fontWeight="600">Wall A — {ft(walls.a)}</text>
        <line x1="10" y1="52" x2="190" y2="52" stroke="#b0a898" strokeWidth="1" strokeDasharray="4,3"/>
        <text x="100" y="65" textAnchor="middle" fontSize="9" fill="#b0a898">← cabinets →</text>
      </svg>
    )
  }
  if (layout === 'galley') {
    return (
      <svg viewBox="0 0 200 110" className="w-48 h-24">
        <rect x="10" y="14" width="180" height={T} fill={fill} stroke={stroke} strokeWidth="1.5" rx="2"/>
        <text x="100" y="11" textAnchor="middle" fontSize="10" fill={lbl} fontWeight="600">Wall A (sink side) — {ft(walls.a)}</text>
        <rect x="10" y="82" width="180" height={T} fill={fill} stroke={stroke} strokeWidth="1.5" rx="2"/>
        <text x="100" y="108" textAnchor="middle" fontSize="10" fill={lbl} fontWeight="600">Wall B (opposite) — {ft(walls.b)}</text>
        <line x1="100" y1="26" x2="100" y2="82" stroke="#b0a898" strokeWidth="1" strokeDasharray="4,3"/>
        <text x="108" y="58" fontSize="9" fill="#b0a898">aisle</text>
      </svg>
    )
  }
  if (layout === 'l_shape') {
    return (
      <svg viewBox="0 0 200 150" className="w-44 h-36">
        <rect x="40" y="10" width="150" height={T} fill={fill} stroke={stroke} strokeWidth="1.5" rx="2"/>
        <text x="115" y="7" textAnchor="middle" fontSize="10" fill={lbl} fontWeight="600">A — {ft(walls.a)}</text>
        <rect x="40" y="10" width={T} height="130" fill={fill} stroke={stroke} strokeWidth="1.5" rx="2"/>
        <text x="24" y="78" textAnchor="middle" fontSize="10" fill={lbl} fontWeight="600"
          transform="rotate(-90,24,78)">B — {ft(walls.b)}</text>
      </svg>
    )
  }
  if (layout === 'u_shape') {
    return (
      <svg viewBox="0 0 200 160" className="w-44 h-36">
        <rect x="40" y="10" width="150" height={T} fill={fill} stroke={stroke} strokeWidth="1.5" rx="2"/>
        <text x="115" y="7" textAnchor="middle" fontSize="10" fill={lbl} fontWeight="600">A — {ft(walls.a)}</text>
        <rect x="40" y="10" width={T} height="140" fill={fill} stroke={stroke} strokeWidth="1.5" rx="2"/>
        <text x="24" y="82" textAnchor="middle" fontSize="10" fill={lbl} fontWeight="600"
          transform="rotate(-90,24,82)">B — {ft(walls.b)}</text>
        <rect x="178" y="10" width={T} height="140" fill={fill} stroke={stroke} strokeWidth="1.5" rx="2"/>
        <text x="196" y="82" textAnchor="middle" fontSize="10" fill={lbl} fontWeight="600"
          transform="rotate(90,196,82)">C — {ft(walls.c)}</text>
      </svg>
    )
  }
  if (layout === 'island') {
    const islandPx = walls.island > 0 ? Math.min(walls.island * 8, 70) : 50
    return (
      <svg viewBox="0 0 200 170" className="w-44 h-40">
        <rect x="40" y="10" width="150" height={T} fill={fill} stroke={stroke} strokeWidth="1.5" rx="2"/>
        <text x="115" y="7" textAnchor="middle" fontSize="10" fill={lbl} fontWeight="600">A — {ft(walls.a)}</text>
        <rect x="40" y="10" width={T} height="140" fill={fill} stroke={stroke} strokeWidth="1.5" rx="2"/>
        <text x="24" y="82" textAnchor="middle" fontSize="10" fill={lbl} fontWeight="600"
          transform="rotate(-90,24,82)">B — {ft(walls.b)}</text>
        <rect x="178" y="10" width={T} height="140" fill={fill} stroke={stroke} strokeWidth="1.5" rx="2"/>
        <text x="196" y="82" textAnchor="middle" fontSize="10" fill={lbl} fontWeight="600"
          transform="rotate(90,196,82)">C — {ft(walls.c)}</text>
        <rect x={115 - islandPx/2} y="90" width={islandPx} height="22" fill={fill} stroke={stroke} strokeWidth="1" rx="2"/>
        <text x="115" y="116" textAnchor="middle" fontSize="9" fill={lbl} fontWeight="600">Island — {ft(walls.island)}</text>
      </svg>
    )
  }
  return null
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
type BuildStep = 'intro' | 'photo' | 1 | 2 | 3 | 'style' | 'estimate' | 'qualify' | 'contact'

// Which wall inputs to show per layout
const WALL_INPUTS: Record<string, Array<{ key: keyof WallsState; label: string; min: number; max: number; hint?: string }>> = {
  straight: [{ key: 'a', label: 'Wall A', min: 3, max: 40 }],
  galley:   [{ key: 'a', label: 'Wall A (sink side)', min: 3, max: 40, hint: 'The longer run' }, { key: 'b', label: 'Wall B (opposite)', min: 3, max: 40, hint: 'Facing wall' }],
  l_shape:  [{ key: 'a', label: 'Wall A', min: 3, max: 40 }, { key: 'b', label: 'Wall B', min: 3, max: 40 }],
  u_shape:  [{ key: 'a', label: 'Wall A', min: 3, max: 40 }, { key: 'b', label: 'Wall B', min: 3, max: 40 }, { key: 'c', label: 'Wall C', min: 3, max: 40 }],
  island:   [{ key: 'a', label: 'Wall A', min: 3, max: 40 }, { key: 'b', label: 'Wall B', min: 3, max: 40 }, { key: 'c', label: 'Wall C', min: 3, max: 40 }, { key: 'island', label: 'Island', min: 2, max: 20 }],
}

function BuilderPath({ onSuccess }: { onSuccess: (d: any) => void }) {
  const business = useBusiness()
  const [step, setStep]             = useState<BuildStep>('intro')
  const [layout, setLayout]         = useState('')
  const [walls, setWalls]           = useState<WallsState>({ a: 0, b: 0, c: 0, island: 0 })
  const [replacing, setReplacing]   = useState<boolean | null>(null)
  const [installOnly, setInstOnly]  = useState<boolean | null>(null)
  const [collection, setCollection] = useState('')
  const [style, setStyle]           = useState('')
  const [contact, setContact]       = useState<ContactForm>(EMPTY)
  const [timeline, setTimeline]     = useState('')
  const [notes, setNotes]           = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState('')
  // Vision state
  const [visionLoading, setVisionLoading] = useState(false)
  const [visionResult, setVisionResult]   = useState<VisionResult | null>(null)
  const [uploadedPhotos, setUploadedPhotos] = useState<File[]>([])
  const [photoThumbs, setPhotoThumbs]       = useState<string[]>([])
  const photo1Ref = useRef<HTMLInputElement>(null)
  const photo2Ref = useRef<HTMLInputElement>(null)

  // Tracks whether wall dims were auto-filled from vision (shows verify notice on step 1)
  const [visionFilled, setVisionFilled] = useState(false)
  // Cabinet count from photo — passed to smart-estimate as override
  const [visionCabinetCount, setVisionCabinetCount] = useState<number | null>(null)

  // Lead qualification
  const [ownsHome, setOwnsHome]               = useState<boolean | null>(null)
  const [replacingAll, setReplacingAll]       = useState<boolean | null>(null) // true=yes, null=not sure
  const [customerTimeline, setCustomerTimeline] = useState<'0-3' | '3-6' | 'exploring' | ''>('')

  // Smart estimate from API
  const [apiEst, setApiEst]         = useState<{ min: number; max: number; cabinetCount: number; countFromPhoto: boolean; cabinetPrice: number; installFee: number; demoFee: number } | null>(null)
  const [apiEstLoading, setApiEstLoading] = useState(false)

  const isQualified       = ownsHome === true && replacingAll === true && customerTimeline !== 'exploring'
  const isHardDisqualified = ownsHome === false
  const canQualify        = ownsHome !== null && replacingAll !== null && customerTimeline !== ''

  const totalLF    = wallsToLF(layout, walls)
  const canStep1   = !!layout && totalLF > 0
  const canStep2   = replacing !== null && installOnly !== null
  const estimate   = (layout && totalLF > 0 && collection && replacing !== null && installOnly !== null)
    ? calcEstimate(totalLF, collection, replacing, installOnly)
    : null
  const displayEst = apiEst ?? estimate
  const contactValid = contact.firstName && contact.lastName && contact.email && contact.phone

  // Fetch real product-based estimate when reaching the estimate step
  useEffect(() => {
    if (step !== 'estimate' || installOnly || !collection || collection === 'Not Sure Yet' || !layout || totalLF <= 0) return
    setApiEstLoading(true)
    setApiEst(null)
    axios.get('/api/public/smart-estimate', {
      params: {
        layout,
        size: lfToSize(layout, totalLF),
        collection,
        replacing: replacing ? 'true' : 'false',
        walls: JSON.stringify(walls),
        ...(visionCabinetCount ? { cabinetCountOverride: visionCabinetCount } : {}),
      }
    })
      .then(r => setApiEst(r.data))
      .catch(() => { /* silently fall back to calcEstimate */ })
      .finally(() => setApiEstLoading(false))
  }, [step]) // eslint-disable-line react-hooks/exhaustive-deps

  // Photo upload — analyze 1 or 2 images
  const analyzePhotos = async (files: File[]) => {
    setVisionLoading(true)
    setVisionResult(null)
    const formData = new FormData()
    files.forEach(f => formData.append('images', f))
    try {
      const { data } = await axios.post('/api/public/analyze-kitchen', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setVisionResult(data)
    } catch {
      setStep(1)
    } finally {
      setVisionLoading(false)
    }
  }

  const handlePhoto1 = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const thumb = URL.createObjectURL(file)
    setUploadedPhotos([file])
    setPhotoThumbs([thumb])
    setVisionResult(null)
    analyzePhotos([file])
    if (photo1Ref.current) photo1Ref.current.value = ''
  }

  const handlePhoto2 = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const thumb = URL.createObjectURL(file)
    const newPhotos = [uploadedPhotos[0], file]
    const newThumbs = [photoThumbs[0], thumb]
    setUploadedPhotos(newPhotos)
    setPhotoThumbs(newThumbs)
    setVisionResult(null)
    analyzePhotos(newPhotos)
    if (photo2Ref.current) photo2Ref.current.value = ''
  }

  const removePhoto2 = () => {
    if (photoThumbs[1]) URL.revokeObjectURL(photoThumbs[1])
    const remaining = [uploadedPhotos[0]]
    const remainingThumbs = [photoThumbs[0]]
    setUploadedPhotos(remaining)
    setPhotoThumbs(remainingThumbs)
    setVisionResult(null)
    analyzePhotos(remaining)
  }

  const resetPhotos = () => {
    photoThumbs.forEach(t => URL.revokeObjectURL(t))
    setUploadedPhotos([])
    setPhotoThumbs([])
    setVisionResult(null)
  }

  const applyVisionResult = (result: VisionResult) => {
    setLayout(result.layout)
    setWalls(result.walls)
    if (result.replacing) setReplacing(true)
    setVisionFilled(true)
    if (result.cabinetCount > 0) setVisionCabinetCount(result.cabinetCount)
    setStep(1) // always land on wall dimensions so user can verify
  }

  const goToEstimate = () => {
    if (installOnly) { setCollection('Not Sure Yet'); setStep('estimate') }
    else setStep(3)
  }

  const pickCollection = (name: string) => {
    setCollection(name)
    setStyle('')
    if (name === 'Not Sure Yet' || !COLLECTION_STYLES[name]?.length) {
      setStep('estimate')
    } else {
      setStep('style')
    }
  }

  const submit = async () => {
    setSubmitting(true); setError('')
    try {
      const est = displayEst ?? estimate!
      const res = await axios.post('/api/public/quote-request', {
        ...contact, timeline, notes,
        kitchenSize: `${layout}_${lfToSize(layout, totalLF)}`,
        collection,
        style,
        quoteType: 'estimate',
        estimateMin: est.min,
        estimateMax: est.max,
        items: [],
        ownsHome,
        replacingAll,
        customerTimeline,
        isQualified,
      })
      onSuccess({
        ...contact,
        estimate: est,
        layout,
        size: lfToSize(layout, totalLF),
        collection,
        style,
        installOnly,
        isQualified,
        isHardDisqualified,
        quoteNumber: res.data.quoteNumber,
      })
    } catch { setError(`Something went wrong. Please call ${business.phone || '(833) 201-7849'}.`) }
    finally { setSubmitting(false) }
  }

  const setWallValue = (key: keyof WallsState, val: string) => {
    const n = parseFloat(val) || 0
    setWalls(w => ({ ...w, [key]: n }))
  }

  return (
    <>
      {/* ── Intro / price anchor step ──────────────────────────────────────────── */}
      {step === 'intro' && (
        <div className="animate-fade-in text-center">
          <div className="w-16 h-16 bg-wood-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-wood-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
          </div>
          <h2 className="text-2xl font-black text-stone-900 mb-2">See If Your Kitchen Qualifies</h2>
          <p className="text-stone-500 text-sm mb-6 max-w-sm mx-auto">
            Full cabinet replacement projects in Orlando typically start between{' '}
            <span className="font-bold text-stone-800">$11,000–$18,000 installed</span> — cabinets, labor, and haul-away included.
          </p>

          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 mb-6 text-left space-y-3 text-sm">
            {[
              { icon: '📐', text: 'Free in-home measurement — no obligation' },
              { icon: '🔨', text: 'Licensed crew handles demo, delivery, and installation' },
              { icon: '💰', text: 'Exact price locked in before any work begins' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-lg">{item.icon}</span>
                <span className="text-stone-700">{item.text}</span>
              </div>
            ))}
          </div>

          <button onClick={() => setStep('photo')}
            className="w-full bg-wood-600 hover:bg-wood-700 text-white font-bold py-4 rounded-xl text-base transition-colors mb-3">
            Check My Kitchen →
          </button>
          <button onClick={() => setStep(1)}
            className="text-stone-400 hover:text-stone-600 text-sm underline underline-offset-2">
            Skip — enter details manually
          </button>
        </div>
      )}

      {/* ── Photo step ─────────────────────────────────────────────────────────── */}
      {step === 'photo' && (
        <div className="animate-fade-in">
          <h2 className="text-xl font-bold text-stone-900 mb-1">Snap a photo of your kitchen</h2>
          <p className="text-stone-400 text-sm mb-5">We'll auto-detect your layout and wall lengths — saves a step.</p>

          {/* State 0: no photos yet */}
          {uploadedPhotos.length === 0 && (
            <div className="border-2 border-dashed border-stone-300 hover:border-stone-400 bg-stone-50 rounded-2xl p-8 text-center transition-all">
              <div className="w-14 h-14 bg-stone-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </div>
              <p className="text-stone-600 font-medium mb-2">Upload a kitchen photo</p>
              <p className="text-stone-400 text-xs mb-4">Claude AI will detect your layout and estimate wall sizes</p>
              <label className="cursor-pointer inline-block">
                <span className="bg-wood-600 hover:bg-wood-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors inline-block">
                  Choose Photo
                </span>
                <input ref={photo1Ref} type="file" accept="image/*" className="hidden" onChange={handlePhoto1}/>
              </label>
              <p className="text-xs text-stone-400 mt-3">JPG, PNG, HEIC up to 10 MB</p>
            </div>
          )}

          {/* State 1 & 2: photos uploaded */}
          {uploadedPhotos.length > 0 && (
            <div className="border-2 border-stone-200 rounded-2xl overflow-hidden">
              {/* Thumbnails row */}
              <div className="flex gap-3 p-4 bg-stone-50 border-b border-stone-200">
                {photoThumbs.map((thumb, i) => (
                  <div key={i} className="relative w-24 h-20 rounded-xl overflow-hidden border border-stone-300 flex-shrink-0">
                    <img src={thumb} alt={`Photo ${i + 1}`} className="w-full h-full object-cover"/>
                  </div>
                ))}

                {/* Add 2nd photo slot — only shown when 1 photo and not loading */}
                {uploadedPhotos.length === 1 && !visionLoading && (
                  <label className="w-24 h-20 rounded-xl border-2 border-dashed border-stone-300 hover:border-wood-500 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors flex-shrink-0">
                    <svg className="w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                    </svg>
                    <span className="text-xs text-stone-400 text-center leading-tight">2nd angle</span>
                    <input ref={photo2Ref} type="file" accept="image/*" className="hidden" onChange={handlePhoto2}/>
                  </label>
                )}

                {/* Remove 2nd photo button */}
                {uploadedPhotos.length === 2 && !visionLoading && (
                  <button onClick={removePhoto2}
                    className="w-24 h-20 rounded-xl border border-stone-200 bg-white text-xs text-stone-400 hover:text-red-500 hover:border-red-300 transition-colors flex flex-col items-center justify-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                    Remove 2nd
                  </button>
                )}
              </div>

              {/* Analysis area */}
              <div className="p-5">
                {visionLoading && (
                  <div className="flex flex-col items-center gap-3 py-2">
                    <Spinner/>
                    <p className="text-stone-500 text-sm">
                      {uploadedPhotos.length === 2 ? 'Analyzing from both angles…' : 'Analyzing your kitchen…'}
                    </p>
                  </div>
                )}

                {visionResult && !visionLoading && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                        </svg>
                      </div>
                      <p className="text-sm font-bold text-stone-800">
                        {(visionResult as any).photoCount === 2 ? 'Analyzed from 2 angles' : 'We detected:'}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        visionResult.confidence === 'high' ? 'bg-green-100 text-green-700' :
                        visionResult.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-stone-100 text-stone-500'
                      }`}>{visionResult.confidence} confidence</span>
                    </div>
                    <p className="text-stone-700 text-sm mb-0.5">
                      {LAYOUTS.find(l => l.value === visionResult.layout)?.label ?? visionResult.layout} layout
                      {visionResult.walls.a > 0 ? ` · Wall A ~${visionResult.walls.a} ft` : ''}
                      {visionResult.walls.b > 0 ? ` · Wall B ~${visionResult.walls.b} ft` : ''}
                      {visionResult.walls.c > 0 ? ` · Wall C ~${visionResult.walls.c} ft` : ''}
                      {visionResult.replacing ? ' · Has existing cabinets' : ''}
                    </p>
                    {visionResult.notes && (
                      <p className="text-xs text-stone-400 italic mb-3">"{visionResult.notes}"</p>
                    )}
                    <div className="flex gap-3 flex-wrap mt-3">
                      <button onClick={() => applyVisionResult(visionResult)}
                        className="bg-wood-600 hover:bg-wood-700 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors">
                        Looks right →
                      </button>
                      <button onClick={() => applyVisionResult(visionResult)}
                        className="border border-stone-300 text-stone-700 text-sm font-medium px-5 py-2 rounded-xl hover:border-stone-400 transition-colors">
                        Adjust manually →
                      </button>
                    </div>
                    <button onClick={resetPhotos}
                      className="block mt-3 text-xs text-stone-400 hover:text-stone-600">
                      ← Start over with different photos
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-5 text-center">
            <button onClick={() => setStep(1)} className="text-stone-500 hover:text-stone-700 text-sm font-medium underline underline-offset-2">
              Skip — I'll fill it in myself
            </button>
          </div>
        </div>
      )}

      {/* ── Step 1: Layout + Wall Dimensions ───────────────────────────────────── */}
      {step === 1 && (
        <div className="animate-fade-in">
          <h2 className="text-xl font-bold text-stone-900 mb-1">What is your kitchen layout?</h2>
          <p className="text-stone-400 text-sm mb-5">Pick the shape, then enter your actual wall lengths.</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {LAYOUTS.map(l => (
              <button key={l.value}
                onClick={() => { setLayout(l.value); setWalls({ a: 0, b: 0, c: 0, island: 0 }); setVisionFilled(false) }}
                className={`border-2 rounded-2xl p-4 text-center transition-all flex flex-col items-center gap-2 ${layout===l.value?'border-wood-600 bg-wood-50':'border-stone-200 hover:border-stone-400'}`}>
                <div className={layout===l.value?'text-wood-700':'text-stone-500'}><LayoutIcon value={l.value}/></div>
                <div className="font-bold text-stone-900 text-sm">{l.label}</div>
                <div className="text-xs text-stone-400">{l.sub}</div>
              </button>
            ))}
          </div>

          {/* AI estimate notice — shown when dimensions were auto-filled from vision */}
          {visionFilled && layout && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mb-3 flex items-start gap-2 text-sm text-amber-800">
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 110 18A9 9 0 0112 3z"/>
              </svg>
              <span>
                <strong>AI estimate — please verify.</strong> These wall lengths were detected from your photo.
                Photos can make spaces look larger — adjust if the numbers seem off.
              </span>
            </div>
          )}

          {/* Wall dimension inputs — shown after layout selected */}
          {layout && (
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 mb-5">
              <p className="text-sm font-bold text-stone-700 mb-3">Enter your wall lengths (feet)</p>
              <div className="flex flex-col sm:flex-row gap-5 items-start">
                {/* Labeled diagram */}
                <div className="flex-shrink-0">
                  <WallDiagram layout={layout} walls={walls}/>
                </div>
                {/* Inputs */}
                <div className="flex-1">
                  <div className="grid grid-cols-2 gap-3">
                    {(WALL_INPUTS[layout] || []).map(({ key, label, min, max, hint }) => (
                      <div key={key}>
                        <label className="text-xs font-semibold text-stone-500 mb-1 block">
                          {label}
                          {hint && <span className="font-normal text-stone-400 ml-1">({hint})</span>}
                        </label>
                        <input
                          type="number" min={min} max={max} step="0.5"
                          value={walls[key] || ''}
                          onChange={e => { setWallValue(key, e.target.value); setVisionFilled(false) }}
                          placeholder={`ft (e.g. ${min + 4})`}
                          className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wood-500 ${
                            visionFilled && walls[key] > 0 ? 'border-amber-300 bg-amber-50' : 'border-stone-300'
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                  {totalLF > 0 && (
                    <div className="mt-3 text-sm text-stone-500">
                      Total: <span className="font-bold text-stone-800">{totalLF} linear ft</span> of cabinetry
                      <span className="ml-2 text-xs text-stone-400">({lfToSize(layout, totalLF)} kitchen)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center">
            <button onClick={() => setStep('photo')} className="text-stone-500 hover:text-stone-700 text-sm font-medium">← Photo</button>
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

      {/* ── Step 3: Collection picker ──────────────────────────────────────────── */}
      {step === 3 && (
        <div className="animate-fade-in">
          <h2 className="text-xl font-bold text-stone-900 mb-1">What cabinet style do you prefer?</h2>
          <p className="text-stone-400 text-sm mb-6">Click a style to see all available colors. Affects pricing.</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {COLLECTIONS.map(col => (
              <button key={col.name} onClick={() => pickCollection(col.name)}
                className={`group rounded-2xl overflow-hidden border-2 transition-all hover:shadow-md hover:scale-[1.02] focus:outline-none bg-white text-left ${collection===col.name?'border-wood-500':'border-stone-200 hover:border-stone-300'}`}>
                {col.tag && <div className="absolute" />}
                <div className="relative h-44 bg-stone-400 flex items-center justify-center overflow-hidden p-3">
                  <img src={col.img} alt={col.name} className="h-full w-auto object-contain drop-shadow-sm"/>
                  {col.tag && <div className="absolute top-2 right-2 bg-wood-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{col.tag}</div>}
                </div>
                <div className="p-2.5 border-t border-stone-100">
                  <div className="font-bold text-xs text-stone-900 leading-tight">{col.name}</div>
                  <div className="text-xs text-stone-400 mt-0.5">{col.desc}</div>
                </div>
              </button>
            ))}
          </div>

          <div className="flex justify-start">
            <button onClick={() => setStep(2)} className="text-stone-500 hover:text-stone-700 text-sm font-medium">← Back</button>
          </div>
        </div>
      )}

      {/* ── Step style: Color picker ───────────────────────────────────────────── */}
      {step === 'style' && (
        <div className="animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => setStep(3)} className="text-stone-500 hover:text-stone-700 text-sm font-medium">← Back</button>
            <span className="text-stone-300">·</span>
            <span className="text-sm font-semibold text-wood-600">{collection}</span>
          </div>
          <h2 className="text-xl font-bold text-stone-900 mb-1">Choose your color</h2>
          <p className="text-stone-400 text-sm mb-5">Not sure? Pick the closest — our team will help refine it.</p>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-6">
            {(COLLECTION_STYLES[collection] || []).map(s => (
              <button key={s.name} onClick={() => { setStyle(s.name); setStep('estimate') }}
                className={`group rounded-xl overflow-hidden border-2 transition-all hover:shadow-md hover:scale-[1.02] focus:outline-none bg-white ${style===s.name?'border-wood-500':'border-stone-200 hover:border-stone-300'}`}>
                <div className="aspect-[3/4] bg-stone-400 flex items-center justify-center overflow-hidden p-2">
                  <img src={s.img} alt={s.name} className="h-full w-auto object-contain drop-shadow-sm"/>
                </div>
                <div className="px-2 py-2 border-t border-stone-100">
                  <div className="text-xs font-semibold text-stone-900 leading-tight">{s.name}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Estimate reveal ────────────────────────────────────────────────────── */}
      {step === 'estimate' && estimate && (
        <div className="animate-fade-in">
          {apiEstLoading && (
            <div className="text-center py-10">
              <div className="inline-flex items-center gap-3 text-stone-500 text-sm">
                <Spinner/>
                <span>Calculating your estimate from our product catalog…</span>
              </div>
            </div>
          )}

          {!apiEstLoading && (
            <>
              <div className="text-center mb-6">
                <div className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">
                  {apiEst ? 'Estimated from our live product catalog' : 'Based on your selections'}
                </div>
                <div className="text-4xl sm:text-5xl font-black text-stone-900 mb-2">
                  ${displayEst!.min.toLocaleString()} – ${displayEst!.max.toLocaleString()}
                </div>
                <div className="text-stone-500 text-sm">
                  {installOnly
                    ? 'flat-rate installation · any kitchen layout'
                    : `fully installed · ${replacing ? 'demo & haul-away included' : 'new construction'}`}
                </div>
                {!installOnly && collection && collection !== 'Not Sure Yet' && (
                  <div className="mt-1 text-xs text-stone-400">{collection}{style ? ` · ${style}` : ''}</div>
                )}
                {totalLF > 0 && (
                  <div className="mt-1 text-xs text-stone-400">{totalLF} linear ft · {lfToSize(layout, totalLF)} kitchen</div>
                )}
              </div>

              {/* Smart estimate breakdown */}
              {apiEst && apiEst.cabinetCount > 0 && (
                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 mb-5 text-sm">
                  <div className="font-semibold text-stone-800 mb-3 text-xs uppercase tracking-wide">What's included</div>
                  <div className="space-y-2 text-stone-600">
                    <div className="flex justify-between">
                      <span>
                        {apiEst.cabinetCount} cabinets ({collection})
                        {apiEst.countFromPhoto && (
                          <span className="ml-1.5 text-xs text-amber-600 font-medium">· counted from photo</span>
                        )}
                      </span>
                      <span className="font-semibold text-stone-800">${apiEst.cabinetPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Professional installation</span>
                      <span className="font-semibold text-stone-800">${apiEst.installFee.toLocaleString()}</span>
                    </div>
                    {apiEst.demoFee > 0 && (
                      <div className="flex justify-between">
                        <span>Demo & haul-away</span>
                        <span className="font-semibold text-stone-800">${apiEst.demoFee.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="border-t border-stone-200 pt-2 flex justify-between text-xs text-stone-400">
                      <span>FL sales tax on materials</span>
                      <span>included</span>
                    </div>
                  </div>
                  {apiEst.countFromPhoto && (
                    <p className="text-xs text-stone-400 mt-3 leading-relaxed">
                      Cabinet count estimated from your photo. Exact count confirmed during your free in-home measurement — pricing adjusts accordingly.
                    </p>
                  )}
                </div>
              )}

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-sm text-amber-800 flex items-start gap-3">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <div>
                  <strong>Estimate range — not a final quote.</strong> Final pricing is confirmed after a quick free measurement. Most projects land near the middle of this range.
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mb-3">
                <button onClick={() => setStep('qualify')}
                  className="flex-1 bg-wood-600 hover:bg-wood-700 text-white font-bold py-3.5 rounded-xl text-sm transition-colors">
                  Get My Quote →
                </button>
              </div>
              {business.phone && (
                <a href={`tel:+${business.phone.replace(/\D/g,'')}`}
                  className="block text-center border-2 border-stone-300 hover:border-stone-400 text-stone-700 font-semibold py-3 rounded-xl text-sm transition-colors mb-4">
                  Call {business.phone}
                </a>
              )}
              <p className="text-center text-stone-400 text-xs">No obligation. Free measurement walkthrough to lock in final pricing.</p>

              <div className="mt-5 flex justify-center gap-4 text-xs text-stone-400">
                <button onClick={() => setStep(installOnly ? 2 : style ? 'style' : 3)} className="hover:text-stone-600 underline underline-offset-2">
                  Change selections
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Planner step ───────────────────────────────────────────────────────── */}
      {/* ── Qualify step ───────────────────────────────────────────────────────── */}
      {step === 'qualify' && (
        <div className="animate-fade-in">
          <h2 className="text-xl font-bold text-stone-900 mb-1">Almost there — two quick questions</h2>
          <p className="text-stone-400 text-sm mb-6">Helps us prepare the right team for your project.</p>

          {/* Q1: Replacing all cabinets? */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-stone-700 mb-3">Are you replacing all your cabinets?</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Yes — full replacement', value: true },
                { label: 'Not sure / partial update', value: null },
              ].map(opt => (
                <button key={String(opt.label)} onClick={() => setReplacingAll(opt.value)}
                  className={`border-2 rounded-xl py-3 px-4 text-sm font-medium transition-all text-left ${
                    replacingAll === opt.value && opt.value !== null
                      ? 'border-wood-600 bg-wood-50 text-wood-800'
                      : replacingAll === null && opt.value === null && replacingAll !== true && customerTimeline === '' && ownsHome === null ? 'border-stone-200 text-stone-600'
                      : (replacingAll === null && opt.value === null) ? 'border-wood-600 bg-wood-50 text-wood-800'
                      : 'border-stone-200 text-stone-600 hover:border-stone-400'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Q2: Timeline */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-stone-700 mb-3">When are you hoping to start?</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Within 3 months', value: '0-3' as const },
                { label: '3–6 months', value: '3-6' as const },
                { label: 'Just exploring', value: 'exploring' as const },
              ].map(opt => (
                <button key={opt.value} onClick={() => setCustomerTimeline(opt.value)}
                  className={`border-2 rounded-xl py-3 px-3 text-sm font-medium transition-all text-center ${
                    customerTimeline === opt.value
                      ? 'border-wood-600 bg-wood-50 text-wood-800'
                      : 'border-stone-200 text-stone-600 hover:border-stone-400'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Q3: Own home? */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-stone-700 mb-3">Do you own the home?</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Yes, I own it', value: true },
                { label: 'No / renting', value: false },
              ].map(opt => (
                <button key={String(opt.value)} onClick={() => setOwnsHome(opt.value)}
                  className={`border-2 rounded-xl py-3 px-4 text-sm font-medium transition-all text-left ${
                    ownsHome === opt.value
                      ? 'border-wood-600 bg-wood-50 text-wood-800'
                      : 'border-stone-200 text-stone-600 hover:border-stone-400'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
            {ownsHome === false && (
              <p className="text-xs text-stone-500 mt-3 bg-stone-50 border border-stone-200 rounded-xl p-3">
                We work directly with homeowners for measurements and approvals — happy to save your info and follow up when you're ready.
              </p>
            )}
          </div>

          <div className="flex justify-between items-center">
            <button onClick={() => setStep('estimate')} className="text-stone-500 hover:text-stone-700 text-sm font-medium">← Back</button>
            <button onClick={() => setStep('contact')} disabled={!canQualify}
              className="bg-wood-600 hover:bg-wood-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-semibold px-8 py-2.5 rounded-xl transition-colors">
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* ── Contact form ───────────────────────────────────────────────────────── */}
      {step === 'contact' && displayEst && (
        <div className="animate-fade-in">
          {/* Sticky estimate reminder */}
          <div className="bg-wood-50 border border-wood-200 rounded-2xl px-5 py-3 mb-6 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-wood-700 uppercase tracking-wider">Your Estimate</div>
              <div className="text-xl font-bold text-wood-800">${displayEst.min.toLocaleString()} – ${displayEst.max.toLocaleString()}</div>
            </div>
            <button onClick={() => setStep('estimate')} className="text-xs text-wood-600 hover:text-wood-800 font-medium border border-wood-200 rounded-lg px-3 py-1.5">
              Edit ↑
            </button>
          </div>

          <h2 className="text-xl font-bold text-stone-900 mb-1">
            {isQualified ? 'Lock in your free measurement' : 'Submit your project details'}
          </h2>
          <p className="text-stone-500 text-sm mb-5">
            {isQualified
              ? 'Emma will call you to schedule a free in-home measurement — usually within 5 minutes.'
              : 'We\'ll review your project and reach out to discuss next steps.'}
          </p>

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
            <button onClick={() => setStep('qualify')} className="text-stone-500 hover:text-stone-700 font-medium text-sm">← Back</button>
            <button onClick={submit} disabled={!contactValid || !timeline || submitting || (!displayEst && !estimate)}
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
  { label: 'Small (10×10)',    value: 'small_10x10',   priceRange: '$8,500–$12,000' },
  { label: 'Medium (12×14)',   value: 'medium_12x14',  priceRange: '$13,000–$18,000' },
  { label: 'Large (15×15+)',   value: 'large_15x15',   priceRange: '$18,500–$26,000' },
  { label: 'Installation Only',value: 'install_only',  priceRange: '$2,800–$4,000' },
  { label: 'Not Sure Yet',     value: 'unknown',       priceRange: "We will figure it out together" },
]
function EstimatePath({ onSuccess }: { onSuccess: (d: any) => void }) {
  const business = useBusiness()
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
    } catch { setError(`Something went wrong. Please call ${business.phone || '(833) 201-7849'}.`) }
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {COLLECTIONS.map(col => (
                <button key={col.name} onClick={() => setCollection(col.name)}
                  className={`group rounded-2xl overflow-hidden border-2 transition-all hover:shadow-md hover:scale-[1.02] focus:outline-none bg-white text-left ${collection===col.name?'border-wood-500':'border-stone-200 hover:border-stone-300'}`}>
                  <div className="relative h-36 bg-stone-400 flex items-center justify-center overflow-hidden p-3">
                    <img src={col.img} alt={col.name} className="h-full w-auto object-contain drop-shadow-sm"/>
                    {col.tag && <div className="absolute top-2 right-2 bg-wood-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{col.tag}</div>}
                  </div>
                  <div className="p-2.5 border-t border-stone-100">
                    <div className="font-bold text-xs text-stone-900 leading-tight">{col.name}</div>
                    <div className="text-xs text-stone-400 mt-0.5">{col.desc}</div>
                  </div>
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
  const business = useBusiness()
  const [mode, setMode]           = useState<Mode>(null)
  const [submitted, setSubmitted] = useState(false)
  const [submitData, setSubmitData] = useState<any>(null)
  const handleSuccess = useCallback((d: any) => { setSubmitData(d); setSubmitted(true) }, [])

  if (submitted) {
    return (
      <div className="min-h-screen bg-stone-50 px-4 py-16">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-stone-900 mb-1">You're all set, {submitData?.firstName}!</h2>
            {submitData?.quoteNumber && (
              <div className="inline-block bg-stone-100 text-stone-500 text-xs font-mono px-3 py-1 rounded-full mt-1">
                {submitData.quoteNumber}
              </div>
            )}
          </div>

          {/* Estimate box */}
          {submitData?.estimate && (
            <div className="bg-white border-2 border-wood-200 rounded-2xl p-5 mb-6 text-center">
              <div className="text-xs font-bold text-wood-600 uppercase tracking-wider mb-1">Your Estimate Range</div>
              <div className="text-3xl font-black text-stone-900">
                ${submitData.estimate.min.toLocaleString()} – ${submitData.estimate.max.toLocaleString()}
              </div>
              <div className="text-xs text-stone-400 mt-1">
                {submitData.installOnly
                  ? 'flat-rate installation'
                  : `${submitData.collection}${submitData.style ? ` · ${submitData.style}` : ''}`}
              </div>
              <div className="mt-3 text-xs text-stone-500 bg-stone-50 rounded-xl px-4 py-2">
                This range is confirmed exact after your free in-home measurement.
                Most projects land in the middle of this range.
              </div>
            </div>
          )}

          {/* What happens next — varies by qualification */}
          {submitData?.isHardDisqualified ? (
            <div className="bg-white border border-stone-200 rounded-2xl p-5 mb-6">
              <h3 className="font-bold text-stone-900 mb-3 text-sm uppercase tracking-wide">What Happens Next</h3>
              <p className="text-stone-600 text-sm leading-relaxed">
                We'll review your project details and reach out to discuss options. If you're working with a homeowner, feel free to have them submit a request directly — we'll get them a measurement appointment right away.
              </p>
              {business.phone && <p className="text-stone-500 text-sm mt-3">Questions? Call us at <a href={`tel:+${business.phone.replace(/\D/g,'')}`} className="font-semibold text-wood-700">{business.phone}</a></p>}
            </div>
          ) : (
            <div className="bg-white border border-stone-200 rounded-2xl p-5 mb-6">
              <h3 className="font-bold text-stone-900 mb-4 text-sm uppercase tracking-wide">What Happens Next</h3>
              <div className="space-y-4">
                {[
                  { icon: '📞', title: 'Emma calls you shortly', desc: 'Our assistant will call to schedule your free measurement — usually within 5 minutes.' },
                  { icon: '📐', title: 'Free in-home measurement', desc: 'A team member visits, takes exact measurements, and walks through your project.' },
                  { icon: '💰', title: 'Exact quote confirmed', desc: 'We lock in the final number — no surprises. Most projects land near the middle of your estimate.' },
                  { icon: '🔨', title: 'Installation in 2–3 days', desc: 'Our licensed crew handles everything: demo, delivery, and full installation.' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="text-xl flex-shrink-0 mt-0.5">{item.icon}</div>
                    <div>
                      <div className="font-semibold text-stone-900 text-sm">{item.title}</div>
                      <div className="text-stone-500 text-xs mt-0.5 leading-relaxed">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              {submitData?.isQualified && submitData?.quoteNumber && (
                <div className="mt-5 pt-4 border-t border-stone-100">
                  <p className="text-xs text-stone-500 mb-2">Can't wait for Emma's call? Pick a time yourself:</p>
                  <a
                    href={`/schedule?quote=${submitData.quoteNumber}&name=${encodeURIComponent(submitData.firstName)}`}
                    className="block w-full text-center bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold py-2.5 rounded-xl text-sm transition-colors">
                    Schedule My Measurement →
                  </a>
                </div>
              )}
            </div>
          )}

          <p className="text-center text-stone-400 text-xs mb-6">
            Confirmation text sent to <strong>{submitData?.phone}</strong>
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/" className="flex-1 border border-stone-300 text-stone-700 font-semibold px-6 py-3 rounded-xl text-sm text-center">
              Back to Home
            </Link>
            <a href={`tel:+${(business.phone || '18332017849').replace(/\D/g,'')}`} className="flex-1 bg-wood-600 hover:bg-wood-700 text-white font-semibold px-6 py-3 rounded-xl text-sm text-center transition-colors">
              Call {business.phone || '(833) 201-7849'}
            </a>
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
                <p className="text-stone-600 text-sm leading-relaxed mb-4">Photo + wall dimensions → instant estimate → visual floor plan. The most accurate quote with zero commitment.</p>
                <div className="flex flex-wrap gap-1.5">
                  {['Photo AI auto-fill', 'Real wall dimensions', 'Visual floor plan'].map(t => (
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
              Prefer to talk? <a href={`tel:+${(business.phone || '18332017849').replace(/\D/g,'')}`} className="text-wood-600 font-semibold">{business.phone || '(833) 201-7849'}</a> — available 24/7.
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
