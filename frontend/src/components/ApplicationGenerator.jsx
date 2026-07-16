import { useState } from 'react'
import { FiMail, FiFileText, FiCopy, FiCheck, FiEdit3, FiSend, FiDownload } from 'react-icons/fi'

export default function ApplicationGenerator({ applications, profile }) {
  const [activeTab, setActiveTab] = useState('cover')
  const [editingIndex, setEditingIndex] = useState(null)
  const [editedContent, setEditedContent] = useState({})
  const [copiedField, setCopiedField] = useState(null)

  const handleCopy = (text, fieldId) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldId)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleEmailSend = (app) => {
    const subject = encodeURIComponent(`Application for ${app.job.title} - ${profile.fullName}`)
    const body = encodeURIComponent(app.coverLetter)
    window.open(`mailto:${app.job.companyEmail || ''}?subject=${subject}&body=${body}`, '_blank')
  }

  if (!applications || applications.length === 0) {
    return (
      <div className="glass-card p-6 sm:p-12 text-center">
        <FiFileText className="w-12 h-12 text-white/20 mx-auto mb-4" />
        <p className="text-white/40">No applications generated yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Generated Applications</h3>

      {applications.map((app, index) => (
        <div key={index} className="glass-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <h4 className="font-semibold text-white">{app.job.title}</h4>
              <p className="text-white/40 text-sm">{app.job.company}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleEmailSend(app)}
                className="btn-secondary text-sm py-2 px-3 flex items-center gap-1"
              >
                <FiMail className="w-4 h-4" /> Email
              </button>
              <button className="btn-secondary text-sm py-2 px-3 flex items-center gap-1">
                <FiDownload className="w-4 h-4" /> PDF
              </button>
            </div>
          </div>

          <div className="flex gap-2 border-b border-white/10 pb-2 overflow-x-auto flex-nowrap">
            {['cover', 'motivational', 'email'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'text-primary-400 border-b-2 border-primary-400'
                    : 'text-white/40 hover:text-white/60'
                }`}
              >
                {tab === 'cover' ? 'Cover Letter' : tab === 'motivational' ? 'Motivational Letter' : 'Email Draft'}
              </button>
            ))}
          </div>

          <div className="bg-white/5 rounded-xl p-4 relative group">
            <div className="absolute top-3 right-3 flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => {
                  const fieldId = `${index}-${activeTab}`
                  handleCopy(
                    activeTab === 'cover' ? app.coverLetter :
                    activeTab === 'motivational' ? app.motivationalLetter :
                    app.emailDraft,
                    fieldId
                  )
                }}
                className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
              >
                {copiedField === `${index}-${activeTab}` ? (
                  <FiCheck className="w-4 h-4 text-green-400" />
                ) : (
                  <FiCopy className="w-4 h-4 text-white/60" />
                )}
              </button>
            </div>
            <pre className="text-white/70 text-sm whitespace-pre-wrap font-sans leading-relaxed">
              {activeTab === 'cover' ? app.coverLetter :
               activeTab === 'motivational' ? app.motivationalLetter :
               app.emailDraft}
            </pre>
          </div>
        </div>
      ))}
    </div>
  )
}
