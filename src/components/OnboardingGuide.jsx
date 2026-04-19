import { useState } from 'react'
import { useTranslation } from 'react-i18next'

function Vec() {
  return (
    <span style={{ fontFamily: "'Cambria Math', 'STIX Two Math', serif", fontWeight: 900, fontSize: '1.05em' }}>
      s⃗
    </span>
  )
}

const bodyStyle = {
  fontSize: '14px',
  color: 'var(--text-secondary)',
  lineHeight: 1.8,
}

const quoteStyle = {
  padding: '14px 18px',
  borderLeft: '3px solid var(--accent)',
  background: 'var(--accent-soft)',
  borderRadius: '0 8px 8px 0',
  fontSize: '14px',
  color: 'var(--accent-text)',
  lineHeight: 1.7,
  fontStyle: 'italic',
}

function getPages(lang) {
  if (lang === 'en') return [
    {
      tag: '01 / Origin',
      title: 'The Real Source of Time Anxiety',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={bodyStyle}>Time anxiety isn't caused by time passing. Passing is a physical fact — there's nothing to fight.</p>
          <p style={bodyStyle}>The real source is more specific: <strong style={{ color: 'var(--accent-text)' }}>resources are shrinking, and what I'm doing has too wide an angle from "the direction most truly me."</strong></p>
          <p style={bodyStyle}>LocuSelf borrows a concept from <em>Rick and Morty</em> — among all parallel versions of you, there exists one that is the purest, most authentic by your own definition. That one is Prime.</p>
          <p style={bodyStyle}>Prime is not a destination. It's a <strong style={{ color: 'var(--text)' }}>direction</strong>.</p>
          <div style={quoteStyle}>
            "You don't need to find an unchanging self and execute it for life. You only need to, at each moment, honestly move toward the direction you truly endorse right now."
          </div>
        </div>
      ),
    },
    {
      tag: '02 / Coordinates',
      title: 'Defining Your Reference Frame',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={bodyStyle}>Before describing any motion, we need a reference frame.</p>
          <p style={bodyStyle}>Define an axis called the <strong style={{ color: 'var(--accent-text)' }}>Prime Axis</strong>, represented by the unit vector û<sub>prime</sub>:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: '4px 0' }}>
            {[
              { label: '+∞', desc: 'Your most authentic state. Fully living in your nature, stripped of all social roles and performance. This is the direction Prime points.', color: 'var(--green)' },
              { label: '0', desc: 'The mediocre starting point. Not bad — just undefined. Living as an NPC in someone else\'s story.', color: 'var(--neutral)' },
              { label: '−∞', desc: 'Your least authentic state. Completely shaped by external expectations, living as someone else.', color: 'var(--red)' },
            ].map(({ label, desc, color }) => (
              <div key={label} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <span className="mono" style={{ fontSize: '15px', fontWeight: 700, color, flexShrink: 0, minWidth: '32px', paddingTop: '1px' }}>{label}</span>
                <p style={{ ...bodyStyle, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
          <p style={{ ...bodyStyle, color: 'var(--text-secondary)' }}>This axis isn't here to judge where you are now. It just gives you a <strong style={{ color: 'var(--text)' }}>direction you can keep calibrating toward</strong>.</p>
        </div>
      ),
    },
    {
      tag: '03 / Formula',
      title: 'P = ∫₀ᵀ s(τ) · û_prime(τ) dτ',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ textAlign: 'center', padding: '20px', background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '22px', color: 'var(--accent-text)', letterSpacing: '0.02em', fontFamily: "'Cambria Math', 'STIX Two Math', serif" }}>
              P = ∫₀ᵀ <b>s</b>(τ) · û<sub>prime</sub>(τ) dτ
            </span>
          </div>
          <p style={bodyStyle}><strong style={{ color: 'var(--text)' }}>P</strong> is the total value your life accumulates in the Prime direction. This formula has three core meanings:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { label: 'Dot ·', node: <>The projection of your moment-to-moment behavior vector <Vec /> onto the Prime direction. Perfect alignment means P grows efficiently; going against Prime means P actively decreases — not just stalls, but true deduction.</> },
              { label: 'Integral ∫', node: <>Meaning is not seized in a single instant — it's the continuous accumulation of every genuine dτ. No day of real effort disappears; it's permanently added to the integral.</> },
              { label: 'Finitude T', node: <>Precisely because T is a finite constant, every choice has a real cost. Finitude isn't rushing you — it's what makes each choice "irreplaceable."</> },
            ].map(({ label, node }) => (
              <div key={label} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <span className="mono" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent)', flexShrink: 0, minWidth: '60px', paddingTop: '2px' }}>{label}</span>
                <p style={{ ...bodyStyle, margin: 0 }}>{node}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      tag: '04 / Axis',
      title: 'You Don\'t Need to Find an Eternal Self',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={bodyStyle}>The original formula had a hidden assumption: û_prime is fixed. That's an idealization.</p>
          <p style={bodyStyle}>In reality, your self-understanding deepens continuously — through time, experience, and self-observation. Your Prime at 20 and at 40 won't be the same. That's not regression. It's that you know yourself better.</p>
          <div style={quoteStyle}>
            Full formula: P = ∫₀ᵀ <b>s</b>(τ) · <strong>û_prime(τ)</strong> dτ
            <br />û_prime becomes a function of time.
          </div>
          <p style={bodyStyle}>
            Each time you truly recognize a new layer of yourself, you're not negating the past — you're <strong style={{ color: 'var(--accent-text)' }}>updating your coordinate system</strong>.
            The P accumulated on the old axis was real — it's the path that brought you here.
          </p>
          <p style={bodyStyle}>You can submit new reflections in the Profile page at any time and let AI help calibrate your Prime Profile. This is one of the core functions this tool exists for.</p>
        </div>
      ),
    },
    {
      tag: '05 / Acceptance',
      title: 'Acceptance Is Not Failure',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={bodyStyle}>Sometimes people go through a drift period — exhausted, compromised, carried along. Anxiety easily surfaces: <em style={{ color: 'var(--text-secondary)' }}>I'm becoming an NPC, I'm wasting time.</em></p>
          <p style={bodyStyle}>There's a key distinction:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: '4px 0' }}>
            <div style={{ padding: '14px 16px', borderRadius: '8px', background: 'var(--red-soft)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--red)', marginBottom: '6px', letterSpacing: '0.05em' }}>Giving Up</div>
              <p style={{ ...bodyStyle, margin: 0, fontSize: '13px' }}>
                û_prime hasn't changed, but <Vec /> has drifted. There's an internal tearing feeling. The dot product is running negative. <strong>This is the real source of anxiety.</strong>
              </p>
            </div>
            <div style={{ padding: '14px 16px', borderRadius: '8px', background: 'var(--green-soft)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--green)', marginBottom: '6px', letterSpacing: '0.05em' }}>True Acceptance</div>
              <p style={{ ...bodyStyle, margin: 0, fontSize: '13px' }}>
                û_prime itself has rotated. Every calm dτ after that is a <strong>positive accumulation</strong> on the new axis.
              </p>
            </div>
          </div>
          <p style={bodyStyle}>Anxiety only lives in this gap: behavior points one way, the Prime axis points another, and neither is adjusted. LocuSelf's self-rating and reports are tools to help you identify this gap.</p>
        </div>
      ),
    },
    {
      tag: '06 / Usage',
      title: 'Three-Step Workflow',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {[
            {
              step: '01',
              title: 'Complete the questionnaire, lock your Prime Profile',
              desc: 'Answer 5 questions about yourself. AI synthesizes these answers to generate your Prime Profile — the initial definition of your û_prime. You can adjust it on the confirmation page before locking.',
            },
            {
              step: '02',
              title: 'Daily: Plan → Journal → Report',
              desc: 'Each day, list your plans. AI assigns a Prime level (+3 to -2) to each. When writing your journal, choose a self-rating (-3 to +3). The system computes semantic alignment and derives ΔP. The report calmly tells you what happened today.',
            },
            {
              step: '03',
              title: 'Continuously calibrate your Prime',
              desc: 'On the Profile page, you can submit recent reflections and changes at any time. AI will propose Profile update suggestions. Once you review and confirm, a new Embedding is generated and the version number increments.',
            },
          ].map(({ step, title, desc }) => (
            <div key={step} style={{ display: 'flex', gap: '16px' }}>
              <div className="mono" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent)', flexShrink: 0, width: '40px', lineHeight: 1.2, paddingTop: '2px' }}>
                {step}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text)', marginBottom: '6px' }}>{title}</div>
                <p style={{ ...bodyStyle, margin: 0 }}>{desc}</p>
              </div>
            </div>
          ))}
          <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'var(--accent-soft)', border: '1px solid var(--border)', fontSize: '13px', color: 'var(--accent-text)' }}>
            You can find the entry to this guide on the Profile page at any time and re-read it.
          </div>
        </div>
      ),
    },
  ]

  // 中文版
  return [
    {
      tag: '01 / 缘起',
      title: '时间焦虑的真正来源',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={bodyStyle}>时间焦虑不是时间在流逝造成的。流逝是物理事实，没有什么可以对抗。</p>
          <p style={bodyStyle}>真正的来源更具体：<strong style={{ color: 'var(--accent-text)' }}>资源在减少，而我正在做的事与「最是我自己的方向」之间，夹角太大。</strong></p>
          <p style={bodyStyle}>本征日志借用《Rick and Morty》里的概念——在所有平行版本的你之中，存在一个最纯粹、最符合你自己定义的那个人。那个人是 Prime。</p>
          <p style={bodyStyle}>Prime 不是一个要抵达的终点，是一个<strong style={{ color: 'var(--text)' }}>方向</strong>。</p>
          <div style={quoteStyle}>
            「你不需要找到永恒不变的自我，然后执行一生。你只需要在每个当下，诚实地朝向你此刻真正认可的方向。」
          </div>
        </div>
      ),
    },
    {
      tag: '02 / 坐标系',
      title: '定义你的参考系',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={bodyStyle}>在描述任何运动之前，我们需要一个参考系。</p>
          <p style={bodyStyle}>定义一条数轴，叫做 <strong style={{ color: 'var(--accent-text)' }}>Prime 轴</strong>，用单位向量 û<sub>prime</sub> 表示：</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: '4px 0' }}>
            {[
              { label: '+∞', desc: '最是你自己的状态。完全活在你的天性里，剥去所有社会角色和表演。这是 Prime 所在的方向。', color: 'var(--green)' },
              { label: '0', desc: '平庸的起点。不坏，只是未定义。以 NPC 的身份活在别人的故事里。', color: 'var(--neutral)' },
              { label: '−∞', desc: '最不是你自己的状态。完全被外部期待塑造，活成了另一个人。', color: 'var(--red)' },
            ].map(({ label, desc, color }) => (
              <div key={label} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <span className="mono" style={{ fontSize: '15px', fontWeight: 700, color, flexShrink: 0, minWidth: '32px', paddingTop: '1px' }}>{label}</span>
                <p style={{ ...bodyStyle, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
          <p style={{ ...bodyStyle, color: 'var(--text-secondary)' }}>这条轴不是用来评判你现在在哪里的。它只是给你一个<strong style={{ color: 'var(--text)' }}>可以持续校准的方向</strong>。</p>
        </div>
      ),
    },
    {
      tag: '03 / 公式',
      title: 'P = ∫₀ᵀ s(τ) · û_prime(τ) dτ',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ textAlign: 'center', padding: '20px', background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '22px', color: 'var(--accent-text)', letterSpacing: '0.02em', fontFamily: "'Cambria Math', 'STIX Two Math', serif" }}>
              P = ∫₀ᵀ <b>s</b>(τ) · û<sub>prime</sub>(τ) dτ
            </span>
          </div>
          <p style={bodyStyle}><strong style={{ color: 'var(--text)' }}>P</strong> 是你生命在 Prime 方向上积累的总价值。这个公式有三个核心含义：</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { label: '点积 ·', node: <>你每时每刻的行为向量 <Vec /> 与 Prime 方向的投影。完全对齐时 P 高效增长；逆 Prime 时 P 主动减少——不是停滞，是真实扣分。</> },
              { label: '积分 ∫', node: <>意义不是在某个瞬间把握的，而是每一个真实的 dτ 的持续积累。没有一天的真实努力会消失，它永远加在积分里。</> },
              { label: '有限性 T', node: <>正因为 T 是有限常数，每个选择才有真实成本。有限性不是在催促你，它是让每个选择「不可替代」的前提。</> },
            ].map(({ label, node }) => (
              <div key={label} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <span className="mono" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent)', flexShrink: 0, minWidth: '60px', paddingTop: '2px' }}>{label}</span>
                <p style={{ ...bodyStyle, margin: 0 }}>{node}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      tag: '04 / 轴',
      title: '你不需要找到永恒的自我',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={bodyStyle}>最初的公式有一个隐含假设：û_prime 是固定的。这是理想化。</p>
          <p style={bodyStyle}>现实里，你对自己的理解在不断加深——通过时间、经历和自我观察。二十岁的 Prime 和四十岁的 Prime 不会相同。这不是退步，而是你更了解自己了。</p>
          <div style={quoteStyle}>
            完整公式：P = ∫₀ᵀ <b>s</b>(τ) · <strong>û_prime(τ)</strong> dτ
            <br />û_prime 成为时间的函数。
          </div>
          <p style={bodyStyle}>每次你真正认识了自己的一个新层次，你不是在否定过去，而是在<strong style={{ color: 'var(--accent-text)' }}>更新坐标系</strong>。过去在旧轴上积累的 P 是真实的——那是把你带到此刻的路径。</p>
          <p style={bodyStyle}>你随时可以在「我的」页面提交新的感悟，让 AI 帮你校准 Prime Profile。这是这个工具存在的核心功能之一。</p>
        </div>
      ),
    },
    {
      tag: '05 / 接受',
      title: '接受不是失败',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={bodyStyle}>有时候人会经历一段漂流期——疲惫、妥协、被裹着走。焦虑容易冒出来：<em style={{ color: 'var(--text-secondary)' }}>我在变成 NPC，我在浪费时间。</em></p>
          <p style={bodyStyle}>这里有一个关键区别：</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: '4px 0' }}>
            <div style={{ padding: '14px 16px', borderRadius: '8px', background: 'var(--red-soft)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--red)', marginBottom: '6px', letterSpacing: '0.05em' }}>放弃</div>
              <p style={{ ...bodyStyle, margin: 0, fontSize: '13px' }}>û_prime 没有变，<Vec /> 偏离了。内在有撕裂感。点积在跑负数。<strong>这是真实的焦虑来源。</strong></p>
            </div>
            <div style={{ padding: '14px 16px', borderRadius: '8px', background: 'var(--green-soft)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--green)', marginBottom: '6px', letterSpacing: '0.05em' }}>真心接受</div>
              <p style={{ ...bodyStyle, margin: 0, fontSize: '13px' }}>û_prime 本身旋转了。此后每一个平静的 dτ，都是在新轴上的<strong>正积累</strong>。</p>
            </div>
          </div>
          <p style={bodyStyle}>焦虑只活在这个间隙里：行为指一个方向，Prime 轴指另一个，两个都不调整。本征日志的自评和报告正是帮你识别这个间隙的工具。</p>
        </div>
      ),
    },
    {
      tag: '06 / 使用',
      title: '三步使用工作流',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {[
            { step: '01', title: '完成问卷，锁定 Prime Profile', desc: '回答 5 个关于你自己的问题。AI 综合这些回答，生成你的 Prime Profile——这是你 û_prime 的初始定义。你可以在确认页调整后锁定。' },
            { step: '02', title: '每日：计划 → 日志 → 报告', desc: '每天列出你的计划，AI 对每项进行 Prime 分级（+3 到 -2）。填写日志时选择自评分数（-3 到 +3），系统计算语义对齐度并得出 ΔP。报告会冷静地告诉你今天发生了什么。' },
            { step: '03', title: '持续校准你的 Prime', desc: '在「我的」页面，你可以随时提交近期的感悟和变化。AI 会提出 Profile 更新建议，你审阅后确认。每次更新都会重新生成 Embedding，版本号递增。' },
          ].map(({ step, title, desc }) => (
            <div key={step} style={{ display: 'flex', gap: '16px' }}>
              <div className="mono" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent)', flexShrink: 0, width: '40px', lineHeight: 1.2, paddingTop: '2px' }}>{step}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text)', marginBottom: '6px' }}>{title}</div>
                <p style={{ ...bodyStyle, margin: 0 }}>{desc}</p>
              </div>
            </div>
          ))}
          <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'var(--accent-soft)', border: '1px solid var(--border)', fontSize: '13px', color: 'var(--accent-text)' }}>
            你随时可以在「我的」页面找到这份指南的入口，重新阅读。
          </div>
        </div>
      ),
    },
  ]
}

export default function OnboardingGuide({ onClose }) {
  const { i18n } = useTranslation()
  const [page, setPage] = useState(0)
  const PAGES  = getPages(i18n.language)
  const current = PAGES[page]
  const isLast  = page === PAGES.length - 1

  const skipLabel  = i18n.language === 'en' ? 'Skip'         : '跳过'
  const nextLabel  = i18n.language === 'en' ? 'Next →'       : '下一页 →'
  const prevLabel  = i18n.language === 'en' ? '← Back'       : '← 上一页'
  const startLabel = i18n.language === 'en' ? 'Get Started →' : '开始使用 →'

  function handleClose() {
    localStorage.setItem('prime:onboarding:seen', 'true')
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.65)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', backdropFilter: 'blur(4px)',
    }}>
      <div className="slide-up" style={{
        width: '100%', maxWidth: '720px', maxHeight: '85vh',
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        borderRadius: '14px', display: 'flex', flexDirection: 'column',
        overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
      }}>
        {/* 顶部 */}
        <div style={{ padding: '20px 28px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="mono" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.1em' }}>
              {current.tag}
            </span>
            <button onClick={handleClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px', lineHeight: 1, padding: '0 4px' }}>
              ×
            </button>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', lineHeight: 1.3 }}>
            {current.title}
          </h2>
          <div style={{ display: 'flex', gap: '6px', paddingTop: '4px' }}>
            {PAGES.map((_, i) => (
              <div key={i} onClick={() => setPage(i)} style={{
                width: i === page ? '20px' : '6px', height: '6px', borderRadius: '3px',
                background: i === page ? 'var(--accent)' : 'var(--border)',
                cursor: 'pointer', transition: 'width 0.25s ease, background 0.2s',
              }} />
            ))}
          </div>
        </div>

        {/* 内容 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          {current.content}
        </div>

        {/* 底部 */}
        <div style={{ padding: '16px 28px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <button className="btn btn-ghost btn-sm" onClick={handleClose}>{skipLabel}</button>
          <div style={{ display: 'flex', gap: '10px' }}>
            {page > 0 && (
              <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => p - 1)}>{prevLabel}</button>
            )}
            <button className="btn btn-primary" onClick={() => isLast ? handleClose() : setPage(p => p + 1)}>
              {isLast ? startLabel : nextLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
