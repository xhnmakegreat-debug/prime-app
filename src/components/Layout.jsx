import { useTranslation } from 'react-i18next'
import { getHistory, computeCumulativeP } from '../lib/storage.js'
import { formatDeltaP, pColorClass } from '../lib/scoring.js'
import ThemeToggle from './ThemeToggle.jsx'

export default function Layout({ currentPage, navigate, children }) {
  const { t } = useTranslation()
  const history = getHistory()
  const withCum = computeCumulativeP(history)
  const latestP = withCum.length ? withCum[withCum.length - 1].cumulative_P : 0
  const pClass  = pColorClass(latestP)

  const NAV_MAIN = [
    { page: 'dashboard',    label: t('nav.dashboard'),    icon: '◈' },
    { page: 'dailyPlan',    label: t('nav.dailyPlan'),    icon: '○' },
    { page: 'dailyJournal', label: t('nav.dailyJournal'), icon: '▦' },
    { page: 'dailyReport',  label: t('nav.dailyReport'),  icon: '◇' },
  ]

  const NAV_BOTTOM = [
    { page: 'me',    label: t('nav.me'),    icon: '◉' },
    { page: 'setup', label: t('nav.setup'), icon: '⚙' },
  ]

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* ══ 左侧导航栏 ══ */}
      <aside style={{
        width: '260px',
        flexShrink: 0,
        background: 'var(--bg-elevated)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        userSelect: 'none',
      }}>

        {/* Logo 行 */}
        <div style={{
          height: '52px',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <span style={{
            fontFamily: 'SF Mono, JetBrains Mono, monospace',
            fontWeight: 700,
            fontSize: '16px',
            letterSpacing: '0.18em',
            color: 'var(--accent)',
          }}>
            {t('app_name')}
          </span>
          <ThemeToggle />
        </div>

        {/* P 值显示 */}
        <div style={{
          padding: '16px 20px 14px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <div style={{
            fontSize: '10px',
            fontWeight: 700,
            color: 'var(--text-muted)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: '6px',
          }}>
            {t('nav.cumulative_p')}
          </div>
          <div
            className={`mono ${pClass}`}
            style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1 }}
          >
            {formatDeltaP(latestP, 2)}
          </div>
        </div>

        {/* 主导航 */}
        <div style={{ padding: '8px 0', flex: 1, overflowY: 'auto' }}>
          <NavSection label={t('nav.workspace')}>
            {NAV_MAIN.map(({ page, label, icon }) => (
              <NavItem
                key={page}
                icon={icon}
                label={label}
                active={currentPage === page}
                onClick={() => navigate(page)}
              />
            ))}
          </NavSection>
        </div>

        {/* 底部导航 */}
        <div style={{ padding: '8px 0', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <NavSection label={t('nav.personal')}>
            {NAV_BOTTOM.map(({ page, label, icon }) => (
              <NavItem
                key={page}
                icon={icon}
                label={label}
                active={currentPage === page}
                onClick={() => navigate(page)}
              />
            ))}
          </NavSection>
        </div>

      </aside>

      {/* ══ 内容区（全宽，无 max-width 限制） ══ */}
      <main style={{
        flex: 1,
        overflowY: 'auto',
        background: 'var(--bg)',
        padding: '48px 56px',
        minWidth: 0,
      }}>
        {children}
      </main>

    </div>
  )
}

function NavSection({ label, children }) {
  return (
    <div>
      <div style={{
        padding: '4px 20px 2px',
        fontSize: '10px',
        fontWeight: 700,
        color: 'var(--text-muted)',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
      }}>
        {label}
      </div>
      {children}
    </div>
  )
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '7px 20px',
        border: 'none',
        background: active ? 'var(--accent-soft)' : 'transparent',
        color: active ? 'var(--accent-text)' : 'var(--text-secondary)',
        fontSize: '14px',
        fontWeight: active ? 600 : 400,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background 0.12s, color 0.12s',
        borderRight: active ? '2px solid var(--accent)' : '2px solid transparent',
      }}
      onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--text)' } }}
      onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' } }}
    >
      <span style={{ fontSize: '13px', opacity: 0.7, fontFamily: 'monospace', flexShrink: 0 }}>{icon}</span>
      <span>{label}</span>
    </button>
  )
}
