import { useState } from 'react'
import ProfileForm from '../components/ProfileForm'
import JobCard from '../components/JobCard'
import { searchJobs, parsResume } from '../api'
import type { Job, UserProfile, SearchMode } from '../types'
import { Briefcase, Database, Wifi, WifiOff, ServerCrash } from 'lucide-react'

interface Props {
  profile:    UserProfile
  onChange:   (p: UserProfile) => void
  onJobSaved: () => void
}

const SOURCE_LABELS: Record<string, { label: string; icon: typeof Wifi }> = {
  live:  { label: 'Live results',  icon: Wifi },
  cache: { label: 'Cached results', icon: Database },
  demo:  { label: 'Demo results',  icon: ServerCrash },
}

export default function SearchPage({ profile, onChange, onJobSaved }: Props) {
  const [primaryJobs,   setPrimaryJobs]   = useState<Job[]>([])
  const [secondaryJobs, setSecondaryJobs] = useState<Job[]>([])
  const [source,        setSource]        = useState<string | null>(null)
  const [isSearching,   setIsSearching]   = useState(false)
  const [isParsing,     setIsParsing]     = useState(false)
  const [searchError,   setSearchError]   = useState<string | null>(null)
  const [lastMode,      setLastMode]      = useState<SearchMode | null>(null)

  const handleSearch = async (mode: SearchMode) => {
    setIsSearching(true)
    setSearchError(null)
    if (mode === 'primary')   setSecondaryJobs([])
    if (mode === 'secondary') setPrimaryJobs([])
    try {
      const result = await searchJobs(profile, mode)
      if (mode === 'primary')   setPrimaryJobs(result.jobs)
      if (mode === 'secondary') setSecondaryJobs(result.jobs)
      setSource(result.source)
      setLastMode(mode)
    } catch (e: any) {
      setSearchError(e.message || 'Search failed. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  const handleParseResume = async (file: File) => {
    setIsParsing(true)
    try {
      const text = await parsResume(file)
      onChange({ ...profile, resumeText: text })
    } catch (e: any) {
      // Surface the error on the form itself via the file error state
      console.error('Resume parse error:', e.message)
    } finally {
      setIsParsing(false)
    }
  }

  const allJobs = [...primaryJobs, ...secondaryJobs]
  const hasResults = allJobs.length > 0

  const SourceBadge = () => {
    if (!source || !hasResults) return null
    const cfg = SOURCE_LABELS[source] ?? SOURCE_LABELS.live
    const Icon = cfg.icon
    return (
      <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border font-medium
        ${source === 'live'  ? 'bg-green/10 text-green border-green/20' :
          source === 'cache' ? 'bg-accent/10 text-accent border-accent/20' :
                               'bg-amber/10 text-amber border-amber/20'}`}>
        <Icon className="w-3 h-3" />
        {cfg.label}
        {source === 'demo' && ' — connect JSearch API for live listings'}
      </span>
    )
  }

  return (
    <div className="max-w-[1540px] mx-auto space-y-6">
      <div className="rounded-[32px] border border-white/10 bg-white/[0.035] p-5 sm:p-7 shadow-[0_24px_90px_rgba(0,0,0,0.24)]">
        <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-6">
          <div className="max-w-3xl">
            <p className="section-heading mb-3">Talent Matching Workspace</p>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-[-0.03em] text-white">
              Discover, tailor, and track roles from one focused cockpit.
            </h1>
            <p className="text-base text-dim mt-4 leading-7">
              Build a candidate signal on the left, review ranked opportunities in the workbench, and generate outreach without breaking flow.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 min-w-full xl:min-w-[390px]">
            <div className="rounded-2xl border border-white/10 bg-ink/40 p-4">
              <p className="text-xs text-muted font-semibold">Results</p>
              <p className="text-2xl font-bold text-white mt-1">{allJobs.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-ink/40 p-4">
              <p className="text-xs text-muted font-semibold">Skills</p>
              <p className="text-2xl font-bold text-accent mt-1">{profile.skills.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-ink/40 p-4">
              <p className="text-xs text-muted font-semibold">Resume</p>
              <p className="text-2xl font-bold text-green mt-1">{profile.resumeText ? 'On' : 'Off'}</p>
            </div>
          </div>
        </div>
      </div>

    <div className="grid grid-cols-1 xl:grid-cols-[390px_minmax(0,1fr)] gap-6 lg:gap-8 items-start">
      {/* Left: Profile Form */}
      <div className="xl:sticky xl:top-24">
        <ProfileForm
          profile={profile}
          onChange={onChange}
          onPrimarySearch={() => handleSearch('primary')}
          onSecondarySearch={() => handleSearch('secondary')}
          isSearching={isSearching}
          parseResume={handleParseResume}
          isParsing={isParsing}
        />
      </div>

      {/* Right: Results */}
      <div className="rounded-[28px] border border-white/10 bg-[#0d1320]/75 shadow-[0_24px_80px_rgba(0,0,0,0.22)] min-h-[64vh] overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 sm:px-6 py-4 bg-white/[0.025]">
          <div>
            <p className="text-sm font-bold text-white">Opportunity workbench</p>
            <p className="text-xs text-muted mt-1">{hasResults ? `${allJobs.length} roles ready for review` : 'Run a search to populate this board'}</p>
          </div>
          <SourceBadge />
        </div>
        <div className="p-4 sm:p-6 space-y-5">
        {/* Error */}
        {searchError && (
          <div className="card p-5 flex items-center gap-4 border-red/30 bg-red/10 animate-fade-in">
            <WifiOff className="w-5 h-5 text-red shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red">Search failed</p>
              <p className="text-xs text-red/70 mt-0.5">{searchError}</p>
            </div>
          </div>
        )}

        {/* Results header */}
        {hasResults && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between animate-fade-in gap-4 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                {lastMode === 'primary' ? 'Best Matches for You' : 'Jobs Based on Your Skills'}
              </h2>
              <p className="text-sm text-muted mt-1">
                {allJobs.length} job{allJobs.length !== 1 ? 's' : ''} found
              </p>
            </div>
          </div>
        )}

        {/* Primary results */}
        {primaryJobs.length > 0 && (
          <div className="space-y-4">
            {secondaryJobs.length > 0 && (
              <p className="section-heading text-xs font-bold text-muted uppercase tracking-widest mt-6">Best matches (role + experience)</p>
            )}
            {primaryJobs.map(job => (
              <JobCard
                key={job._id || job.jobId}
                job={job}
                profile={profile}
                onSaved={onJobSaved}
                searchMode="primary"
              />
            ))}
          </div>
        )}

        {/* Secondary results */}
        {secondaryJobs.length > 0 && (
          <div className="space-y-4">
            {primaryJobs.length > 0 && (
              <p className="section-heading text-xs font-bold text-muted uppercase tracking-widest mt-6">Skill matches</p>
            )}
            {secondaryJobs.map(job => (
              <JobCard
                key={job._id || job.jobId}
                job={job}
                profile={profile}
                onSaved={onJobSaved}
                searchMode="secondary"
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!hasResults && !isSearching && !searchError && (
          <div className="card flex flex-col items-center justify-center py-24 sm:py-32 gap-5 animate-fade-in text-center">
            <div className="w-20 h-20 rounded-3xl bg-white/[0.045] border border-white/10 flex items-center justify-center shadow-inner shadow-black/20">
              <Briefcase className="w-8 h-8 text-accent" />
            </div>
            <div>
              <p className="text-white font-bold text-xl">No results yet</p>
              <p className="text-sm text-muted mt-3 max-w-md leading-relaxed">
                Fill in your profile on the left and click <span className="text-accent font-semibold">Find Jobs by Role</span> or <span className="text-accent font-semibold">Find Jobs by Skills</span> to get started.
              </p>
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {isSearching && (
          <div className="space-y-4 animate-fade-in">
            {[1, 2, 3].map(i => (
              <div key={i} className="card p-7 space-y-5">
                <div className="flex items-start gap-4">
                  <div className="space-y-2.5 flex-1">
                    <div className="h-6 bg-white/10 rounded-xl w-2/3 animate-pulse-soft" />
                    <div className="h-3 bg-white/10 rounded-xl w-1/3 animate-pulse-soft" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="h-7 bg-white/10 rounded-full w-24 animate-pulse-soft" />
                  <div className="h-7 bg-white/10 rounded-full w-20 animate-pulse-soft" />
                  <div className="h-7 bg-white/10 rounded-full w-28 animate-pulse-soft" />
                </div>
                <div className="h-3 bg-white/10 rounded-xl w-full animate-pulse-soft" />
                <div className="h-3 bg-white/10 rounded-xl w-4/5 animate-pulse-soft" />
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
    </div>
  )
}
