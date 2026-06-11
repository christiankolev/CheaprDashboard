import { useEffect, useRef } from 'react'
import CheaprLogo from '../CheaprLogo.svg'

interface SuccessProps {
  onNeuesAngebot: () => void
}

function ConfettiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const COLORS = ['#222222', '#1a1a1a', '#ffffff', '#F5A200', '#FFD166']

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 400,
      vx: (Math.random() - 0.5) * 1.8,
      vy: 2.5 + Math.random() * 3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      w: 5 + Math.random() * 8,
      h: 3 + Math.random() * 4,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.12,
    }))

    let raf: number
    const start = performance.now()
    const DURATION = 4200

    function draw(now: number) {
      const elapsed = now - start
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height)

      const fadeStart = DURATION - 900
      const alpha = elapsed > fadeStart
        ? Math.max(0, 1 - (elapsed - fadeStart) / 900)
        : 1

      particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.045
        p.angle += p.spin

        ctx!.save()
        ctx!.globalAlpha = alpha
        ctx!.fillStyle = p.color
        ctx!.translate(p.x, p.y)
        ctx!.rotate(p.angle)
        ctx!.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        ctx!.restore()
      })

      if (elapsed < DURATION) raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-20"
      style={{ width: '100%', height: '100%' }}
    />
  )
}

function LeafIllustration() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path
        d="M32 6 C10 6 8 28 8 40 C18 40 32 36 42 24"
        stroke="#F5A200" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.9"
      />
      <path
        d="M32 6 C54 6 56 28 56 40 C46 40 32 36 22 24"
        stroke="#F5A200" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.5"
      />
      <line x1="32" y1="58" x2="32" y2="28" stroke="#F5A200" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      <line x1="32" y1="44" x2="22" y2="36" stroke="#F5A200" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <line x1="32" y1="38" x2="42" y2="30" stroke="#F5A200" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    </svg>
  )
}

function CarIllustration() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path
        d="M8 38 L14 26 L20 22 L44 22 L50 26 L56 38 L56 46 L8 46 Z"
        stroke="#F5A200" strokeWidth="2" strokeLinejoin="round" fill="none" opacity="0.9"
      />
      <circle cx="20" cy="46" r="5" stroke="#F5A200" strokeWidth="2" fill="none" opacity="0.7" />
      <circle cx="44" cy="46" r="5" stroke="#F5A200" strokeWidth="2" fill="none" opacity="0.7" />
      <path d="M22 30 L28 24 L40 24 L46 30 Z" stroke="#F5A200" strokeWidth="1.5" strokeLinejoin="round" fill="none" opacity="0.4" />
      <line x1="8" y1="36" x2="56" y2="36" stroke="#F5A200" strokeWidth="1" opacity="0.25" />
    </svg>
  )
}

function WaterIllustration() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path
        d="M32 8 Q48 26 48 38 A16 16 0 0 1 16 38 Q16 26 32 8 Z"
        stroke="#F5A200" strokeWidth="2" strokeLinejoin="round" fill="none" opacity="0.9"
      />
      <path
        d="M24 38 Q28 33 32 38 Q36 43 40 38"
        stroke="#F5A200" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5"
      />
      <path
        d="M22 44 Q26 40 30 44"
        stroke="#F5A200" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.3"
      />
    </svg>
  )
}


export default function Success({ onNeuesAngebot }: SuccessProps) {
  return (
    <>
      <ConfettiCanvas />
      <div className="relative z-10 flex min-h-dvh flex-col bg-[#ECEAE6] px-5 py-6">
        <div className="mx-auto w-full max-w-md flex-1 flex flex-col justify-center gap-3">

          {/* Bento grid: 2 cols, left card spans 2 rows */}
          <div className="grid grid-cols-2 gap-3">

            {/* Left tall card: success message + CTA */}
            <div className="row-span-2 flex flex-col justify-between overflow-hidden rounded-3xl bg-white p-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-black/40">
                  Fertig!
                </p>
                <h2 className="mt-3 text-[2rem] font-black leading-tight tracking-tight text-black">
                  Angebot<br />live!
                </h2>
                <p className="mt-2 text-sm font-medium text-black/50">
                  Du hast gerade etwas Gutes getan.
                </p>
              </div>
              <button
                type="button"
                onClick={onNeuesAngebot}
                className="mt-6 flex items-center justify-between gap-2 rounded-2xl bg-[#222] px-4 py-3 text-[13px] font-black text-[#F5A200] transition-all hover:opacity-90 active:scale-[0.97]"
              >
                Neues Angebot
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <path d="M5 2.5L9.5 7L5 11.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {/* Top right: CO₂ */}
            <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl bg-[#F5A200] p-4">
              <div>
                <p className="text-[1.7rem] font-black leading-none text-[#222]">~3 kg</p>
                <p className="mt-1 text-[11px] font-black text-[#222]">CO₂ gerettet</p>
                <p className="mt-0.5 text-[10px] font-medium text-[#222]/50 leading-snug">weniger Treibhausgas</p>
              </div>
              <div className="mt-2 self-end opacity-30 scale-75 origin-bottom-right">
                <LeafIllustration />
              </div>
            </div>

            {/* Bottom right: Autofahrt */}
            <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl bg-white p-4">
              <div>
                <p className="text-[1.7rem] font-black leading-none text-black">≈ 15 km</p>
                <p className="mt-1 text-[11px] font-black text-black">Autofahrt gespart</p>
                <p className="mt-0.5 text-[10px] font-medium text-black/40 leading-snug">so viel CO₂ wäre sonst emittiert</p>
              </div>
              <div className="mt-2 self-end opacity-20 scale-75 origin-bottom-right">
                <CarIllustration />
              </div>
            </div>
          </div>

          {/* Full-width bottom card: Wasser */}
          <div className="flex items-center justify-between overflow-hidden rounded-3xl bg-[#222] px-6 py-5">
            <div>
              <p className="text-[2rem] font-black leading-none text-[#F5A200]">≈ 500 L</p>
              <p className="mt-1 text-sm font-black text-[#F5A200]">Wasser gespart</p>
              <p className="mt-0.5 text-[11px] font-medium text-[#F5A200]/40 leading-snug">virtuelles Wasser aus der Produktion</p>
            </div>
            <div className="opacity-60">
              <WaterIllustration />
            </div>
          </div>

        </div>

        <div className="flex justify-center pb-3 pt-5">
          <img src={CheaprLogo} alt="Cheapr" className="h-7 w-auto opacity-20" />
        </div>
      </div>
    </>
  )
}
