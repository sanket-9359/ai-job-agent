import { useState, memo } from 'react'
import {
  MapPin,
  Briefcase,
  ExternalLink,
  Mail,
  FileSearch,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Copy,
  CheckCheck,
  Bookmark,
  BookmarkCheck,
  AlertCircle,
  Wifi,
  Lightbulb
} from 'lucide-react'

import type {
  Job,
  UserProfile,
  EmailResponse,
  BulletsResponse
} from '../types'

import {
  generateEmail,
  generateBullets,
  createApplication
} from '../api'

import {
  copyToClipboard,
  truncate
} from '../utils/helpers'

interface Props {
  job: Job
  profile: UserProfile
  onSaved?: () => void
  isSaved?: boolean
  searchMode?: 'primary' | 'secondary'
}

type Panel = 'why' | 'email' | 'resume' | null

function JobCard({
  job,
  profile,
  onSaved,
  isSaved = false
}: Props) {

  const [expanded, setExpanded] = useState(false)

  const [panel, setPanel] = useState<Panel>(null)

  const [emailData, setEmailData] =
    useState<EmailResponse | null>(null)

  const [bulletData, setBulletData] =
    useState<BulletsResponse | null>(null)

  const [loadingEmail, setLoadingEmail] =
    useState(false)

  const [loadingBullets, setLoadingBullets] =
    useState(false)

  const [saving, setSaving] =
    useState(false)

  const [saved, setSaved] =
    useState(isSaved)

  const [error, setError] =
    useState<string | null>(null)

  const [copied, setCopied] =
    useState(false)

  const { matchMetadata, whyJobFitsYou } = job

  const hasResume =
    profile.resumeText &&
    profile.resumeText.length >= 50

  const activeJobId =
    job.jobId || job._id

  const togglePanel = (p: Panel) =>
    setPanel(prev => prev === p ? null : p)

  const handleGenerateEmail = async () => {

    setError(null)

    setLoadingEmail(true)

    togglePanel('email')

    try {

      const result =
        await generateEmail(
          activeJobId,
          profile
        )

      setEmailData(result)

    } catch (e: any) {

      setError(
        e.message ||
        'Failed to generate email'
      )

    } finally {

      setLoadingEmail(false)

    }
  }

  const handleAnalyzeResume = async () => {

    if (!hasResume) {

      setError(
        'Upload a resume first to analyze it against this job.'
      )

      return
    }

    setError(null)

    setLoadingBullets(true)

    togglePanel('resume')

    try {

      const result =
        await generateBullets(
          activeJobId,
          profile
        )

      setBulletData(result)

    } catch (e: any) {

      setError(
        e.message ||
        'Failed to analyze resume'
      )

    } finally {

      setLoadingBullets(false)

    }
  }

  const handleSave = async () => {

    if (saved) return

    setSaving(true)

    setError(null)

    try {

      await createApplication(
        activeJobId,
        job
      )

      setSaved(true)

      onSaved?.()

    } catch (e: any) {

      if (
        e.message?.includes(
          'already saved'
        )
      ) {

        setSaved(true)

      } else {

        setError(
          e.message ||
          'Failed to save job'
        )
      }

    } finally {

      setSaving(false)

    }
  }

  const handleCopy = async () => {

    const text =
      emailData?.email ||
      emailData?.body ||
      ''

    const ok =
      await copyToClipboard(text)

    if (ok) {

      setCopied(true)

      setTimeout(() => {
        setCopied(false)
      }, 2000)
    }
  }

  const MatchBadge = ({
    ok,
    label
  }: {
    ok: boolean
    label: string
  }) => (

    <span className={
      ok
        ? 'tag-matched'
        : 'tag-unmatched'
    }>
      {ok
        ? <Check className="w-3 h-3" />
        : <X className="w-3 h-3" />
      }

      {label}
    </span>
  )

  return (

    <article className="group rounded-[24px] border border-white/10 bg-[#111827]/88 shadow-[0_18px_54px_rgba(0,0,0,0.22)] animate-slide-up overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/30 hover:bg-[#141d2d] hover:shadow-[0_30px_100px_rgba(0,0,0,0.36)]">

      <div className="p-5 sm:p-6 space-y-5">

      {/* Header */}
      <div className="grid grid-cols-[auto_minmax(0,1fr)] lg:grid-cols-[auto_minmax(0,1fr)_auto] gap-4">

        <div className="w-12 h-12 rounded-2xl bg-white text-ink flex items-center justify-center text-lg font-black shadow-[0_12px_32px_rgba(255,255,255,0.10)]">
          {(job.company || job.title || '?').charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">

          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <p className="text-accent text-sm font-bold">
              {job.company}
            </p>
            {job.source === 'demo' && (
              <span className="badge bg-amber/10 text-amber border-amber/20">
                Demo
              </span>
            )}
          </div>

          <h3 className="font-bold text-white text-lg sm:text-xl leading-tight tracking-tight">
            {job.title}
          </h3>

        </div>

        <div className="col-span-2 lg:col-span-1 flex lg:flex-col items-center lg:items-end gap-2">

          <button
            onClick={handleSave}
            disabled={saving || saved}
            className={`p-2.5 rounded-2xl border transition-all duration-200 ${
              saved
                ? 'bg-green/10 border-green/20 text-green shadow-sm'
                : 'border-white/10 bg-white/[0.035] text-muted hover:border-accent/40 hover:text-accent hover:bg-accent/10'
            }`}
          >
            {saving ? (
              <span className="spinner" />
            ) : saved ? (
              <BookmarkCheck className="w-4 h-4" />
            ) : (
              <Bookmark className="w-4 h-4" />
            )}
          </button>

        </div>

      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted">

        {job.location && (
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-muted/70" />
            {job.location}
          </span>
        )}

        {job.workMode && (
          <span className="flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5 text-muted/70" />
            {job.workMode}
          </span>
        )}

        {job.jobType && (
          <span className="flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-muted/70" />
            {job.jobType}
          </span>
        )}

        {job.salary && (
          <span className="text-sm font-bold text-green">
            {job.salary}
          </span>
        )}

      </div>

      {/* Skills */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-3 space-y-3">

        <div className="flex flex-wrap gap-2">

          <MatchBadge
            ok={matchMetadata.roleMatch}
            label="Role match"
          />

          <MatchBadge
            ok={matchMetadata.experienceMatch}
            label="Experience"
          />

        </div>

        {(matchMetadata.matchedSkills.length > 0 ||
          matchMetadata.unmatchedSkills.length > 0) && (

          <div className="flex flex-wrap gap-1.5">

            {matchMetadata.matchedSkills.map(skill => (
              <span
                key={skill}
                className="tag-matched"
              >
                {skill}
              </span>
            ))}

            {matchMetadata.unmatchedSkills.map(skill => (
              <span
                key={skill}
                className="tag-unmatched"
              >
                {skill}
              </span>
            ))}

          </div>
        )}

      </div>

      {/* Description */}
      {job.description && (

        <div className="pt-1">

          <p className="text-sm text-dim leading-7">
            {expanded
              ? job.description
              : truncate(job.description, 160)
            }
          </p>

          {job.description.length > 160 && (

            <button
              onClick={() =>
                setExpanded(prev => !prev)
              }
              className="text-xs text-accent hover:text-blue-400 mt-2.5 flex items-center gap-1.5 font-semibold transition-colors"
            >

              {expanded ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  Show more
                </>
              )}

            </button>
          )}

        </div>
      )}

      {/* Error */}
      {error && (

        <div className="flex items-start gap-3 bg-red/10 border border-red/30 rounded-lg p-4">

          <AlertCircle className="w-4 h-4 text-red shrink-0 mt-0.5" />

          <p className="text-xs text-red font-medium">
            {error}
          </p>

        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">

        <button
          onClick={handleGenerateEmail}
          disabled={loadingEmail}
          className="btn-ghost text-xs px-4 py-2.5 justify-center hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-blue-300"
        >

          {loadingEmail
            ? <span className="spinner" />
            : <Mail className="w-3.5 h-3.5" />
          }

          {emailData
            ? 'Regenerate Email'
            : 'AI Email'
          }

        </button>

        <button
          onClick={handleAnalyzeResume}
          disabled={
            loadingBullets || !hasResume
          }
          className="btn-ghost text-xs px-4 py-2.5 justify-center hover:bg-purple/10 hover:border-purple/30 hover:text-purple disabled:opacity-40"
        >

          {loadingBullets
            ? <span className="spinner" />
            : <FileSearch className="w-3.5 h-3.5" />
          }

          Analyze Resume

        </button>

        {job.url && (

          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost text-xs px-4 py-2.5 justify-center hover:bg-green/10 hover:border-green/30 hover:text-green"
          >

            <ExternalLink className="w-3.5 h-3.5" />
            Apply

          </a>
        )}

      </div>
      </div>

      {/* EMAIL PANEL */}
      {panel === 'email' && (

        <div className="border-t border-white/10 bg-[#0b111d] p-5 sm:p-6 space-y-5 animate-fade-in">

          <div className="flex items-center justify-between gap-4">

            <div>

              <p className="font-bold text-white text-base">
                Cold Email Draft
              </p>

              <p className="text-xs text-muted mt-1">
                AI-generated outreach email
              </p>

            </div>

            {emailData && (

              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 bg-white text-ink hover:bg-slate-100 border border-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
              >

                {copied ? (
                  <>
                    <CheckCheck className="w-3.5 h-3.5 text-green-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </>
                )}

              </button>
            )}

          </div>

          {loadingEmail ? (

            <div className="flex items-center justify-center py-12">

              <p className="text-sm text-slate-500">
                Generating AI email...
              </p>

            </div>

          ) : emailData ? (

            <div className="grid lg:grid-cols-[260px_minmax(0,1fr)] gap-4">

              {emailData.subject && (

                <div className="bg-white border border-white rounded-2xl p-4">

                  <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-2">
                    Subject
                  </p>

                  <p
                    className="text-sm font-semibold leading-relaxed"
                    style={{
                      color: '#111827'
                    }}
                  >
                    {emailData.subject}
                  </p>

                </div>
              )}

              <div className="bg-white text-slate-950 border border-white rounded-2xl p-6 max-h-[440px] overflow-y-auto shadow-[0_20px_60px_rgba(0,0,0,0.18)]">

               <div
                  className="whitespace-pre-wrap break-words text-sm leading-7 font-sans"
                  style={{
                    color: '#111827'
                  }}
              >
                  {String(
                    emailData.email ||
                    emailData.body ||
                    'No email generated'
                  )}
               </div>

              </div>

            </div>

          ) : (

            <div className="flex items-center justify-center py-12">

              <p className="text-sm text-slate-500">
                No email generated yet
              </p>

            </div>

          )}

        </div>
      )}

      {/* RESUME PANEL */}
      {panel === 'resume' && (

        <div className="border-t border-white/10 bg-[#0b111d] p-5 sm:p-6 space-y-5 animate-fade-in">

          <p className="font-bold text-white text-base">
            Resume Analysis
          </p>

          {loadingBullets ? (

            <div className="text-center py-8 text-slate-500 text-sm">
              Analyzing...
            </div>

          ) : bulletData ? (

            <div className="grid lg:grid-cols-3 gap-4">

              {bulletData.strongPoints?.length > 0 && (

                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">

                  <p className="font-bold text-emerald-200 text-sm mb-3">
                    Strong Points
                  </p>

                  <div className="space-y-2.5">

                    {bulletData.strongPoints.map((point, i) => (

                      <div
                        key={i}
                        className="flex items-start gap-3 bg-white/[0.05] border border-white/10 rounded-xl p-3.5"
                      >

                        <Check className="w-4 h-4 text-emerald-300 mt-0.5 shrink-0 font-bold" />

                        <p className="text-sm text-emerald-50 leading-relaxed">
                          {point}
                        </p>

                      </div>
                    ))}

                  </div>

                </div>
              )}

              {bulletData.weakPoints?.length > 0 && (

                <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4">

                  <p className="font-bold text-rose-200 text-sm mb-3">
                    Areas for Improvement
                  </p>

                  <div className="space-y-2.5">

                    {bulletData.weakPoints.map((point, i) => (

                      <div
                        key={i}
                        className="flex items-start gap-3 bg-white/[0.05] border border-white/10 rounded-xl p-3.5"
                      >

                        <AlertCircle className="w-4 h-4 text-rose-300 mt-0.5 shrink-0" />

                        <p className="text-sm text-rose-50 leading-relaxed">
                          {point}
                        </p>

                      </div>
                    ))}

                  </div>

                </div>
              )}

              {bulletData.suggestions?.length > 0 && (

                <div className="rounded-2xl border border-sky-400/20 bg-sky-400/10 p-4">

                  <p className="font-bold text-sky-200 text-sm mb-3">
                    Suggestions
                  </p>

                  <div className="space-y-2.5">

                    {bulletData.suggestions.map((point, i) => (

                      <div
                        key={i}
                        className="flex items-start gap-3 bg-white/[0.05] border border-white/10 rounded-xl p-3.5"
                      >

                        <Lightbulb className="w-4 h-4 text-sky-300 mt-0.5 shrink-0" />

                        <p className="text-sm text-sky-50 leading-relaxed">
                          {point}
                        </p>

                      </div>
                    ))}

                  </div>

                </div>
              )}

            </div>

          ) : null}

        </div>
      )}

      {/* WHY PANEL */}
      {panel === 'why' && (

        <div className="border-t border-white/10 bg-[#0b111d] p-5 sm:p-6 space-y-4 animate-fade-in">

          <p className="font-bold text-white text-base">
            Why This Job Fits You
          </p>

          <div className="space-y-3">

            {whyJobFitsYou.map((reason, i) => (

              <div
                key={i}
                className="flex items-start gap-3 p-3 bg-white/[0.045] rounded-xl border border-white/10"
              >

                <span className="text-accent text-base mt-0.5 font-bold">
                  •
                </span>

                <p className="text-sm text-dim leading-relaxed">
                  {reason}
                </p>

              </div>
            ))}

          </div>

        </div>
      )}

    </article>
  )
}

export default memo(JobCard)
