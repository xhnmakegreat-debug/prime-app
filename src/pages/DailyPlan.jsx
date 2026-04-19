import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getPlan, setPlan, getProfile } from '../lib/storage.js'
import { chat, parseLLMJson } from '../lib/llm.js'
import { buildPromptB } from '../lib/prompts/index.js'

const LEVEL_COLOR = {
  '+3': '#10b981', '+2': '#34d399', '+1': '#86efac',
  '0a': '#6b7280', '0b': '#9ca3af',
  '-1': '#fca5a5', '-2': '#f87171',
}

const TODAY = new Date().toISOString().split('T')[0]

export default function DailyPlan({ date = TODAY, navigate }) {
  const { t } = useTranslation()
  const saved = getPlan(date)
  const [actions,  setActions]  = useState(saved?.actions || [{ text: '', duration_hours: 1, level: null, annotation: null }])
  const [grading,  setGrading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [graded,   setGraded]   = useState(!!saved?.actions?.[0]?.level)

  function addAction() {
    setActions([...actions, { text: '', duration_hours: 1, level: null, annotation: null }])
  }

  function removeAction(i) {
    if (actions.length === 1) return
    setActions(actions.filter((_, idx) => idx !== i))
  }

  function updateAction(i, field, value) {
    setActions(actions.map((a, idx) =>
      idx === i ? { ...a, [field]: field === 'duration_hours' ? parseFloat(value) || 1 : value } : a
    ))
  }

  async function handleGrade() {
    const validActions = actions.filter((a) => a.text.trim())
    if (!validActions.length) return
    const profile = getProfile()
    if (!profile) { setError(t('plan.error_no_profile')); return }

    setGrading(true)
    setError(null)
    try {
      const { system, userMessage } = buildPromptB({ actions: validActions, profile })
      const raw = await chat([{ role: 'user', content: userMessage }], system)
      const grades = parseLLMJson(raw)

      const updated = actions.map((a) => {
        if (!a.text.trim()) return a
        const g = grades[validActions.indexOf(a)]
        return g ? { ...a, level: g.level, annotation: g.annotation } : a
      })
      setActions(updated)
      setGraded(true)
      setPlan(date, { date, actions: updated })
    } catch (e) {
      setError(t('plan.error_grade', { msg: e.message }))
    } finally {
      setGrading(false)
    }
  }

  function handleSaveAndContinue() {
    setPlan(date, { date, actions })
    navigate('dailyJournal', date)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>{t('plan.title')}</h1>
          <span className="mono text-muted" style={{ fontSize: '13px' }}>{date}</span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: 6 }}>
          {t('plan.subtitle')}
        </p>
      </div>

      {/* 行为列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {actions.map((a, i) => (
          <div key={i} className="card fade-in" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <input
                className="input"
                type="text"
                value={a.text}
                onChange={(e) => updateAction(i, 'text', e.target.value)}
                placeholder={t('plan.action_placeholder')}
                style={{ flex: 1 }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                <input
                  className="input"
                  type="number"
                  value={a.duration_hours}
                  onChange={(e) => updateAction(i, 'duration_hours', e.target.value)}
                  min="0.1" max="24" step="0.5"
                  style={{ width: '72px', textAlign: 'center' }}
                />
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('plan.hours_unit')}</span>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => removeAction(i)}
                disabled={actions.length === 1}
                style={{ color: 'var(--text-muted)', padding: '8px' }}
              >
                ×
              </button>
            </div>

            {/* 分级结果 */}
            {a.level && (
              <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  className="badge"
                  style={{ background: LEVEL_COLOR[a.level] + '22', color: LEVEL_COLOR[a.level], fontFamily: 'monospace' }}
                >
                  {a.level}
                </span>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  {a.annotation}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      <button type="button" className="btn btn-ghost" onClick={addAction} style={{ alignSelf: 'flex-start', color: 'var(--accent)' }}>
        {t('plan.add_action')}
      </button>

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'var(--red-soft)', color: 'var(--red)', fontSize: '13px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleGrade}
          disabled={grading || !actions.some((a) => a.text.trim())}
        >
          {grading
            ? <><span className="spinner" style={{ width: 14, height: 14 }} /> {t('plan.grading')}</>
            : graded ? t('plan.grade_button') : t('plan.grade_button')}
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSaveAndContinue}
          disabled={!actions.some((a) => a.text.trim())}
        >
          {t('nav.dailyJournal')} →
        </button>
      </div>
    </div>
  )
}
