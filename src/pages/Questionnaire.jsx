import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { getQuestionnaire, setQuestionnaire } from '../lib/storage.js'
import { chat, parseLLMJson } from '../lib/llm.js'
import { buildPromptA } from '../lib/prompts/index.js'
import { setProfile } from '../lib/storage.js'

export default function Questionnaire({ onComplete }) {
  const { t } = useTranslation()
  const QUESTIONS = t('questionnaire.questions', { returnObjects: true })

  const saved = getQuestionnaire()
  const [messages,   setMessages]   = useState(saved.messages || [])
  const [input,      setInput]      = useState('')
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState(null)
  const [generating, setGenerating] = useState(false)
  const endRef = useRef(null)

  const answered = messages.filter((m) => m.role === 'user').length
  const currentQ = answered < QUESTIONS.length ? QUESTIONS[answered] : null

  useEffect(() => {
    if (messages.length === 0) {
      const first = [{ role: 'assistant', content: QUESTIONS[0] }]
      setMessages(first)
      setQuestionnaire({ messages: first, completed: false })
    }
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!input.trim() || loading || generating) return

    const userMsg  = { role: 'user', content: input.trim() }
    const newMsgs  = [...messages, userMsg]
    setMessages(newMsgs)
    setInput('')
    setQuestionnaire({ messages: newMsgs, completed: false })

    const newAnswered = newMsgs.filter((m) => m.role === 'user').length

    if (newAnswered < QUESTIONS.length) {
      const nextQ   = { role: 'assistant', content: QUESTIONS[newAnswered] }
      const updated = [...newMsgs, nextQ]
      setMessages(updated)
      setQuestionnaire({ messages: updated, completed: false })
    }
  }

  async function generateProfile(msgs) {
    setGenerating(true)
    setError(null)
    try {
      const { system, userMessage } = buildPromptA({ conversationHistory: msgs })
      const raw = await chat([{ role: 'user', content: userMessage }], system)
      const profileData = parseLLMJson(raw)

      setProfile({
        ...profileData,
        embedding: [],
        embedding_provider: null,
        version: 0,
        updated_at: new Date().toISOString(),
      })

      setQuestionnaire({ messages: msgs, completed: true })
      onComplete()
    } catch (e) {
      setError(t('questionnaire.error_prefix', { msg: e.message }))
      setGenerating(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg)',
      padding: '32px',
      maxWidth: '600px',
      margin: '0 auto',
    }}>
      {/* 标题 */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontFamily: 'monospace', color: 'var(--accent)', fontSize: '20px', letterSpacing: '0.08em' }}>
          {t('app_name')}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: 4 }}>
          {answered < QUESTIONS.length
            ? `${answered + 1} / ${QUESTIONS.length}`
            : `${QUESTIONS.length} / ${QUESTIONS.length}`}
        </p>
        <div style={{ marginTop: 8, height: 3, background: 'var(--border)', borderRadius: 2 }}>
          <div style={{
            height: '100%',
            borderRadius: 2,
            background: 'var(--accent)',
            width: `${(Math.min(answered, QUESTIONS.length) / QUESTIONS.length) * 100}%`,
            transition: 'width 0.4s ease',
          }} />
        </div>
      </div>

      {/* 对话区 */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
        {messages.map((m, i) => (
          <div
            key={i}
            className="fade-in"
            style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}
          >
            <div style={{
              maxWidth: '85%',
              padding: '12px 16px',
              borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
              background: m.role === 'user' ? 'var(--accent)' : 'var(--surface)',
              color: m.role === 'user' ? '#fff' : 'var(--text)',
              fontSize: '14px',
              lineHeight: 1.7,
              border: m.role === 'assistant' ? '1px solid var(--border)' : 'none',
            }}>
              {m.content}
            </div>
          </div>
        ))}

        {generating && (
          <div className="fade-in" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '13px' }}>
            <span className="spinner" />
            {t('common.generating')}
          </div>
        )}

        {error && (
          <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'var(--red-soft)', color: 'var(--red)', fontSize: '13px' }}>
            {error}
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* 全部回答完毕后的提交按钮 */}
      {!currentQ && !generating && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
            {t('questionnaire.all_done')}
          </p>
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={() => generateProfile(messages)}
            style={{ width: '100%' }}
          >
            {t('questionnaire.generate_profile')} →
          </button>
        </div>
      )}

      {/* 输入区 */}
      {currentQ && !generating && (
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px' }}>
          <textarea
            className="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('questionnaire.input_placeholder')}
            style={{ flex: 1, minHeight: 'unset', height: '48px', resize: 'none', lineHeight: '28px', padding: '10px 14px' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e) }
            }}
            disabled={loading || generating}
            autoFocus
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!input.trim() || loading || generating}
            style={{ height: '48px', padding: '0 20px' }}
          >
            →
          </button>
        </form>
      )}
    </div>
  )
}
