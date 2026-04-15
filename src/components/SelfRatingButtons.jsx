const RATINGS = [-3, -2, -1, 0, 1, 2, 3]

const META = {
  '-3': { label: '严重背离', color: '#ef4444' },
  '-2': { label: '明显背离', color: '#f87171' },
  '-1': { label: '轻度背离', color: '#fca5a5' },
   '0': { label: '中性',     color: '#6b7280' },
   '1': { label: '轻度正向', color: '#86efac' },
   '2': { label: '正向实践', color: '#34d399' },
   '3': { label: '核心突破', color: '#10b981' },
}

export default function SelfRatingButtons({ value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', gap: '6px' }}>
        {RATINGS.map((r) => {
          const meta    = META[String(r)]
          const active  = value === r
          const sign    = r > 0 ? `+${r}` : String(r)
          return (
            <button
              key={r}
              type="button"
              onClick={() => onChange(r)}
              style={{
                flex: 1,
                padding: '8px 0',
                borderRadius: '10px',
                border: `1.5px solid ${active ? meta.color : 'var(--border)'}`,
                background: active ? meta.color : 'transparent',
                color: active ? '#fff' : meta.color,
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                lineHeight: 1,
              }}
            >
              {sign}
            </button>
          )
        })}
      </div>

      {value !== null && value !== undefined && (
        <p style={{
          textAlign: 'center',
          fontSize: '13px',
          color: META[String(value)]?.color ?? 'var(--text-muted)',
          fontWeight: 500,
        }}>
          {META[String(value)]?.label}
        </p>
      )}
    </div>
  )
}
