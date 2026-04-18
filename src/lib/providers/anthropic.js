// Electron 环境中 webSecurity:false，可直连 Anthropic/Voyage API
// 浏览器 dev 模式下通过 Vite proxy（已移除 proxy 配置，如需浏览器调试请恢复）
const isElectron = typeof window !== 'undefined'
  && window.navigator.userAgent.toLowerCase().includes('electron')

const ANTHROPIC_BASE = isElectron
  ? 'https://api.anthropic.com'
  : (import.meta.env.DEV ? '/anthropic' : 'https://api.anthropic.com')

const VOYAGE_BASE = isElectron
  ? 'https://api.voyageai.com'
  : (import.meta.env.DEV ? '/voyage' : 'https://api.voyageai.com')

export async function chat(messages, systemPrompt, config, attachments = []) {
  const { apiKey, anthropicChatModel } = config
  const hasImages = attachments.some((a) => a.type === 'image')
  const model = hasImages
    ? 'claude-3-5-sonnet-20241022'
    : (anthropicChatModel || 'claude-3-5-haiku-20241022')

  // Build last user message with optional image blocks
  const builtMessages = buildAnthropicMessages(messages, attachments)

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
      messages: builtMessages,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Anthropic chat ${res.status}: ${text}`)
  }

  const data = await res.json()
  return data.content[0].text
}

function buildAnthropicMessages(messages, attachments) {
  if (!attachments.length) return messages

  const imageBlocks = attachments
    .filter((a) => a.type === 'image')
    .map((a) => ({ type: 'image', source: { type: 'base64', media_type: a.mime, data: a.data } }))

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
  return data.data[0].embedding
}
