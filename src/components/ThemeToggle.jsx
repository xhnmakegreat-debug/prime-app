import { useEffect, useState } from 'react'
import { getSettings, setSettings } from '../lib/storage.js'

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => getSettings().theme || 'dark')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    setSettings({ theme: next })
    document.documentElement.setAttribute('data-theme', next)
  }

  return (
    <button
      onClick={toggle}
      className="btn btn-ghost btn-sm"
      title={theme === 'dark' ? '切换为浅色' : '切换为深色'}
      style={{ padding: '6px 8px', fontSize: '16px', lineHeight: 1 }}
    >
      {theme === 'dark' ? '☀︎' : '◑'}
    </button>
  )
}
