import { useState, useRef, useEffect, useCallback } from 'react'
import { Stage, Layer, Rect, Text, Group } from 'react-konva'

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface PlacedCabinet {
  id: string
  wallId: string
  typeCode: string
  label: string
  widthIn: number
  pos: number      // px offset along wall from cabinet start
}

interface WallDef {
  id: string
  label: string
  x: number; y: number; w: number; h: number
  axis: 'h' | 'v'
  innerFace: 'bottom' | 'right' | 'left'
  cabX: number; cabY: number     // cabinet area start (top-left corner)
  cabAxis: 'x' | 'y'
  maxLen: number                  // max px for cabinets
  cabDepth: number               // perpendicular depth in px
}

interface EstimateInfo {
  min: number
  max: number
  installFee?: number
}

interface Props {
  layout: string
  walls: { a: number; b: number; c: number; island: number }
  collection: string
  placedCabinets: PlacedCabinet[]
  onCabinetsChange: (cabs: PlacedCabinet[]) => void
  estimate: EstimateInfo | null
  replacing: boolean
}

// ─── Cabinet palette ────────────────────────────────────────────────────────────

const CABINET_TYPES = [
  { code: 'B18',   label: 'Base 18"',   widthIn: 18, color: '#c9a97b' },
  { code: 'B24',   label: 'Base 24"',   widthIn: 24, color: '#c9a97b' },
  { code: 'B30',   label: 'Base 30"',   widthIn: 30, color: '#c9a97b' },
  { code: 'B36',   label: 'Base 36"',   widthIn: 36, color: '#c9a97b' },
  { code: 'SB30',  label: 'Sink 30"',   widthIn: 30, color: '#7bb5a0' },
  { code: 'BBC36', label: 'Corner 36"', widthIn: 36, color: '#b5957b' },
  { code: 'W3030', label: 'Wall 30"',   widthIn: 30, color: '#d4c49a' },
  { code: 'W3630', label: 'Wall 36"',   widthIn: 36, color: '#d4c49a' },
]

const SCALE = 26        // 1 ft = 26 px
const WALL_THICK = 18   // px — wall rectangle thickness
const CAB_DEPTH = 52    // px — standard 24" base cabinet depth
const STAGE_W = 620
const STAGE_H = 400
const PAD = 60

// ─── Compute wall geometry ──────────────────────────────────────────────────────

function computeWalls(
  layout: string,
  walls: { a: number; b: number; c: number; island: number }
): WallDef[] {
  const a = Math.max(walls.a, 3)
  const b = Math.max(walls.b, 3)
  const c = Math.max(walls.c, 3)
  const isl = Math.max(walls.island, 2)

  // Auto-scale to fit canvas
  const workW = STAGE_W - 2 * PAD
  const workH = STAGE_H - 2 * PAD

  let reqW: number, reqH: number
  switch (layout) {
    case 'straight': reqW = a;     reqH = 4;                   break
    case 'l_shape':  reqW = a;     reqH = b;                   break
    case 'u_shape':
    case 'island':   reqW = a;     reqH = Math.max(b, c);      break
    default:         reqW = 10;    reqH = 8;
  }

  const s = Math.min(workW / Math.max(reqW, 1), workH / Math.max(reqH, 1), SCALE)
  const T = WALL_THICK
  const D = CAB_DEPTH
  const ox = PAD  // canvas left offset
  const oy = PAD  // canvas top offset

  if (layout === 'straight') {
    const len = a * s
    return [{
      id: 'A', label: 'A',
      x: ox, y: oy, w: len, h: T,
      axis: 'h', innerFace: 'bottom',
      cabX: ox, cabY: oy + T,
      cabAxis: 'x', maxLen: len, cabDepth: D,
    }]
  }

  if (layout === 'l_shape') {
    const aLen = a * s
    const bLen = b * s
    return [
      {
        id: 'A', label: 'A',
        x: ox + T, y: oy, w: aLen - T, h: T,
        axis: 'h', innerFace: 'bottom',
        cabX: ox + T, cabY: oy + T,
        cabAxis: 'x', maxLen: aLen - T, cabDepth: D,
      },
      {
        id: 'B', label: 'B',
        x: ox, y: oy, w: T, h: bLen,
        axis: 'v', innerFace: 'right',
        cabX: ox + T, cabY: oy + T,
        cabAxis: 'y', maxLen: bLen - T, cabDepth: D,
      },
    ]
  }

  if (layout === 'u_shape' || layout === 'island') {
    const aLen = a * s
    const bLen = b * s
    const cLen = c * s
    const wDefs: WallDef[] = [
      {
        id: 'A', label: 'A',
        x: ox + T, y: oy, w: aLen - 2 * T, h: T,
        axis: 'h', innerFace: 'bottom',
        cabX: ox + T, cabY: oy + T,
        cabAxis: 'x', maxLen: aLen - 2 * T, cabDepth: D,
      },
      {
        id: 'B', label: 'B',
        x: ox, y: oy, w: T, h: bLen,
        axis: 'v', innerFace: 'right',
        cabX: ox + T, cabY: oy + T,
        cabAxis: 'y', maxLen: bLen - T, cabDepth: D,
      },
      {
        id: 'C', label: 'C',
        x: ox + aLen - T, y: oy, w: T, h: cLen,
        axis: 'v', innerFace: 'left',
        cabX: ox + aLen - T - D, cabY: oy + T,
        cabAxis: 'y', maxLen: cLen - T, cabDepth: D,
      },
    ]

    if (layout === 'island') {
      const islLen = isl * s
      const islX = ox + T + (aLen - 2 * T - islLen) / 2
      const islY = oy + Math.max(bLen, cLen) / 2 - 15
      wDefs.push({
        id: 'island', label: 'Island',
        x: islX, y: islY, w: islLen, h: 24,
        axis: 'h', innerFace: 'bottom',
        cabX: islX, cabY: islY,
        cabAxis: 'x', maxLen: islLen, cabDepth: 24,
      })
    }

    return wDefs
  }

  return []
}

// ─── Auto-populate with sensible defaults ───────────────────────────────────────

function autoPopulate(wallDefs: WallDef[]): PlacedCabinet[] {
  const result: PlacedCabinet[] = []
  let idCounter = 0

  for (const wall of wallDefs) {
    let pos = 0
    while (pos < wall.maxLen - 20) {
      const remaining = wall.maxLen - pos
      let widthIn: number
      let typeCode: string
      let label: string

      if (remaining >= 36 * SCALE / 12) {
        widthIn = 30; typeCode = 'B30'; label = 'Base 30"'
      } else if (remaining >= 24 * SCALE / 12) {
        widthIn = 24; typeCode = 'B24'; label = 'Base 24"'
      } else if (remaining >= 18 * SCALE / 12) {
        widthIn = 18; typeCode = 'B18'; label = 'Base 18"'
      } else {
        break
      }

      const widthPx = (widthIn / 12) * SCALE
      result.push({
        id: `auto-${wall.id}-${idCounter++}`,
        wallId: wall.id,
        typeCode,
        label,
        widthIn,
        pos,
      })
      pos += widthPx
    }
  }

  return result
}

// ─── Get cabinet rect on canvas ─────────────────────────────────────────────────

function getCabRect(wall: WallDef, pos: number, widthPx: number) {
  if (wall.axis === 'h') {
    return { x: wall.cabX + pos, y: wall.cabY, w: widthPx, h: wall.cabDepth }
  } else {
    return { x: wall.cabX, y: wall.cabY + pos, w: wall.cabDepth, h: widthPx }
  }
}

function cabWidthPx(widthIn: number) {
  return (widthIn / 12) * SCALE
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function KitchenPlannerCanvas({
  layout, walls, collection, placedCabinets, onCabinetsChange, estimate,
}: Props) {
  const [selectedWall, setSelectedWall] = useState('A')
  const [selectedCabId, setSelectedCabId] = useState<string | null>(null)
  const [stageScale, setStageScale] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)
  const initialized = useRef(false)

  const wallDefs = computeWalls(layout, walls)

  // Auto-populate on first render
  useEffect(() => {
    if (!initialized.current && placedCabinets.length === 0 && wallDefs.length > 0) {
      initialized.current = true
      onCabinetsChange(autoPopulate(wallDefs))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Responsive scale
  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        const containerW = containerRef.current.offsetWidth
        setStageScale(Math.min(1, containerW / STAGE_W))
      }
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // Select wall A by default if available
  useEffect(() => {
    if (wallDefs.length > 0 && !wallDefs.find(w => w.id === selectedWall)) {
      setSelectedWall(wallDefs[0].id)
    }
  }, [wallDefs]) // eslint-disable-line react-hooks/exhaustive-deps

  const addCabinet = useCallback((type: typeof CABINET_TYPES[0]) => {
    const wall = wallDefs.find(w => w.id === selectedWall)
    if (!wall) return

    const occupied = placedCabinets
      .filter(c => c.wallId === wall.id)
      .reduce((sum, c) => sum + cabWidthPx(c.widthIn), 0)

    const widthPx = cabWidthPx(type.widthIn)
    if (occupied + widthPx > wall.maxLen) {
      alert(`Not enough space on Wall ${wall.label}. Try a shorter cabinet.`)
      return
    }

    onCabinetsChange([...placedCabinets, {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      wallId: wall.id,
      typeCode: type.code,
      label: type.label,
      widthIn: type.widthIn,
      pos: occupied,
    }])
  }, [wallDefs, selectedWall, placedCabinets, onCabinetsChange])

  const deleteCabinet = useCallback((id: string) => {
    const wall = wallDefs.find(w => w.id === placedCabinets.find(c => c.id === id)?.wallId)
    const remaining = placedCabinets.filter(c => c.id !== id)
    // Re-pack remaining cabinets on that wall
    if (wall) {
      let pos = 0
      const repacked = remaining.map(c => {
        if (c.wallId !== wall.id) return c
        const r = { ...c, pos }
        pos += cabWidthPx(c.widthIn)
        return r
      })
      onCabinetsChange(repacked)
    } else {
      onCabinetsChange(remaining)
    }
    setSelectedCabId(null)
  }, [placedCabinets, wallDefs, onCabinetsChange])

  const resetLayout = useCallback(() => {
    initialized.current = false
    onCabinetsChange([])
    setTimeout(() => {
      initialized.current = true
      onCabinetsChange(autoPopulate(wallDefs))
    }, 0)
  }, [wallDefs, onCabinetsChange])

  // Live price estimate from placed cabinets
  const totalCabinets = placedCabinets.length
  const liveEstimate = estimate
    ? {
        min: estimate.min,
        max: estimate.max,
      }
    : null

  return (
    <div className="w-full">
      {/* Live estimate bar */}
      {liveEstimate && (
        <div className="bg-stone-50 border border-stone-200 rounded-xl px-5 py-3 mb-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-stone-400 uppercase tracking-wide">Layout Estimate</div>
            <div className="text-lg font-bold text-stone-900">
              ${liveEstimate.min.toLocaleString()} – ${liveEstimate.max.toLocaleString()}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-stone-400">{totalCabinets} cabinet{totalCabinets !== 1 ? 's' : ''} placed</div>
            <div className="text-xs text-stone-400">{collection}</div>
          </div>
        </div>
      )}

      {/* Wall selector + controls */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-xs font-semibold text-stone-500">Add to Wall:</span>
        {wallDefs.map(w => (
          <button key={w.id} onClick={() => setSelectedWall(w.id)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              selectedWall === w.id
                ? 'bg-wood-600 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}>
            {w.id === 'island' ? 'Island' : `Wall ${w.label}`}
          </button>
        ))}
        <button onClick={resetLayout}
          className="ml-auto text-xs text-stone-400 hover:text-stone-600 font-medium border border-stone-200 rounded-lg px-3 py-1">
          Reset layout
        </button>
      </div>

      {/* Canvas + Palette layout */}
      <div className="flex gap-3">
        {/* Cabinet palette */}
        <div className="w-28 flex-shrink-0">
          <div className="text-xs font-semibold text-stone-500 mb-2">Cabinet Types</div>
          <div className="flex flex-col gap-1.5">
            {CABINET_TYPES.map(t => (
              <button key={t.code} onClick={() => addCabinet(t)}
                className="w-full text-left px-2.5 py-2 bg-white border border-stone-200 rounded-lg hover:border-wood-400 hover:bg-wood-50 transition-all text-xs">
                <div className="font-semibold text-stone-700" style={{ color: t.code.startsWith('W') ? '#7a6a3a' : '#6b4c1e' }}>
                  {t.label}
                </div>
                <div className="text-stone-400" style={{ fontSize: 10 }}>Click to add</div>
              </button>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div ref={containerRef} className="flex-1 min-w-0">
          <Stage
            width={STAGE_W * stageScale}
            height={STAGE_H * stageScale}
            scaleX={stageScale}
            scaleY={stageScale}
            className="bg-white border border-stone-200 rounded-xl overflow-hidden"
            onClick={(e) => {
              if (e.target === e.target.getStage()) setSelectedCabId(null)
            }}
          >
            <Layer>
              {/* Wall rectangles */}
              {wallDefs.map(wall => (
                <Group key={`wall-${wall.id}`}>
                  <Rect
                    x={wall.x} y={wall.y} width={wall.w} height={wall.h}
                    fill="#c8bfb0" stroke="#a09585" strokeWidth={1} cornerRadius={2}
                  />
                  <Text
                    x={wall.axis === 'h' ? wall.x + wall.w / 2 - 20 : wall.x - 2}
                    y={wall.axis === 'h' ? wall.y - 18 : wall.y + wall.h / 2 - 8}
                    text={`Wall ${wall.label}`}
                    fontSize={11} fill="#7c6a58" fontStyle="bold"
                  />
                </Group>
              ))}

              {/* Placed cabinets */}
              {wallDefs.map(wall => {
                const wallCabs = placedCabinets.filter(c => c.wallId === wall.id)
                return wallCabs.map(cab => {
                  const widthPx = cabWidthPx(cab.widthIn)
                  const rect = getCabRect(wall, cab.pos, widthPx)
                  const isSelected = selectedCabId === cab.id
                  const typeInfo = CABINET_TYPES.find(t => t.code === cab.typeCode)
                  const fill = typeInfo?.color || '#c9a97b'

                  return (
                    <Group key={cab.id}>
                      <Rect
                        x={rect.x} y={rect.y} width={rect.w} height={rect.h}
                        fill={fill}
                        stroke={isSelected ? '#7c3f00' : '#a08060'}
                        strokeWidth={isSelected ? 2 : 1}
                        cornerRadius={2}
                        draggable
                        dragBoundFunc={(pos) => {
                          if (wall.axis === 'h') {
                            const minX = wall.cabX
                            const maxX = wall.cabX + wall.maxLen - rect.w
                            return { x: Math.max(minX, Math.min(pos.x, maxX)), y: rect.y }
                          } else {
                            const minY = wall.cabY
                            const maxY = wall.cabY + wall.maxLen - rect.h
                            return { x: rect.x, y: Math.max(minY, Math.min(pos.y, maxY)) }
                          }
                        }}
                        onDragEnd={(e) => {
                          const newPos = wall.axis === 'h'
                            ? e.target.x() - wall.cabX
                            : e.target.y() - wall.cabY
                          const updated = placedCabinets.map(c =>
                            c.id === cab.id ? { ...c, pos: Math.max(0, newPos) } : c
                          )
                          // Re-pack to avoid overlaps
                          const wallCabsSorted = updated
                            .filter(c => c.wallId === wall.id)
                            .sort((a, b) => a.pos - b.pos)
                          let packPos = 0
                          const packed = wallCabsSorted.map(c => {
                            const r = { ...c, pos: packPos }
                            packPos += cabWidthPx(c.widthIn)
                            return r
                          })
                          onCabinetsChange([
                            ...updated.filter(c => c.wallId !== wall.id),
                            ...packed,
                          ])
                          e.target.position({ x: rect.x, y: rect.y }) // reset shape pos (state handles it)
                        }}
                        onClick={() => setSelectedCabId(isSelected ? null : cab.id)}
                      />
                      {/* Cabinet label */}
                      {rect.w > 28 && rect.h > 16 && (
                        <Text
                          x={rect.x + 3} y={rect.y + rect.h / 2 - 8}
                          text={`${cab.widthIn}"`}
                          fontSize={9} fill="#5c3d1a" fontStyle="bold"
                          listening={false}
                        />
                      )}
                      {/* Delete button for selected cabinet */}
                      {isSelected && (
                        <Group x={rect.x + rect.w - 14} y={rect.y - 14}>
                          <Rect width={14} height={14} fill="#ef4444" cornerRadius={3}
                            onClick={() => deleteCabinet(cab.id)}
                          />
                          <Text text="×" x={3} y={1} fontSize={11} fill="white" fontStyle="bold"
                            listening={false}
                          />
                        </Group>
                      )}
                    </Group>
                  )
                })
              })}

              {/* Empty state */}
              {wallDefs.length === 0 && (
                <Text
                  x={STAGE_W / 2 - 100} y={STAGE_H / 2 - 10}
                  text="Select a layout to see your floor plan"
                  fontSize={13} fill="#a09585"
                />
              )}
            </Layer>
          </Stage>

          <div className="mt-2 flex items-center gap-3 text-xs text-stone-400">
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-sm bg-amber-700/60"/>
              Base cabinet
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-sm bg-amber-400/60"/>
              Wall cabinet
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-sm bg-teal-600/40"/>
              Sink base
            </span>
            <span className="ml-auto">Click a cabinet to select · drag to rearrange · × to remove</span>
          </div>
        </div>
      </div>
    </div>
  )
}
