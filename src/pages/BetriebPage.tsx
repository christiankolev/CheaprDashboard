import { Link, useParams } from 'react-router-dom'
import BetriebForm from '../components/BetriebForm'
import { getBetriebById } from '../config/betriebe'

export default function BetriebPage() {
  const { betriebId } = useParams<{ betriebId: string }>()

  if (!betriebId) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#F5A200]">
        <p className="font-bold text-cheapr-dark">Betrieb nicht gefunden</p>
      </div>
    )
  }

  const betrieb = getBetriebById(betriebId)

  if (!betrieb) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#F5A200]">
        <p className="font-bold text-cheapr-dark">Betrieb nicht gefunden</p>
        <Link to="/" className="text-sm font-semibold text-cheapr-dark underline">
          Zurück
        </Link>
      </div>
    )
  }

  return <BetriebForm betrieb={betrieb} />
}
