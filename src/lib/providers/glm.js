const BASE = 'https://open.bigmodel.cn/api/paas/v4'

export async function chat(messages, systemPrompt, config, attachments = []) {
  const { apiKey, glmChatModel } = config
  const model = glmChatModel || 'glm-4v'

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
        ...buildGLMMessages(messages, attachments),
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

// GLM-4V uses same format as OpenAI vision
function buildGLMMessages(messages, attachments) {
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
