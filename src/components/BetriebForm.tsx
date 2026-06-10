import { useRef, useState } from 'react'
import type { Betrieb } from '../config/betriebe'
import { fileToBase64, generatePost } from '../lib/openai'
import { sendAngebotToTelegram } from '../lib/telegram'
import AngebotTypeSelector, { type AngebotType } from './AngebotTypeSelector'
import StepperInput, { OUTLINE_DARK, QuantityPicker, StepperInteger } from './StepperInput'
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

type ItemStep = 'name' | 'price' | 'photo' | 'time' | 'quantity'
type BoxStep = 'overview' | 'add-item' | 'photo' | 'time' | 'quantity'

const ITEM_TOTAL = 5
const BOX_TOTAL = 4

function parsePrice(value: string): number {
  return parseFloat(value.replace(',', '.'))
}

function formatPrice(num: number): string {
  return num % 1 === 0 ? String(num) : num.toFixed(2).replace('.', ',')
}

function boxGerichtName(items: BoxItem[]): string {
  return `Box: ${items.map((i) => {
    const qty = i.count > 1 ? `${i.count}x ` : ''
    return `${qty}${i.name} (${formatPrice(i.price)}€)`
  }).join(', ')}`
}

function boxTotalPrice(items: BoxItem[]): number {
  return items.reduce((sum, i) => sum + i.price * i.count, 0)
}

const DARK_BOX = { backgroundColor: '#222222', color: '#F5A200' } as const

const INPUT_CLS =
  'w-full rounded-2xl px-4 py-4 text-lg font-bold placeholder:font-medium placeholder:opacity-40 focus:outline-none'

const TIME_CLS =
  'w-full rounded-2xl px-4 py-4 text-center text-2xl font-black focus:outline-none [color-scheme:dark]'

export default function BetriebForm({ betrieb }: BetriebFormProps) {
  const [angebotType, setAngebotType] = useState<AngebotType | null>(null)
  const [itemStep, setItemStep] = useState<ItemStep>('name')
  const [boxStep, setBoxStep] = useState<BoxStep>('overview')

  const [produktname, setProduktname] = useState('')
  const [originalpreis, setOriginalpreis] = useState('')
  const [abholzeit, setAbholzeit] = useState('')
  const [portionen, setPortionen] = useState(1)
  const [foto, setFoto] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)

  const [boxItems, setBoxItems] = useState<BoxItem[]>([])
  const [draftName, setDraftName] = useState('')
  const [draftPrice, setDraftPrice] = useState('')
  const [draftCount, setDraftCount] = useState(1)

  const [loading, setLoading] = useState(false)
  const [generatingPost, setGeneratingPost] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [generatedPost, setGeneratedPost] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetForm = () => {
    setAngebotType(null)
    setItemStep('name')
    setBoxStep('overview')
    setProduktname('')
    setOriginalpreis('')
    setAbholzeit('')
    setPortionen(1)
    setFoto(null)
    setFotoPreview(null)
    setBoxItems([])
    setDraftName('')
    setDraftPrice('')
    setDraftCount(1)
    setError(null)
    setSuccess(false)
    setGeneratedPost('')
    setGeneratingPost(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFotoChange = (file: File | null) => {
    setFoto(file)
    if (fotoPreview) URL.revokeObjectURL(fotoPreview)
    setFotoPreview(file ? URL.createObjectURL(file) : null)
  }

  const submitAngebot = async (gerichtName: string, preis: number, anzahl: number) => {
    if (!foto) { setError('Bitte ein Foto hochladen.'); return }
    if (!abholzeit) { setError('Bitte eine Abholzeit angeben.'); return }

    setError(null)
    setLoading(true)
    setGeneratingPost(true)

    try {
      const { base64, mimeType } = await fileToBase64(foto)
      const post = await generatePost({
        betriebCode: betrieb.code,
        betriebName: betrieb.name,
        adresse: betrieb.adresse,
        gerichtName,
        originalpreis: preis,
        abholzeit,
        bildBase64: base64,
        portionen: anzahl,
        mimeType,
      })
      setGeneratingPost(false)
      await sendAngebotToTelegram(foto, post)
      setGeneratedPost(post)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler beim Absenden.')
    } finally {
      setLoading(false)
      setGeneratingPost(false)
    }
  }

  const handleItemSubmit = () =>
    submitAngebot(produktname.trim(), parsePrice(originalpreis), portionen)

  const handleBoxSubmit = () =>
    submitAngebot(boxGerichtName(boxItems), boxTotalPrice(boxItems), portionen)

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
    setBoxStep('overview')
  }

  if (success && generatedPost) {
    return <Success generatedPost={generatedPost} onNeuesAngebot={resetForm} />
  }

  if (!angebotType) {
    return (
      <AngebotTypeSelector
        onSelect={setAngebotType}
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
  }

  const errorBanner = error ? (
    <div className="mb-4 rounded-xl bg-red-500/20 px-4 py-2.5 text-center text-xs font-bold text-red-300">
      {error}
    </div>
  ) : null

  const loadingLabel = generatingPost
    ? 'Post wird generiert…'
    : loading
      ? 'Wird gesendet…'
      : 'Absenden'

  // ─── ITEM FLOW ────────────────────────────────────────────

  if (angebotType === 'item') {
    const itemStepMap: Record<ItemStep, number> = {
      name: 1, price: 2, photo: 3, time: 4, quantity: 5,
    }
    const cur = itemStepMap[itemStep]

    if (itemStep === 'name') return (
      <WizardShell
        {...betriebBadge}
        stepCount={`${cur} / ${ITEM_TOTAL}`}
        stepName="Name"
        currentStep={cur}
        totalSteps={ITEM_TOTAL}
        title="Wie heißt das Produkt?"
        onBack={() => setAngebotType(null)}
        onNext={() => {
          if (!produktname.trim()) { setError('Bitte einen Namen eingeben.'); return }
          setError(null); setItemStep('price')
        }}
      >
        {errorBanner}
          <input
            type="text"
            autoFocus
            value={produktname}
            onChange={(e) => { setProduktname(e.target.value); setError(null) }}
            placeholder="z.B. Gemischte Bäckertüte"
            style={DARK_BOX}
            className={INPUT_CLS}
          />
      </WizardShell>
    )

    if (itemStep === 'price') return (
      <WizardShell
        {...betriebBadge}
        stepCount={`${cur} / ${ITEM_TOTAL}`}
        stepName="Preis"
        currentStep={cur}
        totalSteps={ITEM_TOTAL}
        title="Was kostet es original?"
        onBack={() => setItemStep('name')}
        onNext={() => {
          const preis = parsePrice(originalpreis)
          if (isNaN(preis) || preis <= 0) { setError('Bitte einen gültigen Preis eingeben.'); return }
          setError(null); setItemStep('photo')
        }}
      >
        {errorBanner}
        <StepperInput
          value={originalpreis}
          onChange={(v) => { setOriginalpreis(v); setError(null) }}
          step={0.5} min={0.5} suffix="€" placeholder="0"
        />
      </WizardShell>
    )

    if (itemStep === 'photo') return (
      <WizardShell
        {...betriebBadge}
        stepCount={`${cur} / ${ITEM_TOTAL}`}
        stepName="Foto"
        currentStep={cur}
        totalSteps={ITEM_TOTAL}
        title="Foto hochladen"
        hint="Ein kurzes Bild reicht völlig"
        onBack={() => setItemStep('price')}
        onNext={() => {
          if (!foto) { setError('Bitte ein Foto hochladen.'); return }
          setError(null); setItemStep('time')
        }}
      >
        {errorBanner}
        <PhotoPicker fotoPreview={fotoPreview} onClick={() => fileInputRef.current?.click()} />
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => handleFotoChange(e.target.files?.[0] ?? null)} />
      </WizardShell>
    )

    if (itemStep === 'time') return (
      <WizardShell
        {...betriebBadge}
        stepCount={`${cur} / ${ITEM_TOTAL}`}
        stepName="Abholzeit"
        currentStep={cur}
        totalSteps={ITEM_TOTAL}
        title="Bis wann abholbar?"
        onBack={() => setItemStep('photo')}
        onNext={() => {
          if (!abholzeit) { setError('Bitte eine Abholzeit angeben.'); return }
          setError(null); setItemStep('quantity')
        }}
      >
        {errorBanner}
        <input type="time" value={abholzeit}
          onChange={(e) => { setAbholzeit(e.target.value); setError(null) }}
          style={DARK_BOX}
          className={TIME_CLS} />
      </WizardShell>
    )

    return (
      <WizardShell
        {...betriebBadge}
        stepCount={`${cur} / ${ITEM_TOTAL}`}
        stepName="Anzahl"
        currentStep={cur}
        totalSteps={ITEM_TOTAL}
        title="Wie viele davon?"
        onBack={() => setItemStep('time')}
        onNext={handleItemSubmit}
        nextLabel={loadingLabel}
        nextDisabled={loading}
      >
        {errorBanner}
        <StepperInteger value={portionen} onChange={setPortionen} min={1} />
      </WizardShell>
    )
  }

  // ─── BOX FLOW ─────────────────────────────────────────────

  const boxStepMap: Record<BoxStep, number> = {
    overview: 0, 'add-item': 0, photo: 1, time: 2, quantity: 3,
  }
  const bCur = boxStepMap[boxStep]

  if (boxStep === 'overview') {
    const total = boxTotalPrice(boxItems)
    return (
      <WizardShell
        {...betriebBadge}
        title="Deine Box"
        hint={boxItems.length > 0 ? `${boxItems.length} Item${boxItems.length > 1 ? 's' : ''} · Gesamt ${formatPrice(total)} €` : 'Füge Items mit dem Button unten hinzu'}
        onBack={() => setAngebotType(null)}
        onNext={() => setBoxStep('photo')}
        nextLabel="Box abschließen"
        nextDisabled={boxItems.length === 0}
        extraAction={
          <button
            type="button"
            onClick={() => { setError(null); setBoxStep('add-item') }}
            style={OUTLINE_DARK}
            className="flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-[15px] font-black transition-all hover:bg-[#222222] hover:text-[#F5A200] active:scale-[0.98]"
          >
            <span className="text-lg leading-none">+</span>
            Neues Item
          </button>
        }
      >
        {errorBanner}
        {boxItems.length === 0 ? (
          <div
            style={DARK_BOX}
            className="flex items-center justify-center rounded-2xl py-8"
          >
            <p className="text-sm font-medium opacity-60">Noch keine Items</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {boxItems.map((item, i) => (
              <li
                key={item.id}
                style={DARK_BOX}
                className="flex items-center gap-3 rounded-2xl px-4 py-3.5"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black opacity-40">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black">
                    {item.count > 1 ? `${item.count}× ` : ''}{item.name}
                  </p>
                </div>
                <span className="shrink-0 rounded-full px-2.5 py-1 text-xs font-black opacity-70">
                  {formatPrice(item.price)} €
                </span>
                <button
                  type="button"
                  onClick={() => setBoxItems((p) => p.filter((x) => x.id !== item.id))}
                  aria-label={`${item.name} entfernen`}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold opacity-40 transition-opacity hover:opacity-80"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </WizardShell>
    )
  }

  if (boxStep === 'add-item') return (
    <WizardShell
      {...betriebBadge}
      title="Was kommt rein?"
      onBack={() => { setError(null); setDraftName(''); setDraftPrice(''); setDraftCount(1); setBoxStep('overview') }}
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

  if (boxStep === 'photo') return (
    <WizardShell
      {...betriebBadge}
      stepCount={`${bCur} / ${BOX_TOTAL}`}
      stepName="Foto"
      currentStep={bCur}
      totalSteps={BOX_TOTAL}
      title="Foto der Box"
      hint="Ein grobes Bild reicht"
      onBack={() => setBoxStep('overview')}
      onNext={() => {
        if (!foto) { setError('Bitte ein Foto hochladen.'); return }
        setError(null); setBoxStep('time')
      }}
    >
      {errorBanner}
      <PhotoPicker fotoPreview={fotoPreview} onClick={() => fileInputRef.current?.click()} />
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => handleFotoChange(e.target.files?.[0] ?? null)} />
    </WizardShell>
  )

  if (boxStep === 'time') return (
    <WizardShell
      {...betriebBadge}
      stepCount={`${bCur} / ${BOX_TOTAL}`}
      stepName="Abholzeit"
      currentStep={bCur}
      totalSteps={BOX_TOTAL}
      title="Bis wann abholbar?"
      onBack={() => setBoxStep('photo')}
      onNext={() => {
        if (!abholzeit) { setError('Bitte eine Abholzeit angeben.'); return }
        setError(null); setBoxStep('quantity')
      }}
    >
      {errorBanner}
      <input type="time" value={abholzeit}
        onChange={(e) => { setAbholzeit(e.target.value); setError(null) }}
        style={DARK_BOX}
        className={TIME_CLS} />
    </WizardShell>
  )

  return (
    <WizardShell
      {...betriebBadge}
      stepCount={`${bCur} / ${BOX_TOTAL}`}
      stepName="Anzahl"
      currentStep={bCur}
      totalSteps={BOX_TOTAL}
      title="Wie viele Boxen?"
      onBack={() => setBoxStep('time')}
      onNext={handleBoxSubmit}
      nextLabel={loadingLabel}
      nextDisabled={loading}
    >
      {errorBanner}
      <StepperInteger value={portionen} onChange={setPortionen} min={1} />
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
          <span className="text-3xl opacity-50">+</span>
          <span className="mt-2 text-xs font-semibold opacity-40">Tippe zum Hochladen</span>
        </>
      )}
    </button>
  )
}
