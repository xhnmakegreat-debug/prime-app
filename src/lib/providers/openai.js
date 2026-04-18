// OpenAI 适配器（预置，默认 disabled: true）
// 在 registry.js 中将 disabled 改为 false 即可启用

const BASE = 'https://api.openai.com'

export async function chat(messages, systemPrompt, config, attachments = []) {
  const { apiKey, openaiChatModel } = config
  const model = openaiChatModel || 'gpt-4o-mini'

  const res = await fetch(`${BASE}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...buildOpenAIMessages(messages, attachments),
      ],
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`OpenAI chat ${res.status}: ${text}`)
  }

  const data = await res.json()
  return data.choices[0].message.content
}

function buildOpenAIMessages(messages, attachments) {
  if (!attachments.length) return messages

  const imageBlocks = attachments
    .filter((a) => a.type === 'image')
    .map((a) => ({ type: 'image_url', image_url: { url: `data:${a.mime};base64,${a.data}` } }))

  const docText = attachments
    .filter((a) => a.type !== 'image')
    .map((a) => `[${a.name}]\n${a.data}`)
    .join('\n\n')

  return messages.map((msg, i) => {
    if (i !== messages.length - 1 || msg.role !== 'user') return msg
    const textBlock = { type: 'text', text: (docText ? docText + '\n\n' : '') + msg.content }
    return { role: 'user', content: [...imageBlocks, textBlock] }
  })
}

export async function embed(text, config) {
  const { apiKey } = config

  const res = await fetch(`${BASE}/v1/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  })

  if (!res.ok) {
    const text2 = await res.text()
    throw new Error(`OpenAI embed ${res.status}: ${text2}`)
  }

  const data = await res.json()
  return data.data[0].embedding  // 1536-dim，已归一化
}
