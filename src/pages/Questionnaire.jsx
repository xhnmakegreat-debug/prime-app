import { useState, useEffect, useRef } from 'react'
import { getQuestionnaire, setQuestionnaire } from '../lib/storage.js'
import { chat, parseLLMJson } from '../lib/llm.js'
import { buildPromptA } from '../lib/prompts/index.js'
import { setProfile } from '../lib/storage.js'

const QUESTIONS = [
  '你认为自己目前最核心的使命或方向是什么？不需要宏大，说真实的。',
  '在过去一年里，做哪些事情让你感到真正投入、有能量、不需要表演？',
  '你最不想成为什么样的人？有哪些行为模式是你想避免的？',
  '如果不考虑收入和外部评价，你的典型一天会是什么样的？',
  '现在是什么在阻止你过上面描述的生活？',
]

export default function Questionnaire({ onComplete }) {
  const saved = getQuestionnaire()
  const [messages,  setMessages]  = useState(saved.messages || [])
  const [input,     setInput]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)
  const [generating, setGenerating] = useState(false)
  const endRef = useRef(null)

  // 已回答的问题数量（user 消息数）
  const answered = messages.filter((m) => m.role === 'user').length
  const currentQ = answered < QUESTIONS.length ? QUESTIONS[answered] : null

  // 首次进入：添加第一个问题
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
      // 下一个问题
      const nextQ   = { role: 'assistant', content: QUESTIONS[newAnswered] }
      const updated = [...newMsgs, nextQ]
      setMessages(updated)
      setQuestionnaire({ messages: updated, completed: false })
    } else {
      // 全部回答完毕，等待用户点击提交
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
        version: 0,  // 0 表示未 embed，ProfileConfirm 页面锁定后变为 1
        updated_at: new Date().toISOString(),
      })

      setQuestionnaire({ messages: msgs, completed: true })
      onComplete()
    } catch (e) {
      setError(`生成 Profile 失败：${e.message}`)
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
          PRIME
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: 4 }}>
          {answered < QUESTIONS.length ? `问题 ${answered + 1} / ${QUESTIONS.length}` : `全部完成 ${QUESTIONS.length} / ${QUESTIONS.length}`}
        </p>
        {/* 进度条 */}
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
            style={{
              display: 'flex',
              justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
            }}
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
            正在生成你的 Prime Profile…
          </div>
        )}

        {error && (
          <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'var(--red-soft)', color: 'var(--red)', fontSize: '13px' }}>
            {error}
            <button
              className="btn btn-ghost btn-sm"
              style={{ marginLeft: 12 }}
              onClick={() => generateProfile(messages.filter(m => m.role === 'user').length === QUESTIONS.length ? messages : messages)}
            >
              重试
            </button>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* 全部回答完毕后的提交按钮 */}
      {!currentQ && !generating && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
            五个问题已全部回答完毕。
          </p>
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={() => generateProfile(messages)}
            style={{ width: '100%' }}
          >
            生成 Prime Profile →
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
            placeholder="在这里回答…"
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
