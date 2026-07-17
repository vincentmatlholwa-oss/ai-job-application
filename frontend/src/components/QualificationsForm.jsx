import { useState, useEffect } from 'react'
import { FiCheck, FiDollarSign, FiClock, FiHome, FiGlobe, FiPlus, FiX, FiChevronRight, FiCpu } from 'react-icons/fi'

const WORK_PREFERENCES = [
  { value: 'remote', label: 'Remote', icon: '🏠' },
  { value: 'hybrid', label: 'Hybrid', icon: '🔄' },
  { value: 'onsite', label: 'On-site', icon: '🏢' },
  { value: 'any', label: 'Any', icon: '🌍' },
]

export default function QualificationsForm({ data, cvData, onSubmit }) {
  const [form, setForm] = useState({
    skills: [],
    salaryExpectation: '',
    workPreference: 'any',
    availableFrom: '',
    ...data,
    ...cvData,
  })

  const [skillInput, setSkillInput] = useState('')

  useEffect(() => {
    if (cvData?.skills?.length > 0 && form.skills.length === 0) {
      setForm(prev => ({ ...prev, skills: cvData.skills }))
    }
  }, [cvData])

  const addSkill = (skill) => {
    const trimmed = skill.trim()
    if (trimmed && !form.skills.includes(trimmed)) {
      setForm(prev => ({ ...prev, skills: [...prev.skills, trimmed] }))
    }
    setSkillInput('')
  }

  const removeSkill = (skill) => {
    setForm(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(form)
  }

  const inferredRole = cvData?.inferredRole || cvData?.currentRole || 'Professional'
  const inferredIndustry = cvData?.inferredIndustry || 'Technology'
  const inferredExperience = cvData?.experience || ''

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-white">
          Your <span className="gradient-text">Profile</span>
        </h2>
        <p className="text-white/50 max-w-lg mx-auto">
          We've analyzed your CV. Adjust preferences below or search as-is.
        </p>
      </div>

      <div className="glass-card p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <FiCpu className="w-5 h-5 text-cyan-400" />
          AI-Inferred Profile
        </h3>
        <p className="text-white/40 text-sm">Auto-detected from your CV</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-1">
            <span className="text-white/40 text-xs uppercase tracking-wider">Target Role</span>
            <p className="text-white font-medium flex items-center gap-2">
              <FiCheck className="w-4 h-4 text-green-400 flex-shrink-0" />
              {inferredRole}
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-1">
            <span className="text-white/40 text-xs uppercase tracking-wider">Industry</span>
            <p className="text-white font-medium flex items-center gap-2">
              <FiCheck className="w-4 h-4 text-green-400 flex-shrink-0" />
              {inferredIndustry}
            </p>
          </div>
          {inferredExperience && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-1">
              <span className="text-white/40 text-xs uppercase tracking-wider">Experience</span>
              <p className="text-white font-medium flex items-center gap-2">
                <FiCheck className="w-4 h-4 text-green-400 flex-shrink-0" />
                {inferredExperience}
              </p>
            </div>
          )}
        </div>

        {cvData?.fullName && (
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-white/50">
            <span>{cvData.fullName}</span>
            {cvData.email && <span>{cvData.email}</span>}
            {cvData.phone && <span>{cvData.phone}</span>}
            {cvData.location && <span>{cvData.location}</span>}
          </div>
        )}
      </div>

      <div className="glass-card p-6 space-y-5">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <FiGlobe className="w-5 h-5 text-primary-400" />
          Skills & Preferences
        </h3>

        <div className="space-y-2">
          <label className="text-white/60 text-sm">Key Skills</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type a skill and press Enter"
              value={skillInput}
              onChange={e => setSkillInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addSkill(skillInput)
                }
              }}
              className="input-field flex-1"
            />
            <button
              type="button"
              onClick={() => addSkill(skillInput)}
              className="btn-primary px-4"
            >
              <FiPlus className="w-5 h-5" />
            </button>
          </div>
          {form.skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {form.skills.map((skill, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-500/20 text-primary-300 rounded-lg text-sm"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="hover:text-red-400 transition-colors"
                  >
                    <FiX className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-white/60 text-sm flex items-center gap-2">
            <FiHome className="w-4 h-4" /> Work Preference
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {WORK_PREFERENCES.map(pref => (
              <button
                key={pref.value}
                type="button"
                onClick={() => setForm(p => ({ ...p, workPreference: pref.value }))}
                className={`p-3 rounded-xl border transition-all duration-300 text-center ${
                  form.workPreference === pref.value
                    ? 'bg-primary-500/20 border-primary-500/50 text-white'
                    : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                }`}
              >
                <span className="text-xl block mb-1">{pref.icon}</span>
                <span className="text-sm">{pref.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-white/60 text-sm flex items-center gap-2">
              <FiDollarSign className="w-4 h-4" /> Salary Expectation (ZAR/month)
            </label>
            <input
              type="text"
              placeholder="e.g., 25,000 - 45,000"
              value={form.salaryExpectation}
              onChange={e => setForm(p => ({ ...p, salaryExpectation: e.target.value }))}
              className="input-field"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-white/60 text-sm flex items-center gap-2">
              <FiClock className="w-4 h-4" /> Available From
            </label>
            <input
              type="date"
              value={form.availableFrom}
              onChange={e => setForm(p => ({ ...p, availableFrom: e.target.value }))}
              className="input-field"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg"
      >
        Search for Matching Jobs
        <FiChevronRight className="w-5 h-5" />
      </button>
    </form>
  )
}
