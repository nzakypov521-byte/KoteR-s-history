// src/utils/groq.js
export async function parseVoiceWithGroq(text, baseCurrency = 'KGS') {
  const response = await fetch('/api/parse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, baseCurrency }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error || `Ошибка сервера ${response.status}`)
  }

  const data = await response.json()

  if (!Array.isArray(data.transactions) || data.transactions.length === 0) {
    throw new Error('Пустой ответ')
  }

  return data.transactions
}