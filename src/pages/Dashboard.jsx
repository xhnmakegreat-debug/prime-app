import { useTranslation } from 'react-i18next'
import { getHistory, computeCumulativeP, getJournal, getProfile } from '../lib/storage.js'
import { formatDeltaP, pColorClass, driftCheck } from '../lib/scoring.js'
import PValueChart from '../components/PValueChart.jsx'

const TODAY = new Date().toISOString().split('T')[0]

export default function Dashboard({ date = TODAY, navigate }) {
  const { t } = useTranslation()
  const history  = getHistory()
  const withCum  = computeCumulativeP(history)
  const latestP  = withCum.length ? withCum[withCum.length - 1].cumulative_P : 0
  const todayH   = withCum.find((h) => h.date === date)
  const todayJ   = getJournal(date)
  const profile  = getProfile()
  const drift    = driftCheck(history)
  const recent30 = withCum.slice(-30)

  const quickLinks = [
    { label: t('dashboard.daily_plan'),   page: 'dailyPlan',   status: todayJ ? t('dashboard.filled') : t('dashboard.not_filled') },
    { label: t('dashboard.daily_report'), page: 'dailyReport', status: todayJ?.report ? t('dashboard.generated') : t('dashboard.not_generated') },
  ]

  const tableHeaders = [
    t('dashboard.today_prefix').replace(' · ', '').trim() || 'Date',
    'ΔP',
    t('nav.cumulative_p'),
    t('me.stat_dot'),
    t('me.stat_rating'),
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

      {/* ── 顶部标题栏 ── */}
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: '6px' }}>
              {t('dashboard.title')}
            </h1>
            {profile && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.5, maxWidth: '600px' }}>
                {profile.core_identity}
              </p>
            )}
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '32px' }}>
            <div style={metaLabel}>{t('nav.cumulative_p')}</div>
            <div className={`mono ${pColorClass(latestP)}`} style={{ fontSize: '40px', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1 }}>
              {formatDeltaP(latestP, 2)}
            </div>
          </div>
        </div>
      </div>

      {/* ── 两栏区域 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px', alignItems: 'start' }}>

        {/* 左栏：今日数据 + 漂移 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={metaLabel}>{t('dashboard.today_prefix')}{date}</div>

          {/* 今日 ΔP */}
          <div
            className="card"
            onClick={() => navigate('dailyJournal', date)}
            style={{ cursor: 'pointer', transition: 'border-color 0.15s' }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <div style={metaLabel}>{t('dashboard.today_delta')}</div>
            <div className={`mono ${todayJ?.total_delta_P != null ? pColorClass(todayJ.total_delta_P) : 'text-muted'}`}
              style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '8px' }}>
              {todayJ?.total_delta_P != null ? formatDeltaP(todayJ.total_delta_P) : '—'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {todayJ?.entries?.length
                ? t('dashboard.entry_count', { n: todayJ.entries.length })
                : t('dashboard.no_journal')}
            </div>
          </div>

          {/* 快捷入口 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {quickLinks.map(({ label, page, status }) => (
              <button
                key={page}
                type="button"
                onClick={() => navigate(page, date)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'border-color 0.12s',
                  width: '100%',
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <span style={{ fontSize: '14px', color: 'var(--text)' }}>{label}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{status}</span>
              </button>
            ))}
          </div>

          {/* 漂移警告 */}
          {drift.isDrifting && (
            <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'var(--red-soft)', border: '1px solid var(--border)', fontSize: '13px', color: 'var(--red)', lineHeight: 1.6 }}>
              {t('dashboard.drift_warning')} · ΔP = <span className="mono">{formatDeltaP(drift.avgDeltaP, 3)}</span>
            </div>
          )}

          {/* Profile 摘要 */}
          {profile && (
            <div className="card">
              <div style={metaLabel}>Prime Profile · v{profile.version}</div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '12px' }}>
                {profile.core_identity}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {profile.dimensions?.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, height: '3px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${d.weight * 100}%`, height: '100%', background: 'var(--accent)', borderRadius: '2px' }} />
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0, width: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 右栏：趋势图 + 统计 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>
          <div className="card" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={metaLabel}>P {recent30.length > 0 ? `(${recent30.length}d)` : ''}</div>
              {recent30.length > 0 && (
                <div style={{ display: 'flex', gap: '20px' }}>
                  <Stat label="n" value={recent30.length} />
                  <Stat label="avg ΔP" value={formatDeltaP(recent30.reduce((s,e) => s + e.delta_P, 0) / recent30.length, 3)} cls={pColorClass(recent30.reduce((s,e) => s + e.delta_P, 0))} />
                </div>
              )}
            </div>
            <PValueChart data={recent30} height={200} />
          </div>

          {/* 历史表格 */}
          {withCum.length > 0 && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                <span style={metaLabel}>{t('me.history_section')}</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '480px' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-elevated)' }}>
                      {['Date', 'ΔP', t('nav.cumulative_p'), t('me.stat_dot'), t('me.stat_rating')].map((h) => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...withCum].reverse().slice(0, 20).map((row) => (
                      <tr
                        key={row.date}
                        onClick={() => navigate('dailyJournal', row.date)}
                        style={{ cursor: 'pointer', transition: 'background 0.1s' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ ...tdStyle, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{row.date}</td>
                        <td style={tdStyle} className={`mono ${pColorClass(row.delta_P)}`}>{formatDeltaP(row.delta_P, 3)}</td>
                        <td style={tdStyle} className={`mono ${pColorClass(row.cumulative_P)}`}>{formatDeltaP(row.cumulative_P, 2)}</td>
                        <td style={{ ...tdStyle, color: 'var(--text-secondary)' }} className="mono">
                          {row.avg_dot != null ? row.avg_dot.toFixed(3) : '—'}
                        </td>
                        <td style={{ ...tdStyle, color: 'var(--text-secondary)' }} className="mono">
                          {row.avg_user_rating != null ? (row.avg_user_rating >= 0 ? '+' : '') + row.avg_user_rating.toFixed(1) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 空状态 */}
          {!withCum.length && (
            <div className="card" style={{ padding: '64px 32px', textAlign: 'center' }}>
              <div className="mono" style={{ fontSize: '32px', color: 'var(--border)', marginBottom: '16px' }}>◈</div>
              <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '14px' }}>
                {t('dashboard.no_journal')}
              </p>
              <button className="btn btn-primary" onClick={() => navigate('dailyPlan', date)}>
                {t('dashboard.daily_plan')} →
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}

function Stat({ label, value, cls = '' }) {
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '2px' }}>{label}</div>
      <div className={`mono ${cls}`} style={{ fontSize: '14px', fontWeight: 600 }}>{value}</div>
    </div>
  )
}

const metaLabel = {
  fontSize: '11px',
  fontWeight: 700,
  color: 'var(--text-muted)',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  display: 'block',
  marginBottom: '10px',
}

const thStyle = {
  padding: '10px 16px',
  textAlign: 'left',
  fontSize: '11px',
  fontWeight: 700,
  color: 'var(--text-muted)',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
}

const tdStyle = {
  padding: '12px 16px',
  borderTop: '1px solid var(--border)',
  fontSize: '13px',
}
