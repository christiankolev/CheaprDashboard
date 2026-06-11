import CheaprLogo from '../CheaprLogo.svg'
import BetriebBadge from './BetriebBadge'

export type AngebotType = 'Mini' | 'S' | 'M' | 'L'

export const LEFTY_PRICES: Record<AngebotType, number> = { Mini: 0, S: 3, M: 5, L: 7 }

const LEFTY_OPTIONS: { type: AngebotType; preis: number; maxPreis?: number; warenwert: number; description: string }[] = [
  { type: 'Mini', preis: 0, maxPreis: 3, warenwert: 7, description: 'Einzelnes Item – variabler Preis bis 3 €' },
  { type: 'S', preis: 3, warenwert: 10, description: 'Kleine Tüte für 1–2 Sachen' },
  { type: 'M', preis: 5, warenwert: 17, description: 'Mittlere Box für ein paar Items' },
  { type: 'L', preis: 7, warenwert: 23, description: 'Große Box – voll packen!' },
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
        <div />
      </div>

      <div className="mx-auto w-full max-w-md flex-1 flex flex-col justify-center">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-cheapr-dark/40">
          Neues Angebot
        </p>
        <h1 className="mb-10 text-[2.2rem] font-black leading-tight tracking-tight text-cheapr-dark">
          Welche Box<br />passt?
        </h1>

        <div className="flex flex-col gap-3">
          {LEFTY_OPTIONS.map(({ type, preis, maxPreis, warenwert, description }) => (
            <button
              key={type}
              type="button"
              onClick={() => onSelect(type)}
              style={{ backgroundColor: '#222222', color: '#F5A200' }}
              className="flex h-[110px] w-full items-center justify-between rounded-3xl px-6 text-left shadow-lg transition-all hover:opacity-90 active:scale-[0.97]"
            >
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-[2.2rem] font-black leading-none">{type}</span>
                  <span className="text-[14px] font-black opacity-70">Lefty</span>
                </div>
                <span className="mt-1 block text-[11px] font-medium leading-relaxed opacity-40">
                  {description}
                </span>
              </div>
              <div>
                {maxPreis != null ? (
                  <>
                    <span className="text-[1.4rem] font-black opacity-90">bis {maxPreis} €</span>
                    <span className="text-[13px] font-bold opacity-35"> / ~{warenwert} €</span>
                  </>
                ) : (
                  <>
                    <span className="text-[1.8rem] font-black opacity-90">{preis} €</span>
                    <span className="text-[13px] font-bold opacity-35"> / ~{warenwert} €</span>
                  </>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10 flex justify-center">
        <img src={CheaprLogo} alt="Cheapr" className="h-7 w-auto opacity-30" />
      </div>
    </div>
  )
}
