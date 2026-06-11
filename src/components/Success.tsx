import { useEffect, useRef, useState, type ReactNode } from 'react'
import CheaprLogo from '../CheaprLogo.svg'
import ImgCouple from '../../pexels-cup-of-couple-6963524.webp'
import ImgUrban from '../../pexels-memet-oz-296480690-38043281.webp'
import ImgNature from '../../pexels-justyna-serafin-127253298-18794028.webp'
import type { AngebotType } from './AngebotTypeSelector'

interface SuccessItem {
  id: string
  name: string
  price: number
  count: number
}

export interface SubmittedLefty {
  id: string
  items: SuccessItem[]
  angebotType: AngebotType
  verkaufspreis: number
  abholzeit?: string
}

interface SuccessProps {
  onNeuesAngebot: () => void
  leftys: SubmittedLefty[]
}

function formatPrice(num: number): string {
  const numStr = num % 1 === 0 ? String(num) : num.toFixed(2).replace('.', ',')
  return `${numStr} €`
}

function AnimatedCollapse({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <div
      className="grid transition-[grid-template-rows] duration-300 ease-out"
      style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
    >
      <div className="overflow-hidden">{children}</div>
    </div>
  )
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

    const COLORS = ['#222222', '#1a1a1a', '#ffffff', '#ff6b35', '#FFD166']

    const particles = Array.from({ length: 80 }, () => ({
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
    const DURATION = 4800

    function draw(now: number) {
      const elapsed = now - start
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height)

      const fadeStart = DURATION - 1000
      const alpha = elapsed > fadeStart
        ? Math.max(0, 1 - (elapsed - fadeStart) / 1000)
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

const BASE_STATS = [
  { value: 3, unit: 'kg', prefix: '~', label: 'CO₂ gespart', sub: 'Treibhausgas vermieden', img: ImgCouple },
  { value: 15, unit: 'km', prefix: '≈', label: 'Weniger Fahrt', sub: 'Autofahrt eingespart', img: ImgUrban },
  { value: 500, unit: 'L', prefix: '≈', label: 'Wasser gespart', sub: 'Virtuelle Produktion', img: ImgNature },
]

function scaledStats(count: number) {
  return BASE_STATS.map(s => ({
    ...s,
    num: `${s.prefix}${s.value * count}`,
  }))
}

function BenefitCarousel({ count }: { count: number }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const stats = scaledStats(count)

  const onScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const slideWidth = el.offsetWidth
    if (slideWidth === 0) return
    setActive(Math.round(el.scrollLeft / slideWidth))
  }

  return (
    <div className="mt-8 w-full" style={{ animation: 'slideUp 0.45s 0.12s ease-out both' }}>
      {count > 1 && (
        <p className="mb-3 text-center text-xs font-bold text-cheapr-dark/45">
          {count}× Lefty · Vorteile addiert
        </p>
      )}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {stats.map(({ num, unit, label, sub, img }, i) => (
          <div
            key={label}
            className="w-full shrink-0 snap-center px-0.5"
            style={{ animation: `slideUp 0.45s ${0.15 + i * 0.08}s ease-out both` }}
          >
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl">
              <img src={img} alt={label} className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-x-4 bottom-4">
                <div className="flex items-center gap-3 rounded-2xl bg-white px-3 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.18)]">
                  <img src={img} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-bold leading-tight text-[#222222]">{label}</p>
                    <p className="mt-0.5 truncate text-xs font-medium text-[#222222]/45">{sub}</p>
                  </div>
                  <div className="shrink-0 pl-1 text-right">
                    <span className="text-xl font-black leading-none text-emerald-600">
                      {num}
                      <span className="text-sm">{unit}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex justify-center gap-2">
        {stats.map(({ label }, i) => (
          <button
            key={label}
            type="button"
            aria-label={`Vorteil ${i + 1}`}
            onClick={() => {
              const el = scrollRef.current
              if (!el) return
              el.scrollTo({ left: i * el.offsetWidth, behavior: 'smooth' })
            }}
            className={`h-2 rounded-full transition-all ${
              active === i ? 'w-6 bg-cheapr-dark' : 'w-2 bg-cheapr-dark/20'
            }`}
          />
        ))}
      </div>

      <p className="mt-2 text-center text-[10px] font-bold text-cheapr-dark/35">Nach rechts wischen</p>
    </div>
  )
}

function LeftySuccessCard({ lefty, index }: { lefty: SubmittedLefty; index: number }) {
  const [open, setOpen] = useState(false)
  const warenwert = lefty.items.reduce((s, i) => s + i.price * i.count, 0)

  return (
    <div
      style={{ backgroundColor: '#222222', color: '#F5A200' }}
      className="overflow-hidden rounded-2xl"
    >
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between px-5 py-4 transition-opacity hover:opacity-90 active:opacity-70"
      >
        <div className="text-left">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] opacity-40">
            {index}. Lefty · {lefty.angebotType}
          </p>
          <p className="mt-0.5 text-base font-black">{formatPrice(lefty.verkaufspreis)}</p>
          {lefty.abholzeit && (
            <p className="mt-0.5 text-xs font-medium opacity-40">bis {lefty.abholzeit} Uhr</p>
          )}
        </div>
        <svg
          width="16" height="16" viewBox="0 0 14 14" fill="none"
          className={`shrink-0 transition-transform duration-300 ease-out ${open ? 'rotate-180' : ''}`}
          style={{ opacity: 0.5 }}
        >
          <path d="M2.5 5L7 9.5L11.5 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <AnimatedCollapse open={open}>
        <div className="space-y-2 border-t px-5 pb-4 pt-3" style={{ borderColor: 'rgba(245,162,0,0.15)' }}>
          {lefty.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              <span className="text-sm font-bold">
                {item.count > 1 ? `${item.count}× ` : ''}{item.name}
              </span>
              <span className="text-sm font-bold opacity-60">
                {formatPrice(item.price * item.count)}
              </span>
            </div>
          ))}
          <div className="mt-2 h-px" style={{ backgroundColor: 'rgba(245,162,0,0.15)' }} />
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-bold opacity-50">70% günstiger</span>
            <span className="text-base font-black">{formatPrice(lefty.verkaufspreis)}</span>
          </div>
          {warenwert > 0 && (
            <p className="text-[10px] font-medium opacity-30">statt {formatPrice(warenwert)}</p>
          )}
        </div>
      </AnimatedCollapse>
    </div>
  )
}

export default function Success({ onNeuesAngebot, leftys }: SuccessProps) {
  const count = Math.max(1, leftys.length)
  const plural = leftys.length > 1

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounceDown {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(6px); }
        }
      `}</style>

      <ConfettiCanvas />

      <div className="relative z-10 bg-[#F5A200]">

        <section className="flex min-h-dvh flex-col px-5 py-8">
          <div className="mx-auto w-full max-w-md flex-1 flex flex-col justify-center">
            <div className="w-full text-center" style={{ animation: 'slideUp 0.4s ease-out both' }}>
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-cheapr-dark/40">
                Fertig!
              </p>
              <h1 className="mt-1 text-[2.2rem] font-black leading-tight tracking-tight text-cheapr-dark">
                {plural ? 'Deine Leftys sind live!' : 'Dein Lefty ist live!'}
              </h1>
              <p className="mt-2 text-sm font-medium text-cheapr-dark/60">
                Du hast gerade etwas Gutes getan.
              </p>
            </div>

            <BenefitCarousel count={count} />
          </div>

          <div
            className="mx-auto flex flex-col items-center pb-4 pt-8"
            style={{ animation: 'bounceDown 1.8s ease-in-out infinite' }}
          >
            <svg width="20" height="20" viewBox="0 0 14 14" fill="none" className="text-cheapr-dark/40">
              <path d="M2.5 5L7 9.5L11.5 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="mt-1 text-[10px] font-bold text-cheapr-dark/35">Nach unten scrollen</span>
          </div>
        </section>

        <section className="flex min-h-dvh flex-col justify-center px-5 pb-10 pt-6">
          <div className="mx-auto w-full max-w-md space-y-5">
            <div className="space-y-4">
              {leftys.map((lefty, i) => (
                <LeftySuccessCard key={lefty.id} lefty={lefty} index={i + 1} />
              ))}
            </div>

            <button
              type="button"
              onClick={onNeuesAngebot}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cheapr-dark px-6 py-4 text-[15px] font-black text-[#F5A200] transition-all hover:opacity-90 active:scale-[0.98]"
            >
              Neues Angebot
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 2.5L9.5 7L5 11.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <div className="flex justify-center pt-2">
              <img src={CheaprLogo} alt="Cheapr" className="h-7 w-auto opacity-20" />
            </div>
          </div>
        </section>

      </div>
    </>
  )
}
