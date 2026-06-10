import { useEffect, useRef, useState } from 'react'
import CheaprLogo from '../CheaprLogo.svg'
import { OUTLINE_DARK } from './StepperInput'

interface SuccessProps {
  generatedPost: string
  onNeuesAngebot: () => void
}

export default function Success({ generatedPost, onNeuesAngebot }: SuccessProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) { textarea.focus(); textarea.select() }
  }, [])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedPost)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[#F5A200] px-5 py-6">
      <div className="mx-auto w-full max-w-md flex-1 flex flex-col justify-center">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-cheapr-dark/40">
          Fertig!
        </p>
        <h2 className="text-[2rem] font-black leading-tight tracking-tight text-cheapr-dark">
          Angebot gesendet 🎉
        </h2>
        <p className="mb-7 mt-2 text-sm font-medium text-cheapr-dark/50">
          Telegram-Nachricht wurde verschickt
        </p>

        <label htmlFor="whatsapp-post" className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-cheapr-dark/40">
          WhatsApp-Post
        </label>
        <textarea
          id="whatsapp-post"
          ref={textareaRef}
          readOnly
          value={generatedPost}
          rows={9}
          className="w-full rounded-2xl bg-cheapr-dark px-4 py-3.5 text-xs font-medium leading-relaxed text-cheapr-yellow/80 focus:outline-none"
        />
      </div>

      <div className="mx-auto w-full max-w-md space-y-2.5 pb-4 pt-5">
        <button
          type="button"
          onClick={handleCopy}
          style={OUTLINE_DARK}
          className="flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-[15px] font-black transition-all hover:bg-[#222222] hover:text-[#F5A200] active:scale-[0.98]"
        >
          {copied ? '✓ Kopiert!' : 'Kopieren'}
        </button>
        <button
          type="button"
          onClick={onNeuesAngebot}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cheapr-dark px-6 py-4 text-[15px] font-black tracking-wide text-cheapr-yellow transition-all hover:opacity-90 active:scale-[0.98]"
        >
          Neues Angebot
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M5 2.5L9.5 7L5 11.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="flex justify-center pb-3">
        <img src={CheaprLogo} alt="Cheapr" className="h-7 w-auto opacity-30" />
      </div>
    </div>
  )
}
