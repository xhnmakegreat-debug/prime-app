import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getJournal, setJournal, getProfile } from '../lib/storage.js'
import { chat, parseLLMJson } from '../lib/llm.js'
import { buildPromptC } from '../lib/prompts/index.js'
import { formatDeltaP, pColorClass } from '../lib/scoring.js'

const TODAY = new Date().toISOString().split('T')[0]

export default function DailyReport({ date = TODAY, navigate }) {
  const { t } = useTranslation()
  const journal = getJournal(date)
  const profile = getProfile()
  const [generating, setGenerating] = useState(false)
  const [error,      setError]      = useState(null)
  const [report,     setReport]     = useState(journal?.report || null)

  const SPEED_LABEL = {
    too_slow:    { text: t('report.speed_too_slow'),    color: '#fbbf24' },
    on_track:    { text: t('report.speed_on_track'),    color: '#34d399' },
    too_intense: { text: t('report.speed_too_intense'), color: '#f87171' },
    circling:    { text: t('report.speed_circling'),    color: '#9ca3af' },
  }

  async function handleGenerate() {
    if (!journal?.entries?.length) { setError(t('report.error_no_journal')); return }
    if (!profile) { setError(t('report.error_no_profile')); return }

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
      setError(t('report.error_prefix', { msg: e.message }))
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
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>{t('report.title')}</h1>
          <span className="mono text-muted" style={{ fontSize: '13px' }}>{date}</span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: 6 }}>
          {t('report.subtitle')}
        </p>
      </div>

      {/* 数字概览 */}
      {totalDeltaP !== null && (
        <div className="card" style={{ display: 'flex', gap: '32px', padding: '20px' }}>
          <div>
            <div style={labelStyle}>{t('dashboard.today_delta')}</div>
            <div className={`mono ${pColorClass(totalDeltaP)}`} style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.02em' }}>
              {formatDeltaP(totalDeltaP)}
            </div>
          </div>
          {report && speed && (
            <div>
              <div style={labelStyle}>{t('report.speed_too_slow').split(' ')[0]}</div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: speed.color, marginTop: 4 }}>
                {speed.text}
              </div>
            </div>
          )}
          {report && (
            <div>
              <div style={labelStyle}>n</div>
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
          <ReportSection title="Alignment" content={report.alignment_assessment} />
          {report.speed_note && <ReportSection title="Pace" content={report.speed_note} />}
          {report.gap_analysis && <ReportSection title={t('report.gap_label')} content={report.gap_analysis} accent="yellow" />}
          <div className="card" style={{ borderColor: 'var(--accent)', background: 'var(--accent-soft)', padding: '20px' }}>
            <div style={labelStyle}>{t('report.suggestion_label')}</div>
            <p style={{ fontSize: '15px', color: 'var(--accent-text)', lineHeight: 1.7, fontWeight: 500 }}>
              {report.single_suggestion}
            </p>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '14px' }}>
            {t('report.subtitle')}
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
            {generating
              ? <><span className="spinner" style={{ width: 16, height: 16 }} /> {t('common.generating')}</>
              : t('report.generate_button')}
          </button>
        </div>
      )}

      {report && (
        <div style={{ display: 'flex', gap: '12px' }}>
          <button type="button" className="btn btn-primary" onClick={() => navigate('dashboard')}>{t('nav.dashboard')}</button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('dailyJournal', date)}>{t('nav.dailyJournal')}</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={handleGenerate} disabled={generating} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>
            {generating ? t('common.generating') : t('report.generate_button')}
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
