// src/hooks/useVoice.js
import { useState, useRef, useCallback } from 'react'
import { parseVoiceWithGroq } from '../utils/groq'

export function useVoice({ baseCurrency, onResult, onMultiple }) {
  const [state, setState] = useState('idle') // idle | listening | processing | done | error
  const [label, setLabel] = useState('')

  const recRef    = useRef(null)
  const silRef    = useRef(null)
  const transcRef = useRef('')

  const start = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      setState('error')
      setLabel('Голосовой ввод не поддерживается. Попробуйте Chrome.')
      setTimeout(reset, 3500)
      return
    }

    const rec = new SR()
    rec.lang = 'ru-RU'
    rec.continuous = true
    rec.interimResults = true
    transcRef.current = ''

    rec.onstart = () => {
      setState('listening')
      setLabel('Слушаю…')
    }

    rec.onresult = (e) => {
      clearTimeout(silRef.current)
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) transcRef.current += e.results[i][0].transcript + ' '
        else interim = e.results[i][0].transcript
      }
      setLabel((transcRef.current + interim).trim() || 'Слушаю…')
      // Stop after 1.5s of silence
      silRef.current = setTimeout(() => rec.stop(), 1500)
    }

    rec.onend = async () => {
      clearTimeout(silRef.current)
      const text = transcRef.current.trim()
      if (!text) { reset(); return }

      setState('processing')
      setLabel('Обрабатываю…')

      try {
        const txs = await parseVoiceWithGroq(text, baseCurrency)
        if (txs.length === 1) {
          onResult(txs)
          const t = txs[0]
          const sym = t.currency === 'KGS' ? 'с' : t.currency
          setState('done')
          setLabel(`✓ ${t.type === 'income' ? '+' : '−'}${sym}${Number(t.amount).toLocaleString('ru-RU')} — ${t.description}`)
          setTimeout(reset, 3500)
        } else {
          onMultiple(txs)
          reset()
        }
      } catch (err) {
        setState('error')
        setLabel(err.message || 'Ошибка. Попробуйте ещё раз.')
        setTimeout(reset, 3500)
      }
    }

    rec.onerror = (e) => {
      clearTimeout(silRef.current)
      if (e.error === 'aborted') { reset(); return }
      setState('error')
      setLabel('Ошибка микрофона. Проверьте разрешения.')
      setTimeout(reset, 3000)
    }

    recRef.current = rec
    rec.start()
  }, [baseCurrency, onResult, onMultiple])

  const stop = useCallback(() => {
    recRef.current?.stop()
  }, [])

  const reset = useCallback(() => {
    setState('idle')
    setLabel('')
    transcRef.current = ''
  }, [])

  return { state, label, start, stop, reset }
}
