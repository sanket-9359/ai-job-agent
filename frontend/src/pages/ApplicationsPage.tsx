import { useEffect, useState, useCallback } from 'react'
import {
  getApplications, updateApplication, deleteApplication
} from '../api'
import type { Application, ApplicationStatus } from '../types'
import {
  Trash2, ExternalLink, ChevronDown, RefreshCw,
  Briefcase, Calendar, Clock, Mail, FileText
} from 'lucide-react'
import { STATUS_OPTIONS, STATUS_LABELS, formatDate } from '../utils/helpers'

interface Props {
  refreshTrigger: number
  onCountChange:  (n: number) => void
}

export default function ApplicationsPage({ refreshTrigger, onCountChange }: Props) {
  const [apps,    setApps]    = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getApplications()
      setApps(data)
      onCountChange(data.length)
    } catch (e: any) {
      setError(e.message || 'Failed to load applications')
    } finally {
      setLoading(false)
    }
  }, [onCountChange])

  useEffect(() => { load() }, [load, refreshTrigger])

  const handleStatus = async (id: string, status: ApplicationStatus) => {
    try {
      const updated = await updateApplication(id, { status })
      setApps(prev => prev.map(a => a._id === id ? { ...a, ...updated } : a))
    } catch (e: any) {
      console.error('Status update failed:', e.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this saved job?')) return
    try {
      await deleteApplication(id)
      setApps(prev => {
        const next = prev.filter(a => a._id !== id)
        onCountChange(next.length)
        return next
      })
    } catch (e: any) {
      console.error('Delete failed:', e.message)
    }
  }

  const statusClass: Record<ApplicationStatus, string> = {
    pending:   'status-pending',
    applied:   'status-applied',
    interview: 'status-interview',
    rejected:  'status-rejected',
    offer:     'status-offer',
  }

  if (loading) return (
    <div className="space-y-3 animate-fade-in">
      {[1,2,3].map(i => (
        <div key={i} className="card p-5 space-y-3">
          <div className="h-4 bg-slate rounded-lg w-2/3 animate-pulse-soft" />
          <div className="h-3 bg-slate rounded-lg w-1/3 animate-pulse-soft" />
          <div className="flex gap-2">
            <div className="h-6 bg-slate rounded-lg w-20 animate-pulse-soft" />
            <div className="h-6 bg-slate rounded-lg w-24 animate-pulse-soft" />
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Saved Jobs</h1>
          <p className="text-sm text-muted mt-0.5">
            {apps.length} application{apps.length !== 1 ? 's' : ''} tracked
          </p>
        </div>
        <button onClick={load} className="btn-ghost">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {error && (
        <div className="card p-4 border-red/20 bg-red/5">
          <p className="text-sm text-red">{error}</p>
        </div>
      )}

      {apps.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-slate border border-border flex items-center justify-center">
            <Briefcase className="w-7 h-7 text-muted" />
          </div>
          <div className="text-center">
            <p className="text-white font-medium">No saved jobs yet</p>
            <p className="text-sm text-muted mt-1">
              Click the bookmark icon on any job card to save it here.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {apps.map(app => {
          const job = app.job
          if (!job) return null
          return (
            <article key={app._id} className="card p-5 space-y-4 animate-slide-up hover:border-white/10 transition-colors">
              {/* Job info */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-white text-sm leading-snug">{job.title}</h3>
                  <p className="text-accent text-xs font-medium mt-0.5">{job.company}</p>
                  {job.location && (
                    <p className="text-xs text-muted mt-0.5">{job.location}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={statusClass[app.status]}>{STATUS_LABELS[app.status]}</span>
                  {job.url && (
                    <a href={job.url} target="_blank" rel="noopener noreferrer"
                      className="p-1.5 rounded-lg border border-border text-muted hover:text-accent hover:border-accent/30 transition-all">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button onClick={() => handleDelete(app._id)}
                    className="p-1.5 rounded-lg border border-border text-muted hover:text-red hover:border-red/30 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Timestamps */}
              <div className="flex flex-wrap gap-x-5 gap-y-1">
                <span className="flex items-center gap-1.5 text-xs text-muted">
                  <Calendar className="w-3 h-3" />
                  Saved: {app.savedAtFormatted || formatDate(app.savedAt) || '—'}
                </span>
                {app.appliedAt && (
                  <span className="flex items-center gap-1.5 text-xs text-accent">
                    <Clock className="w-3 h-3" />
                    Applied: {app.appliedAtFormatted || formatDate(app.appliedAt)}
                  </span>
                )}
                {app.reminderAt && app.status === 'applied' && (
                  <span className="flex items-center gap-1.5 text-xs text-amber">
                    <Clock className="w-3 h-3" />
                    Follow up: {formatDate(app.reminderAt)}
                  </span>
                )}
              </div>

              {/* Saved AI content */}
              {app.generatedEmail && (
                <div className="flex items-center gap-2 text-xs text-dim bg-slate/50 border border-border rounded-xl px-3 py-2">
                  <Mail className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span className="truncate">{app.generatedEmail.split('\n')[0]}</span>
                </div>
              )}
              {app.generatedAnalysis?.rawText && (
                <div className="flex items-center gap-2 text-xs text-dim bg-slate/50 border border-border rounded-xl px-3 py-2">
                  <FileText className="w-3.5 h-3.5 text-purple shrink-0" />
                  <span>Resume analysis saved</span>
                </div>
              )}

              {/* Status selector */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted shrink-0">Update status:</label>
                <div className="relative">
                  <select
                    value={app.status}
                    onChange={e => handleStatus(app._id, e.target.value as ApplicationStatus)}
                    className="select text-xs py-1.5 pr-8 appearance-none cursor-pointer"
                  >
                    {STATUS_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
