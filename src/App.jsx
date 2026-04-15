import { useState, useEffect } from 'react'
import { getSettings, getProfile, getQuestionnaire } from './lib/storage.js'
import Layout from './components/Layout.jsx'
import Setup from './pages/Setup.jsx'
import Questionnaire from './pages/Questionnaire.jsx'
import ProfileConfirm from './pages/ProfileConfirm.jsx'
import DailyPlan from './pages/DailyPlan.jsx'
import DailyJournal from './pages/DailyJournal.jsx'
import DailyReport from './pages/DailyReport.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Me from './pages/Me.jsx'

const TODAY = new Date().toISOString().split('T')[0]

// 有侧边栏导航的页面
const LAYOUT_PAGES = new Set(['dashboard', 'dailyPlan', 'dailyJournal', 'dailyReport', 'me', 'setup'])

function resolveInitialPage() {
  const settings = getSettings()
  // 未配置供应商 → 强制进入设置
  if (!settings.provider || settings.provider === '') return 'setup'

  const q = getQuestionnaire()
  if (!q.completed) return 'questionnaire'

  const profile = getProfile()
  if (!profile || !profile.embedding?.length) return 'profileConfirm'

  return 'dashboard'
}

export default function App() {
  const [page, setPage] = useState(resolveInitialPage)
  const [date, setDate] = useState(TODAY)

  // 应用主题
  useEffect(() => {
    const settings = getSettings()
    const theme    = settings.theme || 'dark'
    document.documentElement.setAttribute('data-theme', theme)
  }, [])

  function navigate(targetPage, targetDate) {
    setPage(targetPage)
    if (targetDate) setDate(targetDate)
  }

  function renderPage() {
    switch (page) {
      case 'setup':
        return <Setup onComplete={() => navigate('questionnaire')} />

      case 'questionnaire':
        return <Questionnaire onComplete={() => navigate('profileConfirm')} />

      case 'profileConfirm':
        return <ProfileConfirm onComplete={() => navigate('dashboard')} navigate={navigate} />

      case 'dashboard':
        return <Dashboard date={date} navigate={navigate} />

      case 'dailyPlan':
        return <DailyPlan date={date} navigate={navigate} />

      case 'dailyJournal':
        return <DailyJournal date={date} navigate={navigate} />

      case 'dailyReport':
        return <DailyReport date={date} navigate={navigate} />

      case 'me':
        return <Me navigate={navigate} />

      default:
        return <Dashboard date={date} navigate={navigate} />
    }
  }

  const showLayout = LAYOUT_PAGES.has(page)
    && page !== 'setup'  // Setup 页面有自己的全屏布局

  if (showLayout) {
    return (
      <Layout currentPage={page} navigate={navigate} date={date}>
        {renderPage()}
      </Layout>
    )
  }

  return renderPage()
}
