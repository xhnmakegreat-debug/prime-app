function normalize(vec) {
  const norm = Math.sqrt(vec.reduce((s, x) => s + x * x, 0))
  if (norm === 0) return vec
  return vec.map((x) => x / norm)
}

export async function chat(messages, systemPrompt, config) {
  const base  = config.ollamaBaseUrl || 'http://localhost:11434'
  const model = config.ollamaChatModel || 'qwen2.5:7b'

  const res = await fetch(`${base}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      stream: false,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Ollama chat ${res.status}: ${text}`)
  }

  const data = await res.json()
  return data.message.content
}

export async function embed(text, config) {
  const base  = config.ollamaBaseUrl  || 'http://localhost:11434'
  const model = config.ollamaEmbedModel || 'nomic-embed-text'

  // Ollama >= 0.3 使用 /api/embed（复数），旧版本用 /api/embeddings
  const res = await fetch(`${base}/api/embed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, input: text }),
  })

  if (!res.ok) {
    const text2 = await res.text()
    throw new Error(`Ollama embed ${res.status}: ${text2}`)
  }

  const data = await res.json()
  // /api/embed 返回 { embeddings: [[...]] }
  const vec = data.embeddings?.[0] ?? data.embedding ?? []
  // nomic-embed-text 未归一化，手动归一化
  return normalize(vec)
}
