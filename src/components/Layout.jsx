import { getHistory, computeCumulativeP } from '../lib/storage.js'
import { formatDeltaP, pColorClass } from '../lib/scoring.js'
import ThemeToggle from './ThemeToggle.jsx'

const NAV_ITEMS = [
  { page: 'dashboard',    label: '仪表盘' },
  { page: 'dailyPlan',    label: '今日计划' },
  { page: 'dailyJournal', label: '今日日志' },
  { page: 'dailyReport',  label: '今日报告' },
]

export default function Layout({ currentPage, navigate, children }) {
  const history  = getHistory()
  const withCum  = computeCumulativeP(history)
  const latestP  = withCum.length ? withCum[withCum.length - 1].cumulative_P : 0
  const pClass   = pColorClass(latestP)

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* ── 左侧导航栏 ── */}
      <aside style={{
        width: '220px',
        flexShrink: 0,
        background: 'var(--bg-elevated)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 0',
        overflow: 'hidden',
      }}>
        {/* Logo + 主题切换 */}
        <div style={{
          padding: '0 20px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border)',
        }}>
          <span style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontWeight: 700,
            fontSize: '18px',
            letterSpacing: '0.12em',
            color: 'var(--accent)',
          }}>
            PRIME
          </span>
          <ThemeToggle />
        </div>

        {/* 累计 P 值 */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: 4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            累计 P
          </div>
          <div className={`mono ${pClass}`} style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em' }}>
            {formatDeltaP(latestP, 2)}
          </div>
        </div>

        {/* 主导航 */}
        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {NAV_ITEMS.map(({ page, label }) => (
            <button
              key={page}
              onClick={() => navigate(page)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '9px 12px',
                borderRadius: '8px',
                border: 'none',
                background: currentPage === page ? 'var(--accent-soft)' : 'transparent',
                color: currentPage === page ? 'var(--accent-text)' : 'var(--text-secondary)',
                fontSize: '14px',
                fontWeight: currentPage === page ? 600 : 400,
                cursor: 'pointer',
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => { if (currentPage !== page) e.currentTarget.style.background = 'var(--surface)' }}
              onMouseLeave={(e) => { if (currentPage !== page) e.currentTarget.style.background = 'transparent' }}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* 底部：我的 + 设置 */}
        <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {[
            { page: 'me',    label: '我的' },
            { page: 'setup', label: '设置' },
          ].map(({ page, label }) => (
            <button
              key={page}
              onClick={() => navigate(page)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '9px 12px',
                borderRadius: '8px',
                border: 'none',
                background: currentPage === page ? 'var(--accent-soft)' : 'transparent',
                color: currentPage === page ? 'var(--accent-text)' : 'var(--text-muted)',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => { if (currentPage !== page) e.currentTarget.style.background = 'var(--surface)' }}
              onMouseLeave={(e) => { if (currentPage !== page) e.currentTarget.style.background = 'transparent' }}
            >
              {label}
            </button>
          ))}
        </div>
      </aside>

      {/* ── 内容区 ── */}
      <main style={{
        flex: 1,
        overflowY: 'auto',
        background: 'var(--bg)',
        padding: '48px 40px',
      }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          {children}
        </div>
      </main>
    </div>
  )
}
