import { useRef, useState } from 'react'
import LeftyTuete from '../../leftytüte.svg'
import CheaprLogo from '../CheaprLogo.svg'
import BetriebBadge from './BetriebBadge'

export type AngebotType = 'Mini' | 'S' | 'M' | 'L'

export const LEFTY_PRICES: Record<AngebotType, number> = { Mini: 0, S: 3, M: 5, L: 7 }

export const LEFTY_OPTIONS: { type: AngebotType; warenwert: number }[] = [
  { type: 'Mini', warenwert: 7 },
  { type: 'S', warenwert: 10 },
  { type: 'M', warenwert: 17 },
  { type: 'L', warenwert: 23 },
]

interface AngebotTypeSelectorProps {
  onSelect: (type: AngebotType, count: number) => void
  betriebName?: string
  betriebCode?: string
  betriebBild?: string
}

export default function AngebotTypeSelector({ onSelect, betriebName, betriebCode, betriebBild }: AngebotTypeSelectorProps) {
  const countRef = useRef<HTMLInputElement>(null)
  const [count, setCount] = useState(1)

  const handleSubmit = () => {
    const raw = countRef.current?.value ?? String(count)
    const n = Math.max(1, Math.min(10, parseInt(raw, 10) || 1))
    onSelect('Mini', n)
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[#F5A200] px-5 py-6">

      <div className="flex items-center justify-between pb-10 pt-2">
        <div />
        {betriebCode && betriebName && (
          <BetriebBadge
            label={`${betriebCode} · ${betriebName}`}
            image={betriebBild}
            imageAlt={betriebName}
          />
        )}
        <div className="h-9 w-9" />
      </div>

      <div className="mx-auto w-full max-w-md flex-1 flex flex-col justify-center">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-cheapr-dark/40">
          Neues Angebot
        </p>
        <h1 className="mb-6 text-[2.2rem] font-black leading-tight tracking-tight text-cheapr-dark">
          Füge Leftys hinzu!
        </h1>

        <label htmlFor="lefty-anzahl" className="mb-3 block text-sm font-bold text-cheapr-dark/60">
          Wie viele Leftys?
        </label>
        <input
          ref={countRef}
          id="lefty-anzahl"
          type="number"
          min={1}
          max={10}
          value={count}
          onChange={(e) => setCount(Math.max(1, Math.min(10, parseInt(e.target.value, 10) || 1)))}
          className="mb-4 w-full rounded-2xl border-2 border-cheapr-dark bg-white px-4 py-3 text-center text-2xl font-black text-cheapr-dark focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-auto [&::-webkit-outer-spin-button]:appearance-auto"
        />

        <button
          type="button"
          onClick={handleSubmit}
          style={{ backgroundColor: '#222222' }}
          className="relative flex w-full items-center justify-center rounded-3xl shadow-lg py-10 px-6 transition-all hover:opacity-90 active:scale-[0.98]"
        >
          <img src={LeftyTuete} alt="Lefty Tüte" className="h-40 w-auto" />
          <div
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full"
            style={{ backgroundColor: '#F5A200' }}
          >
            <span className="text-xl font-black leading-none" style={{ color: '#222222' }}>+</span>
          </div>
        </button>
      </div>

      <div className="mt-6 flex justify-center">
        <img src={CheaprLogo} alt="Cheapr" className="h-7 w-auto opacity-30" />
      </div>
    </div>
  )
}
