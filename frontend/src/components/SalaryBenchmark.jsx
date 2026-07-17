import { useState } from 'react'
import { FiDollarSign, FiTrendingUp, FiMapPin, FiClock, FiBarChart2, FiInfo } from 'react-icons/fi'

export default function SalaryBenchmark({ profile }) {
  const [role, setRole] = useState(profile?.targetRole || '')
  const [location, setLocation] = useState(profile?.location || '')
  const [experience, setExperience] = useState(profile?.yearsExperience || '3')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!role) return
    setLoading(true)
    try {
      const resp = await fetch('/api/salary-benchmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, location, experience }),
      })
      setResult(await resp.json())
    } catch {
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  const formatSalary = (n) => 'R' + (n || 0).toLocaleString()

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-white">
          Salary <span className="gradient-text">Benchmark</span>
        </h2>
        <p className="text-white/50">Know your worth before you negotiate</p>
      </div>

      <div className="glass-card p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-white/60 text-sm flex items-center gap-2">
              <FiTrendingUp className="w-4 h-4" /> Role
            </label>
            <input value={role} onChange={e => setRole(e.target.value)} placeholder="e.g., Software Engineer" className="input-field" />
          </div>
          <div className="space-y-1.5">
            <label className="text-white/60 text-sm flex items-center gap-2">
              <FiMapPin className="w-4 h-4" /> Location
            </label>
            <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g., Johannesburg" className="input-field" />
          </div>
          <div className="space-y-1.5">
            <label className="text-white/60 text-sm flex items-center gap-2">
              <FiClock className="w-4 h-4" /> Years of Experience
            </label>
            <input type="number" value={experience} onChange={e => setExperience(e.target.value)} min="0" max="30" className="input-field" />
          </div>
        </div>
        <button onClick={handleSearch} disabled={loading || !role} className="btn-primary w-full flex items-center justify-center gap-2">
          {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiBarChart2 className="w-4 h-4" />}
          Get Salary Data
        </button>
      </div>

      {result && (
        <div className="space-y-4">
          <div className="glass-card p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2 flex-wrap">
              <FiDollarSign className="w-5 h-5 text-green-400" />
              {result.role} \u2022 {result.location} \u2022 {result.experience}
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Entry (P10)', value: result.estimated.low, color: 'text-blue-400' },
                { label: 'Median (P50)', value: result.estimated.median, color: 'text-green-400' },
                { label: 'Top (P75)', value: result.estimated.high, color: 'text-yellow-400' },
                { label: 'Elite (P90)', value: result.estimated.top, color: 'text-purple-400' },
              ].map(tier => (
                <div key={tier.label} className="text-center p-3 bg-white/5 rounded-xl">
                  <p className={`text-lg font-bold ${tier.color}`}>{formatSalary(tier.value)}</p>
                  <p className="text-white/40 text-xs mt-1">{tier.label}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/40">Salary Range</span>
                <span className="text-white/70">{formatSalary(result.estimated.low)} \u2013 {formatSalary(result.estimated.top)}</span>
              </div>
              <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{
                  background: 'linear-gradient(90deg, #3b82f6 0%, #6c5ce7 35%, #00cec9 65%, #a29bfe 100%)',
                  width: '100%',
                }} />
              </div>
              <div className="flex justify-between text-[9px] sm:text-[10px] text-white/30 overflow-x-auto whitespace-nowrap flex-nowrap">
                <span>{formatSalary(result.percentiles.p10)}</span>
                <span>{formatSalary(result.percentiles.p25)}</span>
                <span>{formatSalary(result.percentiles.p50)}</span>
                <span>{formatSalary(result.percentiles.p75)}</span>
                <span>{formatSalary(result.percentiles.p90)}</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-5">
            <h4 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
              <FiInfo className="w-4 h-4 text-cyan-400" /> Pro Tip
            </h4>
            <p className="text-white/60 text-sm leading-relaxed">{result.tip}</p>
          </div>

          <div className="glass-card p-5">
            <h4 className="text-white font-semibold text-sm mb-3">Factors Considered</h4>
            <div className="space-y-2">
              {result.factors.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-white/50 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-400" />
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
