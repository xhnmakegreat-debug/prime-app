// Dev 环境通过 Vite proxy 解决 CORS；生产环境请使用 GLM 或 Ollama
const ANTHROPIC_BASE = import.meta.env.DEV ? '/anthropic' : 'https://api.anthropic.com'
const VOYAGE_BASE    = import.meta.env.DEV ? '/voyage'    : 'https://api.voyageai.com'

export async function chat(messages, systemPrompt, config) {
  const { apiKey, anthropicChatModel } = config
  const model = anthropicChatModel || 'claude-3-5-haiku-20241022'

  const res = await fetch(`${ANTHROPIC_BASE}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      system: systemPrompt,
      messages,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Anthropic chat ${res.status}: ${text}`)
  }

  const data = await res.json()
  return data.content[0].text
}

export async function embed(text, config) {
  const { voyageApiKey } = config

  const res = await fetch(`${VOYAGE_BASE}/v1/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${voyageApiKey}`,
    },
    body: JSON.stringify({
      model: 'voyage-3',
      input: [text],
      input_type: 'document',
    }),
  })

  if (!res.ok) {
    const text2 = await res.text()
    throw new Error(`Voyage embed ${res.status}: ${text2}`)
  }

  const data = await res.json()
  return data.data[0].embedding  // 1024-dim，已归一化
}
