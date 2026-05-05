// Вместо прямого вызова Groq Whisper — через сервер
const whisperRes = await fetch('/api/whisper', {
    method: 'POST',
    headers: { 'Content-Type': 'audio/webm' },
    body: blob,
  })
  
  if (!whisperRes.ok) {
    const err = await whisperRes.json().catch(() => ({}))
    throw new Error(err?.error || `Whisper error ${whisperRes.status}`)
  }
  
  const { text } = await whisperRes.json()
  if (!text?.trim()) throw new Error('Речь не распознана')