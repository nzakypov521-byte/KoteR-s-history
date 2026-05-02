// src/utils/groq.js
// Uses Groq API (free tier) to parse free-form voice text into transactions.

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

const SYSTEM_PROMPT = (baseCurrency, now) => `
You are a financial transaction parser for a personal finance app.
Parse the user's voice input (in Russian, possibly with slang) into transactions.

Current datetime: ${now}
Base currency: ${baseCurrency}

Return ONLY a valid JSON array of transaction objects. No markdown, no explanations.

Each object must have:
{
  "type": "income" | "expense",
  "amount": number (positive),
  "currency": string (ISO code, e.g. "KGS", "USD", "RUB", "KZT", "UZS"),
  "description": string (short description in Russian),
  "category": string (see list below),
  "date": ISO8601 string
}

Categories: Food, Transport, Shopping, Salary, Freelance, Entertainment, Health, Education, Bills, Housing, Subscription, Supplies, Sales, Travel, Other

Rules:
1. Currency slang:
   - "сом", "сомов", no currency mentioned → ${baseCurrency}
   - "бакс", "доллар", "баксов", "$", "долларов" → USD
   - "рубль", "руб", "₽" → RUB
   - "тенге", "₸" → KZT
   - "сум", "сўм" → UZS

2. Amount slang (in specified base currency):
   - "косарь", "косяк", "кусок", "штука", "тысяча" = 1000
   - "лимон", "миллион" = 1000000
   - "пятихатка" = 500
   - "стольник" = 100
   - Numbers like "2к", "5к" = ×1000

3. Quantity / repetition:
   - "2 раза", "дважды" → create 2 SEPARATE transactions
   - "10 штук по 100" → create 10 SEPARATE transactions each 100
   - "N раз за X" → create N transactions each X/N
   - "по X каждый/каждая" → each item costs X

4. Transaction type:
   - Default = expense
   - Income keywords: "получил", "заработал", "продал", "выручил", "пришло", "перевели", "выдали зарплату"

5. Date / time:
   - If not mentioned → use current datetime
   - "вчера" → yesterday same time
   - "позавчера" → 2 days ago

6. Description:
   - Keep it short and in Russian (e.g. "Купил курсы", "Продал стулья")

7. Category logic:
   - курсы, обучение, учёба → Education
   - такси, автобус, метро, маршрутка, бензин → Transport
   - продукты, еда, кофе, обед, ужин → Food
   - зарплата → Salary
   - фриланс, проект → Freelance
   - кино, игры, развлечения → Entertainment
   - аптека, врач, больница → Health
   - счёт, коммуналка → Bills
   - аренда, квартира → Housing
   - подписка, Netflix, Spotify → Subscription
   - материалы, товары для бизнеса → Supplies
   - продал товар, продажи → Sales
   - путешествие, Мальдивы, отель → Travel
   - всё остальное → Other

Return ONLY the JSON array. Example: [{"type":"expense","amount":2000,"currency":"KGS","description":"Купил курсы","category":"Education","date":"2026-04-30T18:53:00.000Z"}]
`.trim()

export async function parseVoiceWithGroq(text, baseCurrency = 'KGS') {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY
  if (!apiKey) throw new Error('VITE_GROQ_API_KEY не указан в .env')

  const now = new Date().toISOString()

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      max_tokens: 1024,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT(baseCurrency, now) },
        { role: 'user', content: text },
      ],
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Groq API error ${response.status}`)
  }

  const data = await response.json()
  const raw = data.choices?.[0]?.message?.content ?? ''

  // Strip possible markdown fences
  const clean = raw.replace(/```json|```/gi, '').trim()

  let parsed
  try {
    parsed = JSON.parse(clean)
  } catch {
    throw new Error('Не удалось распарсить ответ от Groq')
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('Пустой ответ')
  }

  return parsed
}