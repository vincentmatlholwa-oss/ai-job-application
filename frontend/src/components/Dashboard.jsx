import { useState } from 'react'
import {
  FiMail, FiFileText, FiCopy, FiCheck, FiSend, FiDownload,
  FiExternalLink, FiBriefcase, FiUser, FiClock, FiCheckCircle,
  FiEdit3, FiPrinter, FiShare2, FiArrowLeft, FiTarget, FiMessageCircle, FiDollarSign
} from 'react-icons/fi'

export default function Dashboard({ applications, selectedJobs, profile, onViewChange, onInterview }) {
  const [activeJob, setActiveJob] = useState(0)
  const [activeTab, setActiveTab] = useState('cover')
  const [copiedField, setCopiedField] = useState(null)
  const [showInterviewDropdown, setShowInterviewDropdown] = useState(false)
  const [jobStatuses, setJobStatuses] = useState(
    selectedJobs.reduce((acc, job) => ({ ...acc, [job.id]: 'ready' }), {})
  )

  const handleCopy = async (text, fieldId) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(fieldId)
      setTimeout(() => setCopiedField(null), 2000)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopiedField(fieldId)
      setTimeout(() => setCopiedField(null), 2000)
    }
  }

  const handleSendEmail = (app) => {
    const subject = encodeURIComponent(`Application for ${app.job.title} - ${profile.fullName || 'Candidate'}`)
    const body = encodeURIComponent(app.emailDraft)
    window.open(`mailto:${app.job.companyEmail || ''}?subject=${subject}&body=${body}`, '_blank')
    setJobStatuses(prev => ({ ...prev, [app.job.id]: 'sent' }))
  }

  const handleApplyOnline = (job) => {
    if (job.applyUrl) {
      window.open(job.applyUrl, '_blank')
      setJobStatuses(prev => ({ ...prev, [job.id]: 'applied' }))
    }
  }

  const handleDownloadPDF = (app) => {
    const content = `${activeTab === 'cover' ? 'COVER LETTER' : activeTab === 'motivational' ? 'MOTIVATIONAL LETTER' : 'EMAIL DRAFT'}\n\n` +
      `${'='.repeat(50)}\n` +
      `Position: ${app.job.title}\nCompany: ${app.job.company}\nCandidate: ${profile.fullName}\n` +
      `${'='.repeat(50)}\n\n` +
      (activeTab === 'cover' ? app.coverLetter :
       activeTab === 'motivational' ? app.motivationalLetter :
       app.emailDraft)

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${app.job.company}_${app.job.title}_${activeTab}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'ready': return 'bg-blue-500/20 text-blue-400'
      case 'sent': return 'bg-yellow-500/20 text-yellow-400'
      case 'applied': return 'bg-green-500/20 text-green-400'
      default: return 'bg-white/10 text-white/40'
    }
  }

  const currentApp = applications[activeJob]

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-white">
          Your <span className="gradient-text">Applications</span>
        </h2>
        <p className="text-white/50 max-w-lg mx-auto">
          Review, edit, and send your AI-generated applications.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {onInterview && applications.length > 0 && (
          <div className="relative">
            <button onClick={() => setShowInterviewDropdown(!showInterviewDropdown)} className="btn-secondary text-sm py-2 px-4 flex items-center gap-2">
              <FiMessageCircle className="w-4 h-4" /> Interview Prep
            </button>
            {showInterviewDropdown && (
              <div className="absolute top-full mt-2 left-0 bg-dark-800 border border-white/10 rounded-xl shadow-xl z-20 min-w-[250px] max-h-[300px] overflow-y-auto">
                {applications.map((app, i) => (
                  <button
                    key={i}
                    onClick={() => { onInterview(app.job); setShowInterviewDropdown(false) }}
                    className="w-full text-left px-4 py-3 hover:bg-white/10 transition-colors text-sm border-b border-white/5 last:border-0"
                  >
                    <p className="text-white font-medium truncate">{app.job.title}</p>
                    <p className="text-white/40 text-xs truncate">{app.job.company}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {onViewChange && (
          <>
            <button onClick={() => onViewChange('tracker')} className="btn-secondary text-sm py-2 px-4 flex items-center gap-2">
              <FiTarget className="w-4 h-4" /> Application Tracker
            </button>
            <button onClick={() => onViewChange('salary')} className="btn-secondary text-sm py-2 px-4 flex items-center gap-2">
              <FiDollarSign className="w-4 h-4" /> Salary Benchmark
            </button>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-card p-4">
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3 flex items-center gap-2">
              <FiBriefcase className="w-4 h-4" /> Applications ({applications.length})
            </h3>
            <div className="space-y-2">
              {applications.map((app, i) => (
                <button
                  key={i}
                  onClick={() => { setActiveJob(i); setActiveTab('cover') }}
                  className={`w-full text-left p-3 rounded-xl transition-all duration-200 ${
                    activeJob === i
                      ? 'bg-primary-500/20 border border-primary-500/30'
                      : 'bg-white/5 border border-transparent hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">{app.job.title}</p>
                      <p className="text-white/40 text-xs truncate">{app.job.company}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(jobStatuses[app.job.id])}`}>
                      {jobStatuses[app.job.id]}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card p-4">
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3 flex items-center gap-2">
              <FiUser className="w-4 h-4" /> Your Profile
            </h3>
            <div className="space-y-2 text-sm">
              {profile.fullName && (
                <p className="text-white/70"><span className="text-white/40">Name:</span> {profile.fullName}</p>
              )}
              {profile.email && (
                <p className="text-white/70"><span className="text-white/40">Email:</span> {profile.email}</p>
              )}
              {profile.targetRole && (
                <p className="text-white/70"><span className="text-white/40">Target:</span> {profile.targetRole}</p>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {currentApp && (
            <>
              <div className="glass-card p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold text-white">{currentApp.job.title}</h3>
                    <p className="text-white/50">{currentApp.job.company} &middot; {currentApp.job.location}</p>
                  </div>
                  <div className="flex gap-2">
                    {currentApp.job.applyUrl && (
                      <button
                        onClick={() => handleApplyOnline(currentApp.job)}
                        className="btn-primary text-sm py-2 px-4 flex items-center gap-1"
                      >
                        <FiExternalLink className="w-4 h-4" /> Apply Online
                      </button>
                    )}
                    <button
                      onClick={() => handleSendEmail(currentApp)}
                      className="btn-secondary text-sm py-2 px-4 flex items-center gap-1"
                    >
                      <FiSend className="w-4 h-4" /> Send Email
                    </button>
                  </div>
                </div>
              </div>

              <div className="glass-card">
                <div className="flex border-b border-white/10 overflow-x-auto">
                  {[
                    { key: 'cover', label: 'Cover Letter', icon: FiFileText },
                    { key: 'motivational', label: 'Motivational', icon: FiEdit3 },
                    { key: 'email', label: 'Email Draft', icon: FiMail },
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap transition-all ${
                        activeTab === tab.key
                          ? 'text-primary-400 border-b-2 border-primary-400 bg-primary-500/5'
                          : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="p-5 relative group">
                  <div className="absolute top-5 right-5 flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10">
                    <button
                      onClick={() => {
                        const text = activeTab === 'cover' ? currentApp.coverLetter :
                          activeTab === 'motivational' ? currentApp.motivationalLetter :
                          currentApp.emailDraft
                        handleCopy(text, `${activeJob}-${activeTab}`)
                      }}
                      className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                      title="Copy to clipboard"
                    >
                      {copiedField === `${activeJob}-${activeTab}` ? (
                        <FiCheck className="w-4 h-4 text-green-400" />
                      ) : (
                        <FiCopy className="w-4 h-4 text-white/60" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDownloadPDF(currentApp)}
                      className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                      title="Download"
                    >
                      <FiDownload className="w-4 h-4 text-white/60" />
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                      title="Print"
                    >
                      <FiPrinter className="w-4 h-4 text-white/60" />
                    </button>
                  </div>

                  <pre className="text-white/70 text-sm whitespace-pre-wrap font-sans leading-relaxed pr-4 sm:pr-20">
                    {activeTab === 'cover' ? currentApp.coverLetter :
                     activeTab === 'motivational' ? currentApp.motivationalLetter :
                     currentApp.emailDraft}
                  </pre>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: FiCheckCircle, label: 'Words', value: (activeTab === 'cover' ? currentApp.coverLetter : activeTab === 'motivational' ? currentApp.motivationalLetter : currentApp.emailDraft).split(/\s+/).length },
                  { icon: FiClock, label: 'Read Time', value: `${Math.ceil((activeTab === 'cover' ? currentApp.coverLetter : activeTab === 'motivational' ? currentApp.motivationalLetter : currentApp.emailDraft).split(/\s+/).length / 200)} min` },
                  { icon: FiFileText, label: 'Paragraphs', value: (activeTab === 'cover' ? currentApp.coverLetter : activeTab === 'motivational' ? currentApp.motivationalLetter : currentApp.emailDraft).split('\n\n').length },
                ].map((stat, i) => (
                  <div key={i} className="glass-card p-3 text-center">
                    <stat.icon className="w-4 h-4 text-primary-400 mx-auto mb-1" />
                    <p className="text-white font-semibold text-xs sm:text-sm">{stat.value}</p>
                    <p className="text-white/40 text-xs">{stat.label}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
