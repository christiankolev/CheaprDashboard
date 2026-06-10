import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { betriebe } from './config/betriebe'
import BetriebPage from './pages/BetriebPage'

function HomePage() {
  return (
    <div className="mx-auto max-w-lg p-6">
      <h1 className="mb-4 text-2xl font-bold">Cheapr Dashboard</h1>
      <p className="mb-4 text-gray-600">
        Wähle einen Betrieb, um ein neues Angebot zu erstellen:
      </p>
      <ul className="space-y-2">
        {Object.entries(betriebe).map(([id, betrieb]) => (
          <li key={id}>
            <Link
              to={`/betrieb/${id}`}
              className="block rounded border border-gray-300 p-3 hover:bg-gray-50"
            >
              <span className="font-medium">
                {betrieb.code} – {betrieb.name}
              </span>
              <span className="block text-sm text-gray-500">{betrieb.adresse}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/betrieb/:betriebId" element={<BetriebPage />} />
      </Routes>
    </BrowserRouter>
  )
}
