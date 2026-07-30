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
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 animate-fade-in">
      {[1,2,3,4,5].map(i => (
        <div key={i} className="card p-6 space-y-4">
          <div className="h-3 bg-white/10 rounded-xl w-2/3 animate-pulse-soft" />
          <div className="h-8 bg-white/10 rounded-xl w-1/2 animate-pulse-soft" />
        </div>
      ))}
    </div>
  )

  return (
    <div className="max-w-[1320px] mx-auto space-y-6 animate-fade-in">
      <div className="rounded-[32px] border border-white/10 bg-white/[0.035] p-6 sm:p-8 shadow-[0_24px_90px_rgba(0,0,0,0.24)]">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
          <div>
            <p className="section-heading mb-3">Pipeline Intelligence</p>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-[-0.03em] text-white">Dashboard</h1>
            <p className="text-base text-dim mt-3">Your job search at a glance</p>
          </div>
          <button onClick={load} className="btn-ghost w-full sm:w-auto justify-center">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map(({ label, value, color, bg }) => (
          <div key={label} className={`rounded-[24px] border ${bg} p-5 sm:p-6 shadow-[0_18px_54px_rgba(0,0,0,0.22)] hover:-translate-y-0.5 hover:border-white/20 transition-all`}>
            <p className="section-heading mb-3">{label}</p>
            <p className={`text-3xl sm:text-4xl font-bold tracking-tight ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Pipeline */}
      {total > 0 && (
        <div className="rounded-[28px] border border-white/10 bg-[#0d1320]/85 p-6 sm:p-7 space-y-6 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
          <p className="section-heading flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Application Pipeline
          </p>
          <div className="grid gap-4">
            {(['pending','applied','interview','rejected','offer'] as ApplicationStatus[]).map(status => {
              const Icon  = STATUS_ICONS[status]
              const count = counts[status] || 0
              const pct   = total > 0 ? Math.round(count / total * 100) : 0
              return (
                <div key={status} className="grid grid-cols-[130px_minmax(0,1fr)_64px] items-center gap-4">
                  <div className={`flex items-center gap-1.5 shrink-0 badge border ${STATUS_COLORS[status]}`}>
                    <Icon className="w-3.5 h-3.5" />
                    <span className="capitalize text-xs font-semibold">{status}</span>
                  </div>
                  <div className="bg-white/10 rounded-full h-3 overflow-hidden shadow-inner shadow-black/30">
                    <div
                      className="h-full rounded-full bg-current transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted font-semibold w-16 text-right">{count} ({pct}%)</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent activity */}
      {recent.length > 0 && (
        <div className="rounded-[28px] border border-white/10 bg-[#0d1320]/85 p-6 sm:p-7 space-y-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
          <p className="section-heading flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Recent Activity
          </p>
          <div className="space-y-2">
            {recent.map(app => (
              <div key={app._id} className={`grid sm:grid-cols-[minmax(0,1fr)_auto] gap-3 py-4 px-4 rounded-2xl transition-colors bg-white/[0.025] hover:bg-white/[0.055] border border-white/10`}>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-bold text-white truncate">{app.job?.title}</p>
                  <p className="text-sm text-muted mt-1">{app.job?.company}</p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className={`badge border ${STATUS_COLORS[app.status]}`}>{app.status}</span>
                  <span className="text-xs text-muted font-medium">{formatDate(app.savedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {total === 0 && (
        <div className="card flex flex-col items-center justify-center py-28 gap-5 animate-fade-in">
          <div className="w-20 h-20 rounded-3xl bg-white/[0.045] border border-white/10 flex items-center justify-center">
            <TrendingUp className="w-8 h-8 text-accent" />
          </div>
          <div className="text-center">
            <p className="text-white font-bold text-xl">No data yet</p>
            <p className="text-sm text-muted mt-3 max-w-xs leading-relaxed">Start saving jobs to see your application pipeline and dashboard metrics here.</p>
          </div>
        </div>
      )}
    </div>
  )
}
