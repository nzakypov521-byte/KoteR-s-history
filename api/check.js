export default function handler(req, res) {
    const key = process.env.GROQ_API_KEY
    res.json({
      exists: !!key,
      length: key?.length,
      prefix: key?.slice(0, 8),
    })
  }