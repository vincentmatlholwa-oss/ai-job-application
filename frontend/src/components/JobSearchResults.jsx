import { useState } from 'react'
import { FiSearch, FiMapPin, FiDollarSign, FiClock, FiExternalLink, FiCheck, FiCheckSquare, FiSquare, FiBriefcase, FiGlobe, FiFilter, FiRefreshCw } from 'react-icons/fi'

const MATCH_COLORS = {
  excellent: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
  good: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  fair: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
}

export default function JobSearchResults({
  jobs,
  selectedJobs,
  onSelect,
  onSelectAll,
  onSearch,
  onGenerate,
  isSearching,
  isGenerating,
}) {
  const [filter, setFilter] = useState('all')
  const hasSearched = jobs.length > 0 || isSearching

  const filteredJobs = filter === 'all' ? jobs : jobs.filter(j => j.matchLevel === filter)

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-white">
          Found <span className="gradient-text">{jobs.length}</span> Matching Jobs
        </h2>
        <p className="text-white/50 max-w-lg mx-auto">
          Review the AI-matched jobs below. Select the ones you'd like to apply for.
        </p>
      </div>

      {!hasSearched && (
        <div className="glass-card p-6 sm:p-12 text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary-500/20 to-cyan-500/20 flex items-center justify-center">
            <FiSearch className="w-10 h-10 text-primary-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Ready to Find Your Dream Job?</h3>
            <p className="text-white/40">Our AI will search across multiple job boards to find positions that match your profile.</p>
          </div>
          <button
            onClick={onSearch}
            disabled={isSearching}
            className="btn-primary text-sm sm:text-lg px-6 sm:px-8 py-3 sm:py-4 flex items-center justify-center gap-2 mx-auto"
          >
            {isSearching ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                AI is searching...
              </>
            ) : (
              <>
                <FiSearch className="w-5 h-5" />
                Start AI Job Search
              </>
            )}
          </button>
        </div>
      )}

      {isSearching && (
        <div className="glass-card p-6 sm:p-12 text-center space-y-4">
          <div className="w-16 h-16 mx-auto border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          <div>
            <h3 className="text-lg font-semibold text-white">AI is Searching...</h3>
            <p className="text-white/40 text-sm">Scanning job boards, analyzing requirements, and matching your profile</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {['LinkedIn', 'Indeed', 'Glassdoor', 'RemoteOK'].map((site, i) => (
              <span key={site} className="px-3 py-1 bg-white/5 rounded-lg text-xs text-white/40 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}>
                {site}
              </span>
            ))}
          </div>
        </div>
      )}

      {jobs.length > 0 && !isSearching && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {['all', 'excellent', 'good', 'fair'].map(level => (
                <button
                  key={level}
                  onClick={() => setFilter(level)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    filter === level
                      ? 'bg-primary-500 text-white'
                      : 'bg-white/5 text-white/50 hover:bg-white/10'
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                  {level !== 'all' && (
                    <span className="ml-1 text-xs">
                      ({jobs.filter(j => j.matchLevel === level).length})
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button onClick={onSelectAll} className="btn-secondary text-sm py-2 px-4">
                {selectedJobs.length === jobs.length ? 'Deselect All' : 'Select All'}
              </button>
              <button onClick={onSearch} className="btn-secondary text-sm py-2 px-4 flex items-center gap-1">
                <FiRefreshCw className="w-4 h-4" /> Refresh
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {filteredJobs.map(job => {
              const isSelected = selectedJobs.some(j => j.id === job.id)
              const matchStyle = MATCH_COLORS[job.matchLevel] || MATCH_COLORS.good

              return (
                <div
                  key={job.id}
                  onClick={() => onSelect(job)}
                  className={`glass-card-hover p-5 cursor-pointer ${
                    isSelected ? 'ring-2 ring-primary-500 bg-primary-500/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1 shrink-0">
                      {isSelected ? (
                        <FiCheckSquare className="w-5 h-5 text-primary-400" />
                      ) : (
                        <FiSquare className="w-5 h-5 text-white/30" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-semibold text-white truncate">{job.title}</h3>
                            <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${matchStyle.bg} ${matchStyle.text} border ${matchStyle.border}`}>
                              {job.matchScore}% Match
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 flex-wrap text-xs">
                            <span className="text-white/60 text-sm flex items-center gap-1">
                              <FiBriefcase className="w-3.5 h-3.5" /> {job.company}
                            </span>
                            <span className="text-white/40 text-sm flex items-center gap-1">
                              <FiMapPin className="w-3.5 h-3.5" /> {job.location}
                            </span>
                            {job.salary && (
                              <span className="text-white/40 text-sm flex items-center gap-1">
                                <FiDollarSign className="w-3.5 h-3.5" /> {job.salary}
                              </span>
                            )}
                            <span className="text-white/40 text-sm flex items-center gap-1">
                              <FiClock className="w-3.5 h-3.5" /> {job.type}
                            </span>
                          </div>
                        </div>
                      </div>

                      {job.description && (
                        <p className="text-white/40 text-sm mt-3 line-clamp-2">{job.description}</p>
                      )}

                      {job.requiredSkills && job.requiredSkills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {job.requiredSkills.slice(0, 6).map((skill, i) => (
                            <span key={i} className="px-2 py-0.5 bg-white/5 text-white/50 rounded text-xs">
                              {skill}
                            </span>
                          ))}
                          {job.requiredSkills.length > 6 && (
                            <span className="px-2 py-0.5 text-white/30 text-xs">
                              +{job.requiredSkills.length - 6} more
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-3 mt-3">
                        <span className="text-white/30 text-xs">Source: {job.source}</span>
                        {job.applyUrl && (
                          <a
                            href={job.applyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="text-primary-400 text-xs flex items-center gap-1 hover:text-primary-300"
                          >
                            <FiExternalLink className="w-3 h-3" /> Apply Directly
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {selectedJobs.length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-dark-900/90 backdrop-blur-xl border-t border-white/10 z-30">
              <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
                    <FiCheck className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">{selectedJobs.length} jobs selected</p>
                    <p className="text-white/40 text-sm">Ready to generate applications</p>
                  </div>
                </div>
                <button
                  onClick={onGenerate}
                  disabled={isGenerating}
                  className="btn-primary flex items-center gap-2 whitespace-nowrap shrink-0"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      Generate Applications
                      <FiExternalLink className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
