import { useEffect, useState } from 'react'
import Navbar from './components/Navbar'
import SearchPage from './pages/SearchPage'
import ApplicationsPage from './pages/ApplicationsPage'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import type { AuthUser, UserProfile } from './types'

type Page = 'search' | 'applications' | 'dashboard'
type AuthView = 'login' | 'register'

const DEFAULT_PROFILE: UserProfile = {
  targetRole: '',
  experience: '',
  skills:     [],
  resumeText: '',
  resumeFile: null,
}

export default function App() {
  const [page, setPage] = useState<Page>('search')
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE)
  const [savedCount, setSavedCount] = useState(0)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [authView, setAuthView] = useState<AuthView>('login')
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('authUser')
    if (!stored) return null
    try { return JSON.parse(stored) as AuthUser }
    catch { return null }
  })

  useEffect(() => {
    if (user) {
      localStorage.setItem('authUser', JSON.stringify(user))
    } else {
      localStorage.removeItem('authUser')
    }
  }, [user])

  const handleAuthSuccess = (authUser: AuthUser, token: string) => {
    localStorage.setItem('authToken', token)
    setUser(authUser)
    setPage('search')
  }

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    setUser(null)
    setAuthView('login')
  }

  if (!user) {
    return authView === 'login' ? (
      <LoginPage
        onSuccess={handleAuthSuccess}
        onSwitchToRegister={() => setAuthView('register')}
      />
    ) : (
      <RegisterPage
        onSuccess={handleAuthSuccess}
        onSwitchToLogin={() => setAuthView('login')}
      />
    )
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
      <Navbar page={page} setPage={setPage} savedCount={savedCount} />

      <main className="min-w-0 px-4 sm:px-6 lg:px-8 py-6 lg:py-8 pt-24 lg:pt-8">
        <div className="mb-6 flex items-center justify-end gap-3">
          <span className="text-sm text-muted">Signed in as {user.fullName}</span>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-3xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
          >
            Logout
          </button>
        </div>

        {page === 'search' && (
          <SearchPage
            profile={profile}
            onChange={setProfile}
            onJobSaved={() => {
              setSavedCount(c => c + 1)
              setRefreshTrigger(t => t + 1)
            }}
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
