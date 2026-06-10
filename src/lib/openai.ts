const SYSTEM_PROMPT = `Du bist Assistent für meine Lebensmittel-Rettungs-Community in Prenzlauer Berg.

Ich schicke dir:
- Foto des Produkts
- Name des Gerichts
- Originalpreis in €
- Abholzeit
- Betriebscode, Betriebsname und Adresse

Preisregel: Teile den Originalpreis durch 3 und runde auf .00 oder .50 auf.
Beispiel: 12€ → 4.00€ / 11€ → 3.50€ / 14€ → 4.50€

Gib NUR den fertigen Post aus. Kein Kommentar, keine Erklärung.

Format:
[Emoji passend zum Produkt] [Code] – [Betriebsname]
📦 [Name des Gerichts]
💰 [gerechneter Preis] €  (statt [Originalpreis] €)
🕕 Abholung: bis [Uhrzeit] Uhr
📍 [Adresse]

➡️ Interesse? Schreib mir privat: „[Code] – [Anzahl] Portion(en)"
⚡️ First come, first served

Emoji-Regeln:
- Backwaren → 🥐 oder 🍞
- Sushi / Fisch → 🍣
- Pizza → 🍕
- Salate / Bowls → 🥗
- Pasta → 🍝
- Suppe → 🍲
- Süßes / Kuchen → 🍰
- Unbekannt → 🍱`

export interface GeneratePostParams {
  betriebCode: string
  betriebName: string
  adresse: string
  gerichtName: string
  originalpreis: number
  abholzeit: string
  bildBase64: string
  portionen: number
  mimeType?: string
}

export function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const match = result.match(/^data:([^;]+);base64,(.+)$/)
      if (!match) {
        reject(new Error('Foto konnte nicht in Base64 konvertiert werden.'))
        return
      }
      resolve({ base64: match[2], mimeType: match[1] })
    }
    reader.onerror = () => reject(new Error('Foto konnte nicht gelesen werden.'))
    reader.readAsDataURL(file)
  })
}

export async function generatePost(params: GeneratePostParams): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY

  if (!apiKey) {
    throw new Error(
      'OpenAI-Konfiguration fehlt. Bitte VITE_OPENAI_API_KEY in der .env setzen.',
    )
  }

  const mimeType = params.mimeType ?? 'image/jpeg'
  const userText = [
    `Betriebscode: ${params.betriebCode}`,
    `Betriebsname: ${params.betriebName}`,
    `Adresse: ${params.adresse}`,
    `Gericht: ${params.gerichtName}`,
    `Originalpreis: ${params.originalpreis}€`,
    `Abholzeit: ${params.abholzeit}`,
    `Anzahl Portionen: ${params.portionen}`,
  ].join('\n')

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: userText },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${params.bildBase64}`,
              },
            },
          ],
        },
      ],
    }),
  })

  const result = await response.json()

  if (!response.ok) {
    const message =
      result.error?.message ?? `OpenAI API Fehler (HTTP ${response.status})`
    throw new Error(message)
  }

  const content = result.choices?.[0]?.message?.content
  if (!content || typeof content !== 'string') {
    throw new Error('OpenAI hat keine Antwort geliefert.')
  }

  return content.trim()
}
