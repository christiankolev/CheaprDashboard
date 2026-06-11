function getTelegramConfig() {
  const token = import.meta.env.VITE_TELEGRAM_BOT_TOKEN
  const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID
  if (!token || !chatId) {
    throw new Error(
      'Telegram-Konfiguration fehlt. Bitte VITE_TELEGRAM_BOT_TOKEN und VITE_TELEGRAM_CHAT_ID in der .env setzen.',
    )
  }
  return { token, chatId }
}

export async function sendAngebotToTelegram(
  foto: File,
  caption: string,
): Promise<void> {
  const { token, chatId } = getTelegramConfig()

  const formData = new FormData()
  formData.append('chat_id', chatId)
  formData.append('photo', foto)
  formData.append('caption', caption)

  const response = await fetch(
    `https://api.telegram.org/bot${token}/sendPhoto`,
    { method: 'POST', body: formData },
  )

  const result = await response.json()
  if (!response.ok || !result.ok) {
    throw new Error(result.description ?? `Telegram API Fehler (HTTP ${response.status})`)
  }
}

export async function sendTextToTelegram(text: string): Promise<void> {
  const { token, chatId } = getTelegramConfig()

  const formData = new FormData()
  formData.append('chat_id', chatId)
  formData.append('text', text)
  formData.append('parse_mode', 'HTML')

  const response = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    { method: 'POST', body: formData },
  )

  const result = await response.json()
  if (!response.ok || !result.ok) {
    throw new Error(result.description ?? `Telegram API Fehler (HTTP ${response.status})`)
  }
}
