import { useEffect, useRef, useState } from 'react'

interface SuccessProps {
  generatedPost: string
  onNeuesAngebot: () => void
}

export default function Success({ generatedPost, onNeuesAngebot }: SuccessProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.focus()
      textarea.select()
    }
  }, [])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedPost)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="rounded border border-green-300 bg-green-50 p-6">
        <h2 className="mb-2 text-lg font-semibold text-green-800">
          Angebot erfolgreich gesendet!
        </h2>
        <p className="text-green-700">
          Die Telegram-Benachrichtigung wurde versendet.
        </p>
      </div>

      <div>
        <label htmlFor="whatsapp-post" className="mb-1 block text-sm font-medium">
          WhatsApp-Post
        </label>
        <div className="flex gap-2">
          <textarea
            id="whatsapp-post"
            ref={textareaRef}
            readOnly
            value={generatedPost}
            rows={12}
            className="flex-1 rounded border border-gray-300 px-3 py-2 font-mono text-sm"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="h-fit rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
          >
            Kopieren
          </button>
        </div>
        {copied && (
          <p className="mt-1 text-sm text-green-600">In Zwischenablage kopiert!</p>
        )}
      </div>

      <button
        type="button"
        onClick={onNeuesAngebot}
        className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
      >
        Neues Angebot erstellen
      </button>
    </div>
  )
}
