import { useState } from 'react'
import { FiInbox, FiSend, FiEye, FiPhone, FiCheckCircle, FiXCircle, FiClock, FiMoreHorizontal, FiChevronRight, FiExternalLink, FiTrash2 } from 'react-icons/fi'

const STAGES = [
  { id: 'saved', label: 'Saved', icon: FiInbox, color: 'bg-blue-500' },
  { id: 'applied', label: 'Applied', icon: FiSend, color: 'bg-purple-500' },
  { id: 'viewed', label: 'Viewed', icon: FiEye, color: 'bg-yellow-500' },
  { id: 'interview', label: 'Interview', icon: FiPhone, color: 'bg-cyan-500' },
  { id: 'offer', label: 'Offer', icon: FiCheckCircle, color: 'bg-green-500' },
  { id: 'rejected', label: 'Rejected', icon: FiXCircle, color: 'bg-red-500' },
]

export default function KanbanTracker({ applications }) {
  const [tracker, setTracker] = useState(() => {
    const key = 'jobai_tracker'
    try {
      const saved = JSON.parse(localStorage.getItem(key))
      if (saved && Object.keys(saved).length > 0) return saved
    } catch {}
    const initial = {}
    applications.forEach((app) => {
      initial[app.job.id] = {
        ...app,
        stage: 'saved',
        appliedDate: null,
        notes: '',
        followUpDate: '',
        createdAt: new Date().toISOString(),
      }
    })
    return initial
  })

  const [activeStage, setActiveStage] = useState('all')
  const [selectedCard, setSelectedCard] = useState(null)

  const moveJob = (jobId, newStage) => {
    setTracker(prev => {
      const next = {
        ...prev,
        [jobId]: {
          ...prev[jobId],
          stage: newStage,
          appliedDate: newStage === 'applied' ? new Date().toISOString() : prev[jobId].appliedDate,
        }
      }
      localStorage.setItem('jobai_tracker', JSON.stringify(next))
      return next
    })
  }

  const addNote = (jobId, note) => {
    setTracker(prev => {
      const next = { ...prev, [jobId]: { ...prev[jobId], notes: note } }
      localStorage.setItem('jobai_tracker', JSON.stringify(next))
      return next
    })
  }

  const stageCounts = STAGES.reduce((acc, s) => {
    acc[s.id] = Object.values(tracker).filter(j => j.stage === s.id).length
    return acc
  }, {})

  const filteredJobs = activeStage === 'all'
    ? Object.values(tracker)
    : Object.values(tracker).filter(j => j.stage === activeStage)

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-white">
          Application <span className="gradient-text">Tracker</span>
        </h2>
        <p className="text-white/50">Track every application from saved to offer</p>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        <button
          onClick={() => setActiveStage('all')}
          className={`p-3 rounded-xl text-center transition-all ${activeStage === 'all' ? 'bg-primary-500/20 border border-primary-500/30' : 'bg-white/5 border border-transparent'}`}
        >
          <p className="text-lg font-bold text-white">{applications.length}</p>
          <p className="text-white/40 text-xs">All</p>
        </button>
        {STAGES.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveStage(s.id)}
            className={`p-3 rounded-xl text-center transition-all ${activeStage === s.id ? 'bg-primary-500/20 border border-primary-500/30' : 'bg-white/5 border border-transparent'}`}
          >
            <p className="text-lg font-bold text-white">{stageCounts[s.id]}</p>
            <p className="text-white/40 text-xs">{s.label}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredJobs.map(job => (
          <div key={job.job.id} className="glass-card p-4 space-y-3">
            <div>
              <h4 className="text-white font-semibold text-sm">{job.job.title}</h4>
              <p className="text-white/40 text-xs">{job.job.company} \u2022 {job.job.location}</p>
            </div>

            <div className="flex items-center gap-1">
              {STAGES.map((s, i) => (
                <div key={s.id} className="flex items-center">
                  <button
                    onClick={() => moveJob(job.job.id, s.id)}
                    className={`w-9 h-9 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-all ${
                      job.stage === s.id
                        ? `${s.color} text-white scale-110`
                        : 'bg-white/5 text-white/20 hover:bg-white/10'
                    }`}
                    title={`Move to ${s.label}`}
                  >
                    <s.icon className="w-3 h-3" />
                  </button>
                  {i < STAGES.length - 1 && <div className="w-2 h-0.5 bg-white/5" />}
                </div>
              ))}
            </div>

            {job.notes && (
              <p className="text-white/30 text-xs truncate bg-white/5 rounded-lg px-2 py-1">{job.notes}</p>
            )}

            <div className="flex items-center justify-between">
              <span className="text-white/20 text-xs">
                {job.appliedDate ? `Applied ${new Date(job.appliedDate).toLocaleDateString()}` : 'Not applied yet'}
              </span>
              {job.job.applyUrl && (
                <a href={job.job.applyUrl} target="_blank" rel="noopener noreferrer"
                  className="text-primary-400 text-xs flex items-center gap-1 hover:text-primary-300">
                  <FiExternalLink className="w-3 h-3" /> Apply
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredJobs.length === 0 && (
        <div className="glass-card p-8 text-center text-white/30">
          No applications in this stage yet
        </div>
      )}
    </div>
  )
}
