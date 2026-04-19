import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getSettings, setSettings } from '../lib/storage.js'
import { getEnabledProviders } from '../lib/providers/registry.js'
import { embed } from '../lib/llm.js'
import ThemeToggle from '../components/ThemeToggle.jsx'

export default function Setup({ onComplete, isSettings = false }) {
  const { t, i18n } = useTranslation()
  const saved     = getSettings()
  const providers = getEnabledProviders()

  const [provider,         setProvider]         = useState(saved.provider || 'glm')
  const [apiKey,           setApiKey]           = useState(saved.apiKey || '')
  const [voyageApiKey,     setVoyageApiKey]     = useState(saved.voyageApiKey || '')
  const [ollamaBaseUrl,    setOllamaBaseUrl]    = useState(saved.ollamaBaseUrl || 'http://localhost:11434')
  const [ollamaChatModel,  setOllamaChatModel]  = useState(saved.ollamaChatModel || 'qwen2.5:7b')
  const [ollamaEmbedModel, setOllamaEmbedModel] = useState(saved.ollamaEmbedModel || 'nomic-embed-text')
  const [alpha,            setAlpha]            = useState(saved.alpha ?? 0.7)
  const [language,         setLanguage]         = useState(saved.language || 'zh')
  const [testing,          setTesting]          = useState(false)
  const [testResult,       setTestResult]       = useState(null)

  const current = providers.find((p) => p.id === provider)

  function handleLanguageChange(lang) {
    setLanguage(lang)
    i18n.changeLanguage(lang)
  }

  function save(markCompleted = false) {
    setSettings({ provider, apiKey, voyageApiKey, ollamaBaseUrl, ollamaChatModel, ollamaEmbedModel, alpha, language, ...(markCompleted ? { setupCompleted: true } : {}) })
  }

  async function testConnection() {
    save()
    setTesting(true)
    setTestResult(null)
    try {
      const vec = await embed('test connection')
      setTestResult({ ok: true, msg: t('setup.test_success', { dim: vec.length }) })
    } catch (e) {
      setTestResult({ ok: false, msg: e.message })
    } finally {
      setTesting(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    save(!isSettings)
    onComplete()
  }

  const principles = [
    [t('setup.principles.local_title'),     t('setup.principles.local_desc')],
    [t('setup.principles.direction_title'), t('setup.principles.direction_desc')],
    [t('setup.principles.clarity_title'),   t('setup.principles.clarity_desc')],
    [t('setup.principles.axis_title'),      t('setup.principles.axis_desc')],
  ]

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'var(--bg)',
    }}>

      {/* ═══ 左侧品牌面板 ═══ */}
      <div style={{
        width: '40%',
        minWidth: '360px',
        background: 'var(--accent-soft)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '56px 48px',
        position: 'relative',
      }}>
        <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
          <ThemeToggle />
        </div>

        {/* Logo */}
        <div style={{ marginBottom: '40px' }}>
          <div className="mono" style={{ fontSize: '32px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.15em' }}>
            {t('app_name')}
          </div>
          <div style={{ fontSize: '15px', color: 'var(--accent-text)', marginTop: '8px', lineHeight: 1.5 }}>
            {t('app_tagline')}
          </div>
        </div>

        {/* 核心公式 */}
        <div style={{
          padding: '20px 24px',
          background: 'rgba(0,0,0,0.15)',
          borderRadius: '10px',
          marginBottom: '32px',
        }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-text)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px', opacity: 0.7 }}>
            {language === 'zh' ? '核心公式' : 'Core Formula'}
          </div>
          <div style={{ fontSize: '16px', color: 'var(--accent-text)', lineHeight: 1.8, fontFamily: "'Cambria Math', 'STIX Two Math', 'Latin Modern Math', serif" }}>
            P = ∫₀ᵀ <b>s</b>(τ) · û<sub>prime</sub>(τ) dτ
          </div>
        </div>

        {/* 设计原则 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {principles.map(([title, desc]) => (
            <div key={title} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--accent)', fontSize: '16px', marginTop: '1px', flexShrink: 0 }}>·</span>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent-text)', marginBottom: '2px' }}>{title}</div>
                <div style={{ fontSize: '13px', color: 'var(--accent-text)', opacity: 0.7, lineHeight: 1.5 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ 右侧配置面板 ═══ */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '56px 56px',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ maxWidth: '520px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
            {isSettings ? t('setup.title_settings') : t('setup.title')}
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '36px' }}>
            {isSettings ? t('setup.subtitle_settings') : t('setup.subtitle')}
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

            {/* 语言选择 */}
            <div>
              <div style={sectionLabel}>{t('setup.language_section')}</div>
              <div style={{ display: 'flex', gap: '10px' }}>
                {[
                  { code: 'zh', label: t('setup.lang_zh') },
                  { code: 'en', label: t('setup.lang_en') },
                ].map(({ code, label }) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => handleLanguageChange(code)}
                    style={{
                      padding: '8px 20px',
                      borderRadius: '8px',
                      border: `1.5px solid ${language === code ? 'var(--accent)' : 'var(--border)'}`,
                      background: language === code ? 'var(--accent-soft)' : 'var(--surface)',
                      color: language === code ? 'var(--accent-text)' : 'var(--text-secondary)',
                      fontWeight: language === code ? 600 : 400,
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s, background 0.15s',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* 供应商选择 */}
            <div>
              <div style={sectionLabel}>{t('setup.provider_section')}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {providers.map((p) => (
                  <label
                    key={p.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '14px 16px',
                      borderRadius: '10px',
                      border: `1.5px solid ${provider === p.id ? 'var(--accent)' : 'var(--border)'}`,
                      background: provider === p.id ? 'var(--accent-soft)' : 'var(--surface)',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s, background 0.15s',
                    }}
                  >
                    <input
                      type="radio"
                      name="provider"
                      value={p.id}
                      checked={provider === p.id}
                      onChange={() => setProvider(p.id)}
                      style={{ marginTop: '3px', accentColor: 'var(--accent)', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>{p.label}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>{p.description}</div>
                    </div>
                    {provider === p.id && (
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', padding: '2px 8px', background: 'var(--accent-soft)', borderRadius: '4px', flexShrink: 0, alignSelf: 'center' }}>
                        {t('setup.selected_badge')}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Anthropic CORS 提示 */}
            {current?.corsWarning && (
              <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'var(--red-soft)', border: '1px solid var(--border)', fontSize: '13px', color: 'var(--red)', lineHeight: 1.6 }}>
                {t('setup.cors_warning')}
              </div>
            )}

            {/* 动态配置字段 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {current?.needsApiKey && (
                <div>
                  <label style={fieldLabel}>{t('setup.api_key_label')}</label>
                  <input
                    className="input"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={`${current.label} API Key`}
                    autoComplete="off"
                  />
                </div>
              )}

              {current?.needsVoyageKey && (
                <div>
                  <label style={fieldLabel}>
                    {t('setup.voyage_key_label')} <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>{t('setup.voyage_key_suffix')}</span>
                  </label>
                  <input
                    className="input"
                    type="password"
                    value={voyageApiKey}
                    onChange={(e) => setVoyageApiKey(e.target.value)}
                    placeholder="Voyage API Key"
                    autoComplete="off"
                  />
                </div>
              )}

              {current?.needsBaseUrl && (
                <>
                  <div>
                    <label style={fieldLabel}>{t('setup.ollama_url_label')}</label>
                    <input
                      className="input"
                      type="text"
                      value={ollamaBaseUrl}
                      onChange={(e) => setOllamaBaseUrl(e.target.value)}
                      placeholder="http://localhost:11434"
                    />
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                      {t('setup.ollama_start_hint')} <code style={{ fontFamily: 'monospace', background: 'var(--surface)', padding: '1px 6px', borderRadius: '4px' }}>OLLAMA_ORIGINS=* ollama serve</code>
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={fieldLabel}>{t('setup.ollama_chat_label')}</label>
                      <input className="input" type="text" value={ollamaChatModel} onChange={(e) => setOllamaChatModel(e.target.value)} placeholder="qwen2.5:7b" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={fieldLabel}>{t('setup.ollama_embed_label')}</label>
                      <input className="input" type="text" value={ollamaEmbedModel} onChange={(e) => setOllamaEmbedModel(e.target.value)} placeholder="nomic-embed-text" />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Alpha 权重 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label style={fieldLabel}>{t('setup.alpha_label')}</label>
                <span className="mono" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent)' }}>{alpha.toFixed(1)}</span>
              </div>
              <input
                type="range" min="0.1" max="0.9" step="0.1"
                value={alpha}
                onChange={(e) => setAlpha(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                <span>{t('setup.alpha_left')}</span>
                <span>{t('setup.alpha_right')}</span>
              </div>
            </div>

            {/* 测试连接 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={testConnection}
                disabled={testing}
              >
                {testing ? <span className="spinner" style={{ width: 13, height: 13 }} /> : null}
                {testing ? t('setup.testing') : t('setup.test_button')}
              </button>
              {testResult && (
                <span style={{ fontSize: '13px', color: testResult.ok ? 'var(--green)' : 'var(--red)' }}>
                  {testResult.ok ? '✓ ' : '✗ '}{testResult.msg}
                </span>
              )}
            </div>

            <button type="submit" className="btn btn-primary btn-lg" style={{ alignSelf: 'flex-start', minWidth: '160px' }}>
              {isSettings ? t('setup.submit_settings') : t('setup.submit_onboard')}
            </button>

          </form>
        </div>
      </div>
    </div>
  )
}

const sectionLabel = {
  fontSize: '11px',
  fontWeight: 700,
  color: 'var(--text-muted)',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  marginBottom: '10px',
  display: 'block',
}

const fieldLabel = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 600,
  color: 'var(--text-secondary)',
  marginBottom: '8px',
}
