// src/hooks/useWhisper.js
import { useState, useRef, useCallback } from 'react'
import { parseVoiceWithGroq } from '../utils/groq'

function hasAmount(text) {
  return /\d+|косар|косяк|тысяч|лимон|стольник|пятихатк|кусок|\d+к\b/i.test(text)
}

function saidStop(text) {
  return /\bстоп\b/i.test(text)
}

export function useWhisper({ baseCurrency, onResult, onMultiple }) {
  const [state, setState] = useState('idle')
  const [label, setLabel] = useState('')

  const recorderRef     = useRef(null)
  const chunksRef       = useRef([])
  const streamRef       = useRef(null)
  const audioCtxRef     = useRef(null)
  const silenceLoopRef  = useRef(null)
  const silenceTimerRef = useRef(null)
  const speechRecRef    = useRef(null)
  const transcriptRef   = useRef('')
  const liveTextRef     = useRef('')
  const stoppedRef      = useRef(false)

  const reset = useCallback(() => {
    setState('idle')
    setLabel('')
    transcriptRef.current = ''
    liveTextRef.current = ''
    stoppedRef.current = false
  }, [])

  const processAudio = useCallback(async () => {
    setState('processing')
    setLabel('Распознаю речь…')

    try {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      chunksRef.current = []

      // Через сервер — ключ не виден в браузере
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

      setLabel('Обрабатываю…')
      const txs = await parseVoiceWithGroq(text.trim(), baseCurrency)

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
      setLabel(err.message || 'Ошибка')
      setTimeout(reset, 3500)
    }
  }, [baseCurrency, onResult, onMultiple, reset])

  const stopAll = useCallback((shouldProcess) => {
    if (stoppedRef.current) return
    stoppedRef.current = true

    clearInterval(silenceLoopRef.current)
    clearTimeout(silenceTimerRef.current)

    if (speechRecRef.current) {
      speechRecRef.current.onend = null
      try { speechRecRef.current.stop() } catch (_) {}
      speechRecRef.current = null
    }

    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {})
      audioCtxRef.current = null
    }

    const recorder = recorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = () => {
        streamRef.current?.getTracks().forEach((t) => t.stop())
        if (shouldProcess) processAudio()
        else reset()
      }
      recorder.stop()
    } else {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      if (shouldProcess) processAudio()
      else reset()
    }
  }, [processAudio, reset])

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []
      transcriptRef.current = ''
      liveTextRef.current = ''
      stoppedRef.current = false

      // MediaRecorder для записи аудио
      const recorder = new MediaRecorder(stream)
      recorderRef.current = recorder
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.start(100)

      // AudioContext для детектора тишины
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      audioCtxRef.current = audioCtx
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 512
      audioCtx.createMediaStreamSource(stream).connect(analyser)
      const buf = new Uint8Array(analyser.frequencyBinCount)

      let silenceStart = null

      silenceLoopRef.current = setInterval(() => {
        analyser.getByteTimeDomainData(buf)
        let sum = 0
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128
          sum += v * v
        }
        const rms = Math.sqrt(sum / buf.length)

        if (rms > 0.012) {
          silenceStart = null
        } else {
          if (!silenceStart) silenceStart = Date.now()
          const silenceDuration = Date.now() - silenceStart
          const hasData = hasAmount(liveTextRef.current)
          const required = hasData ? 2000 : 5000
          if (silenceDuration >= required) {
            clearInterval(silenceLoopRef.current)
            stopAll(hasData)
          }
        }
      }, 100)

      // Web Speech для живого текста и слова "стоп"
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SR) {
        const rec = new SR()
        speechRecRef.current = rec
        rec.lang = 'ru-RU'
        rec.continuous = true
        rec.interimResults = true

        rec.onresult = (e) => {
          let interim = ''
          for (let i = e.resultIndex; i < e.results.length; i++) {
            if (e.results[i].isFinal) transcriptRef.current += e.results[i][0].transcript + ' '
            else interim = e.results[i][0].transcript
          }
          liveTextRef.current = transcriptRef.current + interim
          const full = liveTextRef.current.trim()
          if (full) setLabel(full)

          if (saidStop(liveTextRef.current)) {
            stopAll(hasAmount(transcriptRef.current))
          }
        }

        rec.onerror = () => {}
        rec.onend = () => {
          if (!stoppedRef.current && speechRecRef.current) {
            try { rec.start() } catch (_) {}
          }
        }
        try { rec.start() } catch (_) {}
      }

      setState('listening')
      setLabel('Слушаю…')

    } catch (err) {
      setState('error')
      setLabel(err.name === 'NotAllowedError'
        ? 'Нет доступа к микрофону. Разрешите в браузере.'
        : err.message || 'Ошибка микрофона')
      setTimeout(reset, 3500)
    }
  }, [baseCurrency, reset, stopAll])

  const stop = useCallback(() => {
    stopAll(hasAmount(liveTextRef.current))
  }, [stopAll])

  return { state, label, start, stop, reset }
}