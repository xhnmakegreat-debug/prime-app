import { useState } from 'react'
import {
  getJournal, setJournal,
  getPlan, getProfile, getSettings,
  upsertHistoryEntry, getHistory, computeCumulativeP,
} from '../lib/storage.js'
import { embed, checkEmbedCompatibility } from '../lib/llm.js'
import {
  computeDeltaP, computeDeltaPFromRating,
  gapAnalysis, formatDeltaP, pColorClass,
} from '../lib/scoring.js'
import SelfRatingButtons from '../components/SelfRatingButtons.jsx'

const TODAY = new Date().toISOString().split('T')[0]

const LEVEL_COLOR = {
  '+3': '#10b981', '+2': '#34d399', '+1': '#86efac',
  '0a': '#6b7280', '0b': '#9ca3af',
  '-1': '#fca5a5', '-2': '#f87171',
}

export default function DailyJournal({ date = TODAY, navigate }) {
  const profile = getProfile()
  const plan    = getPlan(date)
  const saved   = getJournal(date)
  const settings = getSettings()

  const [entries, setEntries] = useState(
    saved?.entries || [{ text: '', user_rating: null, embedding: null, dot_score: null, delta_P: null, dimension_idx: 0, duration_hours: 1 }]
  )
  const [scoring,  setScoring]  = useState(null)  // index of entry being scored
  const [error,    setError]    = useState(null)

  const compat = checkEmbedCompatibility(profile)

  function addEntry() {
    setEntries([...entries, { text: '', user_rating: null, embedding: null, dot_score: null, delta_P: null, dimension_idx: 0, duration_hours: 1 }])
  }

  function updateEntry(i, field, value) {
    setEntries(entries.map((e, idx) =>
      idx === i ? { ...e, [field]: value } : e
    ))
  }

  function saveToStorage(updatedEntries) {
    const totalDeltaP = updatedEntries.reduce((s, e) => s + (e.delta_P || 0), 0)
    setJournal(date, { date, entries: updatedEntries, total_delta_P: totalDeltaP, report: saved?.report || null })

    // 更新历史
    const history = getHistory()
    const withCum = computeCumulativeP(history)
    const prevCum = withCum.filter((h) => h.date < date)
    const prevCumP = prevCum.length ? prevCum[prevCum.length - 1].cumulative_P : 0
    upsertHistoryEntry({
      date,
      delta_P:        totalDeltaP,
      cumulative_P:   prevCumP + totalDeltaP,
      avg_dot:        avg(updatedEntries.map((e) => e.dot_score).filter((v) => v !== null)),
      avg_user_rating: avg(updatedEntries.map((e) => e.user_rating).filter((v) => v !== null)),
    })
  }

  async function scoreEntry(i) {
    const entry = entries[i]
    if (entry.user_rating === null) { setError('请先选择自评分数'); return }
    if (!profile) { setError('未找到 Prime Profile'); return }
    if (!compat.ok) { setError(`供应商已切换（当前 ${compat.current}，Profile 由 ${compat.profileProvider} 生成），请在"我的"页面重新锁定 Profile`); return }

    setScoring(i)
    setError(null)

    try {
      let delta_P, dot_score, embedding
      if (entry.text.trim()) {
        const entryVec = await embed(entry.text)
        const dimWeight = profile.dimensions?.[entry.dimension_idx]?.weight ?? 1
        const result = computeDeltaP(entryVec, profile.embedding, entry.user_rating, settings.alpha, entry.duration_hours, dimWeight)
        delta_P = result.deltaP
        dot_score = result.dotScore
        embedding = entryVec
      } else {
        const dimWeight = profile.dimensions?.[entry.dimension_idx]?.weight ?? 1
        const result = computeDeltaPFromRating(entry.user_rating, entry.duration_hours, dimWeight)
        delta_P = result.deltaP
        dot_score = null
        embedding = null
      }

      const gap = dot_score !== null ? gapAnalysis(dot_score, entry.user_rating) : null

      const updated = entries.map((e, idx) =>
        idx === i ? { ...e, delta_P, dot_score, embedding, gap } : e
      )
      setEntries(updated)
      saveToStorage(updated)
    } catch (e) {
      setError(`评分失败：${e.message}`)
    } finally {
      setScoring(null)
    }
  }

  function removeEntry(i) {
    if (entries.length === 1) return
    const updated = entries.filter((_, idx) => idx !== i)
    setEntries(updated)
    saveToStorage(updated)
  }

  const totalDeltaP = entries.reduce((s, e) => s + (e.delta_P || 0), 0)
  const hasScored   = entries.some((e) => e.delta_P !== null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>今日日志</h1>
          <span className="mono text-muted" style={{ fontSize: '13px' }}>{date}</span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: 6 }}>
          记录你今天实际做了什么，选择自评分数，然后计算对齐度。
        </p>
      </div>

      {!compat.ok && (
        <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'var(--red-soft)', color: 'var(--red)', fontSize: '13px' }}>
          供应商已切换，Profile Embedding 维度不匹配。请在"我的"页面重新锁定 Profile 后再评分。
        </div>
      )}

      {/* 条目列表 */}
      {entries.map((entry, i) => (
        <div key={i} className="card fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* 头部：编号 + 删除 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="mono text-muted" style={{ fontSize: '12px' }}>条目 {i + 1}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => removeEntry(i)} disabled={entries.length === 1} style={{ color: 'var(--text-muted)', padding: '4px 8px' }}>×</button>
          </div>

          {/* 文本输入 */}
          <textarea
            className="input"
            value={entry.text}
            onChange={(e) => updateEntry(i, 'text', e.target.value)}
            placeholder="描述你做了什么（可选，未填则仅用自评计算）"
            style={{ minHeight: '80px' }}
          />

          {/* 维度 + 时长 */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>对应维度</label>
              <select
                className="input"
                value={entry.dimension_idx}
                onChange={(e) => updateEntry(i, 'dimension_idx', parseInt(e.target.value))}
                style={{ cursor: 'pointer' }}
              >
                {(profile?.dimensions || [{ name: '默认', weight: 1 }]).map((d, di) => (
                  <option key={di} value={di}>{d.name}（{d.weight}）</option>
                ))}
              </select>
            </div>
            <div style={{ width: '100px' }}>
              <label style={labelStyle}>时长（h）</label>
              <input
                className="input"
                type="number"
                value={entry.duration_hours}
                onChange={(e) => updateEntry(i, 'duration_hours', parseFloat(e.target.value) || 1)}
                min="0.1" max="24" step="0.5"
                style={{ textAlign: 'center' }}
              />
            </div>
          </div>

          {/* 自评按钮 */}
          <div>
            <label style={labelStyle}>自评</label>
            <SelfRatingButtons
              value={entry.user_rating}
              onChange={(r) => updateEntry(i, 'user_rating', r)}
            />
          </div>

          {/* 评分按钮 */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => scoreEntry(i)}
            disabled={scoring === i || entry.user_rating === null}
            style={{ alignSelf: 'flex-start' }}
          >
            {scoring === i ? <><span className="spinner" style={{ width: 14, height: 14 }} /> 计算中…</> : entry.delta_P !== null ? '重新评分' : '计算 ΔP'}
          </button>

          {/* 评分结果 */}
          {entry.delta_P !== null && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '10px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}>
              <div style={{ display: 'flex', gap: '24px' }}>
                <div>
                  <div style={labelStyle}>ΔP</div>
                  <div className={`mono ${pColorClass(entry.delta_P)}`} style={{ fontSize: '18px', fontWeight: 700 }}>
                    {formatDeltaP(entry.delta_P)}
                  </div>
                </div>
                {entry.dot_score !== null && (
                  <div>
                    <div style={labelStyle}>语义对齐</div>
                    <div className="mono" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-text)' }}>
                      {entry.dot_score.toFixed(3)}
                    </div>
                  </div>
                )}
              </div>
              {entry.gap?.hasGap && (
                <div style={{ fontSize: '13px', color: 'var(--yellow)', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                  ⚠ {entry.gap.message}
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'var(--red-soft)', color: 'var(--red)', fontSize: '13px' }}>
          {error}
        </div>
      )}

      <button type="button" className="btn btn-ghost" onClick={addEntry} style={{ alignSelf: 'flex-start', color: 'var(--accent)' }}>
        + 添加条目
      </button>

      {/* 今日汇总 */}
      {hasScored && (
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px' }}>
          <div>
            <div style={labelStyle}>今日总 ΔP</div>
            <div className={`mono ${pColorClass(totalDeltaP)}`} style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em' }}>
              {formatDeltaP(totalDeltaP)}
            </div>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('dailyReport', date)}
          >
            生成报告 →
          </button>
        </div>
      )}
    </div>
  )
}

function avg(arr) {
  if (!arr.length) return null
  return arr.reduce((s, v) => s + v, 0) / arr.length
}

const labelStyle = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 600,
  color: 'var(--text-muted)',
  marginBottom: '6px',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
}
