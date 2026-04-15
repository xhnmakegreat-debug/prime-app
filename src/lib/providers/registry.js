// ── LLM 供应商注册表 ──
// 添加新供应商步骤：
//   1. 新建 src/lib/providers/xxx.js，实现 chat() 和 embed()
//   2. import 并在 PROVIDERS 对象中注册
//   3. 将 disabled: true 改为 false（或删除该字段）即可启用

import * as glm       from './glm.js'
import * as anthropic from './anthropic.js'
import * as ollama    from './ollama.js'
import * as openai    from './openai.js'

export const PROVIDERS = {
  glm: {
    id:          'glm',
    label:       '智谱 GLM',
    description: '中文优先，国内网络，成本低',
    chatModel:   'glm-4-flash',
    embedModel:  'embedding-3',
    embedDim:    2048,
    needsApiKey:    true,
    needsVoyageKey: false,
    needsBaseUrl:   false,
    corsWarning:    false,
    adapter:     glm,
  },

  anthropic: {
    id:          'anthropic',
    label:       'Anthropic Claude',
    description: '推理质量最高，Dev 环境可用，生产需代理',
    chatModel:   'claude-3-5-haiku-20241022',
    embedModel:  'voyage-3',
    embedDim:    1024,
    needsApiKey:    true,
    needsVoyageKey: true,
    needsBaseUrl:   false,
    corsWarning:    true,
    adapter:     anthropic,
  },

  ollama: {
    id:          'ollama',
    label:       'Ollama 本地',
    description: '完全离线，零成本，隐私最强',
    chatModel:   'qwen2.5:7b',
    embedModel:  'nomic-embed-text',
    embedDim:    768,
    needsApiKey:    false,
    needsVoyageKey: false,
    needsBaseUrl:   true,
    corsWarning:    false,
    adapter:     ollama,
  },

  openai: {
    id:          'openai',
    label:       'OpenAI',
    description: '通用，英文优先',
    chatModel:   'gpt-4o-mini',
    embedModel:  'text-embedding-3-small',
    embedDim:    1536,
    needsApiKey:    true,
    needsVoyageKey: false,
    needsBaseUrl:   false,
    corsWarning:    false,
    disabled:    true,  // 改为 false 即启用
    adapter:     openai,
  },
}

/** 获取所有已启用的供应商（供 Setup 页面列出） */
export function getEnabledProviders() {
  return Object.values(PROVIDERS).filter((p) => !p.disabled)
}

/** 获取指定供应商配置，不存在或已禁用则抛出 */
export function getProvider(id) {
  const p = PROVIDERS[id]
  if (!p)          throw new Error(`未知供应商: "${id}"`)
  if (p.disabled)  throw new Error(`供应商 "${id}" 未启用`)
  return p
}
