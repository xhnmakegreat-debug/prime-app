const BASE = 'https://open.bigmodel.cn/api/paas/v4'

export async function chat(messages, systemPrompt, config) {
  const { apiKey, glmChatModel } = config
  const model = glmChatModel || 'glm-4-flash'

  const res = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`GLM chat ${res.status}: ${text}`)
  }

  const data = await res.json()
  return data.choices[0].message.content
}

export async function embed(text, config) {
  const { apiKey } = config

  const res = await fetch(`${BASE}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: 'embedding-3', input: text }),
  })

  if (!res.ok) {
    const text2 = await res.text()
    throw new Error(`GLM embed ${res.status}: ${text2}`)
  }

  const data = await res.json()
  // GLM embedding-3 已归一化，直接返回
  return data.data[0].embedding
}
