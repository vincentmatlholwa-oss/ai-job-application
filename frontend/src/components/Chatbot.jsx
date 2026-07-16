import { useState, useRef, useEffect, useCallback } from 'react'
import { FiMessageCircle, FiX, FiSend, FiCpu, FiUser, FiMinimize2, FiMaximize2 } from 'react-icons/fi'

const APP_KNOWLEDGE = {
  greeting: "Hello! I'm JobAI Assistant, built by Vincent Matlholwa. I can help you with everything about this app - uploading your CV, searching for jobs, generating cover letters, and more. What would you like help with?",

  topics: {
    'upload|cv|resume|pdf|file': {
      answer: "**Uploading Your CV**\n\n1. Go to the **Upload CV** step (the first screen)\n2. Drag & drop your PDF, DOC, or DOCX file onto the upload area, or click **Browse Files**\n3. Our AI will automatically parse your CV and extract your name, email, skills, education, and experience\n4. Review the parsed information and click **Looks Good, Continue**\n\nYou can also click **Enter Details Manually** if you prefer to type everything yourself.\n\nSupported formats: PDF, DOC, DOCX, TXT (max 10MB)",
      followUp: "Would you like tips on what makes a good CV, or do you need help with the next step?"
    },
    'skill|qualification|experience': {
      answer: "**Adding Your Qualifications**\n\nAfter uploading your CV, you'll see the **Your Profile** step where you can:\n\n- **Target Role** - The job title you're seeking (e.g., Software Engineer)\n- **Industry** - Your preferred industry (Technology, Healthcare, etc.)\n- **Skills** - Type a skill and press Enter to add it\n- **Work Preference** - Choose Remote, Hybrid, On-site, or Any\n- **Salary Expectation** - Your desired salary range\n- **Available From** - When you can start\n\nTip: Be specific about your skills and target role for better job matches!",
      followUp: "Need help with any specific field?"
    },
    'search|find|job|match|recommend': {
      answer: "**Finding Matching Jobs**\n\n1. Complete the **Upload CV** and **Your Profile** steps first\n2. On the **Find Jobs** step, click **Start AI Job Search**\n3. Our AI will search across LinkedIn, Indeed, Glassdoor, RemoteOK, and more\n4. Jobs are ranked by match score (excellent/good/fair)\n5. Use filters to narrow down results\n\nYou can click any job card to select it, then click **Generate Applications** to create personalized letters.",
      followUp: "Do you want to know how match scores are calculated?"
    },
    'cover|letter|motivational|application': {
      answer: "**Generating Applications**\n\nAfter selecting jobs, click **Generate Applications**. Our AI creates for each job:\n\n- **Cover Letter** (300-400 words) - Professionally tailored to the specific role and company\n- **Motivational Letter** (250-350 words) - Focuses on your passion and cultural fit\n- **Email Draft** (100-150 words) - Ready-to-send application email\n\nYou can:\n- Copy any document with one click\n- Download as text file\n- Open in email client directly\n- Switch between letters using tabs\n\nAll letters are personalized based on your CV, skills, and the job requirements.",
      followUp: "Would you like tips for writing effective cover letters?"
    },
    'email|send|apply': {
      answer: "**Applying to Jobs**\n\nYou have two ways to apply:\n\n1. **Apply Online** - Click the green button on any job with an apply link, and it opens the company's application page in a new tab\n\n2. **Send Email** - Click **Send Email** to open your email client with a pre-filled subject line and the generated email draft as the body\n\nThe email subject is automatically formatted as: *\"Application for [Job Title] - [Your Name]\"*\n\nTip: Always personalize the email further before sending!",
      followUp: "Need help with anything else?"
    },
    'chatbot|ai|assistant|help|feature': {
      answer: "**About This App - JobAI by Vincent Matlholwa**\n\nJobAI is an AI-powered job application assistant that:\n\n- Parses your CV automatically using AI\n- Searches multiple job boards simultaneously\n- Matches jobs to your profile with % scores\n- Generates personalized cover letters, motivational letters, and email drafts\n- Provides direct apply links for online applications\n- Works beautifully on mobile devices\n\nThe app uses GPT-4o-mini for intelligent job matching and letter generation. Even without an API key, it provides sample jobs and templates.",
      followUp: "What specific feature would you like to learn more about?"
    },
    'mobile|responsive|phone|tablet': {
      answer: "**Mobile Compatibility**\n\nYes! This app is fully responsive and works great on:\n- Smartphones (iOS & Android)\n- Tablets (iPad, Android tablets)\n- Desktop browsers\n\nAll components are designed to adapt to any screen size. You can upload your CV, search for jobs, and generate applications right from your phone!",
      followUp: "Anything else I can help with?"
    },
    'api|openai|key|setup|config|install': {
      answer: "**Setup & Configuration**\n\n**Quick Start:**\n1. Open `install.bat` or run `npm run install-all`\n2. Add your OpenAI API key to `backend/.env`\n3. Run `npm run dev`\n4. Open http://localhost:3009\n\n**Without API Key:**\nThe app still works with sample job listings and template letters. But for the best AI-powered experience, get your free OpenAI API key at platform.openai.com\n\n**Ports:**\n- Frontend: http://localhost:5173\n- Backend: http://localhost:3009",
      followUp: "Do you need help with anything else?"
    },
    'tip|advice|improve|better': {
      answer: "**Tips for Better Results**\n\n1. **Detailed CV** - The more information in your CV, the better the AI can match you\n2. **Specific Skills** - List both technical and soft skills\n3. **Clear Target Role** - Be specific (e.g., \"Senior React Developer\" vs \"Developer\")\n4. **Industry Selection** - Choose the right industry for relevant matches\n5. **Review Generated Letters** - Always read and personalize before sending\n6. **Apply Quickly** - Apply to fresh listings (1-3 days old) for better chances\n7. **Multiple Applications** - Select several jobs to maximize your chances",
      followUp: "Would you like advice on any specific aspect?"
    },
    'who|creator|author|made|built': {
      answer: "**Created by Vincent Matlholwa**\n\nThis AI Job Application Assistant was built by **Vincent Matlholwa** as a comprehensive tool to help job seekers automate and optimize their job search process.\n\nThe app combines modern web technologies with AI to create a seamless experience for finding and applying to jobs.",
      followUp: "Is there anything else you'd like to know?"
    },
    'thanks|thank': {
      answer: "You're welcome! I'm always here to help. Good luck with your job search! Remember, persistence pays off - keep applying and refining your approach. You've got this!",
      followUp: null
    },
  },

  fallback: "I can help you with:\n\n- **CV Upload** - How to upload and parse your resume\n- **Profile Setup** - Adding qualifications and preferences\n- **Job Search** - Finding matching positions\n- **Applications** - Generating cover letters & emails\n- **Apply** - Online applications and email sending\n- **Setup** - Installation and configuration\n\nJust ask about any of these topics!",

  followUpMap: {
    'cv tips': "Great CVs typically include:\n- Clear contact information\n- Professional summary (2-3 sentences)\n- Relevant skills (both technical & soft)\n- Work experience with achievements (not just duties)\n- Education & certifications\n\nAvoid: spelling errors, outdated info, and generic descriptions.",
    'match scores': "Match scores are calculated based on:\n- **Skills alignment** (40%) - How many of your skills match the job\n- **Experience level** (25%) - Years and seniority fit\n- **Role relevance** (20%) - How close the job is to your target\n- **Location/preference** (15%) - Work arrangement match\n\nExcellent: 90%+ | Good: 80-89% | Fair: Below 80%",
    'cover letter tips': "Strong cover letters:\n- Address the hiring manager by name if possible\n- Open with enthusiasm for the specific role\n- Highlight 2-3 relevant achievements with numbers\n- Show you researched the company\n- End with a clear call to action\n- Keep it to one page\n\nOur AI tailors each letter to the specific job!",
  }
}

function findResponse(input) {
  const lower = input.toLowerCase().trim()

  for (const [pattern, data] of Object.entries(APP_KNOWLEDGE.topics)) {
    const keywords = pattern.split('|')
    if (keywords.some(kw => lower.includes(kw))) {
      return { answer: data.answer, followUp: data.followUp }
    }
  }

  for (const [key, tip] of Object.entries(APP_KNOWLEDGE.followUpMap)) {
    if (lower.includes(key)) {
      return { answer: tip, followUp: null }
    }
  }

  if (lower.match(/\b(hi|hello|hey|howdy|greetings)\b/)) {
    return { answer: APP_KNOWLEDGE.greeting, followUp: null }
  }

  return { answer: APP_KNOWLEDGE.fallback, followUp: null }
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'bot', text: APP_KNOWLEDGE.greeting, time: new Date() }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus()
    }
  }, [isOpen, isMinimized])

  const handleSend = async () => {
    if (!input.trim()) return

    const userMsg = { role: 'user', text: input.trim(), time: new Date() }
    setMessages(prev => [...prev, userMsg])
    const currentInput = input.trim()
    setInput('')
    setIsTyping(true)

    await new Promise(r => setTimeout(r, 600 + Math.random() * 800))

    const { answer, followUp } = findResponse(currentInput)

    const botMsg = { role: 'bot', text: answer, time: new Date(), followUp }
    setMessages(prev => [...prev, botMsg])
    setIsTyping(false)
  }

  const handleFollowUp = async (text) => {
    const userMsg = { role: 'user', text: text, time: new Date() }
    setMessages(prev => [...prev, userMsg])
    setIsTyping(true)

    await new Promise(r => setTimeout(r, 500 + Math.random() * 600))

    const { answer, followUp } = findResponse(text)
    const botMsg = { role: 'bot', text: answer, time: new Date(), followUp }
    setMessages(prev => [...prev, botMsg])
    setIsTyping(false)
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const renderMarkdown = (text) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={i} className="font-bold text-white mt-2">{line.replace(/\*\*/g, '')}</p>
      }

      let processed = line
        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
        .replace(/`(.*?)`/g, '<code class="bg-white/10 px-1.5 py-0.5 rounded text-primary-300 text-xs">$1</code>')

      if (line.startsWith('- ')) {
        return <p key={i} className="ml-3 text-white/60" dangerouslySetInnerHTML={{ __html: '  \u2022 ' + processed.slice(2) }} />
      }
      if (line.match(/^\d+\./)) {
        return <p key={i} className="ml-3 text-white/60" dangerouslySetInnerHTML={{ __html: processed }} />
      }
      if (line === '') return <br key={i} />

      return <p key={i} className="text-white/60" dangerouslySetInnerHTML={{ __html: processed }} />
    })
  }

  return (
    <>
      {/* Chat Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 group"
          aria-label="Open chat assistant"
        >
          {/* Outer glow ring */}
          <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: 'linear-gradient(135deg, #6c5ce7, #00cec9)' }} />
          {/* Main button */}
          <div
            className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #6c5ce7 0%, #00cec9 100%)',
              boxShadow: '0 4px 20px rgba(108, 92, 231, 0.5), 0 0 40px rgba(0, 206, 201, 0.2), inset 0 1px 0 rgba(255,255,255,0.2)',
            }}
          >
            <FiMessageCircle className="w-6 h-6 sm:w-7 sm:h-7 text-white drop-shadow-lg" />
          </div>
          {/* Notification badge */}
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold shadow-lg border-2 border-dark-900 animate-bounce">
            1
          </span>
          {/* Tooltip label */}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 rounded-lg text-xs text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap" style={{ background: 'rgba(15,15,40,0.95)', border: '1px solid rgba(108,92,231,0.3)' }}>
            Need help?
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed z-50 flex flex-col transition-all duration-500 ease-out ${
            isMinimized
              ? 'bottom-5 right-5 sm:bottom-6 sm:right-6 w-[calc(100vw-40px)] sm:w-[380px] h-[56px]'
              : 'bottom-0 right-0 sm:bottom-6 sm:right-6 w-full sm:w-[400px] h-[100dvh] sm:h-[580px] sm:max-h-[calc(100vh-100px)] sm:rounded-2xl'
          }`}
          style={{
            borderRadius: isMinimized ? '16px' : undefined,
            background: 'linear-gradient(180deg, rgba(12, 12, 35, 0.99) 0%, rgba(8, 8, 25, 1) 100%)',
            border: '1px solid rgba(108, 92, 231, 0.2)',
            boxShadow: isMinimized ? '0 8px 32px rgba(0,0,0,0.4)' : '0 25px 80px rgba(0, 0, 0, 0.7), 0 0 40px rgba(108, 92, 231, 0.08)',
            backdropFilter: 'blur(30px)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgba(108, 92, 231, 0.15), rgba(0, 206, 201, 0.1))',
              borderRadius: isMinimized ? '16px' : '24px 24px 0 0',
              borderBottom: '1px solid rgba(108, 92, 231, 0.15)',
            }}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #6c5ce7, #00cec9)' }}
                >
                  <FiCpu className="w-5 h-5 text-white" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-dark-900" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm sm:text-base">JobAI Assistant</h3>
                <p className="text-green-400 text-xs">Online \u2022 Built by Vincent Matlholwa</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/50 hover:text-white"
              >
                {isMinimized ? <FiMaximize2 className="w-4 h-4" /> : <FiMinimize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/50 hover:text-white"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-4">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        msg.role === 'bot'
                          ? ''
                          : 'bg-gradient-to-br from-primary-500 to-cyan-500'
                      }`}
                      style={msg.role === 'bot' ? {
                        background: 'linear-gradient(135deg, #6c5ce7, #00cec9)',
                      } : {}}
                    >
                      {msg.role === 'bot' ? (
                        <FiCpu className="w-4 h-4 text-white" />
                      ) : (
                        <FiUser className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className={`max-w-[80%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                      <div
                        className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                          msg.role === 'user'
                            ? 'rounded-tr-md'
                            : 'rounded-tl-md'
                        }`}
                        style={{
                          background: msg.role === 'user'
                            ? 'linear-gradient(135deg, #6c5ce7, #5a4bd1)'
                            : 'rgba(255, 255, 255, 0.05)',
                          border: msg.role === 'user'
                            ? 'none'
                            : '1px solid rgba(255, 255, 255, 0.05)',
                        }}
                      >
                        {msg.role === 'bot' ? (
                          <div className="space-y-1">{renderMarkdown(msg.text)}</div>
                        ) : (
                          <p className="text-white">{msg.text}</p>
                        )}
                      </div>
                      <p className="text-white/20 text-[10px] mt-1 px-1">{formatTime(msg.time)}</p>

                      {msg.followUp && (
                        <button
                          onClick={() => handleFollowUp(msg.followUp)}
                          className="mt-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-primary-300 hover:bg-white/10 transition-colors"
                        >
                          {msg.followUp}
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-3">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'linear-gradient(135deg, #6c5ce7, #00cec9)' }}
                    >
                      <FiCpu className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white/5 border border-white/5 rounded-2xl rounded-tl-md px-4 py-3">
                      <div className="flex gap-1.5">
                        <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                        <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                        <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Actions */}
              <div className="px-4 sm:px-5 pb-2 flex gap-2 overflow-x-auto">
                {['How to upload CV?', 'Find jobs', 'Generate cover letter', 'Tips'].map(q => (
                  <button
                    key={q}
                    onClick={() => {
                      setInput(q)
                      setTimeout(() => {
                        setInput(q)
                        handleSend()
                      }, 100)
                    }}
                    className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs text-white/50 hover:bg-white/10 hover:text-white/70 transition-colors whitespace-nowrap shrink-0"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Input */}
              <div className="px-4 sm:px-5 pb-4 pt-2 shrink-0">
                <form
                  onSubmit={e => { e.preventDefault(); handleSend() }}
                  className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-2 focus-within:border-primary-500/30 transition-colors"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Ask me anything about this app..."
                    className="flex-1 bg-transparent text-white text-sm placeholder-white/30 focus:outline-none py-1"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className="p-2 rounded-xl transition-all disabled:opacity-30 hover:scale-105 active:scale-95"
                    style={{
                      background: input.trim() ? 'linear-gradient(135deg, #6c5ce7, #00cec9)' : 'transparent',
                    }}
                  >
                    <FiSend className="w-4 h-4 text-white" />
                  </button>
                </form>
                <p className="text-center text-white/15 text-[10px] mt-2">
                  Powered by AI \u2022 Vincent Matlholwa
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
