import { useRef, useState } from 'react'
import type { Betrieb } from '../config/betriebe'
import { sendAngebotToTelegram } from '../lib/telegram'
import AngebotTypeSelector, { LEFTY_PRICES, type AngebotType } from './AngebotTypeSelector'
import StepperInput, { OUTLINE_DARK, QuantityPicker } from './StepperInput'
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

function parsePrice(value: string): number {
  return parseFloat(value.replace(',', '.'))
}

function formatPrice(num: number): string {
  return num % 1 === 0 ? String(num) : num.toFixed(2).replace('.', ',')
}

function boxTotalPrice(items: BoxItem[]): number {
  return items.reduce((sum, i) => sum + i.price * i.count, 0)
}

function calcFestpreis(size: AngebotType, verkaufspreis: number): number {
  return size === 'Mini' ? Math.min(verkaufspreis, 3) : LEFTY_PRICES[size]
}

function buildTelegramCaption(
  size: AngebotType,
  items: BoxItem[],
  abholzeit: string,
  betrieb: Betrieb,
): string {
  const warenwert = boxTotalPrice(items)
  const verkaufspreis = Math.round(warenwert * 0.3 * 100) / 100
  const festpreis = calcFestpreis(size, verkaufspreis)
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
    `💰 ${formatPrice(festpreis)} €  (statt ${formatPrice(warenwert)} €)`,
    `🕕 Abholung: bis ${abholzeit} Uhr`,
    `📍 ${betrieb.adresse}`,
    ``,
    `➡️ Interesse? Schreib mir: „${betrieb.code} – Lefty ${size}"`,
    `⚡️ First come, first served`,
  ].join('\n')
}

const DARK_BOX = { backgroundColor: '#222222', color: '#F5A200' } as const

const INPUT_CLS =
  'w-full rounded-2xl px-4 py-4 text-lg font-bold placeholder:font-medium placeholder:opacity-40 focus:outline-none'

const TIME_CLS =
  'w-full rounded-2xl px-4 py-4 text-center text-2xl font-black focus:outline-none [color-scheme:dark]'

export default function BetriebForm({ betrieb }: BetriebFormProps) {
  const [angebotType, setAngebotType] = useState<AngebotType | null>(null)
  const [step, setStep] = useState<LeftyStep>('photo')

  const [abholzeit, setAbholzeit] = useState('')
  const [foto, setFoto] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)

  const [boxItems, setBoxItems] = useState<BoxItem[]>([])
  const [draftName, setDraftName] = useState('')
  const [draftPrice, setDraftPrice] = useState('')
  const [draftCount, setDraftCount] = useState(1)

  const [showUnderfillPopup, setShowUnderfillPopup] = useState(false)
  const [showOverfillPopup, setShowOverfillPopup] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetForm = () => {
    setAngebotType(null)
    setStep('photo')
    setAbholzeit('')
    setFoto(null)
    setFotoPreview(null)
    setBoxItems([])
    setDraftName('')
    setDraftPrice('')
    setDraftCount(1)
    setShowUnderfillPopup(false)
    setShowOverfillPopup(false)
    setError(null)
    setSuccess(false)
    setLoading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFotoChange = (file: File | null) => {
    setFoto(file)
    if (fotoPreview) URL.revokeObjectURL(fotoPreview)
    setFotoPreview(file ? URL.createObjectURL(file) : null)
  }

  const submitAngebot = async () => {
    if (!foto) { setError('Bitte ein Foto hochladen.'); return }
    if (!abholzeit) { setError('Bitte eine Abholzeit angeben.'); return }
    if (!angebotType) return

    setError(null)
    setLoading(true)

    try {
      const caption = buildTelegramCaption(angebotType, boxItems, abholzeit, betrieb)
      await sendAngebotToTelegram(foto, caption)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler beim Absenden.')
    } finally {
      setLoading(false)
    }
  }

  const addBoxItem = () => {
    const price = parsePrice(draftPrice)
    if (!draftName.trim()) { setError('Bitte einen Namen eingeben.'); return }
    if (isNaN(price) || price <= 0) { setError('Bitte einen gültigen Preis eingeben.'); return }
    setError(null)
    setBoxItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: draftName.trim(), price, count: draftCount },
    ])
    setDraftName('')
    setDraftPrice('')
    setDraftCount(1)
    setStep('overview')
  }

  if (success) {
    return <Success onNeuesAngebot={resetForm} />
  }

  const LEFTY_ORDER: AngebotType[] = ['Mini', 'S', 'M', 'L']

  if (!angebotType) {
    return (
      <AngebotTypeSelector
        onSelect={(type) => { setAngebotType(type); setStep('photo') }}
        betriebCode={betrieb.code}
        betriebName={betrieb.name}
        betriebBild={betrieb.bild}
      />
    )
  }

  const betriebBadge = {
    betriebCode: betrieb.code,
    betriebName: betrieb.name,
    betriebBild: betrieb.bild,
    betriebSubtitle: `Lefty ${angebotType}`,
  }

  const errorBanner = error ? (
    <div className="mb-4 rounded-xl bg-red-500/20 px-4 py-2.5 text-center text-xs font-bold text-red-300">
      {error}
    </div>
  ) : null

  // ─── PHOTO ────────────────────────────────────────────────

  if (step === 'photo') return (
    <WizardShell
      {...betriebBadge}
      stepCount="1 / 3"
      stepName="Foto"
      currentStep={1}
      totalSteps={3}
      title="Foto machen"
      hint="Knips ein Bild der übrigen Sachen"
      onBack={() => setAngebotType(null)}
      onNext={() => {
        if (!foto) { setError('Bitte ein Foto hochladen.'); return }
        setError(null); setStep('add-item')
      }}
    >
      {errorBanner}
      <PhotoPicker fotoPreview={fotoPreview} onClick={() => fileInputRef.current?.click()} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFotoChange(e.target.files?.[0] ?? null)}
      />
    </WizardShell>
  )

  // ─── ADD ITEM ─────────────────────────────────────────────

  if (step === 'add-item') return (
    <WizardShell
      {...betriebBadge}
      stepCount="2 / 3"
      stepName="Artikel"
      currentStep={2}
      totalSteps={3}
      title="Was ist drin?"
      onBack={() => {
        setError(null)
        setDraftName('')
        setDraftPrice('')
        setDraftCount(1)
        setStep(boxItems.length > 0 ? 'overview' : 'photo')
      }}
      onNext={addBoxItem}
      nextLabel="Hinzufügen"
    >
      {errorBanner}
      <div className="space-y-3">
        <input
          type="text"
          autoFocus
          value={draftName}
          onChange={(e) => { setDraftName(e.target.value); setError(null) }}
          placeholder="Name (z.B. Croissant)"
          style={DARK_BOX}
          className={INPUT_CLS}
        />
        <StepperInput
          value={draftPrice}
          onChange={(v) => { setDraftPrice(v); setError(null) }}
          step={0.5} min={0.5} suffix="€" placeholder="0"
        />
        <QuantityPicker
          value={draftCount}
          onChange={(n) => { setDraftCount(n); setError(null) }}
        />
      </div>
    </WizardShell>
  )

  // ─── OVERVIEW / DASHBOARD ─────────────────────────────────

  if (step === 'overview') {
    const warenwert = boxTotalPrice(boxItems)
    const ersparnis = Math.round(warenwert * 0.7 * 100) / 100
    const verkaufspreis = Math.round(warenwert * 0.3 * 100) / 100
    const festpreis = calcFestpreis(angebotType, verkaufspreis)
    const underfilled = angebotType !== 'Mini' && boxItems.length > 0 && verkaufspreis < festpreis
    const nextBoxType = LEFTY_ORDER[LEFTY_ORDER.indexOf(angebotType) + 1] as AngebotType | undefined
    const prevBoxType = LEFTY_ORDER[LEFTY_ORDER.indexOf(angebotType) - 1] as AngebotType | undefined
    const overfilled = !!nextBoxType && verkaufspreis >= LEFTY_PRICES[nextBoxType]

    const handleProceed = () => {
      if (underfilled) { setShowUnderfillPopup(true); return }
      if (overfilled) { setShowOverfillPopup(true); return }
      setStep('time')
    }

    return (
      <div className="relative min-h-dvh">
        <WizardShell
          {...betriebBadge}
          stepCount="2 / 3"
          stepName="Übersicht"
          currentStep={2}
          totalSteps={3}
          title={`Lefty ${angebotType}`}
          titleNote={angebotType === 'Mini' ? '(bis 3 €)' : `(mind. ${festpreis} €)`}
          hint={
            boxItems.length > 0
              ? `${boxItems.length} Artikel`
              : 'Füge Artikel mit dem Button unten hinzu'
          }
          onBack={() => setStep('photo')}
          onNext={handleProceed}
          nextLabel="Weiter"
          nextDisabled={boxItems.length === 0}
          extraAction={
            <button
              type="button"
              onClick={() => { setError(null); setStep('add-item') }}
              style={OUTLINE_DARK}
              className="flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-[15px] font-black transition-all hover:bg-[#222222] hover:text-[#F5A200] active:scale-[0.98]"
            >
              <span className="text-lg leading-none">+</span>
              Nächstes Item
            </button>
          }
        >
          {errorBanner}

          {boxItems.length === 0 ? (
            <div style={DARK_BOX} className="flex items-center justify-center rounded-2xl py-8">
              <p className="text-sm font-medium opacity-60">Noch keine Artikel</p>
            </div>
          ) : (
            <div className="space-y-2 mb-4">
              <ul className="space-y-1.5">
                {boxItems.map((item, i) => (
                  <li key={item.id} className="flex items-center gap-2 rounded-2xl bg-cheapr-dark/10">
                    {/* Tappable main area → +1 */}
                    <button
                      type="button"
                      onClick={() => setBoxItems((p) => p.map((x) => x.id === item.id ? { ...x, count: x.count + 1 } : x))}
                      aria-label={`${item.name} hinzufügen`}
                      className="flex flex-1 items-center gap-3 px-4 py-3 text-left active:opacity-70"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black text-cheapr-dark opacity-40">
                        {item.count}×
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-cheapr-dark">
                          {item.name}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs font-black text-cheapr-dark opacity-60">
                        {formatPrice(item.price * item.count)} €
                      </span>
                    </button>
                    {/* Minus → decrement / remove at 0 */}
                    <button
                      type="button"
                      onClick={() => setBoxItems((p) => {
                        const updated = p.map((x) => x.id === item.id ? { ...x, count: x.count - 1 } : x)
                        return updated.filter((x) => x.count > 0)
                      })}
                      aria-label={`${item.name} entfernen`}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full mr-2 text-base font-black text-cheapr-dark opacity-30 transition-opacity hover:opacity-70 active:opacity-90"
                    >
                      −
                    </button>
                  </li>
                ))}
              </ul>

              {/* Dashboard */}
              <div style={DARK_BOX} className="rounded-2xl px-4 py-4 space-y-2.5 mt-2">
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

        {/* Underfill popup */}
        {showUnderfillPopup && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-5"
            onClick={() => setShowUnderfillPopup(false)}
          >
            <div
              style={{ backgroundColor: '#222222', color: '#F5A200' }}
              className="w-full max-w-sm rounded-3xl p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-xl font-black leading-snug mb-1">Box zu leer ⚠️</p>
              <p className="text-sm font-medium opacity-60 mb-1">
                Der Verkaufspreis <strong className="opacity-100">{formatPrice(verkaufspreis)} €</strong> liegt unter dem Lefty-Festpreis von{' '}
                <strong className="opacity-100">{festpreis} €</strong>.
              </p>
              <p className="text-[11px] font-medium opacity-40 mb-6">
                Füge mehr Artikel hinzu oder wähle eine kleinere Box.
              </p>
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => { setShowUnderfillPopup(false); setStep('add-item') }}
                  className="flex w-full items-center justify-center rounded-2xl px-5 py-3.5 text-[15px] font-black transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{ backgroundColor: '#F5A200', color: '#222222' }}
                >
                  + Weiteren Artikel hinzufügen
                </button>
                {prevBoxType && (
                  <button
                    type="button"
                    onClick={() => {
                      setAngebotType(prevBoxType)
                      setShowUnderfillPopup(false)
                    }}
                    className="flex w-full items-center justify-center rounded-2xl px-5 py-3.5 text-[15px] font-black transition-all hover:opacity-80 active:scale-[0.98]"
                    style={{ border: '2px solid rgba(245,162,0,0.4)' }}
                  >
                    Zu Lefty {prevBoxType} wechseln
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Overfill popup */}
        {showOverfillPopup && nextBoxType && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-5"
            onClick={() => setShowOverfillPopup(false)}
          >
            <div
              style={{ backgroundColor: '#222222', color: '#F5A200' }}
              className="w-full max-w-sm rounded-3xl p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-xl font-black leading-snug mb-1">Upgrade möglich 🚀</p>
              <p className="text-sm font-medium opacity-60 mb-1">
                Dein Warenwert reicht bereits für eine <strong className="opacity-100">Lefty {nextBoxType}</strong>.
              </p>
              <p className="text-[11px] font-medium opacity-40 mb-6">
                Upgrade auf die größere Box – oder biete diese Box günstiger für Kunden an.
              </p>
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setAngebotType(nextBoxType)
                    setShowOverfillPopup(false)
                  }}
                  className="flex w-full items-center justify-center rounded-2xl px-5 py-3.5 text-[15px] font-black transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{ backgroundColor: '#F5A200', color: '#222222' }}
                >
                  Zu Lefty {nextBoxType} upgraden
                </button>
                <button
                  type="button"
                  onClick={() => { setShowOverfillPopup(false); setStep('time') }}
                  className="flex w-full items-center justify-center rounded-2xl px-5 py-3.5 text-[15px] font-black transition-all hover:opacity-80 active:scale-[0.98]"
                  style={{ border: '2px solid rgba(245,162,0,0.4)' }}
                >
                  Günstiger anbieten mit Lefty {angebotType}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ─── TIME ─────────────────────────────────────────────────

  return (
    <WizardShell
      {...betriebBadge}
      stepCount="3 / 3"
      stepName="Abholzeit"
      currentStep={3}
      totalSteps={3}
      title="Bis wann abholbar?"
      onBack={() => setStep('overview')}
      onNext={() => {
        if (!abholzeit) { setError('Bitte eine Abholzeit angeben.'); return }
        setError(null)
        submitAngebot()
      }}
      nextLabel={loading ? 'Wird gesendet…' : 'Absenden'}
      nextDisabled={loading}
    >
      {errorBanner}
      <input
        type="time"
        value={abholzeit}
        onChange={(e) => { setAbholzeit(e.target.value); setError(null) }}
        style={DARK_BOX}
        className={TIME_CLS}
      />
    </WizardShell>
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
