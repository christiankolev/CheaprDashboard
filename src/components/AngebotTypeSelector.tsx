import LeftyLogo from '../Leftylogo.svg'

export type AngebotType = 'box' | 'item'

interface AngebotTypeSelectorProps {
  onSelect: (type: AngebotType) => void
  betriebName?: string
  betriebCode?: string
}

function TypeCard({
  label,
  title,
  description,
  onClick,
}: {
  label: string
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ backgroundColor: '#222222', color: '#E8A838' }}
      className="flex h-[175px] w-full flex-col justify-between rounded-3xl p-5 text-left shadow-lg transition-all hover:opacity-90 active:scale-[0.97]"
    >
      <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">
        {label}
      </span>
      <div>
        <span className="block text-[2.2rem] font-black leading-none">
          {title}
        </span>
        <span className="mt-2 block text-[11px] font-medium leading-relaxed opacity-60">
          {description}
        </span>
      </div>
    </button>
  )
}

export default function AngebotTypeSelector({ onSelect, betriebName, betriebCode }: AngebotTypeSelectorProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-cheapr-page px-5 py-6">

      <div className="flex items-center justify-between pb-10 pt-2">
        <div />
        {betriebCode && betriebName && (
          <div
            style={{ backgroundColor: '#222222', color: '#E8A838' }}
            className="rounded-full px-3 py-1"
          >
            <span className="text-[11px] font-bold">{betriebCode} · {betriebName}</span>
          </div>
        )}
        <div />
      </div>

      <div className="mx-auto w-full max-w-md flex-1 flex flex-col justify-center">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-cheapr-dark/40">
          Neues Angebot
        </p>
        <h1 className="mb-10 text-[2.2rem] font-black leading-tight tracking-tight text-cheapr-dark">
          Was ist übrig<br />geblieben?
        </h1>

        <div className="grid grid-cols-2 gap-3">
          <TypeCard
            label="Mehrere"
            title="Box"
            description="Viele einzelne Sachen zusammen"
            onClick={() => onSelect('box')}
          />
          <TypeCard
            label="Einzeln"
            title="Item"
            description="Ein einzelnes Produkt"
            onClick={() => onSelect('item')}
          />
        </div>
      </div>

      <div className="mt-10 flex justify-center">
        <img src={LeftyLogo} alt="Lefty" className="h-7 w-auto opacity-30" />
      </div>
    </div>
  )
}
