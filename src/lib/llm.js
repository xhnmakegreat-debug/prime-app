import { getProvider } from './providers/registry.js'
import { getSettings } from './storage.js'

/**
 * 发送聊天请求
 * @param {Array<{role: string, content: string}>} messages
 * @param {string} systemPrompt
 * @returns {Promise<string>}
 */
// attachments: Array<{ type: 'image'|'pdf'|'word', mime: string, data: string }>
// data is base64 for images, extracted text for pdf/word
export async function chat(messages, systemPrompt, attachments = []) {
  const settings = getSettings()
  const { adapter } = getProvider(settings.provider)
  return adapter.chat(messages, systemPrompt, settings, attachments)
}

/**
 * 获取文本的 embedding 向量
 * @param {string} text
 * @returns {Promise<number[]>}
 */
export async function embed(text) {
  const settings = getSettings()
  const { adapter, embedDim, id } = getProvider(settings.provider)
  const vec = await adapter.embed(text, settings)

  if (vec.length !== embedDim) {
    console.warn(`[llm] embed dim mismatch for provider "${id}": expected ${embedDim}, got ${vec.length}`)
  }

  return vec
}

/**
 * 解析 LLM 返回的 JSON（兼容 markdown 代码块包裹）
 * @param {string} raw
 * @returns {any}
 */
export function parseLLMJson(raw) {
  // 先尝试直接解析
  try { return JSON.parse(raw.trim()) } catch {}

  // 去除 markdown 代码块后再试
  const stripped = raw
    .replace(/^```(?:json)?\s*/im, '')
    .replace(/```\s*$/m, '')
    .trim()
  try { return JSON.parse(stripped) } catch {}

  // 从文本中提取第一个完整的 {...} 或 [...] 块
  const match = stripped.match(/([\[{][\s\S]*[\]}])/)
  if (match) return JSON.parse(match[1])

  throw new SyntaxError(`无法从 LLM 响应中提取 JSON：${raw.slice(0, 200)}`)
}

/**
 * 检测当前配置的供应商与 Profile 的 embedding_provider 是否一致
 * @returns {{ ok: boolean, current: string, profileProvider: string|null }}
 */
export function checkEmbedCompatibility(profile) {
  const settings = getSettings()
  const current = settings.provider
  const profileProvider = profile?.embedding_provider ?? null
  return {
    ok: profileProvider === null || profileProvider === current,
    current,
    profileProvider,
  }
}
