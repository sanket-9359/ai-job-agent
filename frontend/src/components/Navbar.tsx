import { Briefcase, LayoutDashboard, Search } from 'lucide-react'

interface Props {
  page:    'search' | 'applications' | 'dashboard'
  setPage: (p: 'search' | 'applications' | 'dashboard') => void
  savedCount: number
}

export default function Navbar({ page, setPage, savedCount }: Props) {
  const nav = [
    { id: 'search'      as const, label: 'Find Jobs',    icon: Search },
    { id: 'applications'as const, label: 'Saved Jobs',   icon: Briefcase, badge: savedCount },
    { id: 'dashboard'   as const, label: 'Dashboard',    icon: LayoutDashboard },
  ]

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-ink/85 backdrop-blur-xl lg:hidden">
        <div className="h-20 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent text-white flex items-center justify-center shadow-[0_18px_36px_rgba(91,157,255,0.28)]">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-white text-base tracking-tight">AI Job Agent</span>
              <p className="text-[11px] text-muted font-medium">Career workspace</p>
            </div>
          </div>
          <nav className="flex items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-1">
            {nav.map(({ id, label, icon: Icon, badge }) => (
              <button
                key={id}
                onClick={() => setPage(id)}
                title={label}
                className={`relative grid place-items-center w-10 h-10 rounded-xl transition-all duration-200
                  ${page === id ? 'bg-white text-ink shadow-lg' : 'text-muted hover:text-white hover:bg-white/10'}`}
              >
                <Icon className="w-4 h-4" />
                {badge != null && badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <aside className="hidden lg:flex sticky top-0 h-screen flex-col border-r border-white/10 bg-[#090d15]/92 backdrop-blur-xl">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-accent text-white flex items-center justify-center shadow-[0_20px_44px_rgba(91,157,255,0.30)]">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-white text-lg tracking-tight">AI Job Agent</span>
              <p className="text-xs text-muted font-medium mt-0.5">Recruiter-grade workspace</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1.5">
          {nav.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => setPage(id)}
              className={`relative w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200
                ${page === id
                  ? 'bg-white text-ink shadow-[0_16px_40px_rgba(0,0,0,0.32)]'
                  : 'text-dim hover:text-white hover:bg-white/[0.065]'
                }`}
            >
              <span className="flex items-center gap-3">
                <Icon className="w-4 h-4" />
                {label}
              </span>
              {badge != null && badge > 0 && (
                <span className={`min-w-6 h-6 px-2 rounded-full text-[11px] font-bold flex items-center justify-center ${
                  page === id ? 'bg-ink text-white' : 'bg-accent text-white'
                }`}>
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="mt-auto p-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">Workspace</p>
            <p className="text-sm text-white font-semibold mt-2">Search, tailor, track</p>
            <p className="text-xs text-muted leading-relaxed mt-1.5">
              Keep every job action connected without leaving the dashboard.
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
