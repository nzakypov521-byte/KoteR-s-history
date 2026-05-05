export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end()
  
    const { text, baseCurrency } = req.body
    if (!text) return res.status(400).json({ error: 'No text' })
  
    const now = new Date().toISOString()
  
    const systemPrompt = `
  You are a financial transaction parser for a personal finance app.
  Parse the user's voice input (in Russian, possibly with slang) into transactions.
  
  Current datetime: ${now}
  Base currency: ${baseCurrency || 'KGS'}
  
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
     - "сом", "сомов", no currency mentioned → ${baseCurrency || 'KGS'}
     - "бакс", "доллар", "$" → USD
     - "рубль", "руб" → RUB
     - "тенге" → KZT
     - "сум", "сўм" → UZS
  
  2. Amount slang:
     - "косарь", "косяк", "штука", "тысяча" = 1000
     - "лимон" = 1000000
     - "пятихатка" = 500
     - "стольник" = 100
     - "2к", "5к" = ×1000
  
  3. Quantity — CRITICAL:
     - "по X" = per-unit price, create N transactions each X
     - "за X" = total price, divide by quantity
     - "купил N вещей за X" → N transactions each X÷N
     - "купил N вещей по X" → N transactions each X
     - "N раз за X" → N transactions each X÷N
  
  4. Type:
     - Default = expense
     - Income: "получил", "заработал", "продал", "выручил", "пришло", "перевели"
  
  5. Date: if not mentioned → use current datetime
  
  6. Categories:
     - курсы, обучение → Education
     - такси, автобус, бензин → Transport
     - еда, кофе, обед → Food
     - зарплата → Salary
     - фриланс → Freelance
     - кино, игры → Entertainment
     - аптека, врач → Health
     - счёт, коммуналка → Bills
     - аренда, квартира → Housing
     - подписка → Subscription
     - материалы, товары → Supplies
     - продал товар → Sales
     - путешествие, отель → Travel
     - остальное → Other
  
  Return ONLY the JSON array.
  `.trim()
  
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          temperature: 0.1,
          max_tokens: 1024,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user',   content: text },
          ],
        }),
      })
  
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        return res.status(response.status).json({ error: err?.error?.message || 'Groq error' })
      }
  
      const data = await response.json()
      const raw  = data.choices?.[0]?.message?.content ?? ''
      const clean = raw.replace(/```json|```/gi, '').trim()
      const parsed = JSON.parse(clean)
  
      res.json({ transactions: parsed })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }