import { useState, useEffect } from 'react'
import { FiUploadCloud, FiSearch, FiFileText, FiSend, FiCheckCircle, FiArrowRight, FiZap, FiShield, FiSmartphone, FiChevronRight } from 'react-icons/fi'

const FEATURES = [
  {
    icon: FiUploadCloud,
    title: 'Smart CV Parsing',
    desc: 'Upload your CV and our AI instantly extracts your skills, experience, education, and contact details.',
    color: '#6c5ce7',
  },
  {
    icon: FiSearch,
    title: 'Job Matching',
    desc: 'Get matched to real jobs across Pnet, Indeed, CareerJunction, and LinkedIn — scored by fit.',
    color: '#00cec9',
  },
  {
    icon: FiFileText,
    title: 'Cover Letters & Emails',
    desc: 'AI generates personalized cover letters, motivational letters, and ready-to-send application emails.',
    color: '#fd79a8',
  },
  {
    icon: FiZap,
    title: 'Interview Prep',
    desc: 'Practice with mock interviews, STAR-method answers, and company-specific prep — all tailored to you.',
    color: '#fdcb6e',
  },
  {
    icon: FiSend,
    title: 'One-Click Apply',
    desc: 'Apply directly to real South African job listings or send pre-filled application emails instantly.',
    color: '#55efc4',
  },
  {
    icon: FiShield,
    title: 'Application Tracker',
    desc: 'Track every application from Saved to Offer with a visual Kanban board. Never lose track again.',
    color: '#74b9ff',
  },
]

const STEPS_DATA = [
  { num: '1', title: 'Upload Your CV', desc: 'Drop your PDF or DOC file' },
  { num: '2', title: 'AI Analyzes It', desc: 'Skills, roles, and industry inferred' },
  { num: '3', title: 'Find Matching Jobs', desc: 'Real listings from SA job platforms' },
  { num: '4', title: 'Apply & Track', desc: 'Generate letters and track progress' },
]

export default function LandingPage({ onGetStarted }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  return (
    <div className="min-h-screen relative">
      {/* Hero */}
      <section className="relative pt-16 sm:pt-24 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 left-1/4 w-72 h-72 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: '#6c5ce7' }} />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full opacity-8 blur-3xl pointer-events-none" style={{ background: '#00cec9' }} />

        <div className={`max-w-4xl mx-auto text-center space-y-8 transition-all duration-1000 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium" style={{ background: 'rgba(108,92,231,0.12)', border: '1px solid rgba(108,92,231,0.25)', color: '#a29bfe' }}>
            <FiZap className="w-3.5 h-3.5" />
            AI-Powered Job Application Assistant
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight">
            <span className="text-white">Get Hired</span>
            <br />
            <span className="gradient-text">Faster & Smarter</span>
          </h1>

          <p className="text-white/50 text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Upload your CV once — and let AI find matching jobs, write personalized cover letters, and track your applications across South Africa's top job platforms.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={onGetStarted}
              className="group w-full sm:w-auto btn-primary flex items-center justify-center gap-3 py-4 px-8 text-lg font-semibold rounded-2xl"
              style={{ boxShadow: '0 8px 32px rgba(108,92,231,0.35)' }}
            >
              Get Started — It's Free
              <FiArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </button>
            <span className="text-white/30 text-sm">No sign-up required</span>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-6 sm:gap-10 pt-8 text-center">
            {[
              { value: '6+', label: 'Job Platforms' },
              { value: '100%', label: 'Free to Use' },
              { value: 'AI', label: 'Powered' },
            ].map((stat, i) => (
              <div key={i}>
                <p className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-white/30 text-xs sm:text-sm mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 sm:mb-16 space-y-3">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
              How It <span className="gradient-text">Works</span>
            </h2>
            <p className="text-white/40 max-w-lg mx-auto">Four simple steps from CV to career move.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS_DATA.map((step, i) => (
              <div key={i} className="relative glass-card p-6 text-center space-y-3 group" style={{ transitionDelay: `${i * 100}ms` }}>
                <div className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #6c5ce7, #00cec9)' }}>
                  {step.num}
                </div>
                <h3 className="text-white font-semibold text-sm sm:text-base">{step.title}</h3>
                <p className="text-white/40 text-xs sm:text-sm">{step.desc}</p>
                {i < 3 && (
                  <FiChevronRight className="hidden lg:block absolute top-1/2 -right-3 w-5 h-5 text-white/15 -translate-y-1/2" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16 space-y-3">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
              Everything You <span className="gradient-text">Need</span>
            </h2>
            <p className="text-white/40 max-w-lg mx-auto">From CV parsing to interview prep — one tool for your entire job search.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div key={i} className="glass-card p-6 space-y-4 group">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${f.color}15`, border: `1px solid ${f.color}30` }}>
                  <f.icon className="w-5 h-5" style={{ color: f.color }} />
                </div>
                <h3 className="text-white font-semibold text-sm sm:text-base">{f.title}</h3>
                <p className="text-white/40 text-xs sm:text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="glass-card p-8 sm:p-12 text-center space-y-6" style={{ borderColor: 'rgba(108,92,231,0.3)' }}>
            <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6c5ce7, #00cec9)' }}>
              <FiSmartphone className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Ready to Start?</h2>
            <p className="text-white/40 max-w-md mx-auto">
              Upload your CV and let our AI find your next opportunity. Works on mobile and desktop.
            </p>
            <button
              onClick={onGetStarted}
              className="group btn-primary inline-flex items-center gap-3 py-4 px-8 text-lg font-semibold rounded-2xl"
              style={{ boxShadow: '0 8px 32px rgba(108,92,231,0.35)' }}
            >
              Get Started
              <FiArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-white/30 text-sm">&copy; {new Date().getFullYear()} Vincent Matlholwa. All rights reserved.</span>
            <a
              href="https://wa.me/27677834591"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-9 h-9 rounded-full transition-all duration-300 hover:scale-110"
              style={{ background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.25)' }}
              aria-label="Chat on WhatsApp"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" style={{ fill: '#25D366' }}>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
