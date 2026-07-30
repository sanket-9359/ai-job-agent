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
      setApps(prev =>
        prev.map(a =>
          a._id === id
            ? {
                ...a,
                ...updated,
                job:
                  updated.job &&
                  typeof updated.job === 'object' &&
                  updated.job.company
                    ? {
                        ...a.job,
                        ...updated.job
                      }
                    : a.job
              }
            : a
        )
      )
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
    <div className="space-y-4 animate-fade-in">
      {[1,2,3].map(i => (
        <div key={i} className="card p-7 space-y-4">
          <div className="h-5 bg-white/10 rounded-xl w-2/3 animate-pulse-soft" />
          <div className="h-3 bg-white/10 rounded-xl w-1/3 animate-pulse-soft" />
          <div className="flex gap-2">
            <div className="h-7 bg-white/10 rounded-full w-20 animate-pulse-soft" />
            <div className="h-7 bg-white/10 rounded-full w-24 animate-pulse-soft" />
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="max-w-[1320px] mx-auto space-y-6">
      {/* Header */}
      <div className="rounded-[32px] border border-white/10 bg-white/[0.035] p-6 sm:p-8 shadow-[0_24px_90px_rgba(0,0,0,0.24)]">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <p className="section-heading mb-3">Application Operations</p>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-[-0.03em] text-white">Saved Jobs</h1>
            <p className="text-base text-dim mt-3">
              {apps.length} application{apps.length !== 1 ? 's' : ''} tracked across your pipeline.
            </p>
          </div>
          <button onClick={load} className="btn-ghost w-full sm:w-auto justify-center">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-7">
          {STATUS_OPTIONS.map(status => (
            <div key={status.value} className="rounded-2xl border border-white/10 bg-ink/40 p-4">
              <p className="text-xs text-muted font-semibold">{status.label}</p>
              <p className="text-2xl font-bold text-white mt-1">
                {apps.filter(app => app.status === status.value).length}
              </p>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="card p-5 border-red/30 bg-red/10">
          <p className="text-sm text-red font-semibold">{error}</p>
        </div>
      )}

      {apps.length === 0 && !error && (
        <div className="card flex flex-col items-center justify-center py-28 gap-5 animate-fade-in">
          <div className="w-20 h-20 rounded-3xl bg-white/[0.045] border border-white/10 flex items-center justify-center">
            <Briefcase className="w-8 h-8 text-accent" />
          </div>
          <div className="text-center">
            <p className="text-white font-bold text-xl">No saved jobs yet</p>
            <p className="text-sm text-muted mt-3 max-w-xs leading-relaxed">
              Click the bookmark icon on any job card to save it here.
            </p>
          </div>
        </div>
      )}

      <div className="rounded-[28px] border border-white/10 bg-[#0d1320]/75 shadow-[0_24px_80px_rgba(0,0,0,0.22)] overflow-hidden">
        <div className="grid grid-cols-[minmax(0,1fr)_150px_180px] gap-4 px-6 py-3 border-b border-white/10 bg-white/[0.025] text-[11px] font-bold uppercase tracking-[0.16em] text-muted max-lg:hidden">
          <span>Role</span>
          <span>Status</span>
          <span>Controls</span>
        </div>
        {apps.map(app => {
          const job = app.job
          if (!job) return null
          return (
            <article key={app._id} className="grid lg:grid-cols-[minmax(0,1fr)_150px_180px] gap-5 p-5 sm:p-6 border-b border-white/10 last:border-b-0 animate-slide-up transition-colors hover:bg-white/[0.035]">
              {/* Job info */}
              <div className="min-w-0 flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white text-ink flex items-center justify-center text-lg font-black shrink-0">
                  {(job.company || job.title || '?').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-white text-lg tracking-tight leading-tight truncate">{job.title}</h3>
                  <p className="text-accent text-sm font-semibold mt-1">{job.company}</p>
                  {job.location && (
                    <p className="text-sm text-muted mt-1">{job.location}</p>
                  )}
                </div>
              </div>

              <div className="flex lg:block items-start gap-3">
                <span className={statusClass[app.status]}>{STATUS_LABELS[app.status]}</span>
              </div>

              <div className="flex items-start gap-2 lg:justify-end">
                  {job.url && (
                    <a href={job.url} target="_blank" rel="noopener noreferrer"
                      className="p-2.5 rounded-xl border border-white/10 bg-white/[0.035] text-muted hover:text-accent hover:border-accent/40 hover:bg-accent/10 transition-all">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button onClick={() => handleDelete(app._id)}
                    className="p-2.5 rounded-xl border border-white/10 bg-white/[0.035] text-muted hover:text-red hover:border-red/40 hover:bg-red/10 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
              </div>

              {/* Timestamps */}
              <div className="lg:col-span-3 flex flex-wrap gap-3 text-sm text-muted rounded-2xl border border-white/10 bg-white/[0.025] px-4 py-3">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-muted/60" />
                  Saved: {app.savedAtFormatted || formatDate(app.savedAt) || '—'}
                </span>
                {app.appliedAt && (
                  <span className="flex items-center gap-1.5 text-accent">
                    <Clock className="w-3.5 h-3.5 text-accent/60" />
                    Applied: {app.appliedAtFormatted || formatDate(app.appliedAt)}
                  </span>
                )}
                {app.reminderAt && app.status === 'applied' && (
                  <span className="flex items-center gap-1.5 text-amber">
                    <Clock className="w-3.5 h-3.5 text-amber/60" />
                    Follow up: {formatDate(app.reminderAt)}
                  </span>
                )}
              </div>

              {/* Saved AI content */}
              {app.generatedEmail && (
                <div className="lg:col-span-3 flex items-center gap-3 text-sm text-dim bg-white/[0.035] border border-white/10 rounded-2xl px-4 py-3 hover:border-accent/30 transition-colors">
                  <Mail className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span className="truncate">{app.generatedEmail.split('\n')[0]}</span>
                </div>
              )}
              {app.generatedAnalysis?.rawText && (
                <div className="lg:col-span-3 flex items-center gap-3 text-sm text-dim bg-white/[0.035] border border-white/10 rounded-2xl px-4 py-3 hover:border-purple/30 transition-colors">
                  <FileText className="w-3.5 h-3.5 text-purple shrink-0" />
                  <span>Resume analysis saved</span>
                </div>
              )}

              {/* Status selector */}
              <div className="lg:col-span-3 flex flex-col sm:flex-row sm:items-center gap-3 pt-2 border-t border-white/10">
                <label className="section-heading mb-0 shrink-0 pt-3 sm:pt-0">Status</label>
                <div className="relative flex-1">
                  <select
                    value={app.status}
                    onChange={e => handleStatus(app._id, e.target.value as ApplicationStatus)}
                    className="select text-sm py-3 pr-10 appearance-none cursor-pointer font-semibold"
                  >
                    {STATUS_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
