import { useState, useEffect } from 'react'
import { getSettings, getProfile, getQuestionnaire } from './lib/storage.js'
import Layout from './components/Layout.jsx'
import OnboardingGuide from './components/OnboardingGuide.jsx'
import Setup from './pages/Setup.jsx'
import Questionnaire from './pages/Questionnaire.jsx'
import ProfileConfirm from './pages/ProfileConfirm.jsx'
import DailyPlan from './pages/DailyPlan.jsx'
import DailyJournal from './pages/DailyJournal.jsx'
import DailyReport from './pages/DailyReport.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Me from './pages/Me.jsx'

const TODAY = new Date().toISOString().split('T')[0]

const LAYOUT_PAGES = new Set(['dashboard', 'dailyPlan', 'dailyJournal', 'dailyReport', 'me', 'setup'])

function resolveInitialPage() {
  const settings = getSettings()
  if (!settings.setupCompleted) return 'setup'

  const q = getQuestionnaire()
  if (!q.completed) return 'questionnaire'

  const profile = getProfile()
  if (!profile || !profile.embedding?.length) return 'profileConfirm'

  return 'dashboard'
}

function shouldShowGuide() {
  return localStorage.getItem('prime:onboarding:seen') !== 'true'
}

export default function App() {
  const [page,      setPage]      = useState(resolveInitialPage)
  const [date,      setDate]      = useState(TODAY)
  const [showGuide, setShowGuide] = useState(false)

  // 应用主题 + 首次启动检测
  useEffect(() => {
    const settings = getSettings()
    document.documentElement.setAttribute('data-theme', settings.theme || 'dark')

    // 首次进入 Setup 时不弹指南，其他情况下检测
    if (resolveInitialPage() !== 'setup') {
      setShowGuide(shouldShowGuide())
    }
  }, [])

  function navigate(targetPage, targetDate) {
    setPage(targetPage)
    if (targetDate) setDate(targetDate)
  }

  function handleCloseGuide() {
    localStorage.setItem('prime:onboarding:seen', 'true')
    setShowGuide(false)
  }

  function renderPage() {
    switch (page) {
      case 'setup': {
        const isSettings = getSettings().setupCompleted
        return (
          <Setup
            onComplete={() => {
              if (isSettings) {
                navigate('dashboard')
              } else {
                navigate('questionnaire')
                if (shouldShowGuide()) setShowGuide(true)
              }
            }}
            isSettings={isSettings}
          />
        )
      }

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
        return <Me navigate={navigate} onOpenGuide={() => setShowGuide(true)} />

      default:
        return <Dashboard date={date} navigate={navigate} />
    }
  }

  const showLayout = LAYOUT_PAGES.has(page) && page !== 'setup'

  return (
    <>
      {showLayout ? (
        <Layout currentPage={page} navigate={navigate} date={date}>
          {renderPage()}
        </Layout>
      ) : (
        renderPage()
      )}

      {/* 使用指南弹窗 */}
      {showGuide && <OnboardingGuide onClose={handleCloseGuide} />}
    </>
  )
}
