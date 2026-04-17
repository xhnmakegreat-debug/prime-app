import { useState } from 'react'
import {
  getProfile, setProfile, getMeNotes, addMeNote,
  getPlan, getJournal, getHistory, computeCumulativeP, getAllDates,
  getSettings, clearHistory, clearJournalsAndPlans, clearAll,
} from '../lib/storage.js'
import { chat, parseLLMJson, embed } from '../lib/llm.js'
import { buildPromptD } from '../lib/prompts/index.js'
import { formatDeltaP, pColorClass } from '../lib/scoring.js'
import PValueChart from '../components/PValueChart.jsx'

const TODAY = new Date().toISOString().split('T')[0]

export default function Me({ onOpenGuide }) {
  const profile = getProfile()
  const notes   = getMeNotes()
  const history = getHistory()
  const withCum = computeCumulativeP(history)
  const allDates = getAllDates()

  const [noteText,      setNoteText]      = useState('')
  const [submitting,    setSubmitting]    = useState(false)
  const [pendingProfile, setPendingProfile] = useState(null)  // diff 状态
  const [error,         setError]         = useState(null)
  const [success,       setSuccess]       = useState(null)
  const [selectedDate,  setSelectedDate]  = useState(TODAY)

  const plan    = getPlan(selectedDate)
  const journal = getJournal(selectedDate)
  const dayHist = withCum.find((h) => h.date === selectedDate)

  async function handleSubmitNote() {
    if (!noteText.trim()) return
    if (!profile) { setError('请先完成问卷并锁定 Prime Profile'); return }

    setSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      const { system, userMessage } = buildPromptD({ currentProfile: profile, userNotes: noteText })
      const raw        = await chat([{ role: 'user', content: userMessage }], system)
      const newProfile = parseLLMJson(raw)
      setPendingProfile(newProfile)
      addMeNote({ date: TODAY, content: noteText, triggered_update: true })
    } catch (e) {
      setError(`更新失败：${e.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  async function confirmUpdate() {
    if (!pendingProfile) return
    setSubmitting(true)
    try {
      const settings = getSettings()
      const vec = await embed(pendingProfile.core_identity)
      setProfile({
        ...pendingProfile,
        embedding:          vec,
        embedding_provider: settings.provider,
        version:            (profile?.version || 1) + 1,
        updated_at:         new Date().toISOString(),
      })
      setPendingProfile(null)
      setNoteText('')
      setSuccess('Prime Profile 已更新！')
    } catch (e) {
      setError(`Embedding 生成失败：${e.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 700 }}>我的</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: 6 }}>
          查看 Prime Profile、浏览历史记录、更新方向。
        </p>
      </div>

      {/* Prime Profile 卡片 */}
      {profile ? (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={labelStyle}>Prime Profile · v{profile.version}</div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              更新于 {profile.updated_at?.slice(0, 10) ?? '—'}
            </span>
          </div>

          <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', marginBottom: '16px', lineHeight: 1.5 }}>
            {profile.core_identity}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            {profile.dimensions?.map((d, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{d.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '80px', height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${d.weight * 100}%`, height: '100%', background: 'var(--accent)', borderRadius: '2px' }} />
                  </div>
                  <span className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)', width: '32px', textAlign: 'right' }}>
                    {(d.weight * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {profile.anti_patterns?.map((p, i) => (
              <span key={i} className="badge badge-red">{p}</span>
            ))}
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
          尚未生成 Prime Profile，请先完成问卷。
        </div>
      )}

      {/* P 值趋势 */}
      {withCum.length > 0 && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ ...labelStyle, marginBottom: '12px' }}>P 值趋势（全部）</div>
          <PValueChart data={withCum} height={160} />
        </div>
      )}

      {/* 更新 Prime */}
      {profile && (
        <div className="card">
          <div style={{ ...labelStyle, marginBottom: '12px' }}>更新 Prime</div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.6 }}>
            描述近期的变化、新目标或感悟。AI 将结合当前 Profile 提出更新建议。
          </p>
          <textarea
            className="input"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="例如：最近开始意识到，单纯追求规模不再是我的核心动力……"
            style={{ minHeight: '100px', marginBottom: '12px' }}
          />

          {/* Diff 预览 */}
          {pendingProfile && (
            <div style={{
              padding: '16px',
              borderRadius: '10px',
              background: 'var(--accent-soft)',
              border: '1px solid var(--accent)',
              marginBottom: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }} className="fade-in">
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-text)' }}>AI 建议的更新</div>

              {/* core_identity diff */}
              <div>
                <div style={{ ...labelStyle, marginBottom: 4 }}>核心身份</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'line-through', marginBottom: 2 }}>
                  {profile.core_identity}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--accent-text)', fontWeight: 500 }}>
                  {pendingProfile.core_identity}
                </div>
              </div>

              {/* dimensions diff */}
              <div>
                <div style={{ ...labelStyle, marginBottom: 6 }}>维度权重变化</div>
                {pendingProfile.dimensions?.map((d, i) => {
                  const old = profile.dimensions?.find((od) => od.name === d.name)
                  const diff = old ? d.weight - old.weight : null
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: 4 }}>
                      <span>{d.name}</span>
                      <span className="mono">
                        {old && <span style={{ color: 'var(--text-muted)', textDecoration: 'line-through', marginRight: 8 }}>{old.weight}</span>}
                        <span style={{ color: diff > 0 ? 'var(--green)' : diff < 0 ? 'var(--red)' : 'var(--text-secondary)' }}>
                          {d.weight}
                          {diff != null && diff !== 0 && <span style={{ fontSize: '11px', marginLeft: 4 }}>({diff > 0 ? '+' : ''}{diff.toFixed(2)})</span>}
                        </span>
                      </span>
                    </div>
                  )
                })}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={confirmUpdate}
                  disabled={submitting}
                >
                  {submitting ? '更新中…' : '确认更新'}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setPendingProfile(null)}
                >
                  取消
                </button>
              </div>
            </div>
          )}

          {error   && <p style={{ color: 'var(--red)',   fontSize: '13px', marginBottom: 12 }}>{error}</p>}
          {success && <p style={{ color: 'var(--green)', fontSize: '13px', marginBottom: 12 }}>{success}</p>}

          {!pendingProfile && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleSubmitNote}
              disabled={submitting || !noteText.trim()}
            >
              {submitting ? <><span className="spinner" style={{ width: 14, height: 14 }} /> 分析中…</> : '提交并更新 Prime'}
            </button>
          )}
        </div>
      )}

      {/* 历史记录浏览 */}
      <div className="card">
        <div style={{ ...labelStyle, marginBottom: '16px' }}>历史记录浏览</div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>选择日期</label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="date"
              className="input"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={TODAY}
              style={{ width: '180px' }}
            />
            {allDates.length > 0 && (
              <select
                className="input"
                onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                value=""
                style={{ flex: 1 }}
              >
                <option value="">有记录的日期…</option>
                {allDates.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            )}
          </div>
        </div>

        {/* 当日数据展示 */}
        {dayHist || plan || journal ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="fade-in">
            {/* 数字摘要 */}
            {dayHist && (
              <div style={{ display: 'flex', gap: '24px', padding: '16px', background: 'var(--bg-elevated)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <Stat label="ΔP" value={formatDeltaP(dayHist.delta_P, 3)} cls={pColorClass(dayHist.delta_P)} />
                <Stat label="累计 P" value={formatDeltaP(dayHist.cumulative_P, 2)} cls={pColorClass(dayHist.cumulative_P)} />
                {dayHist.avg_dot   != null && <Stat label="对齐均分" value={dayHist.avg_dot.toFixed(3)} />}
                {dayHist.avg_user_rating != null && <Stat label="自评均分" value={(dayHist.avg_user_rating >= 0 ? '+' : '') + dayHist.avg_user_rating.toFixed(1)} />}
              </div>
            )}

            {/* 计划 */}
            {plan?.actions?.length > 0 && (
              <div>
                <div style={{ ...labelStyle, marginBottom: '8px' }}>计划</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {plan.actions.filter((a) => a.text).map((a, i) => (
                    <span key={i} className="badge badge-neutral" style={{ gap: '6px' }}>
                      {a.level && <span style={{ fontWeight: 700, color: a.level.startsWith('+') ? 'var(--green)' : a.level.startsWith('-') ? 'var(--red)' : 'var(--neutral)' }}>{a.level}</span>}
                      {a.text.slice(0, 30)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 日志条目数 */}
            {journal?.entries?.length > 0 && (
              <div>
                <div style={{ ...labelStyle, marginBottom: '8px' }}>日志</div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  共 {journal.entries.length} 条记录，
                  {journal.entries.filter((e) => e.dot_score != null).length} 条已评分
                </p>
              </div>
            )}

            {/* 报告摘要 */}
            {journal?.report && (
              <div style={{ padding: '14px 16px', borderRadius: '10px', background: 'var(--accent-soft)', border: '1px solid var(--accent)' }}>
                <div style={{ ...labelStyle, color: 'var(--accent-text)', marginBottom: 6 }}>报告建议</div>
                <p style={{ fontSize: '13px', color: 'var(--accent-text)', lineHeight: 1.7 }}>
                  {journal.report.single_suggestion}
                </p>
              </div>
            )}
          </div>
        ) : (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '24px 0', textAlign: 'center' }}>
            {selectedDate} 暂无记录
          </p>
        )}
      </div>

      {/* 使用指南入口 */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '3px' }}>使用指南</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>关于 PRIME 的思想基础与使用方法</div>
        </div>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onOpenGuide}>
          查看指南
        </button>
      </div>

      {/* 数据管理 */}
      <DataReset />

      {/* 笔记历史 */}
      {notes.length > 0 && (
        <div className="card">
          <div style={{ ...labelStyle, marginBottom: '12px' }}>提交记录</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[...notes].reverse().slice(0, 10).map((n, i) => (
              <div key={i} style={{ padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                  <span>{n.date}</span>
                  {n.triggered_update && <span style={{ color: 'var(--accent-text)' }}>触发了 Prime 更新</span>}
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{n.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const CONFIRM_COPY = {
  history:  { title: '确认清零 P 值历史？', body: '将清除所有 ΔP 记录和累计 P，图表归零。Profile 和日志内容保留。此操作不可撤销。' },
  journals: { title: '确认清除日志与计划？', body: '将删除所有日期的日志条目和计划记录，P 值历史保留。此操作不可撤销。' },
  all:      { title: '确认清除全部数据？', body: '将删除所有用户数据，包括 Profile、问卷、日志、计划和 P 值历史，应用回到初始状态。此操作不可撤销。' },
}

function DataReset() {
  const [confirm, setConfirm] = useState(null) // 'history' | 'journals' | 'all'

  function handleConfirm() {
    if (confirm === 'history') clearHistory()
    else if (confirm === 'journals') clearJournalsAndPlans()
    else if (confirm === 'all') clearAll()
    setConfirm(null)
    window.location.reload()
  }

  const copy = confirm ? CONFIRM_COPY[confirm] : null

  return (
    <div className="card" style={{ borderColor: 'var(--border)' }}>
      <div style={{ ...labelStyle, marginBottom: '16px' }}>数据管理</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <ResetRow
          label="P 值历史清零"
          desc="清除所有 ΔP 记录和累计 P，图表归零。Profile 和日志内容保留。"
          onReset={() => setConfirm('history')}
        />
        <ResetRow
          label="日志与计划清除"
          desc="删除所有日期的日志条目和计划，P 值历史保留。"
          onReset={() => setConfirm('journals')}
        />
        <ResetRow
          label="清除全部数据，完全重来"
          desc="删除所有用户数据，应用回到初始状态，重新走配置和问卷流程。"
          onReset={() => setConfirm('all')}
          danger
        />
      </div>

      {/* 二次确认弹窗 */}
      {confirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
        }}>
          <div style={{
            width: '100%', maxWidth: '360px',
            background: 'var(--bg-elevated)', border: `1px solid ${confirm === 'all' ? 'var(--red)' : 'var(--border)'}`,
            borderRadius: '14px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px',
          }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: confirm === 'all' ? 'var(--red)' : 'var(--text)', marginBottom: '8px' }}>
                {copy.title}
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {copy.body}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleConfirm}>确认清除</button>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setConfirm(null)}>取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ResetRow({ label, desc, onReset, danger = false }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '12px 14px', background: danger ? 'var(--red-soft)' : 'var(--bg-elevated)',
      borderRadius: '10px', border: `1px solid ${danger ? 'color-mix(in srgb, var(--red) 30%, transparent)' : 'var(--border)'}`, gap: '16px',
    }}>
      <div>
        <div style={{ fontSize: '13px', fontWeight: 600, color: danger ? 'var(--red)' : 'var(--text)', marginBottom: '3px' }}>{label}</div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</div>
      </div>
      <button type="button" className="btn btn-sm" onClick={onReset}
        style={{ flexShrink: 0, background: 'transparent', border: '1.5px solid var(--red)', color: 'var(--red)', borderRadius: '8px' }}>
        清除
      </button>
    </div>
  )
}

function Stat({ label, value, cls = '' }) {
  return (
    <div>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div className={`mono ${cls}`} style={{ fontSize: '18px', fontWeight: 700 }}>{value}</div>
    </div>
  )
}

const labelStyle = {
  fontSize: '11px',
  fontWeight: 600,
  color: 'var(--text-muted)',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  display: 'block',
}
