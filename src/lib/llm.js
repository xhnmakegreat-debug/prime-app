import { getProvider } from './providers/registry.js'
import { getSettings } from './storage.js'

/**
 * 发送聊天请求
 * @param {Array<{role: string, content: string}>} messages
 * @param {string} systemPrompt
 * @returns {Promise<string>}
 */
export async function chat(messages, systemPrompt) {
  const settings = getSettings()
  const { adapter } = getProvider(settings.provider)
  return adapter.chat(messages, systemPrompt, settings)
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
  const stripped = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/, '')
    .trim()
  return JSON.parse(stripped)
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
