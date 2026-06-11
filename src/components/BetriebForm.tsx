import { useRef, useState } from 'react'
import LeftyTueteSrc from '../../leftytüte.svg'
import type { Betrieb } from '../config/betriebe'
import { sendAngebotToTelegram, sendTextToTelegram } from '../lib/telegram'
import AngebotTypeSelector, { LEFTY_PRICES, type AngebotType } from './AngebotTypeSelector'
import StepperInput, { QuantityPicker } from './StepperInput'
import Success from './Success'
import WizardShell from './WizardShell'

interface BetriebFormProps {
  betrieb: Betrieb
}

interface BoxItem {
  id: string
  name: string
  price: number
  count: number
}

type LeftyStep = 'photo' | 'add-item' | 'overview' | 'time'

interface BoxState {
  id: string
  angebotType: AngebotType | null
  step: LeftyStep
  items: BoxItem[]
  draftName: string
  draftPrice: string
  draftCount: number
  abholzeit: string
  foto: File | null
  fotoPreview: string | null
  submitted: boolean
  loading: boolean
  error: string | null
}

function createEmptyBox(): BoxState {
  return {
    id: crypto.randomUUID(),
    angebotType: null,
    step: 'overview',
    items: [],
    draftName: '',
    draftPrice: '',
    draftCount: 1,
    abholzeit: '',
    foto: null,
    fotoPreview: null,
    submitted: false,
    loading: false,
    error: null,
  }
}

function parsePrice(value: string): number {
  return parseFloat(value.replace(',', '.'))
}

function formatPrice(num: number): string {
  return num % 1 === 0 ? String(num) : num.toFixed(2).replace('.', ',')
}

function boxTotalPrice(items: BoxItem[]): number {
  return items.reduce((sum, i) => sum + i.price * i.count, 0)
}

function autoDetectBoxType(verkaufspreis: number): AngebotType {
  if (verkaufspreis >= LEFTY_PRICES['L']) return 'L'
  if (verkaufspreis >= LEFTY_PRICES['M']) return 'M'
  if (verkaufspreis >= LEFTY_PRICES['S']) return 'S'
  return 'Mini'
}

function buildTelegramCaption(
  size: AngebotType,
  items: BoxItem[],
  abholzeit: string,
  betrieb: Betrieb,
): string {
  const warenwert = boxTotalPrice(items)
  const verkaufspreis = Math.round(warenwert * 0.3 * 100) / 100
  const itemLines = items
    .map((i) => {
      const qty = i.count > 1 ? `${i.count}× ` : ''
      return `• ${qty}${i.name} (${formatPrice(i.price * i.count)} €)`
    })
    .join('\n')

  return [
    `📦 ${betrieb.code} – ${betrieb.name}`,
    `🛍️ Lefty ${size}`,
    ``,
    itemLines,
    ``,
    `💰 ${formatPrice(verkaufspreis)} €  (statt ${formatPrice(warenwert)} €)`,
    `🕕 Abholung: bis ${abholzeit} Uhr`,
    `📍 ${betrieb.adresse}`,
    ``,
    `➡️ Interesse? Schreib mir: „${betrieb.code} – Lefty ${size}"`,
    `⚡️ First come, first served`,
  ].join('\n')
}

const MAX_VERKAUFSPREIS = 10

const DARK_BOX = { backgroundColor: '#222222', color: '#F5A200' } as const

const INPUT_CLS =
  'w-full rounded-2xl px-4 py-4 text-lg font-bold placeholder:font-medium placeholder:opacity-40 focus:outline-none'

const TIME_CLS =
  'w-full rounded-2xl px-4 py-4 text-center text-2xl font-black focus:outline-none [color-scheme:dark]'

// ─── Lefty Nav ────────────────────────────────────────────────────────────────

interface LeftyNavProps {
  boxes: BoxState[]
  activeId: string
  open: boolean
  onToggle: () => void
  onSwitchBox: (id: string) => void
  onDeleteBox: (id: string) => void
  onReset: () => void
}

function LeftyNav({ boxes, activeId, open, onToggle, onSwitchBox, onDeleteBox, onReset }: LeftyNavProps) {
  const visibleBoxes = boxes.filter(b => b.angebotType !== null)
  if (visibleBoxes.length === 0) return null

  const pendingCount = visibleBoxes.filter(b => !b.submitted).length

  return (
    <>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}</style>

      {/* Floating button */}
      <button
        type="button"
        onClick={onToggle}
        aria-label="Box-Übersicht öffnen"
        className="fixed top-[14px] right-5 z-40 flex items-center justify-center"
      >
        <div className="relative">
          <img src={LeftyTueteSrc} alt="Lefty" className="h-[30px] w-auto" />
          {pendingCount > 0 && (
            <span
              className="absolute -top-1.5 -right-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-0.5 text-[10px] font-black"
              style={{ backgroundColor: '#222222', color: '#F5A200' }}
            >
              {pendingCount}
            </span>
          )}
        </div>
      </button>

      {/* Backdrop + panel */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]"
            onClick={onToggle}
          />
          <div
            className="fixed right-0 top-0 z-50 flex h-full w-72 max-w-[85vw] flex-col bg-[#F5A200]"
            style={{ animation: 'slideInRight 0.22s ease-out both', boxShadow: '-8px 0 32px rgba(0,0,0,0.25)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-cheapr-dark/10">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-cheapr-dark/40">Meine Boxes</p>
                <h3 className="mt-0.5 text-lg font-black text-cheapr-dark">Lefty-Übersicht</h3>
              </div>
              <button
                type="button"
                onClick={onToggle}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-cheapr-dark/10 text-cheapr-dark/50 hover:bg-cheapr-dark/20"
                aria-label="Schließen"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Box list */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {boxes.map((box, i) => {
                if (box.angebotType === null) return null
                const warenwert = boxTotalPrice(box.items)
                const vp = Math.round(warenwert * 0.3 * 100) / 100
                const isActive = box.id === activeId

                return (
                  <div key={box.id} className="space-y-1">
                    <button
                      type="button"
                      onClick={() => !box.submitted && onSwitchBox(box.id)}
                      disabled={box.submitted}
                      className={`w-full text-left rounded-2xl p-4 transition-all active:scale-[0.98] ${
                        isActive ? 'ring-2 ring-cheapr-dark/25' : ''
                      } ${box.submitted ? 'opacity-50 cursor-default' : 'hover:opacity-90'}`}
                      style={DARK_BOX}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold opacity-40">Box {i + 1}</span>
                        {box.submitted
                          ? <span className="text-[10px] font-black text-green-400">✓ Gesendet</span>
                          : isActive
                            ? <span className="block h-2.5 w-2.5 rounded-full bg-green-400" />
                            : null}
                      </div>
                      <p className="text-sm font-black">Lefty {box.angebotType}</p>
                      {box.items.length > 0 ? (
                        <div className="mt-1.5 space-y-0.5">
                          {box.items.slice(0, 3).map(item => (
                            <p key={item.id} className="text-[11px] font-medium opacity-50 truncate">
                              {item.count > 1 ? `${item.count}× ` : ''}{item.name}
                            </p>
                          ))}
                          {box.items.length > 3 && (
                            <p className="text-[10px] opacity-30">+{box.items.length - 3} weitere</p>
                          )}
                          <p className="mt-2 text-sm font-black">{formatPrice(vp)} €</p>
                        </div>
                      ) : (
                        <p className="mt-1 text-[11px] font-medium opacity-40">Noch leer</p>
                      )}
                    </button>
                    {!box.submitted && (
                      <button
                        type="button"
                        onClick={() => onDeleteBox(box.id)}
                        aria-label={`Box ${i + 1} löschen`}
                        className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-[11px] font-bold text-cheapr-dark/30 transition-all hover:bg-cheapr-dark/10 hover:text-cheapr-dark/50 active:scale-[0.98]"
                      >
                        <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                          <path d="M2 3.5h10M5.5 3.5V2.5h3v1M6 6v4.5M8 6v4.5M3 3.5l.7 8h6.6l.7-8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Löschen
                      </button>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Footer — Neustart */}
            <div className="px-4 pb-5 pt-3 border-t border-cheapr-dark/10">
              <button
                type="button"
                onClick={onReset}
                className="flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black text-cheapr-dark/50 transition-all hover:bg-cheapr-dark/10 active:scale-[0.98]"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7a5 5 0 1 0 1.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 3.5V7h3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Neustart
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function BetriebForm({ betrieb }: BetriebFormProps) {
  // Stable initial state — lazy init ensures one box + matching ID
  const [{ initBoxes, initActiveId }] = useState(() => {
    const firstBox = createEmptyBox()
    return { initBoxes: [firstBox] as BoxState[], initActiveId: firstBox.id }
  })

  const [boxes, setBoxes] = useState<BoxState[]>(initBoxes)
  const [activeId, setActiveId] = useState(initActiveId)
  const [navOpen, setNavOpen] = useState(false)
  const [globalSuccess, setGlobalSuccess] = useState(false)
  const [sheetMounted, setSheetMounted] = useState(false)
  const [sheetVisible, setSheetVisible] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const openAddSheet = () => {
    updateBox(activeId, { error: null })
    setSheetMounted(true)
    requestAnimationFrame(() => requestAnimationFrame(() => setSheetVisible(true)))
  }

  const closeAddSheet = () => {
    setSheetVisible(false)
    setTimeout(() => setSheetMounted(false), 320)
  }

  const updateBox = (id: string, updates: Partial<BoxState>) => {
    setBoxes(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b))
  }

  const getActive = (): BoxState | undefined => boxes.find(b => b.id === activeId)

  const addNewBox = () => {
    const newBox: BoxState = { ...createEmptyBox(), angebotType: 'Mini', step: 'overview' }
    setBoxes(prev => [...prev, newBox])
    setActiveId(newBox.id)
    setNavOpen(false)
  }

  const resetAll = () => {
    const freshBox = createEmptyBox()
    setBoxes([freshBox])
    setActiveId(freshBox.id)
    setGlobalSuccess(false)
    setNavOpen(false)
  }

  const deleteBox = (id: string) => {
    const remaining = boxes.filter(b => b.id !== id)
    if (remaining.length === 0) {
      resetAll()
      return
    }
    setBoxes(remaining)
    if (activeId === id) setActiveId(remaining[remaining.length - 1].id)
    setNavOpen(false)
  }

  const submitActiveBox = async () => {
    const box = getActive()
    if (!box || !box.angebotType) return
    if (!box.abholzeit) { updateBox(activeId, { error: 'Bitte eine Abholzeit angeben.' }); return }

    updateBox(activeId, { error: null, loading: true })

    try {
      const caption = buildTelegramCaption(box.angebotType, box.items, box.abholzeit, betrieb)
      if (box.foto) {
        await sendAngebotToTelegram(box.foto, caption)
      } else {
        await sendTextToTelegram(caption)
      }

      const newBoxes = boxes.map(b =>
        b.id === activeId ? { ...b, submitted: true, loading: false } : b
      )
      setBoxes(newBoxes)

      const nextPending = newBoxes.find(
        b => b.id !== activeId && !b.submitted && b.items.length > 0
      )
      if (nextPending) {
        setActiveId(nextPending.id)
      } else {
        setGlobalSuccess(true)
      }
    } catch (err) {
      updateBox(activeId, {
        loading: false,
        error: err instanceof Error ? err.message : 'Unbekannter Fehler beim Absenden.',
      })
    }
  }

  const addBoxItem = (): boolean => {
    const box = getActive()
    if (!box) return false
    const price = parsePrice(box.draftPrice)
    if (!box.draftName.trim()) { updateBox(activeId, { error: 'Bitte einen Namen eingeben.' }); return false }
    if (isNaN(price) || price <= 0) { updateBox(activeId, { error: 'Bitte einen gültigen Preis eingeben.' }); return false }

    const newItem = { id: crypto.randomUUID(), name: box.draftName.trim(), price, count: box.draftCount }
    const candidateItems = [...box.items, newItem]
    const candidateWarenwert = boxTotalPrice(candidateItems)
    const candidateVp = Math.round(candidateWarenwert * 0.3 * 100) / 100

    // Auto-split: wenn Verkaufspreis > Max → neues Item in neue Box packen
    if (candidateVp > MAX_VERKAUFSPREIS && box.items.length > 0) {
      const currentVp = Math.round(boxTotalPrice(box.items) * 0.3 * 100) / 100
      const overflowVp = Math.round(newItem.price * newItem.count * 0.3 * 100) / 100
      const overflowBox: BoxState = {
        ...createEmptyBox(),
        items: [newItem],
        angebotType: autoDetectBoxType(overflowVp),
        step: 'overview',
      }
      setBoxes(prev => [
        ...prev.map(b => b.id === activeId
          ? { ...b, angebotType: autoDetectBoxType(currentVp), draftName: '', draftPrice: '', draftCount: 1, error: `"${newItem.name}" wurde in eine neue Box verschoben (max. ${MAX_VERKAUFSPREIS} €)`, step: 'overview' as LeftyStep }
          : b
        ),
        overflowBox,
      ])
      setActiveId(overflowBox.id)
      return true
    }

    updateBox(activeId, {
      items: candidateItems,
      angebotType: autoDetectBoxType(candidateVp),
      draftName: '',
      draftPrice: '',
      draftCount: 1,
      error: null,
      step: 'overview',
    })
    return true
  }

  // ─── Global success ───────────────────────────────────────────────────────

  if (globalSuccess) {
    const lastSubmitted = [...boxes].reverse().find(b => b.submitted) ?? boxes[0]
    const warenwert = boxTotalPrice(lastSubmitted.items)
    const vp = Math.round(warenwert * 0.3 * 100) / 100
    return (
      <>
        <Success
          onNeuesAngebot={resetAll}
          items={lastSubmitted.items}
          angebotType={lastSubmitted.angebotType ?? 'S'}
          verkaufspreis={vp}
        />
        <LeftyNav
          boxes={boxes}
          activeId={activeId}
          open={navOpen}
          onToggle={() => setNavOpen(v => !v)}
          onSwitchBox={(id) => { setActiveId(id); setGlobalSuccess(false); setNavOpen(false) }}
          onDeleteBox={deleteBox}
          onReset={resetAll}
        />
      </>
    )
  }

  // ─── Active box ───────────────────────────────────────────────────────────

  const active = getActive()
  if (!active) return null

  const betriebBadge = {
    betriebCode: betrieb.code,
    betriebName: betrieb.name,
    betriebBild: betrieb.bild,
    betriebSubtitle: active.angebotType ? `Lefty ${active.angebotType}` : undefined,
  }

  const errorBanner = active.error ? (
    <div className="mb-4 rounded-xl bg-red-500/20 px-4 py-2.5 text-center text-xs font-bold text-red-300">
      {active.error}
    </div>
  ) : null

  // ─── SELECTOR ─────────────────────────────────────────────────────────────

  if (!active.angebotType) {
    return (
      <>
        <AngebotTypeSelector
          onSelect={(type) => updateBox(activeId, { angebotType: type, step: 'overview' })}
          betriebCode={betrieb.code}
          betriebName={betrieb.name}
          betriebBild={betrieb.bild}
        />
        {boxes.some(b => b.angebotType !== null) && (
          <LeftyNav
            boxes={boxes}
            activeId={activeId}
            open={navOpen}
            onToggle={() => setNavOpen(v => !v)}
            onSwitchBox={(id) => { setActiveId(id); setNavOpen(false) }}
            onDeleteBox={deleteBox}
            onReset={resetAll}
          />
        )}
      </>
    )
  }

  // ─── PHOTO (kept for future) ───────────────────────────────────────────────

  if (active.step === 'photo') return (
    <>
      <WizardShell
        {...betriebBadge}
        currentStep={1}
        totalSteps={3}
        title="Foto machen"
        hint="Knips ein Bild der übrigen Sachen"
        onBack={() => updateBox(activeId, { angebotType: null })}
        onNext={() => {
          if (!active.foto) { updateBox(activeId, { error: 'Bitte ein Foto hochladen.' }); return }
          updateBox(activeId, { error: null, step: 'add-item' })
        }}
      >
        {errorBanner}
        <PhotoPicker
          fotoPreview={active.fotoPreview}
          onClick={() => fileInputRef.current?.click()}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null
            if (active.fotoPreview) URL.revokeObjectURL(active.fotoPreview)
            updateBox(activeId, {
              foto: file,
              fotoPreview: file ? URL.createObjectURL(file) : null,
            })
          }}
        />
      </WizardShell>
      <LeftyNav
        boxes={boxes}
        activeId={activeId}
        open={navOpen}
        onToggle={() => setNavOpen(v => !v)}
        onSwitchBox={(id) => { setActiveId(id); setNavOpen(false) }}
        onDeleteBox={deleteBox}
        onReset={resetAll}
      />
    </>
  )

  // ─── ADD ITEM ─────────────────────────────────────────────────────────────

  if (active.step === 'add-item') return (
    <>
      <WizardShell
        {...betriebBadge}
        currentStep={1}
        totalSteps={2}
        title="Was ist drin?"
        onBack={() => updateBox(activeId, { error: null, draftName: '', draftPrice: '', draftCount: 1, step: 'overview' })}
        onNext={addBoxItem}
        nextLabel="Hinzufügen"
      >
        {errorBanner}
        <div className="space-y-3">
          <input
            type="text"
            autoFocus
            value={active.draftName}
            onChange={(e) => updateBox(activeId, { draftName: e.target.value, error: null })}
            placeholder="Name (z.B. Croissant)"
            style={DARK_BOX}
            className={INPUT_CLS}
          />
          <StepperInput
            value={active.draftPrice}
            onChange={(v) => updateBox(activeId, { draftPrice: v, error: null })}
            step={0.5}
            min={0.5}
            placeholder="Warenwert (z.B. 2)"
          />
          <QuantityPicker
            value={active.draftCount}
            onChange={(n) => updateBox(activeId, { draftCount: n, error: null })}
          />
        </div>
      </WizardShell>
      <LeftyNav
        boxes={boxes}
        activeId={activeId}
        open={navOpen}
        onToggle={() => setNavOpen(v => !v)}
        onSwitchBox={(id) => { setActiveId(id); setNavOpen(false) }}
        onDeleteBox={deleteBox}
        onReset={resetAll}
      />
    </>
  )

  // ─── OVERVIEW ─────────────────────────────────────────────────────────────

  if (active.step === 'overview') {
    const warenwert = boxTotalPrice(active.items)
    const ersparnis = Math.round(warenwert * 0.7 * 100) / 100
    const verkaufspreis = Math.round(warenwert * 0.3 * 100) / 100

    return (
      <>
        <WizardShell
          {...betriebBadge}
          currentStep={1}
          totalSteps={2}
          title={active.items.length === 0 ? 'Lefty' : `Lefty ${active.angebotType}`}
          titleNote={
            active.angebotType && active.angebotType !== 'Mini' && LEFTY_PRICES[active.angebotType] > 0
              ? `~ ${formatPrice(LEFTY_PRICES[active.angebotType])} €`
              : undefined
          }
          hint={
            active.items.length > 0
              ? `${active.items.length} Artikel`
              : 'Füge Artikel mit dem Button oben hinzu'
          }
          onBack={
            active.items.length > 0
              ? () => updateBox(activeId, { step: 'add-item' })
              : () => updateBox(activeId, { angebotType: null })
          }
          onNext={() => updateBox(activeId, { step: 'time' })}
          showNext={false}
          extraAction={
            <div className="flex items-center justify-between gap-3">
              {/* Neue Box — gleiche Quadrat-Größe wie Fortfahren */}
              <button
                type="button"
                onClick={addNewBox}
                aria-label="Neue Box anlegen"
                className="relative flex aspect-square h-[72px] w-[72px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-2xl border-2 border-cheapr-dark transition-all hover:opacity-90 active:scale-[0.97]"
                style={{ backgroundColor: '#F5A200' }}
              >
                <img src={LeftyTueteSrc} alt="Lefty" className="h-7 w-auto" />
                <span className="text-[8px] font-bold leading-tight text-cheapr-dark/70 text-center px-0.5">
                  Weiteres Lefty
                </span>
                <span
                  className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full text-sm font-black leading-none"
                  style={{ backgroundColor: '#222222', color: '#F5A200' }}
                >+</span>
              </button>

              {/* Fortfahren — gleiche Quadrat-Größe */}
              <button
                type="button"
                onClick={() => updateBox(activeId, { step: 'time' })}
                disabled={active.items.length === 0}
                style={{ backgroundColor: '#222222', color: '#F5A200' }}
                className={`flex aspect-square h-[72px] w-[72px] shrink-0 items-center justify-center rounded-2xl transition-all hover:opacity-90 active:scale-[0.97] ${active.items.length === 0 ? 'opacity-25' : ''}`}
              >
                <svg width="22" height="22" viewBox="0 0 14 14" fill="none">
                  <path d="M5 2.5L9.5 7L5 11.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          }
        >
          {errorBanner}

          {active.items.length === 0 ? (
            <div className="space-y-1.5">
              {/* Add item — above empty state */}
              <button
                type="button"
                onClick={openAddSheet}
                aria-label="Artikel hinzufügen"
                className="flex w-full items-center justify-center rounded-2xl bg-cheapr-dark/10 py-3.5 transition-all hover:bg-cheapr-dark/15 active:scale-[0.98]"
              >
                <span className="text-xl font-black text-cheapr-dark/50">+</span>
              </button>
              <div style={DARK_BOX} className="flex items-center justify-center rounded-2xl py-8">
                <p className="text-sm font-medium opacity-60">Noch keine Artikel</p>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <ul className="space-y-1.5">
                {active.items.map((item) => (
                  <li key={item.id} className="flex items-center gap-2 rounded-2xl bg-cheapr-dark/10">
                    <button
                      type="button"
                      onClick={() => {
                        const newItems = active.items.map(x =>
                          x.id === item.id ? { ...x, count: x.count + 1 } : x
                        )
                        const warenwert2 = boxTotalPrice(newItems)
                        const vp2 = Math.round(warenwert2 * 0.3 * 100) / 100
                        updateBox(activeId, {
                          items: newItems,
                          angebotType: autoDetectBoxType(vp2),
                        })
                      }}
                      aria-label={`${item.name} hinzufügen`}
                      className="flex flex-1 items-center gap-3 px-4 py-3 text-left active:opacity-70"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black text-cheapr-dark opacity-40">
                        {item.count}×
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-cheapr-dark">{item.name}</p>
                      </div>
                      <span className="shrink-0 text-xs font-black text-cheapr-dark opacity-60">
                        {formatPrice(item.price * item.count)} €
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const newItems = active.items
                          .map(x => x.id === item.id ? { ...x, count: x.count - 1 } : x)
                          .filter(x => x.count > 0)
                        const warenwert2 = boxTotalPrice(newItems)
                        const vp2 = Math.round(warenwert2 * 0.3 * 100) / 100
                        updateBox(activeId, {
                          items: newItems,
                          angebotType: newItems.length > 0 ? autoDetectBoxType(vp2) : active.angebotType,
                        })
                      }}
                      aria-label={`${item.name} entfernen`}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full mr-2 text-base font-black text-cheapr-dark opacity-30 transition-opacity hover:opacity-70 active:opacity-90"
                    >
                      −
                    </button>
                  </li>
                ))}
              </ul>

              {/* Add item — article style, centered, directly below list */}
              <button
                type="button"
                onClick={openAddSheet}
                aria-label="Artikel hinzufügen"
                className="flex w-full items-center justify-center rounded-2xl bg-cheapr-dark/10 py-3.5 transition-all hover:bg-cheapr-dark/15 active:scale-[0.98]"
              >
                <span className="text-xl font-black text-cheapr-dark/50">+</span>
              </button>

              <div style={DARK_BOX} className="rounded-2xl px-4 py-4 space-y-2.5 mt-1">
                <div className="flex justify-between text-sm font-bold opacity-50">
                  <span>Warenwert</span>
                  <span>{formatPrice(warenwert)} €</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-orange-400">
                  <span>Rabatt</span>
                  <span>–{formatPrice(ersparnis)} €</span>
                </div>
                <div className="h-px" style={{ backgroundColor: 'rgba(245,162,0,0.2)' }} />
                <div className="flex justify-between">
                  <span className="text-base font-black">Verkaufspreis</span>
                  <span className="text-base font-black">{formatPrice(verkaufspreis)} €</span>
                </div>
              </div>
            </div>
          )}
        </WizardShell>

        <LeftyNav
          boxes={boxes}
          activeId={activeId}
          open={navOpen}
          onToggle={() => setNavOpen(v => !v)}
          onSwitchBox={(id) => { setActiveId(id); setNavOpen(false) }}
          onDeleteBox={deleteBox}
          onReset={resetAll}
        />

        {/* ── Add-item bottom sheet ──────────────────────────────────── */}
        {sheetMounted && (
          <>
            {/* Backdrop */}
            <div
              className={`fixed inset-0 z-50 backdrop-blur-sm transition-opacity duration-300 ${sheetVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
              onClick={closeAddSheet}
            />

            {/* Sheet — full width on mobile, narrower centered on desktop */}
            <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center pointer-events-none">
              <div
                className={`pointer-events-auto w-full max-w-md md:max-w-sm rounded-t-3xl px-5 pb-8 pt-3 transition-transform duration-300 ease-out ${sheetVisible ? 'translate-y-0' : 'translate-y-full'}`}
                style={{ backgroundColor: '#F5A200', boxShadow: '0 -8px 40px rgba(0,0,0,0.2)' }}
              >
              {/* drag handle */}
              <div className="mx-auto mb-5 h-1 w-12 rounded-full bg-cheapr-dark/20" />

              <h3 className="mb-4 text-xl font-black text-cheapr-dark">Was kommt rein?</h3>

              {/* inline error */}
              {active.error && (
                <div className="mb-3 rounded-xl bg-red-500/20 px-4 py-2.5 text-center text-xs font-bold text-red-700">
                  {active.error}
                </div>
              )}

              <div className="space-y-3">
                <input
                  type="text"
                  autoFocus
                  value={active.draftName}
                  onChange={(e) => updateBox(activeId, { draftName: e.target.value, error: null })}
                  placeholder="Name (z.B. Croissant)"
                  style={DARK_BOX}
                  className={INPUT_CLS}
                />
                <StepperInput
                  value={active.draftPrice}
                  onChange={(v) => updateBox(activeId, { draftPrice: v, error: null })}
                  step={0.5}
                  min={0.5}
                  placeholder="Warenwert (z.B. 2)"
                />
                <QuantityPicker
                  value={active.draftCount}
                  onChange={(n) => updateBox(activeId, { draftCount: n, error: null })}
                />
              </div>

              <button
                type="button"
                onClick={() => { if (addBoxItem()) closeAddSheet() }}
                style={{ backgroundColor: '#222222', color: '#F5A200' }}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-[15px] font-black tracking-wide transition-all hover:opacity-90 active:scale-[0.98]"
              >
                Hinzufügen
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 2.5V11.5M2.5 7H11.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
              </button>
              </div>
            </div>
          </>
        )}
      </>
    )
  }

  // ─── TIME ─────────────────────────────────────────────────────────────────

  return (
    <>
      <WizardShell
        {...betriebBadge}
        currentStep={2}
        totalSteps={2}
        title="Bis wann abholbar?"
        onBack={() => updateBox(activeId, { step: 'overview' })}
        onNext={() => {
          if (!active.abholzeit) { updateBox(activeId, { error: 'Bitte eine Abholzeit angeben.' }); return }
          updateBox(activeId, { error: null })
          submitActiveBox()
        }}
        nextLabel={active.loading ? 'Wird gesendet…' : 'Absenden'}
        nextDisabled={active.loading}
      >
        {errorBanner}
        <input
          type="time"
          value={active.abholzeit}
          onChange={(e) => updateBox(activeId, { abholzeit: e.target.value, error: null })}
          style={DARK_BOX}
          className={TIME_CLS}
        />
      </WizardShell>

      <LeftyNav
        boxes={boxes}
        activeId={activeId}
        open={navOpen}
        onToggle={() => setNavOpen(v => !v)}
        onSwitchBox={(id) => { setActiveId(id); setNavOpen(false) }}
        onDeleteBox={deleteBox}
        onReset={resetAll}
      />
    </>
  )
}

function PhotoPicker({ fotoPreview, onClick }: { fotoPreview: string | null; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={DARK_BOX}
      className="flex min-h-40 w-full flex-col items-center justify-center overflow-hidden rounded-2xl transition-all hover:opacity-90 active:scale-[0.98]"
    >
      {fotoPreview ? (
        <img src={fotoPreview} alt="Vorschau" className="h-full max-h-60 w-full rounded-2xl object-cover" />
      ) : (
        <>
          <span className="text-3xl opacity-50">📷</span>
          <span className="mt-2 text-xs font-semibold opacity-40">Tippe zum Fotografieren</span>
        </>
      )}
    </button>
  )
}
