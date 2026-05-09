import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

// Лимиты:
// whisper — 10 запросов в минуту (голосовой ввод)
// parse   — 20 запросов в минуту (текстовый парсинг)
export const whisperLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  prefix: 'soma:whisper',
})

export const parseLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 m'),
  prefix: 'soma:parse',
})

// Хелпер — получить IP из запроса
export function getIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown'
  )
}