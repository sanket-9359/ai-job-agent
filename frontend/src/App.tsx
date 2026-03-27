import { useState } from 'react'
import Navbar from './components/Navbar'
import SearchPage from './pages/SearchPage'
import ApplicationsPage from './pages/ApplicationsPage'
import DashboardPage from './pages/DashboardPage'
import type { UserProfile } from './types'

type Page = 'search' | 'applications' | 'dashboard'

const DEFAULT_PROFILE: UserProfile = {
  targetRole: '',
  experience: '',
  skills:     [],
  resumeText: '',
  resumeFile: null,
}

export default function App() {
  const [page,           setPage]           = useState<Page>('search')
  const [profile,        setProfile]        = useState<UserProfile>(DEFAULT_PROFILE)
  const [savedCount,     setSavedCount]     = useState(0)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleJobSaved = () => {
    setSavedCount(c => c + 1)
    setRefreshTrigger(t => t + 1)
  }

  return (
    <div className="min-h-screen">
      <Navbar page={page} setPage={setPage} savedCount={savedCount} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {page === 'search' && (
          <SearchPage
            profile={profile}
            onChange={setProfile}
            onJobSaved={handleJobSaved}
          />
        )}
        {page === 'applications' && (
          <ApplicationsPage
            refreshTrigger={refreshTrigger}
            onCountChange={setSavedCount}
          />
        )}
        {page === 'dashboard' && (
          <DashboardPage refreshTrigger={refreshTrigger} />
        )}
      </main>
    </div>
  )
}
