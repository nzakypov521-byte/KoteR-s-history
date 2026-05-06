export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end()
  
    try {
      const { audio } = req.body
      if (!audio) return res.status(400).json({ error: 'Аудио пустое' })
  
      const buffer = Buffer.from(audio, 'base64')
  
      const form = new FormData()
      form.append('file', new Blob([buffer], { type: 'audio/webm' }), 'audio.webm')
      form.append('model', 'whisper-large-v3')
      form.append('language', 'ru')
      form.append('response_format', 'json')
  
      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
        body: form,
      })
  
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        return res.status(response.status).json({ error: err?.error?.message || 'Whisper error' })
      }
  
      const data = await response.json()
      res.json({ text: data.text })
  
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }