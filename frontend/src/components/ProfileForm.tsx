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
    <div className="card p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-white">Your Profile</h2>
        <p className="text-sm text-muted mt-0.5">Tell us about yourself to find matching jobs</p>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="flex items-start gap-2 bg-red/10 border border-red/20 rounded-xl p-3">
          <AlertCircle className="w-4 h-4 text-red shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            {errors.map((e, i) => <p key={i} className="text-xs text-red">{e}</p>)}
          </div>
        </div>
      )}

      {/* Target Role */}
      <div className="space-y-1.5">
        <label className="section-heading">Target Role</label>
        <input
          className="input"
          placeholder="e.g. Frontend Developer"
          value={profile.targetRole}
          onChange={e => update({ targetRole: e.target.value })}
        />
      </div>

      {/* Experience */}
      <div className="space-y-1.5">
        <label className="section-heading">Experience Level</label>
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

      {/* Skills */}
      <div className="space-y-2">
        <label className="section-heading">Skills</label>
        {/* Tags */}
        {profile.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {profile.skills.map(s => (
              <span key={s} className="inline-flex items-center gap-1 bg-accent/10 border border-accent/20 text-accent text-xs px-2.5 py-1 rounded-lg">
                {s}
                <button onClick={() => removeSkill(s)} className="hover:text-white transition-colors">
                  <X className="w-3 h-3" />
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
            className="btn-ghost px-3"
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
              className="text-xs px-2 py-0.5 rounded-md bg-slate border border-border text-muted
                         hover:border-accent/40 hover:text-dim transition-colors"
            >
              + {s}
            </button>
          ))}
        </div>
      </div>

      {/* Resume Upload */}
      <div className="space-y-2">
        <label className="section-heading">Resume (Optional)</label>
        <div
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors
            ${profile.resumeFile
              ? 'border-green/40 bg-green/5'
              : 'border-border hover:border-accent/40 hover:bg-accent/5'
            }`}
        >
          {isParsing ? (
            <div className="flex items-center justify-center gap-2 text-dim text-sm">
              <span className="spinner" /> Parsing resume…
            </div>
          ) : profile.resumeFile ? (
            <div className="flex items-center justify-center gap-2 text-green text-sm">
              <FileText className="w-4 h-4" />
              <span className="font-medium">{profile.resumeFile.name}</span>
              <span className="text-muted">({formatFileSize(profile.resumeFile.size)})</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-muted text-sm">
              <Upload className="w-4 h-4" />
              <span>Upload PDF, DOCX, JPG or PNG</span>
            </div>
          )}
        </div>
        {fileError && (
          <p className="text-xs text-red flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> {fileError}
          </p>
        )}
        {profile.resumeText && !isParsing && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-green flex items-center gap-1">
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
              <X className="w-3 h-3" />
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
      <div className="space-y-2 pt-1">
        <button
          onClick={handlePrimary}
          disabled={isSearching}
          className="btn-primary w-full justify-center py-3"
        >
          {isSearching ? <><span className="spinner" /> Searching…</> : <><Search className="w-4 h-4" /> Find Jobs by Role</>}
        </button>
        <button
          onClick={handleSecondary}
          disabled={isSearching}
          className="btn-ghost w-full justify-center py-3"
        >
          {isSearching ? <><span className="spinner" /> Searching…</> : <><Zap className="w-4 h-4" /> Find Jobs by Skills</>}
        </button>
      </div>

      <p className="text-xs text-muted text-center">
        Role search filters by title + experience · Skills search finds any skill match
      </p>
    </div>
  )
}
