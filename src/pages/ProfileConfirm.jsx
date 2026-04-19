import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getProfile, setProfile, setQuestionnaire } from '../lib/storage.js'
import { embed } from '../lib/llm.js'
import { getSettings } from '../lib/storage.js'

export default function ProfileConfirm({ onComplete, navigate }) {
  const { t } = useTranslation()
  const initial = getProfile() || {}
  const [coreIdentity,  setCoreIdentity]  = useState(initial.core_identity || '')
  const [dimensions,    setDimensions]    = useState(initial.dimensions || [])
  const [antiPatterns,  setAntiPatterns]  = useState(initial.anti_patterns || [])
  const [currentStage,  setCurrentStage]  = useState(initial.current_stage || '')
  const [newTag,        setNewTag]        = useState('')
  const [locking,       setLocking]       = useState(false)
  const [error,         setError]         = useState(null)

  const weightSum = dimensions.reduce((s, d) => s + (parseFloat(d.weight) || 0), 0)
  const weightOk  = Math.abs(weightSum - 1.0) < 0.001

  function updateDim(i, field, value) {
    const next = dimensions.map((d, idx) =>
      idx === i ? { ...d, [field]: field === 'weight' ? parseFloat(value) || 0 : value } : d
    )
    setDimensions(next)
  }

  function addDim() {
    if (dimensions.length >= 4) return
    setDimensions([...dimensions, { name: '', weight: 0 }])
  }

  function removeDim(i) {
    setDimensions(dimensions.filter((_, idx) => idx !== i))
  }

  function addTag(e) {
    e.preventDefault()
    if (!newTag.trim()) return
    setAntiPatterns([...antiPatterns, newTag.trim()])
    setNewTag('')
  }

  async function handleLock() {
    if (!weightOk || !coreIdentity.trim()) return
    setLocking(true)
    setError(null)
    try {
      const vec = await embed(coreIdentity)
      const settings = getSettings()
      setProfile({
        core_identity:      coreIdentity,
        dimensions,
        anti_patterns:      antiPatterns,
        current_stage:      currentStage,
        embedding:          vec,
        embedding_provider: settings.provider,
        version:            1,
        updated_at:         new Date().toISOString(),
      })
      onComplete()
    } catch (e) {
      setError(t('profile_confirm.error_embed', { msg: e.message }))
    } finally {
      setLocking(false)
    }
  }

  function handleRegenerate() {
    setQuestionnaire({ messages: [], completed: false })
    navigate('questionnaire')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)' }}>{t('profile_confirm.title')}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: 6 }}>
          {t('profile_confirm.subtitle')}
        </p>
      </div>

      {/* 核心身份 */}
      <div className="card">
        <label style={labelStyle}>{t('profile_confirm.core_identity_label')}</label>
        <textarea
          className="input"
          value={coreIdentity}
          onChange={(e) => setCoreIdentity(e.target.value)}
          placeholder={t('profile_confirm.core_identity_label')}
          style={{ minHeight: '80px' }}
        />
      </div>

      {/* 维度 */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <label style={labelStyle}>{t('profile_confirm.dimensions_label')}</label>
          <span className="mono" style={{ fontSize: '13px', color: weightOk ? 'var(--green)' : 'var(--red)' }}>
            {t('profile_confirm.weight_sum')} {weightSum.toFixed(2)} {weightOk ? t('profile_confirm.weight_ok') : t('profile_confirm.weight_error')}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {dimensions.map((d, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                className="input"
                type="text"
                value={d.name}
                onChange={(e) => updateDim(i, 'name', e.target.value)}
                placeholder={t('profile_confirm.dim_name_placeholder')}
                style={{ flex: 1 }}
              />
              <input
                className="input"
                type="number"
                value={d.weight}
                onChange={(e) => updateDim(i, 'weight', e.target.value)}
                min="0" max="1" step="0.05"
                style={{ width: '80px', textAlign: 'center' }}
              />
              <button
                type="button"
                onClick={() => removeDim(i)}
                className="btn btn-ghost btn-sm"
                style={{ color: 'var(--red)', padding: '6px 8px' }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        {dimensions.length < 4 && (
          <button type="button" onClick={addDim} className="btn btn-ghost btn-sm" style={{ marginTop: 12, color: 'var(--accent)' }}>
            {t('profile_confirm.add_dim')}
          </button>
        )}
      </div>

      {/* 反模式 */}
      <div className="card">
        <label style={labelStyle}>{t('profile_confirm.anti_patterns_label')}</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
          {antiPatterns.map((tag, i) => (
            <span
              key={i}
              className="badge badge-red"
              style={{ cursor: 'pointer' }}
              onClick={() => setAntiPatterns(antiPatterns.filter((_, idx) => idx !== i))}
            >
              {tag} ×
            </span>
          ))}
        </div>
        <form onSubmit={addTag} style={{ display: 'flex', gap: '8px' }}>
          <input
            className="input"
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder={t('profile_confirm.add_tag_placeholder')}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-secondary btn-sm" disabled={!newTag.trim()}>
            {t('profile_confirm.add_tag_button')}
          </button>
        </form>
      </div>

      {/* 当前阶段 */}
      <div className="card">
        <label style={labelStyle}>{t('profile_confirm.current_stage_label')}</label>
        <input
          className="input"
          type="text"
          value={currentStage}
          onChange={(e) => setCurrentStage(e.target.value)}
          placeholder={t('profile_confirm.current_stage_label')}
        />
      </div>

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'var(--red-soft)', color: 'var(--red)', fontSize: '13px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          type="button"
          className="btn btn-primary btn-lg"
          onClick={handleLock}
          disabled={!weightOk || !coreIdentity.trim() || locking}
          style={{ flex: 1 }}
        >
          {locking
            ? <><span className="spinner" style={{ width: 16, height: 16 }} /> {t('profile_confirm.locking')}</>
            : t('profile_confirm.lock_button')}
        </button>
        <button type="button" className="btn btn-ghost btn-lg" onClick={handleRegenerate}>
          {t('profile_confirm.regenerate_button')}
        </button>
      </div>
    </div>
  )
}

const labelStyle = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  color: 'var(--text-muted)',
  marginBottom: '10px',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
}
