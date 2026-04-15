import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer, Dot,
} from 'recharts'
import { pColorClass } from '../lib/scoring.js'

function CustomDot(props) {
  const { cx, cy, payload } = props
  const color = payload.delta_P > 0 ? '#34d399' : payload.delta_P < 0 ? '#f87171' : '#6b7280'
  return <circle cx={cx} cy={cy} r={4} fill={color} stroke="none" />
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border)',
      borderRadius: '10px',
      padding: '10px 14px',
      fontSize: '13px',
      fontFamily: 'var(--font-mono, monospace)',
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{d.date}</div>
      <div>
        <span style={{ color: 'var(--text-secondary)' }}>累计 P  </span>
        <span style={{ color: d.cumulative_P >= 0 ? '#34d399' : '#f87171', fontWeight: 600 }}>
          {d.cumulative_P >= 0 ? '+' : ''}{d.cumulative_P?.toFixed(4)}
        </span>
      </div>
      <div>
        <span style={{ color: 'var(--text-secondary)' }}>今日 ΔP  </span>
        <span style={{ color: d.delta_P >= 0 ? '#34d399' : '#f87171' }}>
          {d.delta_P >= 0 ? '+' : ''}{d.delta_P?.toFixed(4)}
        </span>
      </div>
    </div>
  )
}

export default function PValueChart({ data = [], height = 220 }) {
  if (!data.length) {
    return (
      <div style={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        fontSize: '13px',
        border: '1px dashed var(--border)',
        borderRadius: '10px',
      }}>
        暂无数据
      </div>
    )
  }

  const isPositiveTrend = data.length >= 2
    ? data[data.length - 1].cumulative_P >= data[0].cumulative_P
    : true
  const lineColor = isPositiveTrend ? '#8b5cf6' : '#f87171'

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(d) => d.slice(5)}  // MM-DD
          tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'monospace' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'monospace' }}
          axisLine={false}
          tickLine={false}
          width={50}
          tickFormatter={(v) => (v >= 0 ? '+' : '') + v.toFixed(1)}
        />
        <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="4 4" />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="cumulative_P"
          stroke={lineColor}
          strokeWidth={2}
          dot={<CustomDot />}
          activeDot={{ r: 6, fill: lineColor }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
