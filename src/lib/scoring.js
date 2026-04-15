// ── 纯数学计算，无副作用 ──

const DURATION_EXPONENT = 1  // Tᵈ 中的 d，PRD 未定义，默认线性

export function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0
  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < a.length; i++) {
    dot   += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  if (normA === 0 || normB === 0) return 0
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

/**
 * 计算单条日志条目的 ΔP
 * ΔP = [α·dot(s,û) + (1-α)·r/3] · T^d · w
 *
 * @param {number[]} entryEmbedding   - 日志文本的 embedding 向量
 * @param {number[]} profileEmbedding - Prime Profile 的 embedding 向量
 * @param {number}   userRating       - 用户自评 (-3 ~ +3)
 * @param {number}   alpha            - 混合权重 (0~1，默认 0.7)
 * @param {number}   durationHours    - 时长（小时，> 0）
 * @param {number}   dimensionWeight  - 维度权重 (0~1)
 * @returns {{ deltaP: number, dotScore: number }}
 */
export function computeDeltaP(
  entryEmbedding,
  profileEmbedding,
  userRating,
  alpha = 0.7,
  durationHours = 1,
  dimensionWeight = 1
) {
  const dotScore = cosineSimilarity(entryEmbedding, profileEmbedding)
  const objective   = alpha * dotScore
  const subjective  = (1 - alpha) * (userRating / 3)
  const composite   = objective + subjective
  const T = Math.max(durationHours, 0.1)  // 避免 0 时长
  const deltaP = composite * Math.pow(T, DURATION_EXPONENT) * dimensionWeight
  return { deltaP, dotScore }
}

/**
 * 仅凭用户自评（无文本 embedding）计算 ΔP
 * 当用户未填文字时直接用 r/3
 */
export function computeDeltaPFromRating(
  userRating,
  durationHours = 1,
  dimensionWeight = 1
) {
  const T = Math.max(durationHours, 0.1)
  const deltaP = (userRating / 3) * Math.pow(T, DURATION_EXPONENT) * dimensionWeight
  return { deltaP, dotScore: null }
}

/**
 * 落差分析
 * @param {number} dotScore   - 余弦相似度 (-1 ~ 1)
 * @param {number} userRating - 用户自评 (-3 ~ +3)
 * @returns {{ hasGap: boolean, gapType: string|null, gap: number, message: string }}
 */
export function gapAnalysis(dotScore, userRating) {
  const GAP_THRESHOLD = 0.3
  const normalizedRating = userRating / 3  // 归一化到 -1 ~ 1
  const gap = normalizedRating - dotScore  // 正值 = 用户评分更高（过于乐观）

  if (Math.abs(gap) < GAP_THRESHOLD) {
    return { hasGap: false, gapType: null, gap, message: '主客观评分基本一致。' }
  }

  if (gap > 0) {
    return {
      hasGap: true,
      gapType: 'overrating',
      gap,
      message: `你的主观评分比语义对齐高 ${gap.toFixed(2)}。可能存在自我美化，或 Prime 描述不够准确。`,
    }
  }

  return {
    hasGap: true,
    gapType: 'underrating',
    gap,
    message: `你的主观评分比语义对齐低 ${Math.abs(gap).toFixed(2)}。行为上与 Prime 对齐，但情绪上有抗拒。`,
  }
}

/**
 * 漂移检测：检查近期行为是否持续偏离 Prime
 * @param {Array<{date: string, delta_P: number}>} historyEntries
 * @returns {{ isDrifting: boolean, direction: string, avgDeltaP: number }}
 */
export function driftCheck(historyEntries) {
  if (!historyEntries || historyEntries.length < 3) {
    return { isDrifting: false, direction: 'neutral', avgDeltaP: 0 }
  }
  const recent = historyEntries.slice(-14)
  const negCount = recent.filter((e) => (e.delta_P || 0) <= 0).length
  const avgDeltaP = recent.reduce((s, e) => s + (e.delta_P || 0), 0) / recent.length

  return {
    isDrifting: negCount >= Math.floor(recent.length * 0.7),
    direction: avgDeltaP >= 0 ? 'positive' : 'negative',
    avgDeltaP,
  }
}

/** 格式化 ΔP 显示，带符号 */
export function formatDeltaP(val, digits = 4) {
  if (val === null || val === undefined || isNaN(val)) return '—'
  const sign = val >= 0 ? '+' : ''
  return sign + val.toFixed(digits)
}

/** 根据数值返回 CSS 类名 */
export function pColorClass(val) {
  if (val === null || val === undefined || isNaN(val)) return 'p-zero'
  if (val > 0) return 'p-positive'
  if (val < 0) return 'p-negative'
  return 'p-zero'
}

/** 根据行为级别返回数值 */
export function levelToNumber(level) {
  const map = { '+3': 3, '+2': 2, '+1': 1, '0a': 0, '0b': 0, '-1': -1, '-2': -2 }
  return map[level] ?? 0
}
