import { Link, useParams } from 'react-router-dom'
import BetriebForm from '../components/BetriebForm'
import { getBetriebById } from '../config/betriebe'

export default function BetriebPage() {
  const { betriebId } = useParams<{ betriebId: string }>()

  if (!betriebId) {
    return (
      <div className="p-6">
        <p className="text-red-600">Betrieb nicht gefunden</p>
      </div>
    )
  }

  const betrieb = getBetriebById(betriebId)

  if (!betrieb) {
    return (
      <div className="p-6">
        <p className="text-red-600">Betrieb nicht gefunden</p>
        <Link to="/" className="mt-2 inline-block text-blue-600 underline">
          Zurück zur Übersicht
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {betrieb.code} – {betrieb.name}
        </h1>
        <p className="text-gray-600">{betrieb.adresse}</p>
      </div>
      <BetriebForm betrieb={betrieb} />
    </div>
  )
}
