import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getJournal, setJournal,
  getPlan, getProfile, getSettings,
  upsertHistoryEntry, getHistory, computeCumulativeP,
} from '../lib/storage.js'
import { embed, chat, checkEmbedCompatibility } from '../lib/llm.js'
import {
  computeDeltaP, computeDeltaPFromRating,
  gapAnalysis, formatDeltaP, pColorClass,
} from '../lib/scoring.js'
import { parseAttachment } from '../lib/attachments.js'
import SelfRatingButtons from '../components/SelfRatingButtons.jsx'

const TODAY = new Date().toISOString().split('T')[0]

const LEVEL_COLOR = {
  '+3': '#10b981', '+2': '#34d399', '+1': '#86efac',
  '0a': '#6b7280', '0b': '#9ca3af',
  '-1': '#fca5a5', '-2': '#f87171',
}

export default function DailyJournal({ date = TODAY, navigate }) {
  const { t } = useTranslation()
  const profile  = getProfile()
  const plan     = getPlan(date)
  const saved    = getJournal(date)
  const settings = getSettings()

  const [entries,    setEntries]    = useState(
    saved?.entries || [{ text: '', user_rating: null, embedding: null, dot_score: null, delta_P: null, dimension_idx: 0, duration_hours: 1, attachments: [], attachment_analysis: null }]
  )
  const [scoring,    setScoring]    = useState(null)
  const [uploading,  setUploading]  = useState(null)
  const [scoringMsg, setScoringMsg] = useState('')
  const [error,      setError]      = useState(null)
  const fileInputRefs = useRef({})

  const compat = checkEmbedCompatibility(profile)

  function addEntry() {
    setEntries([...entries, { text: '', user_rating: null, embedding: null, dot_score: null, delta_P: null, dimension_idx: 0, duration_hours: 1, attachments: [], attachment_analysis: null }])
  }

  async function handleFiles(i, files) {
    setUploading(i)
    setError(null)
    try {
      const parsed = []
      for (const file of files) {
        const attachment = await parseAttachment(file)
        parsed.push(attachment)
      }
      const updated = entries.map((e, idx) =>
        idx === i ? { ...e, attachments: [...(e.attachments || []), ...parsed] } : e
      )
      setEntries(updated)
      saveToStorage(updated)
    } catch (e) {
      setError(e.message)
    } finally {
      setUploading(null)
    }
  }

  function removeAttachment(entryIdx, attachmentId) {
    const updated = entries.map((e, idx) =>
      idx === entryIdx ? { ...e, attachments: (e.attachments || []).filter((a) => a.id !== attachmentId) } : e
    )
    setEntries(updated)
    saveToStorage(updated)
  }

  function updateEntry(i, field, value) {
    setEntries(entries.map((e, idx) =>
      idx === i ? { ...e, [field]: value } : e
    ))
  }

  function saveToStorage(updatedEntries) {
    const totalDeltaP = updatedEntries.reduce((s, e) => s + (e.delta_P || 0), 0)
    setJournal(date, { date, entries: updatedEntries, total_delta_P: totalDeltaP, report: saved?.report || null })

    const history = getHistory()
    const withCum = computeCumulativeP(history)
    const prevCum = withCum.filter((h) => h.date < date)
    const prevCumP = prevCum.length ? prevCum[prevCum.length - 1].cumulative_P : 0
    upsertHistoryEntry({
      date,
      delta_P:         totalDeltaP,
      cumulative_P:    prevCumP + totalDeltaP,
      avg_dot:         avg(updatedEntries.map((e) => e.dot_score).filter((v) => v !== null)),
      avg_user_rating: avg(updatedEntries.map((e) => e.user_rating).filter((v) => v !== null)),
    })
  }

  async function scoreEntry(i) {
    const entry = entries[i]
    if (entry.user_rating === null) { setError(t('journal.error_no_rating')); return }
    if (!profile) { setError(t('journal.error_no_profile')); return }
    if (!compat.ok) { setError(t('journal.error_compat', { cur: compat.current, prev: compat.profileProvider })); return }

    setScoring(i)
    setScoringMsg('')
    setError(null)

    try {
      let delta_P, dot_score, embedding, attachment_analysis = entry.attachment_analysis

      const attachments = entry.attachments || []
      if (attachments.length && !attachment_analysis) {
        setScoringMsg(t('journal.attach_analyzing'))
        const systemPrompt = '你是一个日志分析助手。请简洁描述用户上传的附件内容，提取关键信息用于日志记录分析。'
        const userMsg = `请分析以下附件并描述其主要内容（100字以内）。`
        attachment_analysis = await chat(
          [{ role: 'user', content: userMsg }],
          systemPrompt,
          attachments.map((a) => ({ type: a.type, mime: a.mime, data: a.data, name: a.name }))
        )
      }

      setScoringMsg(t('journal.score_computing'))
      const textForEmbed = [entry.text, attachment_analysis].filter(Boolean).join('\n\n')

      if (textForEmbed.trim()) {
        setScoringMsg(t('journal.embed_computing'))
        const entryVec = await embed(textForEmbed)
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
        idx === i ? { ...e, delta_P, dot_score, embedding, gap, attachment_analysis } : e
      )
      setEntries(updated)
      saveToStorage(updated)
    } catch (e) {
      setError(`${e.message}`)
    } finally {
      setScoring(null)
      setScoringMsg('')
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
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>{t('journal.title')}</h1>
          <span className="mono text-muted" style={{ fontSize: '13px' }}>{date}</span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: 6 }}>
          {t('journal.subtitle')}
        </p>
      </div>

      {!compat.ok && (
        <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'var(--red-soft)', color: 'var(--red)', fontSize: '13px' }}>
          {t('journal.error_compat', { cur: compat.current, prev: compat.profileProvider })}
        </div>
      )}

      {/* 条目列表 */}
      {entries.map((entry, i) => (
        <div key={i} className="card fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="mono text-muted" style={{ fontSize: '12px' }}>{i + 1}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => removeEntry(i)} disabled={entries.length === 1} style={{ color: 'var(--text-muted)', padding: '4px 8px' }}>×</button>
          </div>

          <textarea
            className="input"
            value={entry.text}
            onChange={(e) => updateEntry(i, 'text', e.target.value)}
            placeholder={t('journal.entry_placeholder')}
            style={{ minHeight: '80px' }}
          />

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>{t('journal.dot_label')}</label>
              <select
                className="input"
                value={entry.dimension_idx}
                onChange={(e) => updateEntry(i, 'dimension_idx', parseInt(e.target.value))}
                style={{ cursor: 'pointer' }}
              >
                {(profile?.dimensions || [{ name: '-', weight: 1 }]).map((d, di) => (
                  <option key={di} value={di}>{d.name}（{d.weight}）</option>
                ))}
              </select>
            </div>
            <div style={{ width: '100px' }}>
              <label style={labelStyle}>{t('journal.hours_unit')}</label>
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

          <div>
            <label style={labelStyle}>{t('journal.score_button')}</label>
            <SelfRatingButtons
              value={entry.user_rating}
              onChange={(r) => updateEntry(i, 'user_rating', r)}
            />
          </div>

          {/* 附件上传 */}
          <div>
            <label style={labelStyle}>{t('journal.upload_label')}</label>
            <div
              style={dropZoneStyle}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleFiles(i, [...e.dataTransfer.files]) }}
              onClick={() => fileInputRefs.current[i]?.click()}
            >
              {uploading === i
                ? <><span className="spinner" style={{ width: 14, height: 14 }} /></>
                : <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{t('journal.upload_hint')}</span>
              }
            </div>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx"
              multiple
              style={{ display: 'none' }}
              ref={(el) => { fileInputRefs.current[i] = el }}
              onChange={(e) => { handleFiles(i, [...e.target.files]); e.target.value = '' }}
            />

            {(entry.attachments || []).length > 0 && (
              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {(entry.attachments || []).map((att) => (
                  <div key={att.id} style={attachmentTagStyle}>
                    <span>{att.type === 'image' ? '🖼' : att.type === 'pdf' ? '📄' : '📝'} {att.name}</span>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1 }} onClick={() => removeAttachment(i, att.id)}>×</button>
                  </div>
                ))}
              </div>
            )}

            {entry.attachment_analysis && (
              <details style={{ marginTop: '8px' }}>
                <summary style={{ fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer' }}>{t('journal.attach_analysis_label')}</summary>
                <p style={{ fontSize: '13px', marginTop: '6px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{entry.attachment_analysis}</p>
              </details>
            )}
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => scoreEntry(i)}
            disabled={scoring === i || uploading === i || entry.user_rating === null}
            style={{ alignSelf: 'flex-start' }}
          >
            {scoring === i
              ? <><span className="spinner" style={{ width: 14, height: 14 }} /> {scoringMsg || t('journal.scoring')}</>
              : entry.delta_P !== null ? t('journal.score_button') : t('journal.score_button')
            }
          </button>

          {entry.delta_P !== null && (
            <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '24px' }}>
                <div>
                  <div style={labelStyle}>{t('journal.delta_label')}</div>
                  <div className={`mono ${pColorClass(entry.delta_P)}`} style={{ fontSize: '18px', fontWeight: 700 }}>
                    {formatDeltaP(entry.delta_P)}
                  </div>
                </div>
                {entry.dot_score !== null && (
                  <div>
                    <div style={labelStyle}>{t('journal.dot_label')}</div>
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
        {t('journal.add_entry')}
      </button>

      {hasScored && (
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px' }}>
          <div>
            <div style={labelStyle}>{t('dashboard.today_delta')}</div>
            <div className={`mono ${pColorClass(totalDeltaP)}`} style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em' }}>
              {formatDeltaP(totalDeltaP)}
            </div>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => navigate('dailyReport', date)}>
            {t('report.generate_button')} →
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

const dropZoneStyle = {
  border: '1.5px dashed var(--border)',
  borderRadius: '8px',
  padding: '12px 16px',
  cursor: 'pointer',
  textAlign: 'center',
  transition: 'border-color 0.15s',
}

const attachmentTagStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '5px 10px',
  borderRadius: '6px',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  fontSize: '13px',
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
