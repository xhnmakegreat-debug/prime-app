// ── 所有 localStorage 读写经此文件，统一 key 前缀和序列化 ──

const K = {
  SETTINGS:      'prime:settings',
  PROFILE:       'prime:profile',
  QUESTIONNAIRE: 'prime:questionnaire',
  HISTORY:       'prime:history',
  ME_NOTES:      'prime:me:notes',
  PLAN:   (d) => `prime:plans:${d}`,
  JOURNAL:(d) => `prime:journals:${d}`,
}

function safeGet(key, defaultVal) {
  try {
    const raw = localStorage.getItem(key)
    return raw !== null ? JSON.parse(raw) : defaultVal
  } catch {
    return defaultVal
  }
}

function safeSet(key, val) {
  localStorage.setItem(key, JSON.stringify(val))
}

// ── Settings ──
export function getSettings() {
  return safeGet(K.SETTINGS, {
    provider: import.meta.env.VITE_PROVIDER || 'glm',
    apiKey: import.meta.env.VITE_GLM_API_KEY || '',
    voyageApiKey: import.meta.env.VITE_VOYAGE_API_KEY || '',
    ollamaBaseUrl: import.meta.env.VITE_OLLAMA_BASE_URL || 'http://localhost:11434',
    ollamaChatModel: 'qwen2.5:7b',
    ollamaEmbedModel: 'nomic-embed-text',
    alpha: parseFloat(import.meta.env.VITE_ALPHA || '0.7'),
    theme: 'dark',
  })
}

export function setSettings(obj) {
  safeSet(K.SETTINGS, { ...getSettings(), ...obj })
}

// ── Prime Profile ──
export function getProfile() {
  return safeGet(K.PROFILE, null)
}

export function setProfile(obj) {
  safeSet(K.PROFILE, obj)
}

// ── Questionnaire ──
export function getQuestionnaire() {
  return safeGet(K.QUESTIONNAIRE, { messages: [], completed: false })
}

export function setQuestionnaire(obj) {
  safeSet(K.QUESTIONNAIRE, obj)
}

// ── Daily Plan ──
export function getPlan(date) {
  return safeGet(K.PLAN(date), null)
}

export function setPlan(date, obj) {
  safeSet(K.PLAN(date), obj)
}

// ── Daily Journal ──
export function getJournal(date) {
  return safeGet(K.JOURNAL(date), null)
}

export function setJournal(date, obj) {
  safeSet(K.JOURNAL(date), obj)
}

// ── P 值历史 ──
export function getHistory() {
  const raw = safeGet(K.HISTORY, [])
  return [...raw].sort((a, b) => a.date.localeCompare(b.date))
}

export function upsertHistoryEntry(entry) {
  const history = safeGet(K.HISTORY, [])
  const idx = history.findIndex((e) => e.date === entry.date)
  if (idx >= 0) {
    history[idx] = { ...history[idx], ...entry }
  } else {
    history.push(entry)
  }
  safeSet(K.HISTORY, history)
}

// 重新计算累计 P 值（始终从历史中推导，不依赖存储值）
export function computeCumulativeP(history) {
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date))
  let cumulative = 0
  return sorted.map((e) => {
    cumulative += e.delta_P || 0
    return { ...e, cumulative_P: cumulative }
  })
}

// ── Me 页面笔记 ──
export function getMeNotes() {
  return safeGet(K.ME_NOTES, [])
}

export function addMeNote(note) {
  const notes = getMeNotes()
  notes.push(note)
  safeSet(K.ME_NOTES, notes)
}

// ── 重置全部数据（慎用） ──
export function clearAll() {
  Object.keys(localStorage)
    .filter((k) => k.startsWith('prime:'))
    .forEach((k) => localStorage.removeItem(k))
}

// ── 获取所有有记录的日期 ──
export function getAllDates() {
  const dates = new Set()
  Object.keys(localStorage)
    .filter((k) => k.startsWith('prime:journals:') || k.startsWith('prime:plans:'))
    .forEach((k) => {
      const match = k.match(/prime:(?:journals|plans):(\d{4}-\d{2}-\d{2})/)
      if (match) dates.add(match[1])
    })
  return [...dates].sort((a, b) => b.localeCompare(a)) // 降序
}
