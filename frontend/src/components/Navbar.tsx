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
    <header className="sticky top-0 z-50 bg-ink/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center">
            <Briefcase className="w-3.5 h-3.5 text-accent" />
          </div>
          <span className="font-semibold text-white text-sm tracking-tight">AI Job Agent</span>
        </div>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          {nav.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => setPage(id)}
              className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all
                ${page === id
                  ? 'bg-accent/15 text-accent'
                  : 'text-muted hover:text-dim hover:bg-white/5'
                }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
              {badge != null && badge > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>
    </header>
  )
}
