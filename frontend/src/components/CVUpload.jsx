import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'react-toastify'
import { FiUpload, FiFileText, FiCheck, FiUser, FiMail, FiPhone, FiMapPin, FiBriefcase, FiBookOpen, FiAward, FiGlobe, FiClock, FiSkipForward } from 'react-icons/fi'

export default function CVUpload({ onUpload, cvData }) {
  const [parsedData, setParsedData] = useState(null)
  const [isParsing, setIsParsing] = useState(false)
  const [manualMode, setManualMode] = useState(false)
  const [manualForm, setManualForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    currentRole: '',
    experience: '',
    education: '',
    skills: '',
    languages: '',
    certifications: '',
  })

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0]
    if (!file) return

    setIsParsing(true)
    const formData = new FormData()
    formData.append('cv', file)

    try {
      const response = await fetch('/api/parse-cv', {
        method: 'POST',
        body: formData,
      })
      if (!response.ok) throw new Error('Parse failed')
      const data = await response.json()
      setParsedData(data)
    } catch (err) {
      setParsedData(null)
      toast.error('Failed to parse CV. Please try a different file.', { theme: 'dark' })
    } finally {
      setIsParsing(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  })

  const handleManualSubmit = () => {
    if (!manualForm.fullName.trim()) {
      toast.warning('Please enter your full name', { theme: 'dark' })
      return
    }
    if (!manualForm.email.trim() || !manualForm.email.includes('@')) {
      toast.warning('Please enter a valid email address', { theme: 'dark' })
      return
    }

    const skillsArr = manualForm.skills.split(',').map(s => s.trim()).filter(Boolean)
    const eduArr = manualForm.education.split('\n').map(e => e.trim()).filter(Boolean)
    const langArr = manualForm.languages.split(',').map(l => l.trim()).filter(Boolean)
    const certArr = manualForm.certifications.split(',').map(c => c.trim()).filter(Boolean)

    onUpload({
      ...manualForm,
      skills: skillsArr,
      education: eduArr,
      languages: langArr,
      certifications: certArr,
      source: 'manual',
    })
  }

  const handleConfirmParsed = () => {
    onUpload({ ...parsedData, source: 'parsed' })
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-white">
          Let's Start With Your <span className="gradient-text">CV</span>
        </h2>
        <p className="text-white/50 max-w-lg mx-auto">
          Upload your resume or enter your details manually. Our AI will analyze your profile to find the best job matches.
        </p>
      </div>

      {!parsedData && !manualMode && (
        <>
          <div
            {...getRootProps()}
            className={`glass-card p-6 sm:p-10 text-center cursor-pointer transition-all duration-300 ${
              isDragActive
                ? 'border-primary-500 bg-primary-500/10 scale-105'
                : 'hover:border-white/20 hover:bg-white/10'
            }`}
          >
            <input {...getInputProps()} />
            <div className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 ${
              isDragActive
                ? 'bg-primary-500/20 text-primary-400'
                : 'bg-white/5 text-white/40'
            }`}>
              {isParsing ? (
                <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <FiUpload className="w-10 h-10" />
              )}
            </div>
            {isParsing ? (
              <div>
                <p className="text-white font-semibold text-lg">Analyzing your CV...</p>
                <p className="text-white/40 mt-2">Our AI is extracting your information</p>
              </div>
            ) : isDragActive ? (
              <div>
                <p className="text-primary-400 font-semibold text-lg">Drop your CV here</p>
                <p className="text-white/40 mt-2">Release to upload</p>
              </div>
            ) : (
              <div>
                <p className="text-white font-semibold text-lg">Drag & drop your CV here</p>
                <p className="text-white/40 mt-2">PDF, DOC, DOCX, or TXT (max 10MB)</p>
                <button className="btn-primary mt-4 text-sm">
                  <FiFileText className="w-4 h-4 inline mr-2" />
                  Browse Files
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-white/30 text-sm">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <button
            onClick={() => setManualMode(true)}
            className="btn-secondary w-full flex items-center justify-center gap-2"
          >
            <FiUser className="w-5 h-5" />
            Enter Details Manually
          </button>

          <button
            onClick={() => {
              setManualMode(true)
              setManualForm({
                fullName: '', email: '', phone: '', location: '',
                currentRole: '', experience: '', education: '',
                skills: '', languages: '', certifications: '',
              })
            }}
            className="w-full flex items-center justify-center gap-2 py-3 text-white/40 hover:text-white/60 text-sm transition-colors"
          >
            <FiSkipForward className="w-4 h-4" />
            I don't have a CV yet — start from scratch
          </button>
        </>
      )}

      {parsedData && !manualMode && (
        <div className="space-y-4">
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <FiCheck className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">CV Parsed Successfully</h3>
                <p className="text-white/40 text-sm">Review the extracted information below</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {parsedData.fullName && (
                <InfoItem icon={FiUser} label="Full Name" value={parsedData.fullName} />
              )}
              {parsedData.email && (
                <InfoItem icon={FiMail} label="Email" value={parsedData.email} />
              )}
              {parsedData.phone && (
                <InfoItem icon={FiPhone} label="Phone" value={parsedData.phone} />
              )}
              {parsedData.location && (
                <InfoItem icon={FiMapPin} label="Location" value={parsedData.location} />
              )}
              {parsedData.currentRole && (
                <InfoItem icon={FiBriefcase} label="Current Role" value={parsedData.currentRole} />
              )}
              {parsedData.experience && (
                <InfoItem icon={FiAward} label="Experience" value={parsedData.experience} />
              )}
            </div>

            {parsedData.skills && parsedData.skills.length > 0 && (
              <div className="mt-4">
                <p className="text-white/40 text-sm mb-2 flex items-center gap-2">
                  <FiAward className="w-4 h-4" /> Skills
                </p>
                <div className="flex flex-wrap gap-2">
                  {parsedData.skills.map((skill, i) => (
                    <span key={i} className="px-3 py-1 bg-primary-500/20 text-primary-300 rounded-lg text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {parsedData.education && parsedData.education.length > 0 && (
              <div className="mt-4">
                <p className="text-white/40 text-sm mb-2 flex items-center gap-2">
                  <FiBookOpen className="w-4 h-4" /> Education
                </p>
                {parsedData.education.map((edu, i) => (
                  <p key={i} className="text-white/70 text-sm">{edu}</p>
                ))}
              </div>
            )}

            {parsedData.workExperience && parsedData.workExperience.length > 0 && (
              <div className="mt-4">
                <p className="text-white/40 text-sm mb-2 flex items-center gap-2">
                  <FiBriefcase className="w-4 h-4" /> Work Experience ({parsedData.workExperience.length})
                </p>
                <div className="space-y-3">
                  {parsedData.workExperience.map((work, i) => (
                    <div key={i} className="p-3 bg-white/5 rounded-xl">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-white text-sm font-medium">{work.title}</p>
                          {work.company && <p className="text-primary-300 text-xs">{work.company}</p>}
                        </div>
                        {work.dates && (
                          <span className="flex items-center gap-1 text-white/30 text-xs shrink-0">
                            <FiClock className="w-3 h-3" /> {work.dates}
                          </span>
                        )}
                      </div>
                      {work.description && (
                        <p className="text-white/40 text-xs mt-1 line-clamp-2">{work.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={handleConfirmParsed} className="btn-primary flex-1 flex items-center justify-center gap-2">
              <FiCheck className="w-5 h-5" />
              Looks Good, Continue
            </button>
            <button
              onClick={() => { setParsedData(null); setManualMode(true) }}
              className="btn-secondary whitespace-nowrap"
            >
              Edit Manually
            </button>
          </div>
        </div>
      )}

      {manualMode && (
        <div className="glass-card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Personal Details</h3>
            <button onClick={() => setManualMode(false)} className="text-white/40 hover:text-white text-sm">
              Upload CV Instead
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField icon={FiUser} label="Full Name" placeholder="John Doe"
              value={manualForm.fullName} onChange={v => setManualForm(p => ({ ...p, fullName: v }))} />
            <InputField icon={FiMail} label="Email" placeholder="john@example.com" type="email"
              value={manualForm.email} onChange={v => setManualForm(p => ({ ...p, email: v }))} />
            <InputField icon={FiPhone} label="Phone" placeholder="+1 234 567 890"
              value={manualForm.phone} onChange={v => setManualForm(p => ({ ...p, phone: v }))} />
            <InputField icon={FiMapPin} label="Location" placeholder="New York, NY"
              value={manualForm.location} onChange={v => setManualForm(p => ({ ...p, location: v }))} />
            <InputField icon={FiBriefcase} label="Current/Target Role" placeholder="Software Engineer"
              value={manualForm.currentRole} onChange={v => setManualForm(p => ({ ...p, currentRole: v }))} />
            <InputField icon={FiAward} label="Years of Experience" placeholder="5"
              value={manualForm.experience} onChange={v => setManualForm(p => ({ ...p, experience: v }))} />
          </div>

          <TextareaField icon={FiAward} label="Skills (comma separated)"
            placeholder="JavaScript, React, Node.js, Python, SQL..."
            value={manualForm.skills} onChange={v => setManualForm(p => ({ ...p, skills: v }))} />

          <TextareaField icon={FiBookOpen} label="Education (one per line)"
            placeholder="BSc Computer Science - MIT (2018)&#10;MSc Data Science - Stanford (2020)"
            value={manualForm.education} onChange={v => setManualForm(p => ({ ...p, education: v }))} />

          <InputField icon={FiGlobe} label="Languages (comma separated)"
            placeholder="English, Spanish, French"
            value={manualForm.languages} onChange={v => setManualForm(p => ({ ...p, languages: v }))} />

          <InputField icon={FiAward} label="Certifications (comma separated)"
            placeholder="AWS Certified, PMP, Scrum Master"
            value={manualForm.certifications} onChange={v => setManualForm(p => ({ ...p, certifications: v }))} />

          <button onClick={handleManualSubmit} className="btn-primary w-full flex items-center justify-center gap-2">
            <FiCheck className="w-5 h-5" />
            Save & Continue
          </button>
        </div>
      )}
    </div>
  )
}

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
      <Icon className="w-4 h-4 text-primary-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-white/40 text-xs">{label}</p>
        <p className="text-white text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}

function InputField({ icon: Icon, label, placeholder, value, onChange, type = 'text' }) {
  return (
    <div className="space-y-1.5">
      <label className="text-white/60 text-sm flex items-center gap-2">
        <Icon className="w-4 h-4" /> {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="input-field"
      />
    </div>
  )
}

function TextareaField({ icon: Icon, label, placeholder, value, onChange }) {
  return (
    <div className="space-y-1.5">
      <label className="text-white/60 text-sm flex items-center gap-2">
        <Icon className="w-4 h-4" /> {label}
      </label>
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={3}
        className="textarea-field"
      />
    </div>
  )
}
