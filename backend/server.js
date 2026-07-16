import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3009

app.use(cors())
app.use(express.json({ limit: '50mb' }))

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
})

// ============================================
// CV PARSING ENDPOINT
// ============================================
app.post('/api/parse-cv', upload.single('cv'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    let text = ''

    if (req.file.mimetype === 'application/pdf') {
      const pdfParse = (await import('pdf-parse')).default
      const data = await pdfParse(req.file.buffer)
      text = data.text
    } else {
      text = req.file.buffer.toString('utf-8')
    }

    const parsed = parseCVText(text)
    res.json(parsed)
  } catch (err) {
    console.error('CV parse error:', err)
    res.status(500).json({ error: 'Failed to parse CV' })
  }
})

function parseCVText(text) {
  // Step 1: Clean up messy PDF text
  const rawLines = text.split('\n')
  const lines = rawLines.map(l => l.trim()).filter(l => l.length > 0)

  // Step 2: Detect CV section boundaries
  const sectionHeaders = /^(curriculum vitae|resume|cv|personal details|contact details|contact information|personal information|education|qualifications|academic|experience|work history|employment|work experience|professional experience|skills|technical skills|key skills|competencies|languages|certifications|certificates|references?|projects|objectives?|summary|profile|declaration|hobbies|interests|achievements|awards)\s*:?\s*$/i

  const sections = {}
  let currentSection = 'header'
  sections.header = []

  for (const line of lines) {
    const cleanLine = line.replace(/[|•\-\*#:]/g, '').trim()
    if (sectionHeaders.test(cleanLine)) {
      currentSection = cleanLine.toLowerCase().replace(/:$/, '').trim()
      if (!sections[currentSection]) sections[currentSection] = []
    } else {
      if (!sections[currentSection]) sections[currentSection] = []
      sections[currentSection].push(line)
    }
  }

  // Merge all text for global searches
  const fullText = lines.join('\n')

  // === EMAIL ===
  const emailMatch = fullText.match(/[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}/)
  const email = emailMatch ? emailMatch[0] : ''

  // === PHONE ===
  let phone = ''

  // Helper: reject if the number looks like years (e.g. 2020-2023, 2018 - 2020)
  function isLikelyYear(candidate) {
    const digits = candidate.replace(/[^\d]/g, '')
    // Pure 4-digit year
    if (/^\d{4}$/.test(digits)) return true
    // Year range: 2018-2023, 2018 - 2020, 2018/2020
    if (/^19\d{2}[\s.\-\/]\d{2,4}$/.test(digits)) return true
    if (/^20\d{2}[\s.\-\/]\d{2,4}$/.test(digits)) return true
    // 4-digit followed by dash and 4-digit: 2018-2020
    if (/^(19|20)\d{2}[\s\-]+(19|20)\d{2}$/.test(digits)) return true
    // Starts with 19xx or 20xx and total digits <= 8 (likely year range)
    if (/^(19|20)\d{2}/.test(digits) && digits.length <= 8) return true
    // Four-digit segments: 2018 2020 (years with space)
    if (/^(19|20)\d{2}\s+(19|20)\d{2}$/.test(candidate.trim())) return true
    // Just looks like a year: 4 digits starting with 19 or 20
    if (/^19\d{2}$/.test(digits) || /^20\d{2}$/.test(digits)) return true
    // Multiple years in a sequence: 2017 2023 2024 or 2017\n2023\n2024
    if (/^(?:19|20)\d{2}[\s.\-\/]+(?:19|20)\d{2}(?:[\s.\-\/]+(?:19|20)\d{2})+$/.test(candidate.trim())) return true
    // All 4-digit year groups separated by whitespace: check if >50% of parts are years
    const parts = candidate.split(/[\s.\-\/]+/)
    if (parts.length >= 2) {
      const yearParts = parts.filter(p => /^(19|20)\d{2}$/.test(p))
      if (yearParts.length >= 2 && yearParts.length / parts.length >= 0.5) return true
    }
    return false
  }

  // Strategy 1: Look for labeled phone (Phone:, Tel:, Mobile:, Cell:, Contact:)
  const phoneLabelPatterns = [
    /(?:tel(?:ephone|\.)?|phone|mobile|cell|fax|contact|whatsapp)\s*(?:number|no\.?|num\.?)?\s*[:\-=\s]\s*([+\d().\s\-]{7,25})/i,
  ]

  for (const pattern of phoneLabelPatterns) {
    const match = fullText.match(pattern)
    if (match) {
      const raw = match[1].trim()
      const digits = raw.replace(/[^\d]/g, '')
      if (digits.length >= 7 && digits.length <= 15 && !isLikelyYear(raw)) {
        phone = raw.replace(/\s{2,}/g, ' ').trim()
        break
      }
    }
  }

  // Strategy 2: International format with + prefix
  if (!phone) {
    const intlPatterns = [
      /\+(\d{1,4}[\s.\-]?\(?\d{1,5}\)?[\s.\-]?\d{1,5}[\s.\-]?\d{1,5}[\s.\-]?\d{0,5})/,
      /\+(\d{6,15})/,
    ]
    for (const pattern of intlPatterns) {
      const match = fullText.match(pattern)
      if (match) {
        const digits = match[1].replace(/[^\d]/g, '')
        if (digits.length >= 7 && digits.length <= 15) {
          phone = match[0].trim()
          break
        }
      }
    }
  }

  // Strategy 3: Parentheses format like (012) 345 6789 or (27) 12 345 6789
  if (!phone) {
    const parenMatch = fullText.match(/(\(\d{2,5}\)[\s.\-]?\d{3,5}[\s.\-]?\d{3,5})/)
    if (parenMatch) {
      const digits = parenMatch[1].replace(/[^\d]/g, '')
      if (digits.length >= 7 && digits.length <= 15 && !isLikelyYear(parenMatch[1])) {
        phone = parenMatch[1].trim()
      }
    }
  }

  // Strategy 4: Standalone number with common separators
  if (!phone) {
    const numPatterns = [
      /(\d{3,5}[\s.\-]\d{3,5}[\s.\-]\d{3,5})/,
      /(0\d{2}[\s.\-]?\d{3}[\s.\-]?\d{4})/,
      /(\(\d{3}\)\s?\d{3}[\s\-]?\d{4})/,
    ]
    for (const pattern of numPatterns) {
      const match = fullText.match(pattern)
      if (match) {
        const candidate = match[1]
        const digits = candidate.replace(/[^\d]/g, '')
        if (digits.length >= 7 && digits.length <= 15 && !isLikelyYear(candidate)) {
          // Extra check: phone numbers shouldn't be just two 4-digit groups (years)
          const parts = candidate.split(/[\s.\-\/]+/)
          const allFourDigitYears = parts.length === 2 && parts.every(p => /^(19|20)\d{2}$/.test(p))
          if (!allFourDigitYears) {
            phone = candidate.trim()
            break
          }
        }
      }
    }
  }

  // Strategy 5: Consecutive digits (e.g. 0677834591, 0821234567) — SA mobile numbers
  if (!phone) {
    // Match 10-digit sequences starting with 0 (SA format: 0XX XXX XXXX without spaces)
    const consecutivePatterns = [
      /(0\d{9})\b/,
      /(0\d{2}\d{3}\d{4})\b/,
    ]
    for (const pattern of consecutivePatterns) {
      const match = fullText.match(pattern)
      if (match) {
        const candidate = match[1]
        if (!isLikelyYear(candidate) && candidate.length === 10) {
          phone = candidate
          break
        }
      }
    }
  }

  // Strategy 6: Any sequence of digits with common separators that looks like a phone
  if (!phone) {
    const allNums = fullText.match(/[\d][\d\s.\-()]{6,20}\d/g) || []
    for (const candidate of allNums) {
      if (isLikelyYear(candidate)) continue
      const digits = candidate.replace(/[^\d]/g, '')
      if (digits.length >= 7 && digits.length <= 15 && /[\s.\-()]/.test(candidate)) {
        // Reject if first 4 digits are a year
        const first4 = digits.substring(0, 4)
        if (parseInt(first4) >= 1900 && parseInt(first4) <= 2099) continue
        // Reject if it matches a year range pattern
        if (/^\d{4}\s*[-\/]\s*\d{4}$/.test(candidate.trim())) continue
        phone = candidate.trim()
        break
      }
    }
  }

  // === FULL NAME ===
  // Strategy: name is in the header section, before any section keyword, must be 2+ capitalized words
  const nameSkipWords = /^(curriculum vitae|resume|cv|personal|contact|education|experience|skills?|work|employment|references?|certificat|language|objective|summary|profile|declaration|hobbies|interests|date|gender|nationality|id|address|telephone|email|mobile|phone|fax|cell|marital|citizen|driver|passport)/i
  const nameExcludePatterns = /^\d+|^\d{4}|^[\d\s\-\+\/]+$|^\(|^\[|^@|^[a-z]/

  let fullName = ''
  const headerLines = sections.header || []
  for (const line of headerLines.slice(0, 10)) {
    const cleaned = line.replace(/[|•\-\*#:=]+/g, '').trim()
    if (cleaned.length < 3 || cleaned.length > 50) continue
    if (nameSkipWords.test(cleaned)) continue
    if (nameExcludePatterns.test(cleaned)) continue

    const words = cleaned.split(/\s+/).filter(w => w.length > 0)
    // A real name: 2-5 words, each starting with uppercase
    if (words.length >= 2 && words.length <= 5) {
      const allCapitalized = words.every(w => /^[A-Z]/.test(w))
      // Exclude things like "North West" (locations)
      const notLocationWord = !words.some(w => /^(north|south|east|west|province|district|region|country|city|town)$/i.test(w))
      if (allCapitalized && notLocationWord) {
        fullName = cleaned
        break
      }
    }
  }

  // Fallback: "Name: xxx" pattern
  if (!fullName) {
    const nameMatch = fullText.match(/(?:name|candidate|applicant)\s*[:]\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,4})/i)
    if (nameMatch) fullName = nameMatch[1]
  }

  // === LOCATION ===
  let location = ''
  // Look for explicit location labels
  const locLabelMatch = fullText.match(/(?:address|location|city|based in|situated in|residing? in)\s*[:]\s*([^\n]{3,60})/i)
  if (locLabelMatch) {
    const raw = locLabelMatch[1].trim()
    // If it contains a comma with city/province, take it
    if (/,/.test(raw)) {
      location = raw.split(',')[0].trim() + ', ' + raw.split(',').slice(1).join(',').trim()
    } else {
      location = raw
    }
  }

  // Fallback: look for "City, Province" pattern on its own line
  if (!location) {
    const provinces = 'North West|Gauteng|Western Cape|Eastern Cape|KwaZulu-Natal|Free State|Limpopo|Mpumalanga|Northern Cape'
    const locRegex = new RegExp('([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*),\\s*(' + provinces + ')', 'i')
    for (const line of lines) {
      const match = line.match(locRegex)
      if (match) {
        const candidate = match[0].trim()
        // Don't use if it's the full name
        if (fullName && (candidate.includes(fullName) || fullName.includes(candidate))) continue
        location = candidate
        break
      }
    }
  }

  // === EXPERIENCE ===
  let experience = ''
  let workExperience = []

  // Try to parse from the experience section
  const expSectionNames = ['experience', 'work experience', 'work history', 'employment', 'professional experience', 'career history']
  let expLines = []
  for (const secName of Object.keys(sections)) {
    if (expSectionNames.some(s => secName.includes(s))) {
      expLines = sections[secName]
      break
    }
  }

  // Date patterns: handles DD/MM/YYYY, Month YYYY, YYYY, "Present"
  const datePattern = /(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{4}|\d{4})\s*[-–\u2013to]+\s*(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{4}|\d{4}|[Pp]resent|[Cc]urrent|[Nn]ow)/i
  const singleDatePattern = /(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4}|\d{4}/i

  if (expLines.length > 0) {
    const entries = []
    let currentEntry = null
    let pendingCompany = null

    for (const line of expLines) {
      const cleaned = line.replace(/[|•\*#:]/g, '').replace(/^\s*[-–—]+\s*/, '').replace(/\s*[-–—]+\s*$/, '').trim()
      if (!cleaned) continue

      const hasDateRange = datePattern.test(cleaned)

      // Detect company names (parenthesized, or contains school/college/ltd etc)
      const isParenthesized = /^\(.*\)$/.test(cleaned)
      const companyIndicators = /\b(?:ltd|limited|inc|corp|llc|co\.|company|group|enterprises|solutions|services|technologies|systems|global|international|pty|school|college|university|academy|hospital|bank)\b/i
      const isCompanyLine = isParenthesized || (companyIndicators.test(cleaned) && cleaned.length < 80)

      if (hasDateRange) {
        if (currentEntry) entries.push(currentEntry)
        currentEntry = {
          title: '',
          company: pendingCompany || '',
          dates: cleaned.match(datePattern)?.[0] || '',
          description: [],
        }
        pendingCompany = null

        const dateMatch = cleaned.match(datePattern)
        if (dateMatch) {
          const beforeDate = cleaned.substring(0, dateMatch.index).trim().replace(/[-–\u2013]+$/, '').trim()
          const afterDate = cleaned.substring(dateMatch.index + dateMatch[0].length).trim().replace(/^[-–\u2013]+/, '').trim()
          if (beforeDate.length > 3) {
            const dashSplit = beforeDate.split(/-{2,}|(?<=[\w)"])\s*[-–—]\s*(?=[A-Z])/)
            currentEntry.title = dashSplit[0].trim()
            if (dashSplit.length > 1) currentEntry.description.push(dashSplit.slice(1).join('-').trim())
          }
          if (afterDate && afterDate.length > 2 && !currentEntry.company) {
            currentEntry.company = afterDate.replace(/^[-–,]+/, '').trim()
          }
        }
      } else if (isCompanyLine && currentEntry && currentEntry.company) {
        // New company line while we already have an entry — start new entry
        entries.push(currentEntry)
        pendingCompany = cleaned.replace(/[()]/g, '').trim()
        currentEntry = null
      } else if (currentEntry) {
        if (!currentEntry.title && cleaned.length < 80) {
          if (isParenthesized) {
            currentEntry.company = cleaned.replace(/[()]/g, '').trim()
          } else if (isCompanyLine) {
            currentEntry.company = cleaned
          } else {
            // Title + possibly description on same line (e.g., "I.T Technician Internship-Diagnosed and...")
            const dashSplit = cleaned.split(/-{2,}|(?<=[\w)"])\s*[-–—]\s*(?=[A-Z])/)
            currentEntry.title = dashSplit[0].trim()
            if (dashSplit.length > 1) currentEntry.description.push(dashSplit.slice(1).join('. ').trim())
          }
        } else if (!currentEntry.company && isCompanyLine) {
          currentEntry.company = cleaned.replace(/[()]/g, '').trim()
        } else {
          currentEntry.description.push(cleaned)
        }
      } else {
        // No current entry — might be a company before a date, or a title/description after a pending company
        if (isCompanyLine) {
          pendingCompany = cleaned.replace(/[()]/g, '').trim()
        } else if (pendingCompany) {
          // Had a company name but no date — create entry for it now
          currentEntry = { title: '', company: pendingCompany, dates: '', description: [] }
          pendingCompany = null
          const dashSplit = cleaned.split(/-{2,}|(?<=[\w)"])\s*[-–—]\s*(?=[A-Z])/)
          currentEntry.title = dashSplit[0].trim()
          if (dashSplit.length > 1) currentEntry.description.push(dashSplit.slice(1).join('. ').trim())
        }
      }
    }
    if (currentEntry) entries.push(currentEntry)

    workExperience = entries.filter(e => e.title || e.company).map(e => ({
      title: e.title || 'Role',
      company: e.company || '',
      dates: e.dates || '',
      description: e.description.join('; '),
    }))

    if (workExperience.length > 0) {
      experience = workExperience.map(w => {
        const parts = [w.title]
        if (w.company) parts.push(`at ${w.company}`)
        if (w.dates) parts.push(`(${w.dates})`)
        return parts.join(' ')
      }).join(' | ')
    }
  }

  // Fallback: try text pattern if no section-based experience found
  if (!experience) {
    const expMatch = fullText.match(/(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:\w+\s*)*(?:experience|work)/i)
      || fullText.match(/(?:over|more than|about|approximately)\s+(\d+)\s*(?:years?|yrs?)/i)
    if (expMatch) experience = expMatch[0].trim()
  }

  // Calculate years of experience from dates if we have entries
  if (workExperience.length > 0 && !experience.match(/\d+\s*(?:years?|yrs?)/i)) {
    const monthMap = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 }
    let earliest = null
    let latest = null

    for (const w of workExperience) {
      const dates = w.dates || ''
      // Match start: "Month YYYY", "DD/MM/YYYY", or "YYYY"
      const startMatch = dates.match(/((?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{4}|\d{4})/i)
      // Match end: after dash, could be "Month YYYY", "DD/MM/YYYY", "YYYY", or "Present"
      const endMatch = dates.match(/[-–\u2013to]+\s*((?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{4}|\d{4}|[Pp]resent|[Cc]urrent|[Nn]ow)/i)

      if (startMatch) {
        const startStr = startMatch[1]
        let year, month
        const yearM = startStr.match(/(\d{4})/)
        const monthM = startStr.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i)
        // Check for DD/MM/YYYY format
        const ddmmyyyy = startStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
        if (ddmmyyyy) {
          year = parseInt(ddmmyyyy[3])
          month = parseInt(ddmmyyyy[2]) - 1
        } else if (yearM) {
          year = parseInt(yearM[1])
          month = monthM ? monthMap[monthM[1].toLowerCase().substring(0, 3)] : 0
        }
        if (year) {
          const startDate = new Date(year, month)
          if (!earliest || startDate < earliest) earliest = startDate
        }
      }

      if (endMatch) {
        const endStr = endMatch[1]
        let endDate
        if (/[Pp]resent|[Cc]urrent|[Nn]ow/.test(endStr)) {
          endDate = new Date()
        } else {
          const yearM = endStr.match(/(\d{4})/)
          const monthM = endStr.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i)
          const ddmmyyyy = endStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
          if (ddmmyyyy) {
            endDate = new Date(parseInt(ddmmyyyy[3]), parseInt(ddmmyyyy[2]) - 1)
          } else if (yearM) {
            const month = monthM ? monthMap[monthM[1].toLowerCase().substring(0, 3)] : 11
            endDate = new Date(parseInt(yearM[1]), month)
          }
        }
        if (endDate && (!latest || endDate > latest)) latest = endDate
      }
    }

    if (earliest && latest) {
      const totalMonths = (latest.getFullYear() - earliest.getFullYear()) * 12 + (latest.getMonth() - earliest.getMonth())
      const years = Math.floor(totalMonths / 12)
      const months = totalMonths % 12
      if (years > 0) {
        experience = `${years}+ years of experience`
        if (months > 0) experience += ` (${years} years, ${months} months)`
      } else if (months > 0) {
        experience = `${months} months of experience`
      }
    }
  }

  // === CURRENT ROLE ===
  let currentRole = ''
  const roleKeywords = [
    'engineer', 'developer', 'manager', 'analyst', 'designer', 'architect',
    'director', 'lead', 'senior', 'junior', 'intern', 'consultant',
    'specialist', 'coordinator', 'officer', 'technician', 'administrator',
    'supervisor', 'planner', 'executive', 'trainer', 'writer', 'scientist',
    'researcher', 'professor', 'teacher', 'nurse',
    'accountant', 'auditor', 'clerk', 'assistant',
    'superintendent', 'foreman', 'controller',
  ]

  // First try: look in experience entries for the most recent role
  if (workExperience.length > 0 && workExperience[0].title && workExperience[0].title !== 'Role') {
    currentRole = workExperience[0].title
  }

  // Second try: look in header section
  if (!currentRole) {
    for (const line of headerLines) {
      const lower = line.toLowerCase()
      if (roleKeywords.some(kw => lower.includes(kw))) {
        const cleaned = line.replace(/[|•\-\*#:]/g, '').trim()
        if (cleaned.split(/\s+/).length <= 8 && cleaned.length >= 5) {
          currentRole = cleaned
          break
        }
      }
    }
  }

  // Third try: look in the full text for patterns like "Job Title | Company"
  if (!currentRole) {
    const rolePatterns = [
      /(?:I am a|Current(?:ly)?(?:\s+a)?|Working as (?:a|an)|Position:?\s*)([A-Z][a-z]+(?:\s+[A-Za-z]+){1,5}(?:\s+(?:Engineer|Developer|Manager|Analyst|Designer|Architect|Lead|Director|Specialist|Consultant|Coordinator|Officer|Technician|Administrator|Supervisor|Planner|Executive|Trainer|Writer|Scientist|Researcher|Professor|Teacher|Nurse|Accountant|Assistant|Auditor|Clerk|Foreman|Superintendent|Controller)))/i,
    ]
    for (const pattern of rolePatterns) {
      const match = fullText.match(pattern)
      if (match) {
        const candidate = match[1].trim()
        if (candidate.split(/\s+/).length <= 7) {
          currentRole = candidate
          break
        }
      }
    }
  }

  // === SKILLS ===
  const foundSkills = []
  // First try to extract from the skills section specifically
  const skillSections = ['skills', 'technical skills', 'key skills', 'competencies', 'proficiencies', 'technologies']
  let skillText = ''
  for (const secName of Object.keys(sections)) {
    if (skillSections.some(s => secName.includes(s))) {
      skillText = sections[secName].join('\n')
      break
    }
  }

  if (skillText) {
    // Clean up PDF line breaks: merge lines that are clearly continuations
    const cleanedSkillText = skillText
      .replace(/\n\s*\n/g, '\n')  // double newlines to single

    // Fix broken parentheticals that span multiple lines, e.g. "(WI\nFI\nLAN)" -> "(WI FI LAN)"
    let fixed = cleanedSkillText
    let prevFixed
    do {
      prevFixed = fixed
      fixed = fixed.replace(/\(([^)]*)\n([^)]*)\)/g, '($1 $2)')
    } while (fixed !== prevFixed)

    // Protect parenthetical content from being split on commas
    const protectedText = fixed.replace(/\([^)]+\)/g, m => m.replace(/[,]/g, '\x00'))

    // Extract skills - split on commas, semicolons, pipes, newlines
    const rawSkills = protectedText
      .split(/[,;|\n\u2022]+/)
      .map(s => s.replace(/\x00/g, ','))  // restore commas in parentheticals
      .map(s => s.replace(/\([^)]*\)/g, '').trim())  // remove parenthetical descriptions
      .map(s => s.replace(/^\d+[\.\)]\s*/, '').trim())  // remove numbering
      .filter(s => s.length >= 2 && s.length <= 50 && /[a-zA-Z]/.test(s))
      .filter(s => !/^\d{4}$/.test(s) && !/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s))  // remove standalone years and dates

    foundSkills.push(...rawSkills)
  }

  // Also scan for known technical keywords across the whole text
  const techKeywords = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C\\+\\+', 'C#', 'PHP', 'Ruby', 'Go', 'Rust',
    'React', 'Angular', 'Vue', 'Svelte', 'Next\\.?js', 'Nuxt',
    'Node\\.?js', 'Express', 'Django', 'Flask', 'FastAPI', 'Spring',
    'Laravel', 'Rails', 'ASP\\.NET',
    'HTML', 'CSS', 'Sass', 'Tailwind', 'Bootstrap',
    'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'SQLite', 'Firebase',
    'AWS', 'Azure', 'GCP', 'Heroku', 'Vercel',
    'Docker', 'Kubernetes', 'Jenkins', 'GitHub Actions',
    'Git', 'CI/CD', 'REST', 'GraphQL',
    'Linux', 'Windows', 'macOS', 'CISCO',
    'TensorFlow', 'PyTorch', 'Machine Learning',
    'Data Science', 'Tableau', 'Power BI',
    'Agile', 'Scrum', 'Jira', 'Confluence',
    'Figma', 'Photoshop', 'Illustrator', 'Adobe',
    'WordPress', 'Shopify', 'SEO',
    'SAP', 'Salesforce', 'Microsoft Office', 'Excel', 'PowerPoint', 'Word',
    'TCP/IP', 'DNS', 'DHCP', 'VPN', 'Firewall', 'Active Directory',
    'Hardware', 'Networking', 'Troubleshooting', 'IT Support',
    'Project Management', 'Problem Solving', 'Communication',
  ]

  for (const kw of techKeywords) {
    try {
      const regex = new RegExp('\\b' + kw + '\\b', 'i')
      if (regex.test(fullText)) {
        const display = kw.replace(/\\\./g, '.').replace(/\?/g, '')
        // Don't add if already found from skills section
        if (!foundSkills.some(s => s.toLowerCase() === display.toLowerCase())) {
          foundSkills.push(display)
        }
      }
    } catch { /* skip */ }
  }

  // Deduplicate
  const uniqueSkills = [...new Set(foundSkills)]

  // === EDUCATION ===
  const education = []
  // Try to get from education section
  const eduSections = ['education', 'qualifications', 'academic', 'academic record']
  let eduLines = []
  for (const secName of Object.keys(sections)) {
    if (eduSections.some(s => secName.includes(s))) {
      eduLines = sections[secName]
      break
    }
  }

  if (eduLines.length > 0) {
    // Clean up broken lines from PDF
    const eduText = eduLines
      .join('\n')
      .replace(/\n\s*\n/g, '\n')

    // Look for degree patterns
    const degreePatterns = [
      /(?:Doctor\s+(?:of\s+Philosophy|of\s+Science))\s*(?:in\s+[\w\s]+)?/gi,
      /(?:Ph\.?\s*D\.?)\s*(?:in\s+[\w\s]+)?/gi,
      /(?:Master(?:'s)?\s+(?:of\s+)?(?:Science|Arts|Business|Engineering|Technology|Education))\s*(?:in\s+[\w\s]+)?/gi,
      /(?:M\.?\s*B\.?\s*A\.?)\s*(?:in\s+[\w\s]+)?/gi,
      /(?:Bachelor(?:'s)?\s+(?:of\s+)?(?:Science|Arts|Business|Engineering|Technology|Education|Commerce|Law|Medicine))\s*(?:in\s+[\w\s]+)?/gi,
      /(?:B\.?\s*Tech|B\.?\s*Eng|B\.?\s*Sc|B\.?\s*Com|B\.?\s*A|B\.?\s*Ed)\s*(?:in\s+[\w\s]+)?/gi,
      /(?:Diploma|National Diploma|Advanced Diploma)\s*(?:in\s+[\w\s]+)?/gi,
      /(?:Higher Certificate|Certificate)\s*(?:in\s+[\w\s]+)?/gi,
    ]

    for (const pattern of degreePatterns) {
      const matches = [...eduText.matchAll(pattern)]
      for (const match of matches) {
        let edu = match[0].trim()
        if (edu.length > 3) {
          education.push(edu)
        }
      }
    }

    // Also look for lines with university/college/institute
    for (const line of eduLines) {
      if (/university|college|institute|school|academy|faculty|technikon|polytechnic/i.test(line)) {
        const cleaned = line.replace(/[|•\-\*#:]/g, '').trim()
        if (cleaned.length > 5 && cleaned.length < 120 && !education.some(e => e.toLowerCase() === cleaned.toLowerCase())) {
          education.push(cleaned)
        }
      }
    }
  }

  // === LANGUAGES ===
  const languages = []
  const knownLanguages = ['English', 'Afrikaans', 'Zulu', 'Xhosa', 'Sotho', 'Sesotho', 'Tswana', 'Setswana', 'Venda', 'Tsonga', 'Swazi', 'siSwati', 'Pedi', 'Sepedi', 'German', 'French', 'Spanish', 'Portuguese', 'Chinese', 'Mandarin', 'Japanese', 'Korean', 'Arabic', 'Hindi', 'Russian', 'Italian', 'Dutch', 'Swedish', 'Norwegian', 'Danish', 'Finnish', 'Polish', 'Turkish', 'Greek', 'Hebrew', 'Thai', 'Vietnamese', 'Indonesian', 'Malay', 'Filipino', 'Swahili']

  // Check language section
  const langSections = ['languages', 'language']
  let langText = ''
  for (const secName of Object.keys(sections)) {
    if (langSections.some(s => secName.includes(s))) {
      langText = sections[secName].join('\n')
      break
    }
  }

  const searchText = langText || fullText
  for (const lang of knownLanguages) {
    if (new RegExp('\\b' + lang.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i').test(searchText)) {
      languages.push(lang)
    }
  }

  // === CERTIFICATIONS ===
  const certifications = []
  const certText = fullText
  const certMatches = certText.match(/(?:AWS Certified|Google Certified|Microsoft Certified|Cisco Certified|CompTIA|PMP|CISM|CISSP|CEH|ITIL|Six Sigma|Scrum Master|Certified[\s\w]+(?:Professional|Associate|Expert|Engineer|Administrator|Analyst|Practitioner))/gi)
  if (certMatches) {
    certifications.push(...certMatches.map(m => m.trim()))
  }

  // === INFER ROLE & INDUSTRY FROM CV DATA ===
  let inferredRole = currentRole || ''
  let inferredIndustry = ''

  // Infer role from job titles + skills + education
  if (!inferredRole && workExperience.length > 0) {
    inferredRole = workExperience[0].title !== 'Role' ? workExperience[0].title : ''
  }

  const allText = [currentRole, ...workExperience.map(w => w.title + ' ' + w.description), ...uniqueSkills, ...education].join(' ').toLowerCase()

  const roleMap = [
    { keywords: ['network', 'networking', 'lan', 'wan', 'firewall', 'cisco', 'switch', 'router'], role: 'Network Technician' },
    { keywords: ['hardware', 'repair', 'upgrade', 'desktop', 'laptop'], role: 'IT Support Technician' },
    { keywords: ['active directory', 'windows server', 'sysadmin', 'system admin'], role: 'Systems Administrator' },
    { keywords: ['software', 'javascript', 'python', 'react', 'node', 'java', 'coding', 'programming', 'developer', 'engineer'], role: 'Software Developer' },
    { keywords: ['data', 'sql', 'database', 'analytics', 'analyst'], role: 'Data Analyst' },
    { keywords: ['cyber', 'security', 'endpoint', 'firewall', 'penetration'], role: 'IT Security Specialist' },
    { keywords: ['ict', 'technician', 'it technician', 'it support', 'help desk', 'sa-sams'], role: 'IT Technician' },
    { keywords: ['web', 'html', 'css', 'frontend', 'ui', 'ux'], role: 'Web Developer' },
    { keywords: ['cloud', 'aws', 'azure', 'gcp', 'devops'], role: 'Cloud Engineer' },
    { keywords: ['teacher', 'trainer', 'instructor', 'educator', 'cadre'], role: 'IT Trainer / Educator' },
  ]

  if (!inferredRole) {
    for (const { keywords, role } of roleMap) {
      if (keywords.some(kw => allText.includes(kw))) {
        inferredRole = role
        break
      }
    }
  }

  if (!inferredRole) inferredRole = 'IT Professional'

  // Infer industry
  const industryMap = [
    { keywords: ['software', 'developer', 'programming', 'coding', 'javascript', 'python', 'react', 'node', 'saas'], industry: 'Technology' },
    { keywords: ['network', 'cisco', 'lan', 'wan', 'firewall', 'ict', 'active directory', 'windows', 'hardware', 'it support', 'endpoint'], industry: 'Information Technology' },
    { keywords: ['school', 'education', 'teacher', 'student', 'academy', 'college', 'university'], industry: 'Education' },
    { keywords: ['health', 'hospital', 'medical', 'nurse', 'clinical'], industry: 'Healthcare' },
    { keywords: ['finance', 'bank', 'accounting', 'audit', 'investment'], industry: 'Finance' },
    { keywords: ['sales', 'marketing', 'retail', 'ecommerce'], industry: 'Retail' },
    { keywords: ['manufacturing', 'factory', 'production'], industry: 'Manufacturing' },
    { keywords: ['construction', 'building', 'engineering'], industry: 'Engineering' },
    { keywords: ['government', 'municipal', 'public'], industry: 'Government' },
  ]

  for (const { keywords, industry } of industryMap) {
    if (keywords.some(kw => allText.includes(kw))) {
      inferredIndustry = industry
      break
    }
  }
  if (!inferredIndustry) inferredIndustry = 'Technology'

  return {
    fullName,
    email,
    phone,
    location,
    currentRole,
    inferredRole,
    inferredIndustry,
    experience,
    workExperience: workExperience.slice(0, 10),
    skills: uniqueSkills.slice(0, 25),
    education: education.slice(0, 5),
    languages: languages.slice(0, 10),
    certifications: certifications.slice(0, 10),
    rawText: fullText.substring(0, 5000),
  }
}

// ============================================
// JOB SEARCH ENDPOINT (with OpenAI)
// ============================================
app.post('/api/search-jobs', async (req, res) => {
  try {
    const profile = req.body
    let jobs = []

    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
      jobs = await searchJobsWithAI(profile)
    } else {
      jobs = generateSampleJobs(profile)
    }

    res.json({ jobs })
  } catch (err) {
    console.error('Job search error:', err)
    const jobs = generateSampleJobs(req.body)
    res.json({ jobs })
  }
})

async function searchJobsWithAI(profile) {
  const { default: OpenAI } = await import('openai')
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const prompt = `Based on this job seeker profile, generate 8-12 realistic job listings in South Africa that would be good matches.

Profile:
- Name: ${profile.fullName || 'Candidate'}
- Target Role: ${profile.targetRole || 'any role'}
- Industry: ${profile.targetIndustry || 'any industry'}
- Experience: ${profile.yearsExperience || 'N/A'}
- Skills: ${(profile.skills || []).join(', ')}
- Work Preference: ${profile.workPreference || 'any'}
- Education: ${(profile.education || []).join('; ')}

IMPORTANT: All jobs must be in South Africa. Use South African cities (Johannesburg, Cape Town, Pretoria, Durban, etc). Salaries must be in ZAR (R) per month.

For each job, provide JSON with:
- id (unique number)
- title (job title)
- company (realistic company name — can be real SA companies or realistic-sounding ones)
- location (city, Gauteng/Western Cape/etc or "Remote (SA)")
- salary (salary range in ZAR per month, e.g. "R25,000 - R45,000/month")
- type (Full-time, Part-time, Contract)
- description (2-3 sentence description)
- requiredSkills (array of 4-8 skills)
- matchScore (85-98 number, how well it matches profile)
- matchLevel ("excellent" for 90+, "good" for 80-89, "fair" for below 80)
- source (Pnet, Indeed SA, LinkedIn, CareerJunction, JobMail)
- applyUrl (one of: https://www.pnet.co.za/jobs, https://za.indeed.com/jobs, https://www.linkedin.com/jobs, https://www.careerjunction.co.za/jobs, https://www.jobmail.co.za/jobs)
- companyEmail (HR email like hr@company.co.za)
- postedAgo (e.g., "2 days ago", "1 week ago")

Return ONLY a valid JSON array, no other text.`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a job matching AI. Return valid JSON arrays only.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 4000,
  })

  const content = completion.choices[0].message.content
  const jsonMatch = content.match(/\[[\s\S]*\]/)
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0])
  }
  return generateSampleJobs(profile)
}

function generateSampleJobs(profile) {
  const { targetRole, targetIndustry, skills, workPreference } = profile

  const roleBase = targetRole || 'IT Professional'
  const roleVariations = [
    roleBase, `Senior ${roleBase}`, `${roleBase} Intern`,
    `Junior ${roleBase}`, `${roleBase} Contractor`,
  ]

  const locations = workPreference === 'remote'
    ? ['Remote (South Africa)', 'Remote', 'Work from Home — South Africa']
    : ['Johannesburg, Gauteng', 'Cape Town, Western Cape', 'Pretoria, Gauteng', 'Durban, KwaZulu-Natal',
       'Bloemfontein, Free State', 'Port Elizabeth, Eastern Cape', 'Stellenbosch, Western Cape',
       'Sandton, Gauteng', 'Centurion, Gauteng', 'East London, Eastern Cape', 'Polokwane, Limpopo',
       'Nelspruit, Mpumalanga', 'Rustenburg, North West', 'Kimberley, Northern Cape', 'Remote (SA)']

  const salaries = [
    'R15,000 - R25,000/month', 'R20,000 - R35,000/month', 'R25,000 - R45,000/month',
    'R30,000 - R55,000/month', 'R18,000 - R30,000/month', 'R35,000 - R65,000/month',
    'R12,000 - R20,000/month', 'R40,000 - R75,000/month', 'R22,000 - R40,000/month',
    'R15,000 - R28,000/month',
  ]

  const descriptions = [
    `Join a dynamic South African team. You'll work on meaningful projects with exposure to modern technologies and a supportive work environment.`,
    `An exciting opportunity at a growing SA company. Competitive salary, team events, and real career growth potential.`,
    `We're expanding and need skilled professionals. Flexible hours, great benefits, and a collaborative culture.`,
    `Work alongside experienced engineers in a fast-paced South African tech environment. Great for learning and growth.`,
    `Be part of a team making an impact in the local market. We value initiative and offer hands-on experience.`,
    `A role with real responsibility from day one. Perfect for someone eager to grow their career in South Africa.`,
    `Join us in building solutions that serve South African businesses and communities. Competitive pay and benefits.`,
    `This role offers a balance of challenge and reward. Work with cutting-edge tools in a local team.`,
  ]

  const saCompanies = [
    { name: 'Dimension Data', industry: 'IT Services' },
    { name: 'Datatec', industry: 'Technology' },
    { name: 'Bytes Technology', industry: 'IT Solutions' },
    { name: 'Gijima', industry: 'IT Services' },
    { name: 'EOH', industry: 'Technology' },
    { name: 'Altron', industry: 'Technology' },
    { name: 'Liquid Intelligent Technologies', industry: 'Telecoms' },
    { name: 'Vodacom', industry: 'Telecommunications' },
    { name: 'MTN SA', industry: 'Telecommunications' },
    { name: 'Standard Bank IT', industry: 'Banking/IT' },
    { name: 'FNB (First National Bank)', industry: 'Banking/IT' },
    { name: 'Nedbank IT', industry: 'Banking/IT' },
  ]

  const platforms = [
    { name: 'Pnet', searchUrl: (q, l) => `https://www.pnet.co.za/jobs/search?what=${encodeURIComponent(q)}&where=${encodeURIComponent(l)}` },
    { name: 'Indeed SA', searchUrl: (q, l) => `https://za.indeed.com/jobs?q=${encodeURIComponent(q)}&l=${encodeURIComponent(l)}` },
    { name: 'CareerJunction', searchUrl: (q, l) => `https://www.careerjunction.co.za/jobs?keywords=${encodeURIComponent(q)}&location=${encodeURIComponent(l)}` },
    { name: 'LinkedIn', searchUrl: (q, l) => `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(q)}&location=${encodeURIComponent(l + ', South Africa')}` },
    { name: 'JobMail', searchUrl: (q, l) => `https://www.jobmail.co.za/jobs?q=${encodeURIComponent(q)}&l=${encodeURIComponent(l)}` },
    { name: 'Gumtree Jobs', searchUrl: (q, l) => `https://www.gumtree.co.za/s-${encodeURIComponent(l)}/q-${encodeURIComponent(q)}` },
  ]

  const times = ['1 day ago', '2 days ago', '3 days ago', '5 days ago', '1 week ago', '2 weeks ago', '3 days ago', '4 days ago']

  const baseSkills = skills && skills.length > 0 ? skills : ['Networking', 'Hardware Repair', 'Windows', 'Active Directory', 'Troubleshooting']

  return Array.from({ length: 10 }, (_, i) => {
    const company = saCompanies[i % saCompanies.length]
    const matchScore = Math.floor(Math.random() * 18) + 81
    const role = roleVariations[i % roleVariations.length]
    const location = locations[i % locations.length]
    const platform = platforms[i % platforms.length]

    return {
      id: i + 1,
      title: role,
      company: company.name,
      location,
      salary: salaries[i % salaries.length],
      type: i < 8 ? 'Full-time' : 'Contract',
      description: descriptions[i % descriptions.length],
      requiredSkills: baseSkills.sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 4) + 4),
      matchScore,
      matchLevel: matchScore >= 90 ? 'excellent' : matchScore >= 80 ? 'good' : 'fair',
      source: platform.name,
      applyUrl: platform.searchUrl(role, location.replace(/,.*$/, '')),
      companyEmail: `careers@${company.name.toLowerCase().replace(/\s+/g, '')}.co.za`,
      postedAgo: times[i % times.length],
    }
  })
}

// ============================================
// APPLICATION GENERATION ENDPOINT
// ============================================
app.post('/api/generate-applications', async (req, res) => {
  try {
    const { profile, jobs } = req.body

    if (!jobs || jobs.length === 0) {
      return res.status(400).json({ error: 'No jobs selected' })
    }

    let applications = []

    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
      applications = await generateApplicationsWithAI(profile, jobs)
    } else {
      applications = generateSampleApplications(profile, jobs)
    }

    res.json({ applications })
  } catch (err) {
    console.error('Application generation error:', err)
    const applications = generateSampleApplications(req.body.profile, req.body.jobs)
    res.json({ applications })
  }
})

async function generateApplicationsWithAI(profile, jobs) {
  const { default: OpenAI } = await import('openai')
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const applications = []

  for (const job of jobs) {
    const prompt = `Generate a professional job application package.

CANDIDATE:
- Name: ${profile.fullName || 'Candidate'}
- Email: ${profile.email || ''}
- Phone: ${profile.phone || ''}
- Role: ${profile.targetRole || ''}
- Experience: ${profile.yearsExperience || ''} years
- Skills: ${(profile.skills || []).join(', ')}
- Education: ${(profile.education || []).join('; ')}

JOB:
- Title: ${job.title} at ${job.company}
- Location: ${job.location}
- Skills: ${(job.requiredSkills || []).join(', ')}

Generate as JSON:
1. coverLetter: Professional cover letter (300-400 words)
2. motivationalLetter: Motivational letter (250-350 words)
3. emailDraft: Email body (100-150 words)

Return ONLY valid JSON.`

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a professional job application writer. Return valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 2000,
      })

      const content = completion.choices[0].message.content
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        applications.push({
          job,
          coverLetter: parsed.coverLetter || '',
          motivationalLetter: parsed.motivationalLetter || '',
          emailDraft: parsed.emailDraft || '',
        })
        continue
      }
    } catch {
      // fallback below
    }

    applications.push(generateSingleApplication(profile, job))
  }

  return applications
}

function generateSampleApplications(profile, jobs) {
  return jobs.map(job => generateSingleApplication(profile, job))
}

function generateSingleApplication(profile, job) {
  const name = profile.fullName || 'Applicant'
  const skills = (profile.skills || ['relevant skills']).slice(0, 5).join(', ')
  const experience = profile.yearsExperience || 'several'
  const role = profile.targetRole || 'professional'
  const education = (profile.education || ['a relevant degree'])[0]
  const location = profile.location || ''

  const coverLetter = `Dear ${job.company} Hiring Team,

I am writing to express my strong interest in the ${job.title} position at ${job.company}. With ${experience} years of experience as a ${role} and a proven track record of delivering impactful results, I am confident that my skills and passion align perfectly with this opportunity.

Throughout my career, I have developed deep expertise in ${skills}, which directly aligns with the requirements of this role. My background in ${education} has provided me with a strong foundation in both technical and strategic thinking, enabling me to approach complex challenges with innovative solutions.

In my previous roles, I have consistently demonstrated my ability to lead cross-functional teams, deliver projects on time and within scope, and drive measurable business outcomes. I am particularly drawn to ${job.company}'s mission and the innovative work being done in the ${job.location} area.

What excites me most about this position is the opportunity to contribute to ${job.company}'s continued growth while further developing my own expertise. I am eager to bring my skills in ${skills} and my collaborative approach to your team.

I would welcome the opportunity to discuss how my experience and enthusiasm can contribute to ${job.company}'s success. Thank you for considering my application.

Best regards,
${name}`

  const motivationalLetter = `I am thrilled to apply for the ${job.title} role at ${job.company}. This position represents exactly the kind of opportunity I have been seeking \u2013 one where I can leverage my ${experience} years of experience as a ${role} while continuing to grow in a dynamic, innovation-driven environment.

What draws me most to ${job.company} is the company's commitment to excellence and its forward-thinking approach. I have followed ${job.company}'s journey and am deeply impressed by the impact you've made in the industry. The opportunity to be part of a team that values both professional development and meaningful contributions is incredibly exciting to me.

My passion for ${role.toLowerCase()} work stems from a genuine love for solving complex problems and creating solutions that make a real difference. With my expertise in ${skills} and my educational background in ${education}, I am well-positioned to make immediate contributions to your team.

I am particularly motivated by the challenge of working in ${job.location === 'Remote' ? 'a distributed team environment' : job.location}, where I can collaborate with talented colleagues from diverse backgrounds. I believe that diversity of thought and experience drives innovation, and I am eager to contribute to that culture.

Thank you for considering my application. I look forward to the opportunity to discuss how my passion and skills align with ${job.company}'s vision for the future.

Warm regards,
${name}`

  const emailDraft = `Dear ${job.company} Recruiting Team,

I am excited to apply for the ${job.title} position. With ${experience} years of experience as a ${role} and strong expertise in ${skills}, I believe I would be a valuable addition to your team.

I have attached my resume and cover letter for your review. I would welcome the opportunity to discuss how my background aligns with your needs.

Thank you for your time and consideration.

Best regards,
${name}
${profile.email || ''}
${profile.phone || ''}`

  return { job, coverLetter, motivationalLetter, emailDraft }
}

// ============================================
// CV STRENGTH ANALYZER
// ============================================
app.post('/api/analyze-cv', async (req, res) => {
  try {
    const { cvData, targetRole } = req.body
    const analysis = analyzeCVStrength(cvData, targetRole)
    res.json(analysis)
  } catch (err) {
    console.error('CV analysis error:', err)
    res.status(500).json({ error: 'Failed to analyze CV' })
  }
})

function analyzeCVStrength(cvData, targetRole) {
  let score = 0
  const tips = []
  const strengths = []

  // Name check
  if (cvData.fullName && cvData.fullName.split(' ').length >= 2) {
    score += 10; strengths.push('Professional name format')
  } else {
    tips.push({ type: 'critical', text: 'Add your full name (first and last) at the top of your CV' })
  }

  // Email check
  if (cvData.email && cvData.email.includes('@')) {
    score += 8; strengths.push('Professional email provided')
  } else {
    tips.push({ type: 'critical', text: 'Add a professional email address' })
  }

  // Phone check
  if (cvData.phone && cvData.phone.replace(/\D/g, '').length >= 7) {
    score += 7; strengths.push('Contact number included')
  } else {
    tips.push({ type: 'warning', text: 'Add a phone number for recruiters to reach you' })
  }

  // Location check
  if (cvData.location && cvData.location.length > 3) {
    score += 5; strengths.push('Location specified')
  } else {
    tips.push({ type: 'warning', text: 'Add your city/location - many jobs require location for filtering' })
  }

  // Skills check
  const skillCount = (cvData.skills || []).length
  if (skillCount >= 8) {
    score += 15; strengths.push(`Strong skill set (${skillCount} skills listed)`)
  } else if (skillCount >= 4) {
    score += 10
    tips.push({ type: 'improvement', text: `Add more skills - you have ${skillCount}, aim for 8-15 for better ATS matching` })
  } else {
    score += 3
    tips.push({ type: 'critical', text: `Only ${skillCount} skills found - add at least 8 relevant skills (technical + soft skills)` })
  }

  // Education check
  const eduCount = (cvData.education || []).length
  if (eduCount >= 1) {
    score += 10; strengths.push('Education history included')
  } else {
    tips.push({ type: 'warning', text: 'Add your education - degrees, diplomas, or certifications' })
  }

  // Experience check
  if (cvData.experience) {
    score += 10; strengths.push('Work experience indicated')
  } else {
    tips.push({ type: 'improvement', text: 'Add years of experience - helps recruiters filter candidates' })
  }

  // Languages check
  if ((cvData.languages || []).length >= 2) {
    score += 5; strengths.push('Multiple languages listed')
  } else if ((cvData.languages || []).length === 1) {
    score += 3
    tips.push({ type: 'improvement', text: 'Add additional languages - multilingual candidates are more competitive' })
  } else {
    tips.push({ type: 'improvement', text: 'Add language proficiencies to your CV' })
  }

  // Certifications check
  if ((cvData.certifications || []).length >= 1) {
    score += 8; strengths.push('Certifications listed')
  } else {
    tips.push({ type: 'improvement', text: 'Industry certifications boost credibility - add any relevant ones' })
  }

  // Role-specific skill matching
  if (targetRole && skillCount > 0) {
    const roleLower = targetRole.toLowerCase()
    const matchingSkills = (cvData.skills || []).filter(s => {
      const sLower = s.toLowerCase()
      return roleLower.includes(sLower) || sLower.includes(roleLower.split(' ')[0] || '')
    })
    if (matchingSkills.length >= 3) {
      score += 12; strengths.push(`Skills align well with "${targetRole}"`)
    } else {
      score += 5
      tips.push({ type: 'improvement', text: `Add skills specific to "${targetRole}" - tailor your CV for each application` })
    }
  }

  // Bonus for raw text length (indicates detail)
  if (cvData.rawText && cvData.rawText.length > 1000) {
    score += 5; strengths.push('Detailed CV content')
  } else if (cvData.rawText && cvData.rawText.length < 300) {
    tips.push({ type: 'warning', text: 'Your CV appears short - add more detail about achievements and responsibilities' })
  }

  score = Math.min(score, 100)

  // ATS compatibility check
  const atsScore = calculateATSScore(cvData)

  return {
    overallScore: score,
    atsScore: atsScore.score,
    tips: tips.sort((a, b) => {
      const order = { critical: 0, warning: 1, improvement: 2 }
      return (order[a.type] || 3) - (order[b.type] || 3)
    }),
    strengths,
    atsDetails: atsScore.details,
    grade: score >= 80 ? 'A' : score >= 65 ? 'B' : score >= 50 ? 'C' : score >= 35 ? 'D' : 'F',
  }
}

function calculateATSScore(cvData) {
  let score = 0
  const details = []

  // Standard sections that ATS systems look for
  const requiredSections = ['skills', 'education', 'experience']
  const presentSections = requiredSections.filter(s => {
    if (s === 'skills') return (cvData.skills || []).length > 0
    if (s === 'education') return (cvData.education || []).length > 0
    if (s === 'experience') return !!cvData.experience
    return false
  })

  score += (presentSections.length / requiredSections.length) * 30
  if (presentSections.length === requiredSections.length) {
    details.push('All standard CV sections present')
  } else {
    const missing = requiredSections.filter(s => !presentSections.includes(s))
    details.push(`Missing ATS sections: ${missing.join(', ')}`)
  }

  // Contact info
  if (cvData.email) score += 15
  if (cvData.phone) score += 10
  details.push(`${cvData.email ? 'Email' : 'No email'} | ${cvData.phone ? 'Phone' : 'No phone'}`)

  // Skills keyword density
  const skillCount = (cvData.skills || []).length
  if (skillCount >= 10) { score += 20; details.push('Strong keyword density') }
  else if (skillCount >= 5) { score += 10; details.push('Moderate keyword density') }
  else { details.push('Low keyword density - add more skills') }

  // Name present
  if (cvData.fullName) score += 10

  // Structured data
  if (cvData.education && cvData.education.length > 0) score += 10
  if (cvData.location) score += 5

  return { score: Math.min(Math.round(score), 100), details }
}

// ============================================
// INTERVIEW PREP ENDPOINT
// ============================================
app.post('/api/interview-prep', async (req, res) => {
  try {
    const { cvData, job } = req.body

    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
      const { default: OpenAI } = await import('openai')
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

      const prompt = `Generate comprehensive interview preparation for this candidate applying to this job. This must be REAL, PRACTICAL interview prep — not generic advice.

CANDIDATE: ${cvData.fullName || 'Candidate'}
Skills: ${(cvData.skills || []).join(', ')}
Experience: ${cvData.experience || 'N/A'}
Education: ${(cvData.education || []).join('; ')}

JOB: ${job.title} at ${job.company}
Description: ${job.description}
Required Skills: ${(job.requiredSkills || []).join(', ')}
Location: ${job.location || 'Not specified'}

Generate as JSON:
{
  "technicalQuestions": [{ "question": "...", "detailedAnswer": "...", "difficulty": "easy|medium|hard", "whatInterviewerLooksFor": "..." }],
  "behavioralQuestions": [{ "question": "...", "sampleAnswer": "...", "starBreakdown": { "situation": "...", "task": "...", "action": "...", "result": "..." }, "tip": "..." }],
  "companyInsights": [{ "category": "culture|growth|product|news", "point": "..." }],
  "salaryNegotiation": [{ "tip": "...", "exampleScript": "..." }],
  "redFlagsToWatch": [{ "flag": "...", "whatItMeans": "...", "howToHandle": "..." }],
  "interviewPractice": {
    "openingQuestions": [{ "question": "...", "strongAnswer": "...", "whyTheyAsk": "..." }],
    "caseStudy": { "scenario": "...", "approach": "...", "keyPoints": ["..."] },
    "technicalChallenge": { "description": "...", "expectedApproach": "...", "tips": ["..."] },
    "closingQuestions": [{ "question": "...", "purpose": "..." }],
    "mockInterviewScript": { "interviewer": ["..."], "candidate": ["..."] }
  }
}

Return 6 technical (tailored to job's required skills), 4 behavioral (with STAR breakdowns), 4 company insights, 3 salary tips with scripts, 3 red flags with handling advice, and full interview practice section. Valid JSON only.`

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert career coach. Return valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 3000,
      })

      const content = completion.choices[0].message.content
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return res.json(JSON.parse(jsonMatch[0]))
      }
    }

    // Fallback: generate sample interview prep
    res.json(generateInterviewPrep(cvData, job))
  } catch (err) {
    console.error('Interview prep error:', err)
    res.json(generateInterviewPrep(req.body.cvData, req.body.job))
  }
})

function generateInterviewPrep(cvData, job) {
  const skills = (cvData.skills || ['your technical skills']).slice(0, 5)
  const skillStr = skills.join(' and ')
  const role = job.title || 'the position'
  const company = job.company || 'the company'
  const reqSkills = (job.requiredSkills || skills).slice(0, 5)

  return {
    technicalQuestions: [
      { question: `Walk me through a complex project where you used ${skills[0] || 'your primary skill'}.`, detailedAnswer: `Use the STAR method: Describe the project context, your specific responsibilities, the technical challenges you solved, and the measurable outcomes (e.g., "reduced load time by 40%", "processed 10K daily transactions"). Be specific about YOUR role, not the team's.`, difficulty: 'medium', whatInterviewerLooksFor: 'Problem-solving ability, technical depth, and ability to communicate complex ideas clearly' },
      { question: `How would you design a system that needs to handle ${(Math.floor(Math.random() * 900) + 100)}K daily users for ${role.toLowerCase().includes('front') ? 'a single-page application' : 'a backend service'}?`, detailedAnswer: `Start with requirements clarification (read/write ratio, latency needs). Discuss: load balancing, caching strategy (Redis/Memcached), database choice (SQL vs NoSQL based on data model), CDN for static assets, horizontal vs vertical scaling. Mention trade-offs between consistency and availability.`, difficulty: 'hard', whatInterviewerLooksFor: 'System design thinking, understanding of scalability patterns, ability to discuss trade-offs' },
      { question: `Explain the difference between ${reqSkills[0] || 'two key technologies'} and ${reqSkills[1] || 'another technology'} in your stack. When would you use each?`, detailedAnswer: `Provide a concrete comparison: performance characteristics, use cases, ecosystem maturity. Give a real example from your experience where choosing one over the other made a difference. Show you understand WHY, not just WHAT.`, difficulty: 'medium', whatInterviewerLooksFor: 'Depth of knowledge, ability to make architectural decisions' },
      { question: `Describe your approach to debugging a critical production issue that's affecting users right now.`, detailedAnswer: `Step 1: Assess impact and communicate with stakeholders. Step 2: Check monitoring/logs (CloudWatch, Datadog, etc.). Step 3: Reproduce in staging if possible. Step 4: Identify root cause using binary search or logging. Step 5: Implement minimal fix. Step 6: Verify and monitor post-fix. Step 7: Write incident report.`, difficulty: 'hard', whatInterviewerLooksFor: 'Crisis management, systematic thinking, communication under pressure' },
      { question: `How do you ensure code quality in a fast-paced development environment?`, detailedAnswer: `Discuss: code review process, automated testing (unit, integration, e2e), linting/formatting (ESLint, Prettier), CI/CD pipelines, pair programming for complex features. Emphasize balancing speed with quality — "move fast but don't break things" isn't just a motto, it requires tooling.`, difficulty: 'easy', whatInterviewerLooksFor: 'Engineering discipline, understanding of software craft' },
      { question: `Tell me about a time you had to learn a new technology quickly for a project. How did you approach it?`, detailedAnswer: `Choose a real example. Describe: what you needed to learn, your learning strategy (official docs, tutorials, building a toy project), how quickly you became productive, and the outcome. Show you're a self-directed learner who can ramp up fast.`, difficulty: 'easy', whatInterviewerLooksFor: 'Learning agility, self-motivation, adaptability' },
    ],
    behavioralQuestions: [
      { question: `Tell me about a time you disagreed with a technical decision on your team. How did you handle it?`, sampleAnswer: 'Describe the disagreement respectfully, how you presented data-driven arguments, and the outcome — whether you convinced the team or learned something new.', starBreakdown: { situation: 'During a project sprint, the team decided to use a specific database that I had concerns about for our use case.', task: 'I needed to either accept the decision or advocate for an alternative approach.', action: 'I prepared a benchmark comparison, scheduled a 15-minute tech talk, and presented data on performance, cost, and maintainability.', result: 'The team agreed to run a proof-of-concept with both options, and we ended up choosing a hybrid approach that performed 30% better.' }, tip: 'Never say "I was right and they were wrong." Focus on collaboration and data.' },
      { question: `Describe a situation where you had to deliver under a very tight deadline.`, sampleAnswer: 'Focus on prioritization, stakeholder communication, and the trade-offs you made. Show you can deliver under pressure without sacrificing quality entirely.', starBreakdown: { situation: 'A client needed a feature deployed in 48 hours for a product launch, and it was originally planned for a 2-week sprint.', task: 'I needed to scope the feature to its MVP, coordinate with QA, and ensure no critical bugs.', action: 'I broke the feature into must-have and nice-to-have parts, pair-programmed with a colleague, and ran parallel testing.', result: 'Launched on time with the core feature. Post-launch, we added the remaining parts in the next sprint with zero regressions.' }, tip: 'Quantify the impact — hours saved, revenue protected, client satisfaction.' },
      { question: `Give an example of when you mentored someone or helped a team member grow.`, sampleAnswer: 'Choose a genuine example. Discuss how you assessed their needs, the approach you took, and the measurable growth.', starBreakdown: { situation: 'A junior developer on our team was struggling with code reviews and feeling overwhelmed.', task: 'I wanted to help them improve without micromanaging or doing their work for them.', action: 'I started doing 30-minute weekly pairing sessions, created a checklist for self-review before submitting PRs, and shared my mental model for code review.', result: 'Their PR approval rate went from 40% to 90% in 6 weeks, and they later mentored another new hire.' }, tip: 'Show genuine care for others growth, not just "checking a box."' },
      { question: `How do you handle working with stakeholders who have unclear or constantly changing requirements?`, sampleAnswer: 'Discuss your approach to requirement gathering, expectation management, and iterative delivery.', starBreakdown: { situation: 'A product manager frequently changed requirements mid-sprint, causing rework and team frustration.', task: 'I needed to find a way to maintain sprint stability while still being responsive to business needs.', action: 'I proposed a "requirements freeze" 2 days before sprint start, created a backlog grooming process, and built a change request template for urgent mid-sprint changes.', result: 'Sprint completion rate improved from 60% to 85%, and the PM appreciated having a structured process for urgent changes.' }, tip: 'Show empathy for the stakeholder while maintaining engineering discipline.' },
    ],
    companyInsights: [
      { category: 'culture', point: `Research ${company}'s team page and LinkedIn profiles. Look for signs of team size, diversity, and how long people stay. Average tenure under 1 year may indicate culture issues.` },
      { category: 'growth', point: `Check ${company}'s recent funding rounds, job postings, and press releases. Growing companies often have more relaxed interview processes and faster hiring timelines.` },
      { category: 'product', point: `Use ${company}'s product before the interview. Take notes on UX, features you like, and potential improvements. Mentioning specific product insights shows genuine interest.` },
      { category: 'news', point: `Search for recent news about ${company} on Google News and TechCrunch. Being aware of their latest developments shows you've done your homework and are genuinely interested.` },
    ],
    salaryNegotiation: [
      { tip: `Research ${role} salaries on Glassdoor, Levels.fyi, and Payscale for ${job.location || 'your area'}. Know the market rate before任何 conversation.`, exampleScript: `"Based on my research and the market rate for ${role}s in ${job.location || 'this area'}, and considering my experience, I'm looking for a range of $X to $Y. I'm open to discussing the full compensation package including equity, bonus, and benefits."` },
      { tip: `Never give the first number. If pressed, give a range where your target is the lower end. Always negotiate the offer — most employers expect it.`, exampleScript: `"I'm excited about this opportunity. Could you share the compensation range for this role? I want to make sure we're aligned before we go further."` },
      { tip: `Consider the TOTAL package: base salary, signing bonus, annual bonus, equity/RSUs, benefits, PTO, remote flexibility, learning budget. A lower base with strong equity can be worth more.`, exampleScript: `"Thank you for the offer. I'd love to discuss a few aspects — could we explore the signing bonus and equity components? I want to understand the full picture before making a decision."` },
    ],
    redFlagsToWatch: [
      { flag: 'Interviewer cannot clearly describe the role or team structure', whatItMeans: 'May indicate poor planning, high turnover, or that the role is being created on the fly', howToHandle: 'Ask specific questions: "Who would I report to?" "What does a typical day look like?" "How is success measured in this role?"' },
      { flag: 'Pressure to accept the offer immediately or very tight deadline', whatItMeans: 'Either they are desperate (high turnover) or trying to prevent you from comparing offers', howToHandle: 'It is reasonable to ask for 48-72 hours to review an offer. A good employer will respect this.' },
      { flag: 'Negative comments about previous employees or vague answers about team dynamics', whatItMeans: 'Potential toxic work environment or poor management', howToHandle: 'Ask about employee retention rates and growth opportunities. Check Glassdoor reviews.' },
    ],
    interviewPractice: {
      openingQuestions: [
        { question: `Tell me about yourself and why you're interested in the ${role} position at ${company}.`, strongAnswer: `I'm a ${role} with ${cvData.experience || 'several years of'} experience in ${(skills.slice(0, 3)).join(', ') || 'my field'}. I've been following ${company}'s work in [specific product/area] and I'm excited about [specific reason]. My background in [relevant experience] aligns well with what you're looking for, and I'm eager to contribute to [specific team goal].`, whyTheyAsk: 'This is your elevator pitch. They want to see if you can communicate clearly and if you have genuine interest in THIS role, not just any job.' },
        { question: `What do you know about ${company} and our products/services?`, strongAnswer: `Mention specific products, recent news, company values from their website, and how the role fits into their mission. Example: "I know ${company} recently [launched/funded/expanded X], and I was impressed by [specific detail]. Your approach to [specific technology/methodology] resonates with my experience in [related area]."`, whyTheyAsk: 'Tests if you did your homework. Generic answers like "great company" are instant red flags.' },
      ],
      caseStudy: {
        scenario: `You're tasked with ${role.toLowerCase().includes('design') ? 'redesigning the onboarding flow for a mobile app where 40% of users drop off during sign-up' : role.toLowerCase().includes('manage') ? 'planning a project to migrate a legacy system to the cloud with zero downtime' : `building a new feature for ${company}'s main product that needs to handle 10x the current traffic`}. You have 2 weeks and a team of 3. How do you approach this?`,
        approach: `1. Clarify requirements and success metrics (What does "done" look like?). 2. Break the work into phases with clear milestones. 3. Identify risks early (technical debt, dependencies, unknowns). 4. Set up communication cadence (daily standups, weekly stakeholder updates). 5. Build the MVP first, iterate based on feedback.`,
        keyPoints: [
          'Ask clarifying questions before diving into solutions',
          'Show you can break complex problems into manageable pieces',
          'Demonstrate awareness of trade-offs (time vs quality, scope vs deadline)',
          'Mention how you would communicate progress and handle blockers',
          'Show you think about testing and rollback strategies',
        ],
      },
      technicalChallenge: {
        description: `Implement a function that ${reqSkills[0] ? `uses ${reqSkills[0]}` : 'takes an array of numbers'} and returns the top N most frequent items. Consider edge cases, time complexity, and write clean, readable code.`,
        expectedApproach: `1. Clarify: What happens with ties? What if N > array length? Empty array? 2. Choose approach: Hash map + sorting (O(n log n)) or heap (O(n log k)). 3. Implement with clean variable names and comments. 4. Discuss time/space complexity. 5. Test with examples.`,
        tips: [
          'Think out loud — interviewers want to see your process, not just the answer',
          'Start with the brute force solution, then optimize',
          'Mention edge cases: empty input, null values, single element',
          'If stuck, ask for a hint — it shows collaboration, not weakness',
          'Write clean code even under pressure — naming matters',
        ],
      },
      closingQuestions: [
        { question: 'What questions do you have for us?', purpose: 'This is NOT optional. Ask thoughtful questions about the team, challenges, growth opportunities, and company direction. Prepare 3-5 questions.' },
        { question: 'Where do you see this role evolving in the next 1-2 years?', purpose: 'Shows you think long-term and are interested in growth, not just a paycheck.' },
        { question: 'What does success look like in the first 90 days for this role?', purpose: 'Shows you are results-oriented and want to hit the ground running.' },
      ],
      mockInterviewScript: {
        interviewer: [
          'Good morning! Thanks for coming in today. I\'m [Name], the [Title] here at ' + company + '. Let\'s start — tell me about yourself.',
          `Great, thanks for that overview. Now, I see from your resume you have experience with ${skills[0] || 'several technologies'}. Can you walk me through a challenging project where you used it?`,
          'Interesting approach. What would you do differently if you had to do it again?',
          `Now let's talk about ${company}. Why are you interested in joining our team for this ${role} position?`,
          `One more scenario: if you joined our team and discovered the codebase had significant technical debt slowing down feature delivery, how would you approach that?`,
          'Those are all my questions. Do you have any questions for me?',
        ],
        candidate: [
          `"Thank you for having me. I'm ${cvData.fullName || 'a passionate professional'} with ${cvData.experience || 'experience'} in ${skills.slice(0, 3).join(', ') || 'my field'}. I've been working as a ${role} and I'm excited about the opportunity at ${company} because [specific reason]. I'm particularly drawn to [specific aspect of the role/company]."`,
          `"Sure! In my ${cvData.experience || 'previous'} role, I worked on [specific project]. The challenge was [specific problem]. I used ${skills[0] || 'my skills'} to [specific approach]. The outcome was [measurable result — percentage improvement, time saved, users impacted]. Key lesson: [what you learned]."`,
          `"Great question. Looking back, I would [specific improvement — e.g., 'write more tests earlier', 'involve stakeholders sooner', 'choose a different architecture']. This taught me the importance of [lesson]. In future projects, I now [specific practice you've adopted]."`,
          `"I'm excited about ${company} because [2-3 specific reasons — product, mission, culture, growth]. I've [used your product / followed your news] and I'm impressed by [specific detail]. This ${role} role aligns perfectly with my goal of [career objective]. I'm confident I can contribute to [specific team goal].`,
          `"I'd approach it in phases. First, I'd assess the severity by identifying which debt impacts delivery most. Then I'd create a 'tech debt budget' — allocating 20% of each sprint to improvements. I'd prioritize fixes that unblock feature work, and build a business case for larger refactors by showing their impact on velocity. Communication with the team and stakeholders is key."`,
          `"Yes, thank you! I have a few questions. First, what does success look like in the first 90 days? Second, what's the biggest technical challenge the team is facing right now? And third, how does the team approach professional development and learning?"`,
        ],
      },
    },
  }
}

// ============================================
// CV EVALUATION + TEMPLATE GENERATION
// ============================================
app.post('/api/evaluate-cv', async (req, res) => {
  try {
    const { cvData } = req.body
    const evaluation = evaluateCVQuality(cvData)
    res.json(evaluation)
  } catch (err) {
    console.error('CV evaluation error:', err)
    res.status(500).json({ error: 'Failed to evaluate CV' })
  }
})

function evaluateCVQuality(cvData) {
  const issues = []
  let qualityScore = 100

  // Check critical fields
  if (!cvData.fullName || cvData.fullName.split(' ').length < 2) {
    issues.push({ severity: 'critical', field: 'name', message: 'Missing or incomplete full name' })
    qualityScore -= 15
  }
  if (!cvData.email || !cvData.email.includes('@')) {
    issues.push({ severity: 'critical', field: 'email', message: 'Missing email address' })
    qualityScore -= 15
  }
  if (!cvData.phone || cvData.phone.replace(/\D/g, '').length < 7) {
    issues.push({ severity: 'critical', field: 'phone', message: 'Missing or invalid phone number' })
    qualityScore -= 10
  }

  // Check content quality
  if (!cvData.skills || cvData.skills.length < 3) {
    issues.push({ severity: 'critical', field: 'skills', message: 'Too few skills detected (need at least 3)' })
    qualityScore -= 20
  }
  if (!cvData.education || cvData.education.length === 0) {
    issues.push({ severity: 'warning', field: 'education', message: 'No education information found' })
    qualityScore -= 10
  }
  if (!cvData.experience) {
    issues.push({ severity: 'warning', field: 'experience', message: 'No work experience detected' })
    qualityScore -= 10
  }
  if (!cvData.location) {
    issues.push({ severity: 'warning', field: 'location', message: 'No location specified' })
    qualityScore -= 5
  }
  if (!cvData.currentRole) {
    issues.push({ severity: 'improvement', field: 'role', message: 'No current/target role identified' })
    qualityScore -= 5
  }

  // Check raw text quality
  const rawLen = (cvData.rawText || '').length
  if (rawLen < 200) {
    issues.push({ severity: 'critical', field: 'content', message: 'CV appears to have very little content - possibly corrupted or poorly formatted' })
    qualityScore -= 20
  } else if (rawLen < 500) {
    issues.push({ severity: 'warning', field: 'content', message: 'CV content seems sparse - may need more detail' })
    qualityScore -= 10
  }

  // Check if sections are missing
  const raw = (cvData.rawText || '').toLowerCase()
  const hasSummary = /summary|profile|objective|about/.test(raw)
  const hasWork = /experience|employment|work history|career/.test(raw)
  const hasEducation = /education|qualification|academic|degree/.test(raw)
  const hasSkills = /skills|competencies|proficiencies|technologies/.test(raw)

  const sectionCount = [hasSummary, hasWork, hasEducation, hasSkills].filter(Boolean).length
  if (sectionCount < 2) {
    issues.push({ severity: 'critical', field: 'structure', message: 'CV lacks standard section structure (Summary, Experience, Education, Skills)' })
    qualityScore -= 15
  } else if (sectionCount < 3) {
    issues.push({ severity: 'warning', field: 'structure', message: 'CV is missing some standard sections' })
    qualityScore -= 5
  }

  qualityScore = Math.max(qualityScore, 0)

  // Determine if CV is "badly created"
  const isPoorQuality = qualityScore < 50 || issues.filter(i => i.severity === 'critical').length >= 3

  let templates = []
  if (isPoorQuality) {
    templates = generateCVTemplates(cvData)
  }

  return {
    qualityScore,
    isPoorQuality,
    issues,
    templates,
    message: isPoorQuality
      ? 'Your CV appears to be poorly formatted or missing key information. We have generated improved CV templates using your data. Choose one below and download it as a PDF.'
      : qualityScore < 70
        ? 'Your CV needs some improvements. Consider the suggestions below to strengthen it.'
        : 'Your CV looks good! Minor improvements could make it even better.',
  }
}

function generateCVTemplates(cvData) {
  const name = cvData.fullName || 'Your Name'
  const email = cvData.email || 'email@example.com'
  const phone = cvData.phone || '+1 234 567 890'
  const location = cvData.location || 'City, Country'
  const role = cvData.currentRole || cvData.targetRole || 'Professional'
  const skills = cvData.skills || []
  const education = cvData.education || []
  const experience = cvData.experience || ''
  const languages = cvData.languages || []
  const certifications = cvData.certifications || []

  return [
    {
      id: 'modern',
      name: 'Modern Professional',
      description: 'Clean, modern design with a sidebar layout. Best for tech and creative roles.',
      sections: [
        { title: 'header', content: { name, email, phone, location, role } },
        { title: 'summary', heading: 'Professional Summary', content: `Dedicated ${role} with${experience ? ' ' + experience : ''} of experience. Skilled in ${skills.slice(0, 5).join(', ') || 'multiple areas'}. Committed to delivering high-quality results and continuous professional growth.` },
        { title: 'skills', heading: 'Core Skills', content: skills.length > 0 ? skills : ['Add your skills here'] },
        { title: 'experience', heading: 'Work Experience', content: experience || 'Add your work experience with specific achievements and responsibilities.' },
        { title: 'education', heading: 'Education', content: education.length > 0 ? education : ['Add your education details'] },
        { title: 'certifications', heading: 'Certifications', content: certifications.length > 0 ? certifications : [] },
        { title: 'languages', heading: 'Languages', content: languages.length > 0 ? languages : [] },
      ],
    },
    {
      id: 'classic',
      name: 'Classic Executive',
      description: 'Traditional, professional format. Ideal for corporate and senior positions.',
      sections: [
        { title: 'header', content: { name, email, phone, location, role } },
        { title: 'objective', heading: 'Career Objective', content: `Seeking a challenging ${role} position where I can utilize my skills in ${skills.slice(0, 3).join(', ') || 'my field'} to contribute to organizational success and professional development.` },
        { title: 'experience', heading: 'Professional Experience', content: experience || 'Detail your professional experience, focusing on achievements and impact.' },
        { title: 'education', heading: 'Education', content: education.length > 0 ? education : ['Add your education'] },
        { title: 'skills', heading: 'Key Competencies', content: skills.length > 0 ? skills : ['Add key competencies'] },
        { title: 'certifications', heading: 'Professional Development', content: certifications.length > 0 ? certifications : [] },
        { title: 'languages', heading: 'Languages', content: languages.length > 0 ? languages : [] },
      ],
    },
    {
      id: 'creative',
      name: 'Creative Minimal',
      description: 'Minimalist design with bold typography. Great for startups and modern companies.',
      sections: [
        { title: 'header', content: { name, email, phone, location, role } },
        { title: 'about', heading: 'About Me', content: `${role} passionate about creating impactful solutions.${experience ? ' With ' + experience + ' of hands-on experience,' : ''} I bring expertise in ${skills.slice(0, 4).join(', ') || 'my craft'} and a drive for excellence.` },
        { title: 'skills', heading: 'What I Do', content: skills.length > 0 ? skills : ['Add your skills'] },
        { title: 'experience', heading: 'Experience', content: experience || 'Describe your experience and key achievements.' },
        { title: 'education', heading: 'Education', content: education.length > 0 ? education : ['Add your education'] },
        { title: 'extras', heading: 'Additional', content: [...(certifications.length > 0 ? certifications : []), ...(languages.length > 0 ? ['Languages: ' + languages.join(', ')] : [])] },
      ],
    },
  ]
}

// ============================================
// SALARY BENCHMARK ENDPOINT
// ============================================
app.post('/api/salary-benchmark', async (req, res) => {
  try {
    const { role, location, experience } = req.body
    const benchmark = getSalaryBenchmark(role, location, experience)
    res.json(benchmark)
  } catch (err) {
    res.status(500).json({ error: 'Failed to get salary data' })
  }
})

function getSalaryBenchmark(role, location, experience) {
  const roleLower = (role || '').toLowerCase()
  const exp = parseInt(experience) || 3

  const salaryData = {
    'software engineer': { base: 95000, variance: 35000 },
    'data scientist': { base: 100000, variance: 30000 },
    'product manager': { base: 110000, variance: 40000 },
    'devops engineer': { base: 105000, variance: 30000 },
    'ux designer': { base: 85000, variance: 25000 },
    'project manager': { base: 80000, variance: 25000 },
    'business analyst': { base: 75000, variance: 20000 },
    'systems administrator': { base: 70000, variance: 20000 },
    'network engineer': { base: 72000, variance: 18000 },
    'cyber security': { base: 95000, variance: 35000 },
    'cloud engineer': { base: 110000, variance: 30000 },
    'frontend developer': { base: 85000, variance: 25000 },
    'backend developer': { base: 95000, variance: 30000 },
    'full stack developer': { base: 100000, variance: 30000 },
    'mobile developer': { base: 95000, variance: 25000 },
    'machine learning': { base: 115000, variance: 35000 },
    'it support': { base: 45000, variance: 15000 },
    'database administrator': { base: 80000, variance: 20000 },
  }

  let matched = null
  for (const [key, val] of Object.entries(salaryData)) {
    if (roleLower.includes(key)) { matched = val; break }
  }
  if (!matched) matched = { base: 75000, variance: 25000 }

  // Location multipliers
  const locationMultipliers = {
    'san francisco': 1.4, 'new york': 1.3, 'seattle': 1.25, 'boston': 1.2,
    'los angeles': 1.15, 'chicago': 1.05, 'austin': 1.1, 'denver': 1.05,
    'remote': 1.0, 'london': 1.15, 'berlin': 0.9, 'dubai': 1.1,
  }

  let multiplier = 1.0
  const locLower = (location || '').toLowerCase()
  for (const [key, mult] of Object.entries(locationMultipliers)) {
    if (locLower.includes(key)) { multiplier = mult; break }
  }

  // Experience multiplier
  const expMultiplier = exp <= 2 ? 0.8 : exp <= 5 ? 1.0 : exp <= 8 ? 1.15 : exp <= 12 ? 1.3 : 1.45

  const adjustedBase = Math.round(matched.base * multiplier * expMultiplier)
  const variance = Math.round(matched.variance * multiplier)

  return {
    role: role || 'General',
    location: location || 'National Average',
    experience: `${exp} years`,
    estimated: {
      low: adjustedBase - variance,
      median: adjustedBase,
      high: adjustedBase + variance,
      top: adjustedBase + variance * 2,
    },
    percentiles: {
      p10: adjustedBase - variance,
      p25: adjustedBase - variance * 0.5,
      p50: adjustedBase,
      p75: adjustedBase + variance * 0.5,
      p90: adjustedBase + variance,
    },
    factors: [
      `${experience || 0} years of experience`,
      `Location: ${location || 'National'}`,
      'Industry demand',
      'Specific technical skills',
    ],
    tip: exp < 3 ? 'Consider certifications to boost your earning potential.' :
         exp < 7 ? 'Your experience level is competitive - negotiate aggressively.' :
         'At your seniority level, total compensation (equity, bonus) matters more than base salary.',
  }
}

// ============================================
// HEALTH CHECK
// ============================================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ============================================
// SERVE FRONTEND IN PRODUCTION
// ============================================
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '../frontend/dist')))
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '../frontend/dist/index.html'))
  })
}

// ============================================
// SECURITY HEADERS
// ============================================
app.disable('x-powered-by')

// ============================================
// GLOBAL ERROR HANDLER
// ============================================
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
  console.log(`
  AI Job Application Server
  Running on http://localhost:${PORT}
  OpenAI: ${process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here' ? 'Configured' : 'Not configured (using sample data)'}
  `)
})
