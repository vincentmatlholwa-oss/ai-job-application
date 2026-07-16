import { useState, useEffect } from 'react'
import { FiCheckCircle, FiAlertTriangle, FiAlertCircle, FiTrendingUp, FiTarget, FiShield, FiArrowRight, FiStar, FiInfo } from 'react-icons/fi'

export default function CVStrengthAnalyzer({ cvData, targetRole, onComplete }) {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const analyze = async () => {
      try {
        const resp = await fetch('/api/analyze-cv', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cvData, targetRole }),
        })
        if (!resp.ok) throw new Error('Analysis failed')
        setAnalysis(await resp.json())
      } catch {
        setAnalysis({
          overallScore: 50, atsScore: 45, grade: 'C',
          tips: [{ type: 'improvement', text: 'Could not analyze CV fully. Try again or proceed manually.' }],
          strengths: [], atsDetails: [],
        })
      } finally {
        setLoading(false)
      }
    }
    analyze()
  }, [cvData, targetRole])

  if (loading) {
    return (
      <div className="glass-card p-8 text-center space-y-4">
        <div className="w-16 h-16 mx-auto border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
        <p className="text-white/60">Analyzing your CV strength...</p>
      </div>
    )
  }

  if (!analysis) return null

  const gradeColors = {
    A: 'from-green-400 to-emerald-500',
    B: 'from-blue-400 to-cyan-500',
    C: 'from-yellow-400 to-orange-500',
    D: 'from-orange-400 to-red-500',
    F: 'from-red-400 to-rose-600',
  }

  const tipIcons = {
    critical: <FiAlertCircle className="w-4 h-4 text-red-400 shrink-0" />,
    warning: <FiAlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />,
    improvement: <FiInfo className="w-4 h-4 text-blue-400 shrink-0" />,
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-white">
          Your CV <span className="gradient-text">Score</span>
        </h2>
        <p className="text-white/50">AI-powered analysis of your CV strength and ATS compatibility</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-6 text-center">
          <div className="relative w-24 h-24 mx-auto mb-3">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="none" />
              <circle cx="50" cy="50" r="42" stroke="url(#grad1)" strokeWidth="8" fill="none"
                strokeDasharray={`${analysis.overallScore * 2.64} 264`}
                strokeLinecap="round" />
              <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6c5ce7" />
                  <stop offset="100%" stopColor="#00cec9" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">{analysis.overallScore}</span>
            </div>
          </div>
          <p className="text-white/40 text-sm">Overall Score</p>
          <span className={`inline-block mt-2 px-4 py-1 rounded-full text-sm font-bold bg-gradient-to-r ${gradeColors[analysis.grade]} text-white`}>
            Grade {analysis.grade}
          </span>
        </div>

        <div className="glass-card p-6 text-center">
          <div className="relative w-24 h-24 mx-auto mb-3">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="none" />
              <circle cx="50" cy="50" r="42" stroke="#00cec9" strokeWidth="8" fill="none"
                strokeDasharray={`${analysis.atsScore * 2.64} 264`}
                strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">{analysis.atsScore}</span>
            </div>
          </div>
          <p className="text-white/40 text-sm">ATS Score</p>
          <p className="text-white/30 text-xs mt-1">Applicant Tracking System</p>
        </div>

        <div className="glass-card p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-primary-500/20 flex items-center justify-center">
            <FiTarget className="w-8 h-8 text-primary-400" />
          </div>
          <p className="text-white/40 text-sm">Insights</p>
          <div className="mt-2 space-y-1">
            <p className="text-green-400 text-sm">{analysis.strengths.length} strengths</p>
            <p className="text-yellow-400 text-sm">{analysis.tips.length} tips to improve</p>
          </div>
        </div>
      </div>

      {analysis.strengths.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <FiStar className="w-5 h-5 text-green-400" /> Strengths
          </h3>
          <div className="space-y-2">
            {analysis.strengths.map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-green-400/80 text-sm">
                <FiCheckCircle className="w-4 h-4 shrink-0" />
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {analysis.tips.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <FiTrendingUp className="w-5 h-5 text-yellow-400" /> Improvement Tips
          </h3>
          <div className="space-y-3">
            {analysis.tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                {tipIcons[tip.type]}
                <p className="text-white/70 text-sm leading-relaxed">{tip.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {analysis.atsDetails.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <FiShield className="w-5 h-5 text-cyan-400" /> ATS Compatibility
          </h3>
          <div className="space-y-2">
            {analysis.atsDetails.map((d, i) => (
              <p key={i} className="text-white/50 text-sm">{'\u2022'} {d}</p>
            ))}
          </div>
        </div>
      )}

      <button onClick={onComplete} className="btn-primary w-full flex items-center justify-center gap-2 py-3 sm:py-4 text-base sm:text-lg">
        Continue to Job Search <FiArrowRight className="w-5 h-5" />
      </button>
    </div>
  )
}
