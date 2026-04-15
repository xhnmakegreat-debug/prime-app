import { useState, useEffect } from 'react'
import { getSettings, setSettings } from '../lib/storage.js'
import { getEnabledProviders } from '../lib/providers/registry.js'
import { embed } from '../lib/llm.js'
import ThemeToggle from '../components/ThemeToggle.jsx'

export default function Setup({ onComplete }) {
  const saved    = getSettings()
  const providers = getEnabledProviders()

  const [provider,         setProvider]         = useState(saved.provider || 'glm')
  const [apiKey,           setApiKey]           = useState(saved.apiKey || '')
  const [voyageApiKey,     setVoyageApiKey]     = useState(saved.voyageApiKey || '')
  const [ollamaBaseUrl,    setOllamaBaseUrl]    = useState(saved.ollamaBaseUrl || 'http://localhost:11434')
  const [ollamaChatModel,  setOllamaChatModel]  = useState(saved.ollamaChatModel || 'qwen2.5:7b')
  const [ollamaEmbedModel, setOllamaEmbedModel] = useState(saved.ollamaEmbedModel || 'nomic-embed-text')
  const [alpha,            setAlpha]            = useState(saved.alpha ?? 0.7)
  const [testing,          setTesting]          = useState(false)
  const [testResult,       setTestResult]       = useState(null)

  const current = providers.find((p) => p.id === provider)

  function save() {
    setSettings({ provider, apiKey, voyageApiKey, ollamaBaseUrl, ollamaChatModel, ollamaEmbedModel, alpha })
  }

  async function testConnection() {
    save()
    setTesting(true)
    setTestResult(null)
    try {
      const vec = await embed('test connection')
      setTestResult({ ok: true, msg: `连接成功，向量维度 ${vec.length}` })
    } catch (e) {
      setTestResult({ ok: false, msg: e.message })
    } finally {
      setTesting(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    save()
    onComplete()
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: '32px',
    }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontFamily: 'monospace', fontSize: '28px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.1em' }}>
              PRIME
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: 4 }}>配置模型供应商</p>
          </div>
          <ThemeToggle />
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* 供应商选择 */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '20px' }}>
            <label style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              LLM 供应商
            </label>
            {providers.map((p) => (
              <label
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '12px',
                  borderRadius: '10px',
                  border: `1.5px solid ${provider === p.id ? 'var(--accent)' : 'var(--border)'}`,
                  background: provider === p.id ? 'var(--accent-soft)' : 'transparent',
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
                  style={{ marginTop: 2, accentColor: 'var(--accent)' }}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>{p.label}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 2 }}>{p.description}</div>
                </div>
              </label>
            ))}
          </div>

          {/* Anthropic CORS 警告 */}
          {current?.corsWarning && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '10px',
              background: '#7f1d1d22',
              border: '1px solid #f8717144',
              fontSize: '13px',
              color: '#fca5a5',
              lineHeight: 1.6,
            }}>
              Anthropic API 不支持浏览器直连生产环境。Dev 模式下通过 Vite proxy 可用，生产环境请使用 GLM 或 Ollama。
            </div>
          )}

          {/* 动态配置字段 */}
          <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {current?.needsApiKey && (
              <div>
                <label style={labelStyle}>API Key</label>
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
                <label style={labelStyle}>Voyage API Key（Embedding 用）</label>
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
                  <label style={labelStyle}>Ollama Base URL</label>
                  <input
                    className="input"
                    type="text"
                    value={ollamaBaseUrl}
                    onChange={(e) => setOllamaBaseUrl(e.target.value)}
                    placeholder="http://localhost:11434"
                  />
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 6 }}>
                    启动命令：<code style={{ fontFamily: 'monospace' }}>OLLAMA_ORIGINS=* ollama serve</code>
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>聊天模型</label>
                    <input className="input" type="text" value={ollamaChatModel} onChange={(e) => setOllamaChatModel(e.target.value)} placeholder="qwen2.5:7b" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Embedding 模型</label>
                    <input className="input" type="text" value={ollamaEmbedModel} onChange={(e) => setOllamaEmbedModel(e.target.value)} placeholder="nomic-embed-text" />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Alpha 权重 */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <label style={labelStyle}>α 混合权重</label>
              <span className="mono" style={{ color: 'var(--accent)', fontWeight: 700 }}>{alpha.toFixed(1)}</span>
            </div>
            <input
              type="range" min="0.1" max="0.9" step="0.1"
              value={alpha}
              onChange={(e) => setAlpha(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: '12px', color: 'var(--text-muted)' }}>
              <span>主观感受（r）</span>
              <span>语义对齐（dot）</span>
            </div>
          </div>

          {/* 测试连接 */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={testConnection}
              disabled={testing}
            >
              {testing ? <span className="spinner" style={{ width: 14, height: 14 }} /> : null}
              {testing ? '测试中…' : '测试连接'}
            </button>
            {testResult && (
              <span style={{ fontSize: '13px', color: testResult.ok ? 'var(--green)' : 'var(--red)' }}>
                {testResult.msg}
              </span>
            )}
          </div>

          {/* 提交 */}
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
            保存并继续
          </button>
        </form>
      </div>
    </div>
  )
}

const labelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 600,
  color: 'var(--text-secondary)',
  marginBottom: '8px',
  letterSpacing: '0.02em',
}
