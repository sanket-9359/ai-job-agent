import { useState, memo } from 'react'
import {
  MapPin, Clock, Briefcase, ExternalLink, Mail, FileSearch,
  Check, X, ChevronDown, ChevronUp, Copy, CheckCheck, Bookmark,
  BookmarkCheck, AlertCircle, Wifi, WifiOff, Info, Lightbulb
} from 'lucide-react'
import type { Job, UserProfile, EmailResponse, BulletsResponse } from '../types'
import { generateEmail, generateBullets, createApplication } from '../api'
import { copyToClipboard, truncate } from '../utils/helpers'

interface Props {
  job:         Job
  profile:     UserProfile
  onSaved?:     () => void
  isSaved?:     boolean
  searchMode?: 'primary' | 'secondary'
}

type Panel = 'why' | 'email' | 'resume' | null

function JobCard({ job, profile, onSaved, isSaved = false, searchMode }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [panel, setPanel]       = useState<Panel>(null)

  const [emailData,  setEmailData]  = useState<EmailResponse | null>(null)
  const [bulletData, setBulletData] = useState<BulletsResponse | null>(null)

  const [loadingEmail,  setLoadingEmail]  = useState(false)
  const [loadingBullets, setLoadingBullets] = useState(false)
  const [saving,         setSaving]         = useState(false)
  const [saved,          setSaved]          = useState(isSaved)

  const [error,  setError]  = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const { matchMetadata, whyJobFitsYou } = job
  const hasResume = profile.resumeText && profile.resumeText.length >= 50

  // FIXED: Determine which ID to use. Search results use jobId, saved jobs use _id.
  const activeJobId = job.jobId || job._id;

  // ── Panel toggle ────────────────────────────────────────────────────────────
  const togglePanel = (p: Panel) => setPanel(prev => prev === p ? null : p)

  // ── Generate email ───────────────────────────────────────────────────────────
  const handleGenerateEmail = async () => {
    setError(null)
    setLoadingEmail(true)
    togglePanel('email')
    try {
      // Pass the active ID (string or mongo)
      const result = await generateEmail(activeJobId, profile)
      setEmailData(result)
    } catch (e: any) {
      setError(e.message || 'Failed to generate email')
    } finally {
      setLoadingEmail(false)
    }
  }

  // ── Analyze resume ───────────────────────────────────────────────────────────
  const handleAnalyzeResume = async () => {
    if (!hasResume) {
      setError('Upload a resume first to analyze it against this job.')
      return
    }
    setError(null)
    setLoadingBullets(true)
    togglePanel('resume')
    try {
      const result = await generateBullets(activeJobId, profile)
      setBulletData(result)
    } catch (e: any) {
      setError(e.message || 'Failed to analyze resume')
    } finally {
      setLoadingBullets(false)
    }
  }

  // ── Save job ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (saved) return
    setSaving(true)
    setError(null)
    try {
      // FIX: Passing the full job object as the second argument (jobData)
      // This allows the backend to create the job if it doesn't exist yet.
      await createApplication(activeJobId, job)
      setSaved(true)
      onSaved?.()
    } catch (e: any) {
      if (e.message?.includes('already saved')) {
        setSaved(true)
      } else {
        setError(e.message || 'Failed to save job')
      }
    } finally {
      setSaving(false)
    }
  }

  // ── Copy email ────────────────────────────────────────────────────────────────
  const handleCopy = async () => {
    const text = emailData?.email || emailData?.body || ''
    const ok = await copyToClipboard(text)
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000) }
  }

  // ── Match indicators ─────────────────────────────────────────────────────────
  const MatchBadge = ({ ok, label }: { ok: boolean; label: string }) => (
    <span className={ok ? 'tag-matched' : 'tag-unmatched'}>
      {ok ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
      {label}
    </span>
  )

  return (
    <article className="card p-5 space-y-4 animate-slide-up hover:border-white/10 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-white text-base leading-snug">{job.title}</h3>
          <p className="text-accent text-sm font-medium mt-0.5">{job.company}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {job.source === 'demo' && (
            <span className="badge bg-amber/10 text-amber border border-amber/20 text-xs">Demo</span>
          )}
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className={`p-2 rounded-xl border transition-all ${
              saved
                ? 'bg-green/10 border-green/20 text-green'
                : 'border-border text-muted hover:border-accent/40 hover:text-accent'
            }`}
          >
            {saving ? <span className="spinner" /> : saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {job.location && (
          <span className="flex items-center gap-1 text-xs text-dim">
            <MapPin className="w-3 h-3" /> {job.location}
          </span>
        )}
        {job.workMode && (
          <span className="flex items-center gap-1 text-xs text-dim">
            <Wifi className="w-3 h-3" /> {job.workMode}
          </span>
        )}
        {job.jobType && (
          <span className="flex items-center gap-1 text-xs text-dim">
            <Briefcase className="w-3 h-3" /> {job.jobType}
          </span>
        )}
        {job.salary && (
          <span className="text-xs font-medium text-green">{job.salary}</span>
        )}
      </div>

      {/* Skills */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
          <MatchBadge ok={matchMetadata.roleMatch}       label="Role match" />
          <MatchBadge ok={matchMetadata.experienceMatch} label="Experience" />
        </div>
        {(matchMetadata.matchedSkills.length > 0 || matchMetadata.unmatchedSkills.length > 0) && (
          <div className="flex flex-wrap gap-1.5">
            {matchMetadata.matchedSkills.map(s => <span key={s} className="tag-matched">{s}</span>)}
            {matchMetadata.unmatchedSkills.map(s => <span key={s} className="tag-unmatched">{s}</span>)}
          </div>
        )}
      </div>

      {/* Description */}
      {job.description && (
        <div>
          <p className="text-xs text-dim leading-relaxed">
            {expanded ? job.description : truncate(job.description, 160)}
          </p>
          {job.description.length > 160 && (
            <button
              onClick={() => setExpanded(p => !p)}
              className="text-xs text-accent hover:text-blue-400 mt-1 flex items-center gap-1 transition-colors"
            >
              {expanded ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Show more</>}
            </button>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-red/10 border border-red/20 rounded-xl p-3">
          <AlertCircle className="w-4 h-4 text-red shrink-0" />
          <p className="text-xs text-red">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => togglePanel('why')} className="btn-ghost text-xs px-3 py-2">
          <Info className="w-3.5 h-3.5" /> Why this fits
        </button>

        <button onClick={handleGenerateEmail} disabled={loadingEmail} className="btn-ghost text-xs px-3 py-2">
          {loadingEmail ? <span className="spinner" /> : <Mail className="w-3.5 h-3.5" />}
          {emailData ? 'Regenerate Email' : 'AI Email'}
        </button>

        <button onClick={handleAnalyzeResume} disabled={loadingBullets || !hasResume} className="btn-ghost text-xs px-3 py-2">
          {loadingBullets ? <span className="spinner" /> : <FileSearch className="w-3.5 h-3.5" />}
          Analyze Resume
        </button>

        {job.url && (
          <a href={job.url} target="_blank" rel="noopener noreferrer" className="btn-ghost text-xs px-3 py-2">
            <ExternalLink className="w-3.5 h-3.5" /> Apply
          </a>
        )}
      </div>

      {/* Panels (Email/Resume/Why) */}
      {panel === 'email' && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 animate-fade-in shadow-sm">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-slate-800 text-sm mb-0">Cold Email Draft</p>
            {emailData && (
              <button onClick={handleCopy} className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-sm hover:shadow-md">
                {copied ? <><CheckCheck className="w-3 h-3 text-green-600 mr-1" /> Copied!</> : <><Copy className="w-3 h-3 mr-1" /> Copy</>}
              </button>
            )}
          </div>
          {loadingEmail ? (
            <div className="text-center py-4 text-slate-500 text-sm">Generating...</div>
          ) : (
            <div className="font-sans text-slate-800 leading-relaxed text-sm whitespace-pre-wrap">
              {emailData?.email || emailData?.body}
            </div>
          )}
        </div>
      )}

      {panel === 'resume' && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 animate-fade-in shadow-sm">
          <p className="font-semibold text-slate-800 text-sm mb-0">Resume Analysis</p>
          {loadingBullets ? (
            <div className="text-center py-4 text-slate-500 text-sm">Analyzing...</div>
          ) : bulletData ? (
            <div className="space-y-4">
              {/* Strong Points */}
              {bulletData.strongPoints && bulletData.strongPoints.length > 0 && (
                <div>
                  <p className="font-medium text-slate-700 text-sm mb-2">Strong Points</p>
                  <div className="space-y-2">
                    {bulletData.strongPoints.map((point, i) => (
                      <div key={i} className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-lg p-3 shadow-sm">
                        <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <p className="font-sans text-emerald-700 text-sm leading-relaxed">{point}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Weak Points */}
              {bulletData.weakPoints && bulletData.weakPoints.length > 0 && (
                <div>
                  <p className="font-medium text-slate-700 text-sm mb-2">Areas for Improvement</p>
                  <div className="space-y-2">
                    {bulletData.weakPoints.map((point, i) => (
                      <div key={i} className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-lg p-3 shadow-sm">
                        <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
                        <p className="font-sans text-rose-700 text-sm leading-relaxed">{point}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {bulletData.suggestions && bulletData.suggestions.length > 0 && (
                <div>
                  <p className="font-medium text-slate-700 text-sm mb-2">Suggestions</p>
                  <div className="space-y-2">
                    {bulletData.suggestions.map((point, i) => (
                      <div key={i} className="flex items-start gap-2 bg-sky-50 border border-sky-200 rounded-lg p-3 shadow-sm">
                        <Lightbulb className="w-4 h-4 text-sky-600 mt-0.5 flex-shrink-0" />
                        <p className="font-sans text-sky-700 text-sm leading-relaxed">{point}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {panel === 'why' && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 animate-fade-in shadow-sm">
          <p className="font-semibold text-slate-800 text-sm mb-0">Why This Job Fits You</p>
          <div className="space-y-2">
            {whyJobFitsYou.map((reason, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-slate-600 text-sm mt-0.5">•</span>
                <p className="font-sans text-slate-800 text-sm leading-relaxed">{reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  )
}

export default memo(JobCard)