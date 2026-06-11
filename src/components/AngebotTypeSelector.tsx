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
  onSelect: (type: AngebotType) => void
  betriebName?: string
  betriebCode?: string
  betriebBild?: string
}

export default function AngebotTypeSelector({ onSelect, betriebName, betriebCode, betriebBild }: AngebotTypeSelectorProps) {
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
        <h1 className="mb-8 text-[2.2rem] font-black leading-tight tracking-tight text-cheapr-dark">
          Füge ein Lefty hinzu!
        </h1>

        <button
          type="button"
          onClick={() => onSelect('Mini')}
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
