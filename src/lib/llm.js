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

  // 从文本中提取第一个完整的 {...} 或 [...] 块（贪婪匹配最外层）
  const match = stripped.match(/([\[{][\s\S]*[\]}])/)
  if (match) {
    try { return JSON.parse(match[1]) } catch {}
  }

  // 兜底：模型返回 key: value 纯文本时，逐字段提取
  const speedMatch = stripped.match(/speed_check[：:]\s*(too_slow|on_track|too_intense|circling)/i)
  const alignMatch = stripped.match(/alignment_assessment[：:]\s*(.+?)(?:\n|速度|speed|$)/is)
  const noteMatch  = stripped.match(/speed_note[：:]\s*(.+?)(?:\n|差距|gap|$)/is)
  const gapMatch   = stripped.match(/gap_analysis[：:]\s*(.+?)(?:\n|单条|single|$)/is)
  const sugMatch   = stripped.match(/single_suggestion[：:]\s*(.+?)(?:\n|$)/is)
  if (speedMatch || alignMatch || sugMatch) {
    return {
      today_delta_P:        0,
      alignment_assessment: alignMatch?.[1]?.trim() ?? stripped.slice(0, 150),
      speed_check:          speedMatch?.[1]?.trim() ?? 'on_track',
      speed_note:           noteMatch?.[1]?.trim() ?? null,
      gap_analysis:         gapMatch?.[1]?.trim().replace(/^null$/i, null) ?? null,
      single_suggestion:    sugMatch?.[1]?.trim() ?? null,
    }
  }

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
