import { useState, useEffect } from 'react'
import { FiCpu, FiMessageSquare, FiBriefcase, FiDollarSign, FiAlertTriangle, FiChevronDown, FiChevronUp, FiBook, FiTarget, FiMic, FiHelpCircle, FiArrowRight, FiCheckCircle, FiList, FiZap } from 'react-icons/fi'

export default function InterviewPrep({ cvData, job, onBack }) {
  const [prep, setPrep] = useState(null)
  const [loading, setLoading] = useState(true)
  const [openItem, setOpenItem] = useState(null)
  const [activeTab, setActiveTab] = useState('technical')

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await fetch('/api/interview-prep', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cvData, job }),
        })
        setPrep(await resp.json())
      } catch {
        setPrep(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [cvData, job])

  if (loading) {
    return (
      <div className="glass-card p-6 sm:p-12 text-center space-y-4">
        <div className="w-16 h-16 mx-auto border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
        <p className="text-white/60">Preparing real interview practice for {job.title} at {job.company}...</p>
        <p className="text-white/30 text-sm">Generating role-specific questions, case studies, and mock interviews</p>
      </div>
    )
  }

  if (!prep) return (
    <div className="glass-card p-5 sm:p-8 text-center text-white/40 space-y-4">
      <p>Could not load interview prep</p>
      <button onClick={() => window.location.reload()} className="btn-secondary text-sm py-2 px-4">
        Try Again
      </button>
    </div>
  )

  const tabs = [
    { key: 'technical', label: 'Technical', icon: FiCpu, count: prep.technicalQuestions?.length },
    { key: 'behavioral', label: 'Behavioral', icon: FiMessageSquare, count: prep.behavioralQuestions?.length },
    { key: 'practice', label: 'Mock Interview', icon: FiMic, count: prep.interviewPractice?.mockInterviewScript ? 2 : 0 },
    { key: 'caseStudy', label: 'Case Study', icon: FiTarget, count: 1 },
    { key: 'company', label: 'Company Intel', icon: FiBriefcase, count: prep.companyInsights?.length },
    { key: 'salary', label: 'Salary Tips', icon: FiDollarSign, count: prep.salaryNegotiation?.length },
    { key: 'flags', label: 'Red Flags', icon: FiAlertTriangle, count: prep.redFlagsToWatch?.length },
  ]

  const difficultyColors = {
    easy: 'bg-green-500/20 text-green-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    hard: 'bg-red-500/20 text-red-400',
  }

  return (
    <div className="space-y-6">
      <div>
        <button onClick={onBack} className="text-white/40 hover:text-white text-sm mb-3 flex items-center gap-1">
          {'\u2190'} Back to applications
        </button>
        <h2 className="text-xl sm:text-2xl font-bold text-white break-words">
          Interview Prep: <span className="gradient-text">{job.title}</span>
        </h2>
        <p className="text-white/50 text-sm mt-1">{job.company} \u2022 Real practice tailored to this exact role</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? 'bg-primary-500/20 border border-primary-500/30 text-white'
                : 'bg-white/5 border border-transparent text-white/40 hover:bg-white/10'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* TECHNICAL QUESTIONS */}
      {activeTab === 'technical' && (
        <div className="space-y-3">
          {prep.technicalQuestions?.map((q, i) => (
            <div key={i} className="glass-card overflow-hidden">
              <button
                onClick={() => setOpenItem(openItem === `t${i}` ? null : `t${i}`)}
                className="w-full p-4 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center text-primary-400 text-sm font-bold shrink-0">{i + 1}</span>
                  <span className="text-white text-sm font-medium">{q.question}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${difficultyColors[q.difficulty]}`}>{q.difficulty}</span>
                  {openItem === `t${i}` ? <FiChevronUp className="w-4 h-4 text-white/40" /> : <FiChevronDown className="w-4 h-4 text-white/40" />}
                </div>
              </button>
              {openItem === `t${i}` && (
                <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
                  <div>
                    <p className="text-white/40 text-xs mb-1 font-medium">MODEL ANSWER</p>
                    <p className="text-white/70 text-sm leading-relaxed">{q.detailedAnswer || q.answer}</p>
                  </div>
                  {q.whatInterviewerLooksFor && (
                    <div className="p-3 bg-cyan-500/5 rounded-xl border border-cyan-500/10">
                      <p className="text-cyan-300/80 text-xs flex items-center gap-1 mb-1">
                        <FiEye className="w-3 h-3" /> What the interviewer is looking for
                      </p>
                      <p className="text-white/50 text-xs">{q.whatInterviewerLooksFor}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* BEHAVIORAL QUESTIONS */}
      {activeTab === 'behavioral' && (
        <div className="space-y-3">
          {prep.behavioralQuestions?.map((q, i) => (
            <div key={i} className="glass-card overflow-hidden">
              <button
                onClick={() => setOpenItem(openItem === `b${i}` ? null : `b${i}`)}
                className="w-full p-4 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-sm font-bold shrink-0">{i + 1}</span>
                  <span className="text-white text-sm font-medium">{q.question}</span>
                </div>
                {openItem === `b${i}` ? <FiChevronUp className="w-4 h-4 text-white/40 shrink-0" /> : <FiChevronDown className="w-4 h-4 text-white/40 shrink-0" />}
              </button>
              {openItem === `b${i}` && (
                <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
                  {q.starBreakdown ? (
                    <div className="space-y-2">
                      <p className="text-white/40 text-xs font-medium">STAR BREAKDOWN</p>
                      {['situation', 'task', 'action', 'result'].map(key => (
                        q.starBreakdown[key] ? (
                          <div key={key} className="flex items-start gap-2">
                            <span className="px-1.5 py-0.5 bg-primary-500/20 text-primary-300 text-[10px] font-bold rounded uppercase shrink-0 mt-0.5">{key}</span>
                            <p className="text-white/60 text-xs leading-relaxed">{q.starBreakdown[key]}</p>
                          </div>
                        ) : null
                      ))}
                    </div>
                  ) : (
                    <div>
                      <p className="text-white/40 text-xs mb-1">SAMPLE ANSWER</p>
                      <p className="text-white/60 text-sm leading-relaxed">{q.sampleAnswer || q.answer}</p>
                    </div>
                  )}
                  {q.tip && (
                    <div className="flex items-start gap-2 p-2 bg-yellow-500/5 rounded-lg border border-yellow-500/10">
                      <FiBook className="w-3.5 h-3.5 text-yellow-400 mt-0.5 shrink-0" />
                      <p className="text-yellow-300/80 text-xs">{q.tip}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* MOCK INTERVIEW */}
      {activeTab === 'practice' && prep.interviewPractice && (
        <div className="space-y-4">
          {/* Opening Questions */}
          {prep.interviewPractice.openingQuestions?.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <FiHelpCircle className="w-5 h-5 text-green-400" /> Opening Questions
              </h3>
              <div className="space-y-3">
                {prep.interviewPractice.openingQuestions.map((q, i) => (
                  <div key={i} className="bg-white/5 rounded-xl p-3 space-y-2">
                    <p className="text-white text-sm font-medium">{q.question}</p>
                    <p className="text-green-300/70 text-xs leading-relaxed">{q.strongAnswer}</p>
                    {q.whyTheyAsk && (
                      <p className="text-white/30 text-xs italic">Why they ask: {q.whyTheyAsk}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Closing Questions */}
          {prep.interviewPractice.closingQuestions?.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <FiArrowRight className="w-5 h-5 text-cyan-400" /> Questions YOU Should Ask
              </h3>
              <div className="space-y-2">
                {prep.interviewPractice.closingQuestions.map((q, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                    <FiCheckCircle className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-white text-sm font-medium">{q.question}</p>
                      {q.purpose && <p className="text-white/40 text-xs mt-1">{q.purpose}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mock Interview Script */}
          {prep.interviewPractice.mockInterviewScript && (
            <div className="glass-card p-5">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <FiMic className="w-5 h-5 text-purple-400" /> Full Mock Interview Script
              </h3>
              <p className="text-white/30 text-xs mb-4">Practice this conversation out loud before your real interview</p>
              <div className="space-y-3">
                {prep.interviewPractice.mockInterviewScript.interviewer?.map((line, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                        <span className="text-red-400 text-xs font-bold">HR</span>
                      </div>
                      <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-3 flex-1">
                        <p className="text-white/70 text-sm leading-relaxed">{line}</p>
                      </div>
                    </div>
                    {prep.interviewPractice.mockInterviewScript.candidate?.[i] && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                          <span className="text-green-400 text-xs font-bold">You</span>
                        </div>
                        <div className="bg-green-500/5 border border-green-500/10 rounded-xl p-3 flex-1">
                          <p className="text-white/70 text-sm leading-relaxed">{prep.interviewPractice.mockInterviewScript.candidate[i]}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CASE STUDY */}
      {activeTab === 'caseStudy' && prep.interviewPractice?.caseStudy && (
        <div className="space-y-4">
          <div className="glass-card p-5">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <FiTarget className="w-5 h-5 text-yellow-400" /> Case Study Scenario
            </h3>
            <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-xl p-4 mb-4">
              <p className="text-white/80 text-sm leading-relaxed">{prep.interviewPractice.caseStudy.scenario}</p>
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <FiZap className="w-5 h-5 text-primary-400" /> Expected Approach
            </h3>
            <p className="text-white/60 text-sm leading-relaxed">{prep.interviewPractice.caseStudy.approach}</p>
          </div>

          {prep.interviewPractice.caseStudy.keyPoints?.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="text-white font-semibold mb-3">Key Points to Hit</h3>
              <div className="space-y-2">
                {prep.interviewPractice.caseStudy.keyPoints.map((point, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <FiCheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                    <span className="text-white/60">{point}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Technical Challenge */}
          {prep.interviewPractice.technicalChallenge && (
            <div className="glass-card p-5">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <FiCpu className="w-5 h-5 text-cyan-400" /> Live Coding Challenge
              </h3>
              <p className="text-white/60 text-sm mb-3">{prep.interviewPractice.technicalChallenge.description}</p>
              <div className="bg-white/5 rounded-xl p-3 mb-3">
                <p className="text-white/40 text-xs mb-1 font-medium">EXPECTED APPROACH</p>
                <p className="text-white/50 text-xs">{prep.interviewPractice.technicalChallenge.expectedApproach}</p>
              </div>
              {prep.interviewPractice.technicalChallenge.tips?.length > 0 && (
                <div className="space-y-1.5">
                  {prep.interviewPractice.technicalChallenge.tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-white/40">
                      <span className="text-primary-400 shrink-0">{'>'}</span> {tip}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* COMPANY INSIGHTS */}
      {activeTab === 'company' && (
        <div className="glass-card p-5 space-y-3">
          {prep.companyInsights?.map((c, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
              <FiBriefcase className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
              <div>
                {c.category && (
                  <span className="text-[10px] font-bold uppercase text-cyan-400/60 tracking-wider">{c.category}</span>
                )}
                <p className="text-white/70 text-sm">{c.point}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SALARY NEGOTIATION */}
      {activeTab === 'salary' && (
        <div className="space-y-3">
          {prep.salaryNegotiation?.map((s, i) => (
            <div key={i} className="glass-card p-5 space-y-2">
              <div className="flex items-start gap-3">
                <FiDollarSign className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                <p className="text-white/70 text-sm">{s.tip}</p>
              </div>
              {s.exampleScript && (
                <div className="ml-7 bg-green-500/5 border border-green-500/10 rounded-xl p-3">
                  <p className="text-green-300/70 text-xs italic leading-relaxed">{s.exampleScript}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* RED FLAGS */}
      {activeTab === 'flags' && (
        <div className="space-y-3">
          {prep.redFlagsToWatch?.map((f, i) => (
            <div key={i} className="glass-card p-5 space-y-2 border border-red-500/10">
              <div className="flex items-start gap-3">
                <FiAlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <p className="text-red-300/80 text-sm font-medium">{f.flag}</p>
              </div>
              {f.whatItMeans && (
                <p className="text-white/40 text-xs ml-7">{f.whatItMeans}</p>
              )}
              {f.howToHandle && (
                <div className="ml-7 bg-yellow-500/5 border border-yellow-500/10 rounded-lg p-2">
                  <p className="text-yellow-300/70 text-xs">{f.howToHandle}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function FiEye({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}
