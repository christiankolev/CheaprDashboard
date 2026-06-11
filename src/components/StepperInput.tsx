interface StepperInputProps {
  value: string
  onChange: (value: string) => void
  step?: number
  min?: number
  placeholder?: string
}

function parseDecimal(value: string): number {
  return parseFloat(value.replace(',', '.'))
}

function formatDecimal(num: number): string {
  if (Number.isInteger(num)) return String(num)
  return num.toFixed(2).replace(/\.?0+$/, '').replace('.', ',')
}

const DARK_BOX = { backgroundColor: '#222222', color: '#F5A200' } as const
export const OUTLINE_DARK = { border: '2px solid #222222', color: '#222222', backgroundColor: 'transparent' } as const

const BTN_CLS =
  'flex h-[54px] w-12 shrink-0 items-center justify-center rounded-2xl text-2xl font-black transition-all hover:opacity-80 active:scale-95'

const INPUT_INNER_CLS =
  'w-full rounded-2xl px-4 py-4 text-lg font-bold placeholder:font-medium placeholder:opacity-40 focus:outline-none'

export default function StepperInput({
  value,
  onChange,
  step = 0.5,
  min = 0,
  placeholder = 'Warenwert (z.B. 2)',
}: StepperInputProps) {
  const adjust = (delta: number) => {
    const current = parseDecimal(value)
    const base = isNaN(current) ? min : current
    const next = Math.max(min, Math.round((base + delta) * 100) / 100)
    onChange(formatDecimal(next))
  }

  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => adjust(-step)} aria-label="Weniger" className={BTN_CLS} style={DARK_BOX}>
        −
      </button>

      <div className="relative flex-1">
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, ''))}
          placeholder={placeholder}
          style={DARK_BOX}
          className={`w-full ${INPUT_INNER_CLS} ${value ? 'pr-9' : ''}`}
        />
        <span
          aria-hidden
          className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-lg font-bold transition-opacity duration-150 ${value ? 'opacity-70' : 'opacity-0'}`}
          style={{ color: '#F5A200' }}
        >
          €
        </span>
      </div>

      <button type="button" onClick={() => adjust(step)} aria-label="Mehr" className={BTN_CLS} style={DARK_BOX}>
        +
      </button>
    </div>
  )
}

interface StepperIntegerProps {
  value: number
  onChange: (value: number) => void
  min?: number
}

export function StepperInteger({ value, onChange, min = 1 }: StepperIntegerProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        aria-label="Weniger"
        className={BTN_CLS}
        style={DARK_BOX}
      >
        −
      </button>

      <div
        style={DARK_BOX}
        className="flex flex-1 items-center justify-center rounded-xl py-3.5"
      >
        <span className="text-4xl font-black">{value}</span>
      </div>

      <button
        type="button"
        onClick={() => onChange(value + 1)}
        aria-label="Mehr"
        className={BTN_CLS}
        style={DARK_BOX}
      >
        +
      </button>
    </div>
  )
}

interface QuantityPickerProps {
  value: number
  onChange: (value: number) => void
  label?: string
}

export function QuantityPicker({ value, onChange, label = 'Wie viele davon?' }: QuantityPickerProps) {
  return (
    <div>
      <p className="mb-2 text-sm font-bold text-cheapr-dark">{label}</p>
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            style={value === n ? DARK_BOX : OUTLINE_DARK}
            className="rounded-xl py-3 text-lg font-black transition-all hover:opacity-90 active:scale-95"
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}
