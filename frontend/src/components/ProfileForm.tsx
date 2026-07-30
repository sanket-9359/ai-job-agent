import { useState, useRef } from 'react'
import { Search, Zap, Plus, X, Upload, FileText, AlertCircle } from 'lucide-react'
import type { UserProfile } from '../types'
import { EXPERIENCE_OPTIONS, POPULAR_SKILLS, validateResumeFile, formatFileSize } from '../utils/helpers'

interface Props {
  profile:          UserProfile
  onChange:         (p: UserProfile) => void
  onPrimarySearch:  () => void
  onSecondarySearch: () => void
  isSearching:      boolean
  parseResume:      (file: File) => Promise<void>
  isParsing:        boolean
}

export default function ProfileForm({
  profile, onChange, onPrimarySearch, onSecondarySearch,
  isSearching, parseResume, isParsing,
}: Props) {
  const [skillInput, setSkillInput] = useState('')
  const [errors, setErrors]         = useState<string[]>([])
  const [fileError, setFileError]   = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const update = (patch: Partial<UserProfile>) => onChange({ ...profile, ...patch })

  // ── Skills ──────────────────────────────────────────────────────────────────
  const addSkill = (skill: string) => {
    const s = skill.trim()
    if (!s || profile.skills.includes(s)) return
    update({ skills: [...profile.skills, s] })
    setSkillInput('')
  }

  const removeSkill = (s: string) => update({ skills: profile.skills.filter(x => x !== s) })

  const handleSkillKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['Enter', ',', 'Tab'].includes(e.key)) {
      e.preventDefault()
      addSkill(skillInput)
    }
  }

  // ── File ────────────────────────────────────────────────────────────────────
  const handleFile = async (file: File | null) => {
    setFileError(null)
    if (!file) { update({ resumeFile: null, resumeText: '' }); return }
    const err = validateResumeFile(file)
    if (err) { setFileError(err); return }
    update({ resumeFile: file })
    await parseResume(file)
  }

  // ── Validate ────────────────────────────────────────────────────────────────
  const validatePrimary = (): boolean => {
    const errs: string[] = []
    if (!profile.targetRole.trim()) errs.push('Target role is required.')
    if (!profile.experience)        errs.push('Experience level is required.')
    setErrors(errs)
    return errs.length === 0
  }

  const validateSecondary = (): boolean => {
    const errs: string[] = []
    if (profile.skills.length === 0) errs.push('Add at least one skill.')
    setErrors(errs)
    return errs.length === 0
  }

  const handlePrimary = () => { if (validatePrimary())   onPrimarySearch() }
  const handleSecondary = () => { if (validateSecondary()) onSecondarySearch() }

  return (
    <div className="rounded-[28px] border border-white/10 bg-[#0d1320]/95 shadow-[0_24px_80px_rgba(0,0,0,0.28)] overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="p-5 sm:p-6 border-b border-white/10 bg-white/[0.025]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="section-heading mb-2">Search Console</p>
            <h2 className="text-xl font-bold tracking-tight text-white">Candidate profile</h2>
            <p className="text-sm text-muted mt-2 leading-relaxed">Inputs used by job search, email, and resume analysis.</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-accent/20 border border-accent/25 flex items-center justify-center text-accent font-bold">
            {profile.skills.length}
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-6">

      {/* Errors */}
      {errors.length > 0 && (
        <div className="flex items-start gap-3 bg-red/10 border border-red/30 rounded-2xl p-4">
          <AlertCircle className="w-4 h-4 text-red shrink-0 mt-0.5" />
          <div className="space-y-1">
            {errors.map((e, i) => <p key={i} className="text-xs text-red font-medium">{e}</p>)}
          </div>
        </div>
      )}

      {/* Target Role */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 rounded-full bg-white text-ink text-xs font-bold flex items-center justify-center">1</span>
          <div>
            <p className="text-sm font-bold text-white">Role target</p>
            <p className="text-xs text-muted">Set the search intent and seniority.</p>
          </div>
        </div>
        <input
          className="input"
          placeholder="e.g. Frontend Developer"
          value={profile.targetRole}
          onChange={e => update({ targetRole: e.target.value })}
        />

      {/* Experience */}
      <div>
        <select
          className="select"
          value={profile.experience}
          onChange={e => update({ experience: e.target.value })}
        >
          {EXPERIENCE_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
      </div>

      {/* Skills */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 rounded-full bg-white text-ink text-xs font-bold flex items-center justify-center">2</span>
          <div>
            <p className="text-sm font-bold text-white">Skill signal</p>
            <p className="text-xs text-muted">Add stack keywords for broader matching.</p>
          </div>
        </div>
        {/* Tags */}
        {profile.skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {profile.skills.map(s => (
              <span key={s} className="inline-flex items-center gap-2 bg-accent/10 border border-accent/25 text-accent text-xs px-3 py-1.5 rounded-full font-semibold hover:bg-accent/20 transition-colors">
                {s}
                <button onClick={() => removeSkill(s)} className="hover:text-white transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}
        {/* Input */}
        <div className="flex gap-2">
          <input
            className="input"
            placeholder="Type a skill and press Enter"
            value={skillInput}
            onChange={e => setSkillInput(e.target.value)}
            onKeyDown={handleSkillKey}
          />
          <button
            onClick={() => addSkill(skillInput)}
            className="btn-ghost px-3.5"
            title="Add skill"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        {/* Popular pills */}
        <div className="flex flex-wrap gap-1.5">
          {POPULAR_SKILLS.filter(s => !profile.skills.includes(s)).slice(0, 12).map(s => (
            <button
              key={s}
              onClick={() => addSkill(s)}
              className="text-xs px-3 py-1.5 rounded-full bg-white/[0.035] border border-white/10 text-muted
                         hover:border-accent/40 hover:text-accent hover:bg-accent/10 transition-all font-semibold"
            >
              + {s}
            </button>
          ))}
        </div>
      </div>

      {/* Resume Upload */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 rounded-full bg-white text-ink text-xs font-bold flex items-center justify-center">3</span>
          <div>
            <p className="text-sm font-bold text-white">Resume context</p>
            <p className="text-xs text-muted">Optional, but improves tailoring.</p>
          </div>
        </div>
        <div
          onClick={() => fileRef.current?.click()}
          className={`border border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all
            ${profile.resumeFile
              ? 'border-green/40 bg-green/10 hover:bg-green/20'
              : 'border-white/20 bg-white/[0.025] hover:border-accent/40 hover:bg-accent/10'
            }`}
        >
          {isParsing ? (
            <div className="flex items-center justify-center gap-2 text-dim text-sm font-semibold">
              <span className="spinner" /> Parsing resume…
            </div>
          ) : profile.resumeFile ? (
            <div className="flex items-center justify-center gap-2 text-green text-sm font-semibold">
              <FileText className="w-4 h-4" />
              <span>{profile.resumeFile.name}</span>
              <span className="text-muted text-xs">({formatFileSize(profile.resumeFile.size)})</span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 text-muted text-sm">
              <div className="w-11 h-11 rounded-2xl bg-white/[0.045] border border-white/10 flex items-center justify-center">
                <Upload className="w-5 h-5 text-accent" />
              </div>
              <span className="font-semibold text-dim">Upload PDF, DOCX, JPG or PNG</span>
              <span className="text-xs text-muted">Used for resume-aware email and analysis</span>
            </div>
          )}
        </div>
        {fileError && (
          <p className="text-xs text-red flex items-center gap-1 font-medium">
            <AlertCircle className="w-3 h-3" /> {fileError}
          </p>
        )}
        {profile.resumeText && !isParsing && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-green flex items-center gap-1 font-semibold">
              ✓ Resume parsed ({profile.resumeText.length.toLocaleString()} chars)
            </p>
            <button
              onClick={() => {
                update({ resumeFile: null, resumeText: '' });
                if (fileRef.current) fileRef.current.value = '';
              }}
              className="text-xs text-muted hover:text-red transition-colors"
              title="Remove resume"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.docx,image/jpeg,image/png"
          className="hidden"
          onChange={e => handleFile(e.target.files?.[0] ?? null)}
        />
      </div>

      {/* CTA Buttons */}
      <div className="space-y-3 pt-1">
        <button
          onClick={handlePrimary}
          disabled={isSearching}
          className="btn-primary w-full justify-center py-3.5 font-bold"
        >
          {isSearching ? <><span className="spinner" /> Searching…</> : <><Search className="w-4 h-4" /> Find Jobs by Role</>}
        </button>
        <button
          onClick={handleSecondary}
          disabled={isSearching}
          className="btn-ghost w-full justify-center py-3.5 font-semibold"
        >
          {isSearching ? <><span className="spinner" /> Searching…</> : <><Zap className="w-4 h-4" /> Find Jobs by Skills</>}
        </button>
      </div>

      <p className="text-xs text-muted text-center leading-relaxed rounded-2xl border border-white/10 bg-white/[0.025] px-4 py-3">
        Role search filters by title + experience · Skills search finds any skill match
      </p>
      </div>
    </div>
  )
}
