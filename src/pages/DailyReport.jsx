import { useState } from 'react'
import { getJournal, setJournal, getProfile } from '../lib/storage.js'
import { chat, parseLLMJson } from '../lib/llm.js'
import { buildPromptC } from '../lib/prompts/index.js'
import { formatDeltaP, pColorClass } from '../lib/scoring.js'

const TODAY = new Date().toISOString().split('T')[0]

const SPEED_LABEL = {
  too_slow:   { text: '进展偏慢', color: '#fbbf24' },
  on_track:   { text: '节奏正常', color: '#34d399' },
  too_intense:{ text: '过于高强度', color: '#f87171' },
  circling:   { text: '原地打转', color: '#9ca3af' },
}

export default function DailyReport({ date = TODAY, navigate }) {
  const journal = getJournal(date)
  const profile = getProfile()
  const [generating, setGenerating] = useState(false)
  const [error,      setError]      = useState(null)
  const [report,     setReport]     = useState(journal?.report || null)

  async function handleGenerate() {
    if (!journal?.entries?.length) { setError('没有日志条目，请先填写今日日志'); return }
    if (!profile) { setError('未找到 Prime Profile'); return }

    setGenerating(true)
    setError(null)
    try {
      const { system, userMessage } = buildPromptC({
        entries:     journal.entries,
        profile,
        date,
        totalDeltaP: journal.total_delta_P ?? 0,
      })
      const raw  = await chat([{ role: 'user', content: userMessage }], system)
      const data = parseLLMJson(raw)
      setReport(data)
      setJournal(date, { ...journal, report: data })
    } catch (e) {
      setError(`报告生成失败：${e.message}`)
    } finally {
      setGenerating(false)
    }
  }

  const totalDeltaP = journal?.total_delta_P ?? null
  const speed = report ? SPEED_LABEL[report.speed_check] : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>今日报告</h1>
          <span className="mono text-muted" style={{ fontSize: '13px' }}>{date}</span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: 6 }}>
          基于今日日志数据生成的客观分析。
        </p>
      </div>

      {/* 数字概览 */}
      {totalDeltaP !== null && (
        <div className="card" style={{ display: 'flex', gap: '32px', padding: '20px' }}>
          <div>
            <div style={labelStyle}>今日 ΔP</div>
            <div className={`mono ${pColorClass(totalDeltaP)}`} style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.02em' }}>
              {formatDeltaP(totalDeltaP)}
            </div>
          </div>
          {report && speed && (
            <div>
              <div style={labelStyle}>节奏</div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: speed.color, marginTop: 4 }}>
                {speed.text}
              </div>
            </div>
          )}
          {report && (
            <div>
              <div style={labelStyle}>条目数</div>
              <div className="mono" style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-secondary)', marginTop: 2 }}>
                {journal?.entries?.length ?? 0}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 报告内容 */}
      {report ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="fade-in">
          <ReportSection title="对齐评估" content={report.alignment_assessment} />
          {report.speed_note && <ReportSection title="速度分析" content={report.speed_note} />}
          {report.gap_analysis && <ReportSection title="落差分析" content={report.gap_analysis} accent="yellow" />}
          <div className="card" style={{ borderColor: 'var(--accent)', background: 'var(--accent-soft)', padding: '20px' }}>
            <div style={labelStyle}>明日建议</div>
            <p style={{ fontSize: '15px', color: 'var(--accent-text)', lineHeight: 1.7, fontWeight: 500 }}>
              {report.single_suggestion}
            </p>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '14px' }}>
            报告尚未生成。点击下方按钮生成今日报告。
          </p>
          {error && (
            <p style={{ color: 'var(--red)', fontSize: '13px', marginBottom: '16px' }}>{error}</p>
          )}
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? <><span className="spinner" style={{ width: 16, height: 16 }} /> 生成中…</> : '生成今日报告'}
          </button>
        </div>
      )}

      {/* 已有报告时的操作 */}
      {report && (
        <div style={{ display: 'flex', gap: '12px' }}>
          <button type="button" className="btn btn-primary" onClick={() => navigate('dashboard')}>返回仪表盘</button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('dailyJournal', date)}>补充日志</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={handleGenerate} disabled={generating} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>
            {generating ? '重新生成…' : '重新生成'}
          </button>
        </div>
      )}
    </div>
  )
}

function ReportSection({ title, content, accent }) {
  const borderColor = accent === 'yellow' ? '#fbbf2444' : 'var(--border)'
  return (
    <div className="card" style={{ borderColor, padding: '20px' }}>
      <div style={labelStyle}>{title}</div>
      <p style={{ fontSize: '14px', color: 'var(--text)', lineHeight: 1.8 }}>{content}</p>
    </div>
  )
}

const labelStyle = {
  fontSize: '11px',
  fontWeight: 600,
  color: 'var(--text-muted)',
  marginBottom: '8px',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  display: 'block',
}
