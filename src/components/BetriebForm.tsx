import { useRef, useState, type ReactNode } from 'react'
import LeftyTueteSrc from '../../leftytüte.svg'
import type { Betrieb } from '../config/betriebe'
import { sendAngebotToTelegram, sendTextToTelegram } from '../lib/telegram'
import AngebotTypeSelector, { LEFTY_PRICES, type AngebotType } from './AngebotTypeSelector'
import BetriebBadge from './BetriebBadge'
import StepperInput, { QuantityPicker } from './StepperInput'
import Success, { type SubmittedLefty } from './Success'
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

type LeftyStep = 'photo' | 'add-item' | 'overview' | 'time' | 'confirm'

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
  const numStr = num % 1 === 0 ? String(num) : num.toFixed(2).replace('.', ',')
  return `${numStr} €`
}

function getSessionBoxes(boxes: BoxState[]): BoxState[] {
  return boxes.filter(b => b.angebotType && !b.submitted)
}

function AnimatedCollapse({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <div
      className="grid transition-[grid-template-rows] duration-300 ease-out"
      style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
    >
      <div className="overflow-hidden">{children}</div>
    </div>
  )
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
      return `• ${qty}${i.name} (${formatPrice(i.price * i.count)})`
    })
    .join('\n')

  return [
    `📦 ${betrieb.code} – ${betrieb.name}`,
    `🛍️ Lefty ${size}`,
    ``,
    itemLines,
    ``,
    `💰 ${formatPrice(verkaufspreis)}  (statt ${formatPrice(warenwert)})`,
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

const SWIPE_DELETE_THRESHOLD = 100
const SWIPE_MAX = 120

function TrashIcon({ className = '' }: { className?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 14 14" fill="none" className={className}>
      <path d="M2 3.5h10M5.5 3.5V2.5h3v1M6 6v4.5M8 6v4.5M3 3.5l.7 8h6.6l.7-8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
      <rect x="4.5" y="4.5" width="7" height="8" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3 9.5V3.5a1.2 1.2 0 0 1 1.2-1.2H9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function InsertIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
      <path d="M4 2.5h6v2H4zM3 4.5h8a1 1 0 0 1 1 1v6.5H2V5.5a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M7 7v3M5.5 8.5H8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

const ACTION_BTN_CLS =
  'flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-[11px] font-bold opacity-50 transition-all hover:opacity-80 active:scale-[0.98]'

function LeftyEmptySummary({ onInsert }: { onInsert?: () => void }) {
  return (
    <div style={DARK_BOX} className="mt-1 space-y-2.5 rounded-2xl px-4 py-6">
      <p className="text-center text-sm font-medium opacity-60">Noch keine Artikel</p>
      {onInsert && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onInsert() }}
          className={ACTION_BTN_CLS}
          style={{ backgroundColor: 'rgba(245,162,0,0.15)' }}
        >
          <InsertIcon />
          Lefty einfügen
        </button>
      )}
    </div>
  )
}

function LeftyInsertPicker({
  targetId,
  sessionBoxes,
  visible,
  onSelect,
  onClose,
}: {
  targetId: string
  sessionBoxes: BoxState[]
  visible: boolean
  onSelect: (sourceId: string) => void
  onClose: () => void
}) {
  const sources = sessionBoxes.filter(
    b => b.id !== targetId && b.items.length > 0
  )

  return (
    <>
      <div
        className={`fixed inset-0 z-[60] backdrop-blur-sm transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
        onClick={onClose}
      />
      <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center p-5">
        <div
          className={`pointer-events-auto w-full max-w-[280px] rounded-2xl px-4 py-4 transition-all duration-300 ease-out ${visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
          style={{ backgroundColor: '#F5A200', boxShadow: '0 12px 40px rgba(0,0,0,0.25)' }}
        >
          <h3 className="text-base font-black text-cheapr-dark">Lefty einfügen</h3>
          <p className="mt-0.5 text-[11px] font-medium text-cheapr-dark/45">
            Wähle einen offenen Lefty
          </p>

          <div className="mt-3 max-h-56 space-y-2 overflow-y-auto">
            {sources.length === 0 ? (
              <p className="rounded-xl bg-cheapr-dark/5 px-3 py-4 text-center text-xs font-medium text-cheapr-dark/40">
                Keine Leftys mit Inhalt verfügbar
              </p>
            ) : (
              sources.map((box) => {
                const idx = sessionBoxes.findIndex(b => b.id === box.id) + 1
                const vp = Math.round(boxTotalPrice(box.items) * 0.3 * 100) / 100
                return (
                  <button
                    key={box.id}
                    type="button"
                    onClick={() => onSelect(box.id)}
                    className="w-full rounded-xl px-3 py-2.5 text-left transition-all hover:opacity-90 active:scale-[0.98]"
                    style={DARK_BOX}
                  >
                    <p className="text-[9px] font-bold uppercase tracking-wider opacity-40">
                      {idx}. Lefty
                    </p>
                    <p className="mt-0.5 text-xs font-black">
                      Lefty {box.angebotType} · {box.items.length} Artikel
                    </p>
                    <p className="mt-0.5 text-[10px] font-medium opacity-50">
                      {formatPrice(vp)}
                    </p>
                    <div className="mt-1.5 space-y-0.5">
                      {box.items.slice(0, 2).map(item => (
                        <p key={item.id} className="truncate text-[10px] font-medium opacity-40">
                          {item.count > 1 ? `${item.count}× ` : ''}{item.name}
                        </p>
                      ))}
                      {box.items.length > 2 && (
                        <p className="text-[9px] font-medium opacity-30">
                          +{box.items.length - 2} weitere
                        </p>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function LeftyPriceSummary({
  warenwert,
  ersparnis,
  verkaufspreis,
  onCopy,
}: {
  warenwert: number
  ersparnis: number
  verkaufspreis: number
  onCopy?: () => void
}) {
  return (
    <div style={DARK_BOX} className="mt-1 space-y-2.5 rounded-2xl px-4 py-4">
      <div className="flex justify-between text-sm font-bold opacity-50">
        <span>Warenwert</span>
        <span>{formatPrice(warenwert)}</span>
      </div>
      <div className="flex justify-between text-sm font-bold text-orange-400">
        <span>Rabatt</span>
        <span>–{formatPrice(ersparnis)}</span>
      </div>
      <div className="h-px" style={{ backgroundColor: 'rgba(245,162,0,0.2)' }} />
      <div className="flex justify-between">
        <span className="text-base font-black">Verkaufspreis</span>
        <span className="text-base font-black">{formatPrice(verkaufspreis)}</span>
      </div>
      {onCopy && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onCopy() }}
          className={ACTION_BTN_CLS}
          style={{ backgroundColor: 'rgba(245,162,0,0.15)' }}
        >
          <CopyIcon />
          Kopieren
        </button>
      )}
    </div>
  )
}

function SwipeToDelete({
  onDelete,
  children,
  disabled,
  innerRef,
}: {
  onDelete: () => void
  children: ReactNode
  disabled?: boolean
  innerRef?: (el: HTMLDivElement | null) => void
}) {
  const [offset, setOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const startX = useRef(0)
  const startY = useRef(0)
  const startOffset = useRef(0)
  const isHorizontal = useRef(false)

  const reset = () => setOffset(0)

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return
    setIsDragging(true)
    isHorizontal.current = false
    startX.current = e.clientX
    startY.current = e.clientY
    startOffset.current = offset
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return
    const dx = startX.current - e.clientX
    const dy = Math.abs(startY.current - e.clientY)

    if (!isHorizontal.current && (Math.abs(dx) > 8 || dy > 8)) {
      isHorizontal.current = Math.abs(dx) > dy
    }
    if (!isHorizontal.current) return

    e.preventDefault()
    const next = Math.max(0, Math.min(SWIPE_MAX, startOffset.current + dx))
    setOffset(next)
  }

  const finishDrag = (e: React.PointerEvent) => {
    if (!isDragging) return
    setIsDragging(false)
    e.currentTarget.releasePointerCapture(e.pointerId)

    if (isHorizontal.current && offset >= SWIPE_DELETE_THRESHOLD) {
      onDelete()
    }
    reset()
  }

  return (
    <div ref={innerRef} className="relative scroll-mt-24 overflow-hidden rounded-2xl">
      <div className="absolute inset-0 flex items-center justify-end bg-red-500 px-6" aria-hidden>
        <TrashIcon className="text-white" />
      </div>
      <div
        className={`relative ${isDragging ? '' : 'transition-transform duration-200 ease-out'}`}
        style={{ transform: `translateX(-${offset}px)`, touchAction: 'pan-y' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={() => { setIsDragging(false); reset() }}
      >
        {children}
      </div>
    </div>
  )
}

// ─── Lefty Dropdown Section (Multi-Modus) ─────────────────────────────────────

interface LeftyDropdownSectionProps {
  box: BoxState
  index: number
  isActive: boolean
  expanded: boolean
  onToggle: () => void
  onAdd: () => void
  onCopy: () => void
  onInsert: () => void
  updateBox: (id: string, updates: Partial<BoxState>) => void
}

function LeftyDropdownSection({
  box,
  index,
  isActive,
  expanded,
  onToggle,
  onAdd,
  onCopy,
  onInsert,
  updateBox,
}: LeftyDropdownSectionProps) {
  const warenwert = boxTotalPrice(box.items)
  const ersparnis = Math.round(warenwert * 0.7 * 100) / 100
  const verkaufspreis = Math.round(warenwert * 0.3 * 100) / 100

  return (
    <div
      id={`lefty-section-${box.id}`}
      className={`overflow-hidden rounded-2xl border-2 bg-[#F5A200] transition-colors ${
        isActive ? 'border-cheapr-dark' : 'border-cheapr-dark/20'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between bg-cheapr-dark/5 px-4 py-4 text-left transition-colors hover:bg-cheapr-dark/10 active:scale-[0.99]"
      >
        <div>
          <p className="text-lg font-black text-cheapr-dark">{index}. Lefty</p>
          <p className="mt-0.5 text-xs font-medium text-cheapr-dark/45">
            {box.items.length > 0
              ? `${box.items.length} Artikel · ${formatPrice(verkaufspreis)}`
              : 'Noch leer'}
          </p>
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 14 14"
          fill="none"
          className={`shrink-0 text-cheapr-dark/40 transition-transform duration-300 ease-out ${expanded ? 'rotate-180' : ''}`}
        >
          <path d="M2.5 5L7 9.5L11.5 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <AnimatedCollapse open={expanded}>
        <div className="space-y-1.5 border-t border-cheapr-dark/10 px-4 py-4">
          {box.items.length === 0 ? (
            <>
              <button
                type="button"
                onClick={onAdd}
                aria-label="Artikel hinzufügen"
                className="flex w-full items-center justify-center rounded-2xl bg-cheapr-dark/10 py-3.5 transition-all hover:bg-cheapr-dark/15 active:scale-[0.98]"
              >
                <span className="text-xl font-black text-cheapr-dark/50">+</span>
              </button>
              <LeftyEmptySummary onInsert={onInsert} />
            </>
          ) : (
            <>
              <ul className="space-y-1.5">
                {box.items.map((item) => (
                  <li key={item.id} className="flex items-center gap-2 rounded-2xl bg-cheapr-dark/10">
                    <button
                      type="button"
                      onClick={() => {
                        const newItems = box.items.map(x =>
                          x.id === item.id ? { ...x, count: x.count + 1 } : x
                        )
                        const vp2 = Math.round(boxTotalPrice(newItems) * 0.3 * 100) / 100
                        updateBox(box.id, { items: newItems, angebotType: autoDetectBoxType(vp2) })
                      }}
                      className="flex flex-1 items-center gap-3 px-4 py-3 text-left active:opacity-70"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black text-cheapr-dark opacity-40">
                        {item.count}×
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-cheapr-dark">{item.name}</p>
                      </div>
                      <span className="shrink-0 text-xs font-black text-cheapr-dark opacity-60">
                        {formatPrice(item.price * item.count)}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const newItems = box.items
                          .map(x => x.id === item.id ? { ...x, count: x.count - 1 } : x)
                          .filter(x => x.count > 0)
                        const vp2 = Math.round(boxTotalPrice(newItems) * 0.3 * 100) / 100
                        updateBox(box.id, {
                          items: newItems,
                          angebotType: newItems.length > 0 ? autoDetectBoxType(vp2) : box.angebotType,
                        })
                      }}
                      className="mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base font-black text-cheapr-dark opacity-30 hover:opacity-70"
                    >
                      −
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={onAdd}
                className="flex w-full items-center justify-center rounded-2xl bg-cheapr-dark/10 py-3.5 transition-all hover:bg-cheapr-dark/15 active:scale-[0.98]"
              >
                <span className="text-xl font-black text-cheapr-dark/50">+</span>
              </button>
              <LeftyPriceSummary
                warenwert={warenwert}
                ersparnis={ersparnis}
                verkaufspreis={verkaufspreis}
                onCopy={onCopy}
              />
            </>
          )}
        </div>
      </AnimatedCollapse>
    </div>
  )
}

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
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
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
                        <span className="text-[10px] font-bold opacity-40">{i + 1}. Lefty</span>
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
                          <p className="mt-2 text-sm font-black">{formatPrice(vp)}</p>
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
  const [insertPickerTargetId, setInsertPickerTargetId] = useState<string | null>(null)
  const [insertPickerMounted, setInsertPickerMounted] = useState(false)
  const [insertPickerVisible, setInsertPickerVisible] = useState(false)
  const [expandedBoxIds, setExpandedBoxIds] = useState<Set<string>>(new Set())
  const [selectedSubmitIds, setSelectedSubmitIds] = useState<Set<string>>(new Set())
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const boxSectionRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const openAddSheet = (boxId?: string) => {
    const id = boxId ?? activeId
    setActiveId(id)
    updateBox(id, { error: null })
    setSheetMounted(true)
    requestAnimationFrame(() => requestAnimationFrame(() => setSheetVisible(true)))
  }

  const closeAddSheet = () => {
    setSheetVisible(false)
    setTimeout(() => setSheetMounted(false), 320)
  }

  const openInsertPicker = (boxId: string) => {
    setInsertPickerTargetId(boxId)
    setInsertPickerMounted(true)
    requestAnimationFrame(() => requestAnimationFrame(() => setInsertPickerVisible(true)))
  }

  const closeInsertPicker = () => {
    setInsertPickerVisible(false)
    setTimeout(() => {
      setInsertPickerMounted(false)
      setInsertPickerTargetId(null)
    }, 320)
  }

  const importIntoBox = (targetId: string, sourceId: string) => {
    const source = boxes.find(b => b.id === sourceId)
    if (!source?.angebotType || source.items.length === 0 || targetId === sourceId) return

    const items = source.items.map(item => ({ ...item, id: crypto.randomUUID() }))
    const vp = Math.round(boxTotalPrice(items) * 0.3 * 100) / 100

    updateBox(targetId, {
      items,
      angebotType: autoDetectBoxType(vp),
      abholzeit: source.abholzeit,
      error: null,
    })
    setActiveId(targetId)
    setExpandedBoxIds(prev => new Set(prev).add(targetId))
    closeInsertPicker()
  }

  const renderInsertPicker = () => {
    if (!insertPickerMounted || !insertPickerTargetId) return null
    return (
      <LeftyInsertPicker
        targetId={insertPickerTargetId}
        sessionBoxes={getSessionBoxes(boxes)}
        visible={insertPickerVisible}
        onSelect={(sourceId) => importIntoBox(insertPickerTargetId, sourceId)}
        onClose={closeInsertPicker}
      />
    )
  }

  const updateBox = (id: string, updates: Partial<BoxState>) => {
    setBoxes(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b))
  }

  const getActive = (): BoxState | undefined => boxes.find(b => b.id === activeId)

  const startLeftys = (type: AngebotType, count: number) => {
    const n = Math.max(1, Math.min(10, count))
    if (n === 1) {
      updateBox(activeId, { angebotType: type, step: 'overview' })
      return
    }
    const newBoxes = Array.from({ length: n }, () => ({
      ...createEmptyBox(),
      angebotType: type,
      step: 'overview' as LeftyStep,
    }))
    setBoxes(newBoxes)
    setActiveId(newBoxes[0].id)
    setExpandedBoxIds(new Set())
  }

  const goToSessionOverview = () => {
    setBoxes(prev => prev.map(b =>
      b.angebotType && !b.submitted
        ? { ...b, step: 'overview' as LeftyStep, error: null }
        : b
    ))
    setSubmitError(null)
  }

  const isMultiSession = () => getSessionBoxes(boxes).length > 1

  const switchToBox = (id: string) => {
    setGlobalSuccess(false)
    setActiveId(id)
    setNavOpen(false)

    if (isMultiSession()) {
      goToSessionOverview()
    }

    setExpandedBoxIds(prev => new Set(prev).add(id))
    requestAnimationFrame(() => {
      boxSectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

  const toggleBoxExpanded = (id: string) => {
    setActiveId(id)
    setExpandedBoxIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

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
    setExpandedBoxIds(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    setNavOpen(false)
  }

  const copyBox = (id: string) => {
    const source = boxes.find(b => b.id === id)
    if (!source?.angebotType) return

    const copied: BoxState = {
      ...createEmptyBox(),
      angebotType: source.angebotType,
      step: 'overview',
      items: source.items.map(item => ({ ...item, id: crypto.randomUUID() })),
      abholzeit: source.abholzeit,
      foto: source.foto,
      fotoPreview: source.fotoPreview,
    }

    setBoxes(prev => {
      const idx = prev.findIndex(b => b.id === id)
      const next = [...prev]
      next.splice(idx + 1, 0, copied)
      return next
    })
    setActiveId(copied.id)
    setExpandedBoxIds(prev => new Set(prev).add(copied.id))
    setNavOpen(false)
    requestAnimationFrame(() => {
      boxSectionRefs.current[copied.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
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

  const goToConfirm = () => {
    const box = getActive()
    if (!box?.abholzeit) {
      updateBox(activeId, { error: 'Bitte eine Abholzeit angeben.' })
      return
    }
    const time = box.abholzeit
    const eligible = boxes.filter(b => b.angebotType && !b.submitted && b.items.length > 0)
    const eligibleIds = eligible.map(b => b.id)

    setBoxes(prev => prev.map(b =>
      eligibleIds.includes(b.id)
        ? { ...b, abholzeit: time, step: 'confirm' as LeftyStep, error: null }
        : b
    ))
    setSelectedSubmitIds(new Set(eligibleIds))
    setSubmitError(null)
    if (eligibleIds.length > 0) setActiveId(eligibleIds[0])
  }

  const toggleSubmitSelection = (id: string) => {
    setSelectedSubmitIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setSubmitError(null)
  }

  const submitSelectedBoxes = async () => {
    if (selectedSubmitIds.size === 0) {
      setSubmitError('Bitte mindestens ein Lefty auswählen.')
      return
    }
    setSubmitError(null)
    setIsSubmitting(true)

    try {
      let latestBoxes = [...boxes]
      for (const id of selectedSubmitIds) {
        const box = latestBoxes.find(b => b.id === id)
        if (!box?.angebotType || !box.abholzeit) continue

        const caption = buildTelegramCaption(box.angebotType, box.items, box.abholzeit, betrieb)
        if (box.foto) {
          await sendAngebotToTelegram(box.foto, caption)
        } else {
          await sendTextToTelegram(caption)
        }
        latestBoxes = latestBoxes.map(b =>
          b.id === id ? { ...b, submitted: true, loading: false } : b
        )
      }
      setBoxes(latestBoxes)
      setGlobalSuccess(true)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unbekannter Fehler beim Absenden.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ─── Global success ───────────────────────────────────────────────────────

  if (globalSuccess) {
    const submittedLeftys: SubmittedLefty[] = boxes
      .filter(b => b.submitted && b.angebotType && b.items.length > 0)
      .map(b => ({
        id: b.id,
        items: b.items,
        angebotType: b.angebotType!,
        verkaufspreis: Math.round(boxTotalPrice(b.items) * 0.3 * 100) / 100,
        abholzeit: b.abholzeit || undefined,
      }))

    return (
      <>
        <Success
          onNeuesAngebot={resetAll}
          leftys={submittedLeftys}
        />
        <LeftyNav
          boxes={boxes}
          activeId={activeId}
          open={navOpen}
          onToggle={() => setNavOpen(v => !v)}
          onSwitchBox={switchToBox}
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
          onSelect={startLeftys}
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
            onSwitchBox={switchToBox}
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
        onSwitchBox={switchToBox}
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
        <div className="space-y-5">
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
            placeholder="Warenwert (z.B. 2€)"
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
        onSwitchBox={switchToBox}
        onDeleteBox={deleteBox}
        onReset={resetAll}
      />
    </>
  )

  // ─── OVERVIEW ─────────────────────────────────────────────────────────────

  if (active.step === 'overview') {
    const sessionBoxes = getSessionBoxes(boxes)
    const isMultiLefty = sessionBoxes.length > 1
    const warenwert = boxTotalPrice(active.items)
    const ersparnis = Math.round(warenwert * 0.7 * 100) / 100
    const verkaufspreis = Math.round(warenwert * 0.3 * 100) / 100

    // ── Multi-Lefty: gestapelte Dropdown-Sections ──
    if (isMultiLefty) {
      return (
        <>
          <div className="flex min-h-dvh flex-col bg-[#F5A200]">
            <div className="flex items-center justify-between px-5 pb-1 pt-4">
              <button
                type="button"
                onClick={() => updateBox(activeId, { angebotType: null })}
                aria-label="Zurück"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-cheapr-dark/10 text-cheapr-dark/50 transition-colors hover:bg-cheapr-dark/15"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M9 11.5L4.5 7L9 2.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <BetriebBadge
                label={`${betrieb.code} · ${betrieb.name}`}
                image={betrieb.bild}
                imageAlt={betrieb.name}
              />
              <div className="h-9 w-9" />
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 pb-36">
              <h2 className="text-[1.75rem] font-black leading-tight text-cheapr-dark">Deine Leftys</h2>
              <p className="mt-1 text-sm font-medium text-cheapr-dark/50">
                {sessionBoxes.length} Leftys · Tippe zum Aufklappen
              </p>

              {active.error && (
                <div className="mb-4 mt-4 rounded-xl bg-red-500/20 px-4 py-2.5 text-center text-xs font-bold text-red-700">
                  {active.error}
                </div>
              )}

              <div className="mt-5 space-y-5">
                {sessionBoxes.map((box, i) => (
                  <SwipeToDelete
                    key={box.id}
                    onDelete={() => deleteBox(box.id)}
                    innerRef={(el) => { boxSectionRefs.current[box.id] = el }}
                  >
                    <LeftyDropdownSection
                      box={box}
                      index={i + 1}
                      isActive={box.id === activeId}
                      expanded={expandedBoxIds.has(box.id)}
                      onToggle={() => toggleBoxExpanded(box.id)}
                      onAdd={() => openAddSheet(box.id)}
                      onCopy={() => copyBox(box.id)}
                      onInsert={() => openInsertPicker(box.id)}
                      updateBox={updateBox}
                    />
                  </SwipeToDelete>
                ))}
              </div>
            </div>

            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-cheapr-dark/10 bg-[#F5A200] px-5 pb-5 pt-3">
              <div className="mx-auto flex max-w-md items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={addNewBox}
                  aria-label="Neue Box anlegen"
                  className="relative flex aspect-square h-[72px] w-[72px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-2xl border-2 border-cheapr-dark transition-all hover:opacity-90 active:scale-[0.97]"
                  style={{ backgroundColor: '#F5A200' }}
                >
                  <img src={LeftyTueteSrc} alt="Lefty" className="h-7 w-auto" />
                  <span className="px-0.5 text-center text-[8px] font-bold leading-tight text-cheapr-dark/70">
                    Neue Lefty
                  </span>
                  <span
                    className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full text-sm font-black leading-none"
                    style={{ backgroundColor: '#222222', color: '#F5A200' }}
                  >+</span>
                </button>
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
            </div>
          </div>

          <LeftyNav
            boxes={boxes}
            activeId={activeId}
            open={navOpen}
            onToggle={() => setNavOpen(v => !v)}
            onSwitchBox={switchToBox}
            onDeleteBox={deleteBox}
            onReset={resetAll}
          />

          {sheetMounted && (
            <>
              <div
                className={`fixed inset-0 z-50 backdrop-blur-sm transition-opacity duration-300 ${sheetVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
                onClick={closeAddSheet}
              />
              <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center">
                <div
                  className={`pointer-events-auto w-full max-w-md rounded-t-3xl px-5 pb-8 pt-3 transition-transform duration-300 ease-out md:max-w-sm ${sheetVisible ? 'translate-y-0' : 'translate-y-full'}`}
                  style={{ backgroundColor: '#F5A200', boxShadow: '0 -8px 40px rgba(0,0,0,0.2)' }}
                >
                  <div className="mx-auto mb-5 h-1 w-12 rounded-full bg-cheapr-dark/20" />
                  <h3 className="mb-4 text-xl font-black text-cheapr-dark">Was kommt rein?</h3>
                  {active.error && (
                    <div className="mb-3 rounded-xl bg-red-500/20 px-4 py-2.5 text-center text-xs font-bold text-red-700">
                      {active.error}
                    </div>
                  )}
                  <div className="space-y-5">
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
                      placeholder="Warenwert (z.B. 2€)"
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
          {renderInsertPicker()}
        </>
      )
    }

    // ── Single-Lefty: WizardShell ──
    return (
      <>
        <WizardShell
          {...betriebBadge}
          currentStep={1}
          totalSteps={3}
          title={active.items.length === 0 ? 'Lefty' : `Lefty ${active.angebotType}`}
          titleNote={
            active.angebotType && active.angebotType !== 'Mini' && LEFTY_PRICES[active.angebotType] > 0
              ? `~ ${formatPrice(LEFTY_PRICES[active.angebotType])}`
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
                onClick={() => openAddSheet()}
                aria-label="Artikel hinzufügen"
                className="flex w-full items-center justify-center rounded-2xl bg-cheapr-dark/10 py-3.5 transition-all hover:bg-cheapr-dark/15 active:scale-[0.98]"
              >
                <span className="text-xl font-black text-cheapr-dark/50">+</span>
              </button>
              <LeftyEmptySummary onInsert={() => openInsertPicker(activeId)} />
            </div>
          ) : (
            <SwipeToDelete onDelete={() => deleteBox(activeId)}>
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
                        {formatPrice(item.price * item.count)}
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
                onClick={() => openAddSheet()}
                aria-label="Artikel hinzufügen"
                className="flex w-full items-center justify-center rounded-2xl bg-cheapr-dark/10 py-3.5 transition-all hover:bg-cheapr-dark/15 active:scale-[0.98]"
              >
                <span className="text-xl font-black text-cheapr-dark/50">+</span>
              </button>

              <LeftyPriceSummary
                warenwert={warenwert}
                ersparnis={ersparnis}
                verkaufspreis={verkaufspreis}
                onCopy={() => copyBox(activeId)}
              />
            </div>
            </SwipeToDelete>
          )}
        </WizardShell>

        <LeftyNav
          boxes={boxes}
          activeId={activeId}
          open={navOpen}
          onToggle={() => setNavOpen(v => !v)}
          onSwitchBox={switchToBox}
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

              <div className="space-y-5">
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
                  placeholder="Warenwert (z.B. 2€)"
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
        {renderInsertPicker()}
      </>
    )
  }

  // ─── CONFIRM ──────────────────────────────────────────────────────────────

  if (active.step === 'confirm') {
    const confirmBoxes = boxes.filter(
      b => b.step === 'confirm' && b.angebotType && !b.submitted && b.items.length > 0
    )

    return (
      <>
        <WizardShell
          {...betriebBadge}
          currentStep={3}
          totalSteps={3}
          title="Welche willst du abschicken?"
          hint="Einfach antippen zum Auswählen"
          onBack={() => (isMultiSession() ? goToSessionOverview() : updateBox(activeId, { step: 'time' }))}
          onNext={submitSelectedBoxes}
          nextLabel={isSubmitting ? 'Wird gesendet…' : 'Absenden'}
          nextDisabled={isSubmitting || selectedSubmitIds.size === 0}
        >
          {submitError && (
            <div className="mb-4 rounded-xl bg-red-500/20 px-4 py-2.5 text-center text-xs font-bold text-red-700">
              {submitError}
            </div>
          )}

          <div className="space-y-5">
            {confirmBoxes.map((box, i) => {
              const vp = Math.round(boxTotalPrice(box.items) * 0.3 * 100) / 100
              const selected = selectedSubmitIds.has(box.id)

              return (
                <button
                  key={box.id}
                  type="button"
                  onClick={() => toggleSubmitSelection(box.id)}
                  className={`w-full rounded-2xl p-4 text-left transition-all active:scale-[0.98] ${
                    selected
                      ? 'ring-2 ring-cheapr-dark shadow-md'
                      : 'ring-1 ring-cheapr-dark/15 opacity-70 hover:opacity-90'
                  }`}
                  style={selected ? DARK_BOX : { backgroundColor: 'rgba(34,34,34,0.08)', color: '#222222' }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${selected ? 'opacity-40' : 'opacity-30'}`}>
                        {i + 1}. Lefty
                      </p>
                      <p className="mt-0.5 text-base font-black">
                        {box.items.length === 0 ? 'Lefty' : `Lefty ${box.angebotType}`}
                      </p>
                    </div>
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                        selected
                          ? 'border-[#F5A200] bg-[#F5A200]'
                          : 'border-cheapr-dark/25 bg-transparent'
                      }`}
                    >
                      {selected && (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6.5L4.5 9L10 3" stroke="#222222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 space-y-1">
                    {box.items.slice(0, 3).map(item => (
                      <p key={item.id} className={`truncate text-xs font-medium ${selected ? 'opacity-55' : 'opacity-45'}`}>
                        {item.count > 1 ? `${item.count}× ` : ''}{item.name}
                      </p>
                    ))}
                    {box.items.length > 3 && (
                      <p className={`text-[10px] font-medium ${selected ? 'opacity-35' : 'opacity-30'}`}>
                        +{box.items.length - 3} weitere
                      </p>
                    )}
                  </div>

                  <div className={`mt-3 flex items-center justify-between border-t pt-3 ${selected ? 'border-[#F5A200]/20' : 'border-cheapr-dark/10'}`}>
                    <span className={`text-xs font-bold ${selected ? 'opacity-50' : 'opacity-40'}`}>
                      bis {box.abholzeit} Uhr
                    </span>
                    <span className="text-base font-black">{formatPrice(vp)}</span>
                  </div>
                </button>
              )
            })}
          </div>

          {selectedSubmitIds.size > 0 && (
            <p className="mt-4 text-center text-xs font-bold text-cheapr-dark/40">
              {selectedSubmitIds.size} von {confirmBoxes.length} ausgewählt
            </p>
          )}
        </WizardShell>

        <LeftyNav
          boxes={boxes}
          activeId={activeId}
          open={navOpen}
          onToggle={() => setNavOpen(v => !v)}
          onSwitchBox={switchToBox}
          onDeleteBox={deleteBox}
          onReset={resetAll}
        />
      </>
    )
  }

  // ─── TIME ─────────────────────────────────────────────────────────────────

  return (
    <>
      <WizardShell
        {...betriebBadge}
        currentStep={2}
        totalSteps={3}
        title="Bis wann abholbar?"
        onBack={() => (isMultiSession() ? goToSessionOverview() : updateBox(activeId, { step: 'overview' }))}
        onNext={() => {
          if (!active.abholzeit) { updateBox(activeId, { error: 'Bitte eine Abholzeit angeben.' }); return }
          updateBox(activeId, { error: null })
          goToConfirm()
        }}
        nextLabel="Weiter"
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
        onSwitchBox={switchToBox}
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
