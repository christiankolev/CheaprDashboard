import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { betriebe } from './config/betriebe'
import BetriebPage from './pages/BetriebPage'
import logo from './CheaprLogo.svg'

function MapPinIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <path d="M20 10c0 6-8 13-8 13S4 16 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function HomePage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5A200' }}>
      {/* Header */}
      <header className="flex justify-center pt-10 pb-6 px-4">
        <img src={logo} alt="Cheapr" className="h-12 w-auto" />
      </header>

      {/* Subtitle */}
      <p className="text-center text-[#232323] font-semibold text-lg mb-6 px-4">
        Wähle deinen Betrieb
      </p>

      {/* Horizontal scrollable card row */}
      <div className="flex overflow-x-auto gap-4 px-5 pb-12 snap-x snap-mandatory scrollbar-hide">
        {Object.entries(betriebe).map(([id, betrieb]) => (
          <Link
            key={id}
            to={`/betrieb/${id}`}
            className="snap-start shrink-0 w-[240px] block group"
          >
            <div className="bg-white rounded-2xl overflow-hidden shadow-md transition-transform duration-200 group-active:scale-[0.97]">
              {/* Business image */}
              <div className="h-40 w-full overflow-hidden">
                <img
                  src={betrieb.bild}
                  alt={betrieb.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              {/* Info section */}
              <div className="px-3 py-3">
                {/* Business name */}
                <p className="text-[#232323] font-bold text-base leading-tight mb-1">
                  {betrieb.name}
                </p>

                {/* Address with pin icon */}
                <div className="flex items-start gap-1 text-gray-500 text-xs mb-2 leading-snug">
                  <MapPinIcon />
                  <span>{betrieb.adresse}</span>
                </div>

                {/* Category badge */}
                <span className="inline-block bg-[#F5A200]/20 text-[#a06800] text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                  {betrieb.kategorie}
                </span>
              </div>
            </div>
          </Link>
        ))}
        {/* trailing spacer so last card doesn't sit at edge */}
        <div className="shrink-0 w-1" />
      </div>
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
