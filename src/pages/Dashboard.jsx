import { getHistory, computeCumulativeP, getJournal, getProfile } from '../lib/storage.js'
import { formatDeltaP, pColorClass, driftCheck } from '../lib/scoring.js'
import PValueChart from '../components/PValueChart.jsx'

const TODAY = new Date().toISOString().split('T')[0]

export default function Dashboard({ date = TODAY, navigate }) {
  const history  = getHistory()
  const withCum  = computeCumulativeP(history)
  const latestP  = withCum.length ? withCum[withCum.length - 1].cumulative_P : 0
  const todayH   = withCum.find((h) => h.date === date)
  const todayJ   = getJournal(date)
  const profile  = getProfile()
  const drift    = driftCheck(history)

  const recentHistory = withCum.slice(-30)  // 最近 30 天

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* 标题栏 */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{
              fontFamily: 'monospace',
              fontSize: '26px',
              fontWeight: 700,
              color: 'var(--accent)',
              letterSpacing: '0.1em',
            }}>
              PRIME
            </h1>
            {profile && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: 4 }}>
                {profile.core_identity}
              </p>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={labelStyle}>累计 P</div>
            <div className={`mono ${pColorClass(latestP)}`} style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.03em' }}>
              {formatDeltaP(latestP, 2)}
            </div>
          </div>
        </div>
      </div>

      {/* P 值曲线 */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={labelStyle}>P 值趋势</div>
        <PValueChart data={recentHistory} height={200} />
      </div>

      {/* 漂移警告 */}
      {drift.isDrifting && (
        <div style={{
          padding: '14px 16px',
          borderRadius: '10px',
          background: '#7f1d1d22',
          border: '1px solid #f8717144',
          fontSize: '13px',
          color: '#fca5a5',
        }}>
          近期持续偏离 Prime 方向（近 {Math.min(history.length, 14)} 天平均 ΔP = {formatDeltaP(drift.avgDeltaP, 3)}）。
          建议审视你的 Prime 是否需要调整。
        </div>
      )}

      {/* 今日快捷入口 */}
      <div>
        <div style={labelStyle}>今日 · {date}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <ActionCard
            title="今日计划"
            value={todayH ? null : '未填'}
            onClick={() => navigate('dailyPlan', date)}
            accent={false}
          />
          <ActionCard
            title="今日 ΔP"
            value={todayJ?.total_delta_P != null ? formatDeltaP(todayJ.total_delta_P) : '—'}
            valueClass={todayJ?.total_delta_P != null ? pColorClass(todayJ.total_delta_P) : 'text-muted'}
            onClick={() => navigate('dailyJournal', date)}
          />
          <ActionCard
            title="今日报告"
            value={todayJ?.report ? '已生成' : '未生成'}
            onClick={() => navigate('dailyReport', date)}
          />
        </div>
      </div>

      {/* 历史记录表 */}
      {withCum.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <span style={labelStyle}>历史记录</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-elevated)' }}>
                {['日期', 'ΔP', '累计 P', '对齐均分', '自评均分'].map((h) => (
                  <th key={h} style={{ ...thStyle }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...withCum].reverse().slice(0, 14).map((row) => (
                <tr
                  key={row.date}
                  onClick={() => navigate('dailyJournal', row.date)}
                  style={{ cursor: 'pointer', transition: 'background 0.1s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ ...tdStyle, color: 'var(--text-secondary)' }} className="mono">{row.date}</td>
                  <td style={{ ...tdStyle }} className={`mono ${pColorClass(row.delta_P)}`}>{formatDeltaP(row.delta_P, 3)}</td>
                  <td style={{ ...tdStyle }} className={`mono ${pColorClass(row.cumulative_P)}`}>{formatDeltaP(row.cumulative_P, 2)}</td>
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
      )}

      {/* 空状态 */}
      {!withCum.length && (
        <div className="card" style={{ textAlign: 'center', padding: '48px 32px' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '14px' }}>
            开始你的第一天
          </p>
          <button className="btn btn-primary" onClick={() => navigate('dailyPlan', date)}>
            制定今日计划 →
          </button>
        </div>
      )}
    </div>
  )
}

function ActionCard({ title, value, valueClass = '', onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '16px',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'border-color 0.15s, background 0.15s',
        width: '100%',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-soft)' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)';  e.currentTarget.style.background = 'var(--surface)' }}
    >
      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
        {title}
      </div>
      <div className={`mono ${valueClass}`} style={{ fontSize: '20px', fontWeight: 700 }}>
        {value ?? '→'}
      </div>
    </button>
  )
}

const labelStyle = {
  fontSize: '11px',
  fontWeight: 600,
  color: 'var(--text-muted)',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  display: 'block',
  marginBottom: '12px',
}

const thStyle = {
  padding: '10px 16px',
  textAlign: 'left',
  fontSize: '11px',
  fontWeight: 600,
  color: 'var(--text-muted)',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
}

const tdStyle = {
  padding: '12px 16px',
  borderTop: '1px solid var(--border)',
  fontSize: '13px',
}
