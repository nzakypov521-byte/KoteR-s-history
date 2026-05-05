// src/hooks/useWhisper.js
import { useState, useRef, useCallback } from 'react'
import { parseVoiceWithGroq } from '../utils/groq'

const GROQ_WHISPER_URL = 'https://api.groq.com/openai/v1/audio/transcriptions'

// Есть ли в тексте сумма (число или сленг)
function hasAmount(text) {
  return /\d+|косар|косяк|тысяч|лимон|стольник|пятихатк|кусок|\d+к\b/i.test(text)
}

// Сказал ли пользователь "стоп"
function saidStop(text) {
  return /\bстоп\b/i.test(text)
}

export function useWhisper({ baseCurrency, onResult, onMultiple }) {
  const [state, setState] = useState('idle')
  const [label, setLabel] = useState('')

  // refs — не вызывают ре-рендер, доступны внутри колбэков
  const recorderRef    = useRef(null)
  const chunksRef      = useRef([])
  const streamRef      = useRef(null)
  const audioCtxRef    = useRef(null)
  const silenceLoopRef = useRef(null)
  const silenceTimerRef= useRef(null)
  const speechRecRef   = useRef(null)
  const transcriptRef  = useRef('')   // живой текст от Web Speech
  const lastSoundRef   = useRef(0)
  const stoppedRef     = useRef(false)// флаг чтобы не вызывать стоп дважды

  // ── Сброс в исходное состояние ────────────────────────────
  const reset = useCallback(() => {
    setState('idle')
    setLabel('')
    transcriptRef.current = ''
    stoppedRef.current = false
  }, [])

  // ── Отправка аудио в Whisper → LLM ────────────────────────
  const processAudio = useCallback(async () => {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY

    setState('processing')
    setLabel('Распознаю речь…')

    try {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      chunksRef.current = []

      const form = new FormData()
      form.append('file', blob, 'audio.webm')
      form.append('model', 'whisper-large-v3')
      form.append('language', 'ru')
      form.append('response_format', 'json')

      const res = await fetch(GROQ_WHISPER_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error?.message || `Whisper error ${res.status}`)
      }

      const { text } = await res.json()
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

  // ── Остановка всего (shouldProcess = обрабатывать или нет) ─
  const stopAll = useCallback((shouldProcess) => {
    if (stoppedRef.current) return
    stoppedRef.current = true

    // Чистим таймеры
    clearInterval(silenceLoopRef.current)
    clearTimeout(silenceTimerRef.current)

    // Останавливаем Web Speech
    if (speechRecRef.current) {
      speechRecRef.current.onend = null // запрещаем авто-перезапуск
      try { speechRecRef.current.stop() } catch (_) {}
      speechRecRef.current = null
    }

    // Закрываем AudioContext
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {})
      audioCtxRef.current = null
    }

    // Останавливаем MediaRecorder
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

  // ── Запуск ────────────────────────────────────────────────
  const start = useCallback(async () => {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY
    if (!apiKey) {
      setState('error')
      setLabel('VITE_GROQ_API_KEY не указан в .env')
      setTimeout(reset, 3000)
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []
      transcriptRef.current = ''
      stoppedRef.current = false
      lastSoundRef.current = Date.now()

      // ── 1. MediaRecorder (для Whisper) ──
      const recorder = new MediaRecorder(stream)
      recorderRef.current = recorder
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.start(100)

      // ── 2. AudioContext — детектор тишины по громкости ──
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      audioCtxRef.current = audioCtx
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 512
      audioCtx.createMediaStreamSource(stream).connect(analyser)
      const buf = new Uint8Array(analyser.frequencyBinCount)

      silenceLoopRef.current = setInterval(() => {
        analyser.getByteTimeDomainData(buf)
        // RMS — среднеквадратичная громкость
        let sum = 0
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128
          sum += v * v
        }
        const rms = Math.sqrt(sum / buf.length)

        if (rms > 0.012) {
          // Есть звук — сбрасываем таймер тишины
          lastSoundRef.current = Date.now()
          clearTimeout(silenceTimerRef.current)
          silenceTimerRef.current = null
        } else {
          // Тишина — запускаем таймер если ещё не запущен
          if (!silenceTimerRef.current) {
            const hasData = hasAmount(transcriptRef.current)
            const delay = hasData ? 2000 : 5000

            silenceTimerRef.current = setTimeout(() => {
                // Пересчитываем в момент срабатывания, а не в момент старта
                const hasDataNow = hasAmount(transcriptRef.current)
                stopAll(hasDataNow)
              }, delay)
          }
        }
      }, 100)

      // ── 3. Web Speech API — живой текст + слово "стоп" ──
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
            if (e.results[i].isFinal) {
              transcriptRef.current += e.results[i][0].transcript + ' '
            } else {
              interim = e.results[i][0].transcript
            }
          }

          // Показываем живой текст над кнопкой
          const full = (transcriptRef.current + interim).trim()
          if (full) setLabel(full)

          // Проверяем слово "стоп"
          if (saidStop(transcriptRef.current + interim)) {
            stopAll(hasAmount(transcriptRef.current))
          }
        }

        rec.onerror = () => {} // ошибки не критичны, есть Whisper
        rec.onend = () => {
          // Перезапускаем пока не остановлены намеренно
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

  // Ручная остановка кнопкой
  const stop = useCallback(() => {
    stopAll(hasAmount(transcriptRef.current))
  }, [stopAll])

  return { state, label, start, stop, reset }
}