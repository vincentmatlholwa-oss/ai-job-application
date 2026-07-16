import { FiBriefcase, FiZap } from 'react-icons/fi'

export default function Header() {
  return (
    <header className="relative z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #6c5ce7, #00cec9)',
                boxShadow: '0 8px 32px rgba(108, 92, 231, 0.3), 0 0 20px rgba(0, 206, 201, 0.15)',
                transform: 'translateZ(20px)',
              }}
            >
              <FiBriefcase className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div style={{ transform: 'translateZ(10px)' }}>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Job<span className="gradient-text">AI</span>
              </h1>
              <p className="text-xs text-white/30 hidden sm:block">Smart Job Application Assistant</p>
            </div>
          </div>
          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
            style={{
              background: 'rgba(108, 92, 231, 0.08)',
              border: '1px solid rgba(108, 92, 231, 0.15)',
              transform: 'translateZ(10px)',
            }}
          >
            <FiZap className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-white/60 hidden sm:inline">AI Powered</span>
          </div>
        </div>
      </div>
    </header>
  )
}
