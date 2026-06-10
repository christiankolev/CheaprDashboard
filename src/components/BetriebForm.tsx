import { FormEvent, useRef, useState } from 'react'
import type { Betrieb } from '../config/betriebe'
import { fileToBase64, generatePost } from '../lib/openai'
import { sendAngebotToTelegram } from '../lib/telegram'
import Success from './Success'

interface BetriebFormProps {
  betrieb: Betrieb
}

export default function BetriebForm({ betrieb }: BetriebFormProps) {
  const [produktname, setProduktname] = useState('')
  const [originalpreis, setOriginalpreis] = useState('')
  const [abholzeit, setAbholzeit] = useState('')
  const [portionen, setPortionen] = useState('')
  const [foto, setFoto] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [generatingPost, setGeneratingPost] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [generatedPost, setGeneratedPost] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetForm = () => {
    setProduktname('')
    setOriginalpreis('')
    setAbholzeit('')
    setPortionen('')
    setFoto(null)
    setError(null)
    setSuccess(false)
    setGeneratedPost('')
    setGeneratingPost(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!foto) {
      setError('Bitte ein Foto hochladen.')
      return
    }

    const preis = parseFloat(originalpreis)
    const anzahl = parseInt(portionen, 10)

    if (isNaN(preis) || preis <= 0) {
      setError('Bitte einen gültigen Originalpreis eingeben.')
      return
    }

    if (isNaN(anzahl) || anzahl < 1) {
      setError('Bitte eine gültige Anzahl Portionen eingeben.')
      return
    }

    if (!abholzeit) {
      setError('Bitte eine Abholzeit angeben.')
      return
    }

    const trimmedProduktname = produktname.trim()

    setLoading(true)
    setGeneratingPost(true)

    try {
      const { base64, mimeType } = await fileToBase64(foto)

      const post = await generatePost({
        betriebCode: betrieb.code,
        betriebName: betrieb.name,
        adresse: betrieb.adresse,
        gerichtName: trimmedProduktname,
        originalpreis: preis,
        abholzeit,
        bildBase64: base64,
        portionen: anzahl,
        mimeType,
      })

      setGeneratingPost(false)
      await sendAngebotToTelegram(foto, post)

      setGeneratedPost(post)
      setSuccess(true)
      setProduktname('')
      setOriginalpreis('')
      setAbholzeit('')
      setPortionen('')
      setFoto(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unbekannter Fehler beim Absenden.'
      setError(message)
    } finally {
      setLoading(false)
      setGeneratingPost(false)
    }
  }

  if (success && generatedPost) {
    return <Success generatedPost={generatedPost} onNeuesAngebot={resetForm} />
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="betriebsname" value={betrieb.name} />

      {error && (
        <div className="rounded border border-red-300 bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}

      {generatingPost && (
        <div className="rounded border border-blue-300 bg-blue-50 p-3 text-blue-700">
          Post wird generiert...
        </div>
      )}

      <div>
        <label htmlFor="produktname" className="mb-1 block text-sm font-medium">
          Produktname
        </label>
        <input
          id="produktname"
          type="text"
          required
          value={produktname}
          onChange={(e) => setProduktname(e.target.value)}
          placeholder="z.B. Gemischte Bäckertüte"
          className="w-full rounded border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="foto" className="mb-1 block text-sm font-medium">
          Foto
        </label>
        <input
          id="foto"
          ref={fileInputRef}
          type="file"
          accept="image/*"
          required
          onChange={(e) => setFoto(e.target.files?.[0] ?? null)}
          className="w-full"
        />
      </div>

      <div>
        <label htmlFor="originalpreis" className="mb-1 block text-sm font-medium">
          Originalpreis (€)
        </label>
        <input
          id="originalpreis"
          type="number"
          step="0.01"
          min="0.01"
          required
          value={originalpreis}
          onChange={(e) => setOriginalpreis(e.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="abholzeit" className="mb-1 block text-sm font-medium">
          Abholzeit
        </label>
        <input
          id="abholzeit"
          type="time"
          required
          value={abholzeit}
          onChange={(e) => setAbholzeit(e.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="portionen" className="mb-1 block text-sm font-medium">
          Anzahl verfügbarer Portionen
        </label>
        <input
          id="portionen"
          type="number"
          min="1"
          step="1"
          required
          value={portionen}
          onChange={(e) => setPortionen(e.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-2"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {generatingPost
          ? 'Post wird generiert...'
          : loading
            ? 'Wird an Telegram gesendet…'
            : 'Angebot absenden'}
      </button>
    </form>
  )
}
