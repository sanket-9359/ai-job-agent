import { useEffect, useState, useCallback } from 'react'
import { getApplications } from '../api'
import type { Application, ApplicationStatus } from '../types'
import {
  Briefcase, Send, Users, ThumbsDown, Award,
  TrendingUp, Calendar, RefreshCw
} from 'lucide-react'
import { formatDate } from '../utils/helpers'

interface Props { refreshTrigger: number }

const STATUS_ICONS: Record<ApplicationStatus, typeof Briefcase> = {
  pending:   Briefcase,
  applied:   Send,
  interview: Users,
  rejected:  ThumbsDown,
  offer:     Award,
}

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  pending:   'text-amber  bg-amber/10  border-amber/20',
  applied:   'text-accent bg-accent/10 border-accent/20',
  interview: 'text-purple bg-purple/10 border-purple/20',
  rejected:  'text-red    bg-red/10    border-red/20',
  offer:     'text-green  bg-green/10  border-green/20',
}

export default function DashboardPage({ refreshTrigger }: Props) {
  const [apps,    setApps]    = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try { setApps(await getApplications()) }
    catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load, refreshTrigger])

  const counts = apps.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1
    return acc
  }, {})

  const total       = apps.length
  const responseRate = total > 0
    ? Math.round(((counts.interview || 0) + (counts.offer || 0)) / total * 100)
    : 0

  const recent = [...apps]
    .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
    .slice(0, 5)

  const statCards = [
    { label: 'Total Saved',   value: total,                color: 'text-white',  bg: 'bg-white/5  border-white/10' },
    { label: 'Applied',       value: counts.applied   || 0, color: 'text-accent', bg: 'bg-accent/5 border-accent/20' },
    { label: 'Interviews',    value: counts.interview || 0, color: 'text-purple', bg: 'bg-purple/5 border-purple/20' },
    { label: 'Offers',        value: counts.offer     || 0, color: 'text-green',  bg: 'bg-green/5  border-green/20' },
    { label: 'Response Rate', value: `${responseRate}%`,   color: 'text-amber',  bg: 'bg-amber/5  border-amber/20' },
  ]

  if (loading) return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 animate-fade-in">
      {[1,2,3,4,5].map(i => (
        <div key={i} className="card p-4 space-y-2">
          <div className="h-3 bg-slate rounded w-2/3 animate-pulse-soft" />
          <div className="h-7 bg-slate rounded w-1/2 animate-pulse-soft" />
        </div>
      ))}
    </div>
  )

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Dashboard</h1>
          <p className="text-sm text-muted mt-0.5">Your job search at a glance</p>
        </div>
        <button onClick={load} className="btn-ghost">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {statCards.map(({ label, value, color, bg }) => (
          <div key={label} className={`card p-4 border ${bg}`}>
            <p className="text-xs text-muted mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Pipeline */}
      {total > 0 && (
        <div className="card p-5 space-y-4">
          <p className="section-heading flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5" /> Application Pipeline
          </p>
          <div className="space-y-3">
            {(['pending','applied','interview','rejected','offer'] as ApplicationStatus[]).map(status => {
              const Icon  = STATUS_ICONS[status]
              const count = counts[status] || 0
              const pct   = total > 0 ? Math.round(count / total * 100) : 0
              return (
                <div key={status} className="flex items-center gap-3">
                  <div className={`flex items-center gap-1.5 w-28 shrink-0 badge border ${STATUS_COLORS[status]}`}>
                    <Icon className="w-3 h-3" />
                    <span className="capitalize text-xs">{status}</span>
                  </div>
                  <div className="flex-1 bg-slate rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-current transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted w-8 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent activity */}
      {recent.length > 0 && (
        <div className="card p-5 space-y-4">
          <p className="section-heading flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" /> Recent Activity
          </p>
          <div className="space-y-2">
            {recent.map(app => (
              <div key={app._id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{app.job?.title}</p>
                  <p className="text-xs text-muted">{app.job?.company}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`badge border ${STATUS_COLORS[app.status]}`}>{app.status}</span>
                  <span className="text-xs text-muted">{formatDate(app.savedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {total === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate border border-border flex items-center justify-center">
            <TrendingUp className="w-7 h-7 text-muted" />
          </div>
          <div className="text-center">
            <p className="text-white font-medium">No data yet</p>
            <p className="text-sm text-muted mt-1">Start saving jobs to see your pipeline here.</p>
          </div>
        </div>
      )}
    </div>
  )
}
