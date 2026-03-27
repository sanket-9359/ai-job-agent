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
    <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">
      {/* Left: Profile Form */}
      <div className="lg:sticky lg:top-20">
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
      <div className="space-y-4 min-h-[60vh]">
        {/* Error */}
        {searchError && (
          <div className="card p-4 flex items-center gap-3 border-red/20 bg-red/5 animate-fade-in">
            <WifiOff className="w-5 h-5 text-red shrink-0" />
            <div>
              <p className="text-sm font-medium text-red">Search failed</p>
              <p className="text-xs text-muted mt-0.5">{searchError}</p>
            </div>
          </div>
        )}

        {/* Results header */}
        {hasResults && (
          <div className="flex items-center justify-between animate-fade-in">
            <div>
              <h2 className="text-base font-semibold text-white">
                {lastMode === 'primary' ? 'Best Matches for You' : 'Jobs Based on Your Skills'}
              </h2>
              <p className="text-xs text-muted mt-0.5">
                {allJobs.length} job{allJobs.length !== 1 ? 's' : ''} found
              </p>
            </div>
            <SourceBadge />
          </div>
        )}

        {/* Primary results */}
        {primaryJobs.length > 0 && (
          <div className="space-y-3">
            {secondaryJobs.length > 0 && (
              <p className="section-heading">Best matches (role + experience)</p>
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
          <div className="space-y-3">
            {primaryJobs.length > 0 && (
              <p className="section-heading mt-2">Skill matches</p>
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
          <div className="flex flex-col items-center justify-center py-24 gap-4 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-slate border border-border flex items-center justify-center">
              <Briefcase className="w-7 h-7 text-muted" />
            </div>
            <div className="text-center">
              <p className="text-white font-medium">No results yet</p>
              <p className="text-sm text-muted mt-1 max-w-xs">
                Fill in your profile on the left and click <span className="text-accent">Find Jobs by Role</span> or <span className="text-accent">Find Jobs by Skills</span> to get started.
              </p>
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {isSearching && (
          <div className="space-y-3 animate-fade-in">
            {[1, 2, 3].map(i => (
              <div key={i} className="card p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-slate rounded-lg w-2/3 animate-pulse-soft" />
                    <div className="h-3 bg-slate rounded-lg w-1/3 animate-pulse-soft" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="h-6 bg-slate rounded-lg w-24 animate-pulse-soft" />
                  <div className="h-6 bg-slate rounded-lg w-20 animate-pulse-soft" />
                  <div className="h-6 bg-slate rounded-lg w-28 animate-pulse-soft" />
                </div>
                <div className="h-3 bg-slate rounded-lg w-full animate-pulse-soft" />
                <div className="h-3 bg-slate rounded-lg w-4/5 animate-pulse-soft" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
