import { useState, useCallback, useEffect, useMemo } from 'react'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Header from './components/Header'
import StepIndicator from './components/StepIndicator'
import LandingPage from './components/LandingPage'
import CVUpload from './components/CVUpload'
import CVEvaluator from './components/CVEvaluator'
import QualificationsForm from './components/QualificationsForm'
import JobSearchResults from './components/JobSearchResults'
import Dashboard from './components/Dashboard'
import KanbanTracker from './components/KanbanTracker'
import InterviewPrep from './components/InterviewPrep'
import SalaryBenchmark from './components/SalaryBenchmark'
import Scene3D from './components/Scene3D'
import Footer from './components/Footer'
import Chatbot from './components/Chatbot'

const STEPS = ['Upload CV', 'Evaluate', 'Your Profile', 'Find Jobs', 'Applications']

function App() {
  const [view, setView] = useState(() => {
    try { return localStorage.getItem('jobai_view') || 'landing' } catch { return 'landing' }
  })
  const [currentStep, setCurrentStep] = useState(() => {
    try { return parseInt(localStorage.getItem('jobai_step')) || 0 } catch { return 0 }
  })
  const [cvData, setCvData] = useState(() => {
    try { return JSON.parse(localStorage.getItem('jobai_cvData')) || null } catch { return null }
  })
  const [qualifications, setQualifications] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('jobai_qualifications'))
      return saved || {
        fullName: '', email: '', phone: '', location: '',
        targetRole: '', targetIndustry: '', yearsExperience: '',
        skills: [], education: [], languages: [], certifications: [],
        salaryExpectation: '', workPreference: 'remote', availableFrom: '',
      }
    } catch {
      return {
        fullName: '', email: '', phone: '', location: '',
        targetRole: '', targetIndustry: '', yearsExperience: '',
        skills: [], education: [], languages: [], certifications: [],
        salaryExpectation: '', workPreference: 'remote', availableFrom: '',
      }
    }
  })
  const [jobs, setJobs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('jobai_jobs')) || [] } catch { return [] }
  })
  const [selectedJobs, setSelectedJobs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('jobai_selectedJobs')) || [] } catch { return [] }
  })
  const [applications, setApplications] = useState(() => {
    try { return JSON.parse(localStorage.getItem('jobai_applications')) || [] } catch { return [] }
  })
  const [isSearching, setIsSearching] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [dashboardView, setDashboardView] = useState('applications')
  const [interviewJob, setInterviewJob] = useState(null)

  useEffect(() => {
    try {
      localStorage.setItem('jobai_view', view)
      localStorage.setItem('jobai_step', currentStep)
      if (cvData) localStorage.setItem('jobai_cvData', JSON.stringify(cvData))
      localStorage.setItem('jobai_qualifications', JSON.stringify(qualifications))
      if (jobs.length > 0) localStorage.setItem('jobai_jobs', JSON.stringify(jobs))
      if (selectedJobs.length > 0) localStorage.setItem('jobai_selectedJobs', JSON.stringify(selectedJobs))
      if (applications.length > 0) localStorage.setItem('jobai_applications', JSON.stringify(applications))
    } catch {}
  }, [view, currentStep, cvData, qualifications, jobs, selectedJobs, applications])

  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash
      if (hash) {
        const step = parseInt(hash.replace('#step-', ''))
        if (!isNaN(step) && step >= 0 && step <= 4) setCurrentStep(step)
      }
    }
    window.addEventListener('popstate', handlePopState)
    if (window.location.hash) handlePopState()
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const setCurrentStepWithHistory = useCallback((step) => {
    setCurrentStep(step)
    window.history.pushState(null, '', `#step-${step}`)
  }, [])

  const handleCVUpload = useCallback((data) => {
    setCvData(data)
    setQualifications(prev => ({
      ...prev,
      fullName: data.fullName || prev.fullName,
      email: data.email || prev.email,
      phone: data.phone || prev.phone,
      location: data.location || prev.location,
      targetRole: data.inferredRole || data.currentRole || prev.targetRole,
      targetIndustry: data.inferredIndustry || prev.targetIndustry,
      yearsExperience: data.experience || prev.yearsExperience,
      skills: data.skills?.length > 0 ? data.skills : prev.skills,
      education: data.education?.length > 0 ? data.education : prev.education,
    }))
    toast.success('CV parsed successfully!', { theme: 'dark' })
    setTimeout(() => setCurrentStepWithHistory(1), 500)
  }, [setCurrentStepWithHistory])

  const handleUseOriginal = useCallback(() => {
    toast.info('Continuing with your original CV', { theme: 'dark' })
    setCurrentStepWithHistory(2)
  }, [setCurrentStepWithHistory])

  const handleUseTemplate = useCallback((template) => {
    const header = template.sections.find(s => s.title === 'header')?.content || {}
    const templateData = {
      ...cvData,
      fullName: header.name || cvData.fullName,
      email: header.email || cvData.email,
      phone: header.phone || cvData.phone,
      location: header.location || cvData.location,
      currentRole: header.role || cvData.currentRole,
      _usedTemplate: template.name,
    }
    setCvData(templateData)
    toast.success(`Using "${template.name}" template — PDF downloaded!`, { theme: 'dark' })
    setCurrentStepWithHistory(2)
  }, [cvData, setCurrentStepWithHistory])

  const handleQualificationsSubmit = useCallback((data) => {
    setQualifications(prev => ({
      ...prev,
      ...data,
      targetRole: cvData?.inferredRole || cvData?.currentRole || prev.targetRole,
      targetIndustry: cvData?.inferredIndustry || prev.targetIndustry,
      yearsExperience: cvData?.experience || prev.yearsExperience,
    }))
    toast.success('Profile saved!', { theme: 'dark' })
    setCurrentStepWithHistory(3)
  }, [cvData, setCurrentStepWithHistory])

  const handleSearchJobs = useCallback(async () => {
    setIsSearching(true)
    try {
      const profile = { ...qualifications, ...cvData }
      const response = await fetch('/api/search-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      if (!response.ok) throw new Error('Search failed')
      const data = await response.json()
      setJobs(data.jobs)
      toast.success(`Found ${data.jobs.length} matching jobs!`, { theme: 'dark' })
    } catch (err) {
      toast.error('Failed to search jobs. Please try again.', { theme: 'dark' })
    } finally {
      setIsSearching(false)
    }
  }, [qualifications, cvData])

  const handleGenerateApplications = useCallback(async () => {
    if (selectedJobs.length === 0) {
      toast.warning('Please select at least one job', { theme: 'dark' })
      return
    }
    setIsGenerating(true)
    try {
      const profile = { ...qualifications, ...cvData }
      const response = await fetch('/api/generate-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, jobs: selectedJobs }),
      })
      if (!response.ok) throw new Error('Generation failed')
      const data = await response.json()
      setApplications(data.applications)
      toast.success('Applications generated!', { theme: 'dark' })
      setCurrentStepWithHistory(4)
    } catch (err) {
      toast.error('Failed to generate applications.', { theme: 'dark' })
    } finally {
      setIsGenerating(false)
    }
  }, [selectedJobs, qualifications, cvData])

  const handleSelectJob = useCallback((job) => {
    setSelectedJobs(prev => {
      const exists = prev.find(j => j.id === job.id)
      if (exists) return prev.filter(j => j.id !== job.id)
      return [...prev, job]
    })
  }, [])

  const handleSelectAllJobs = useCallback(() => {
    setSelectedJobs(prev => prev.length === jobs.length ? [] : [...jobs])
  }, [jobs])

  const goToStep = useCallback((step) => {
    if (step <= currentStep) {
      setCurrentStep(step)
      window.history.pushState(null, '', `#step-${step}`)
    }
  }, [currentStep])

  const handleOpenInterview = useCallback((job) => {
    setInterviewJob(job)
    setDashboardView('interview')
  }, [])

  const handleBackFromInterview = useCallback(() => {
    setInterviewJob(null)
    setDashboardView('applications')
  }, [])

  const profile = useMemo(() => ({ ...qualifications, ...cvData }), [qualifications, cvData])

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <CVUpload onUpload={handleCVUpload} cvData={cvData} />
      case 1:
        return (
          <CVEvaluator
            cvData={cvData}
            onUseOriginal={handleUseOriginal}
            onUseTemplate={handleUseTemplate}
          />
        )
      case 2:
        return (
          <QualificationsForm
            data={qualifications}
            cvData={cvData}
            onSubmit={handleQualificationsSubmit}
          />
        )
      case 3:
        return (
          <JobSearchResults
            jobs={jobs}
            selectedJobs={selectedJobs}
            onSelect={handleSelectJob}
            onSelectAll={handleSelectAllJobs}
            onSearch={handleSearchJobs}
            onGenerate={handleGenerateApplications}
            isSearching={isSearching}
            isGenerating={isGenerating}
          />
        )
      case 4:
        if (dashboardView === 'interview' && interviewJob) {
          return <InterviewPrep cvData={profile} job={interviewJob} onBack={handleBackFromInterview} />
        }
        if (dashboardView === 'tracker') {
          return <KanbanTracker applications={applications} />
        }
        if (dashboardView === 'salary') {
          return <SalaryBenchmark profile={profile} />
        }
        return (
          <Dashboard
            applications={applications}
            selectedJobs={selectedJobs}
            profile={profile}
            onViewChange={setDashboardView}
            onInterview={handleOpenInterview}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ perspective: '1200px' }}>
      <Scene3D />
      <div className="relative z-10">
        {view === 'landing' ? (
          <LandingPage onGetStarted={() => setView('app')} />
        ) : (
          <>
            <Header />
            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
              <StepIndicator steps={STEPS} currentStep={currentStep} onStepClick={goToStep} />
              <div className="mt-8" style={{ transformStyle: 'preserve-3d' }}>
                {renderStep()}
              </div>
            </main>
            <Footer />
          </>
        )}
      </div>
      <Chatbot />
      <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="dark" />
    </div>
  )
}

export default App
