import type {
  Job,
  Profile,
  CounselResponse,
  Business,
  JobFilters,
  PostJobPayload,
  RegisterBusinessPayload,
  SkillsGapResponse,
  SalaryInsightResponse,
  CoverLetterResponse,
  InterviewPrepResponse,
  JargonTranslationResponse,
  FirstWeekPrepResponse,
  QuizQuestion,
  QuizEvaluationResponse,
  OutreachResponse,
  PaycheckExplanation,
} from './types'

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '')

function authHeaders(token: string | null): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

export async function getJobs(filters?: JobFilters): Promise<Job[]> {
  const params = new URLSearchParams()
  if (filters?.skill) params.set('skill', filters.skill)
  if (filters?.location) params.set('location', filters.location)
  if (filters?.category) params.set('category', filters.category)

  const query = params.toString() ? `?${params.toString()}` : ''
  const res = await fetch(`${API_URL}/api/jobs${query}`, {
    headers: { 'Content-Type': 'application/json' },
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch jobs: ${res.statusText}`)
  }

  const data = await res.json()
  return data.jobs ?? data
}

export async function getProfile(token: string | null): Promise<Profile> {
  const res = await fetch(`${API_URL}/api/profile`, {
    headers: authHeaders(token),
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch profile: ${res.statusText}`)
  }

  return res.json()
}

export async function updateProfile(token: string | null, profile: Profile): Promise<Profile> {
  const res = await fetch(`${API_URL}/api/profile`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(profile),
  })

  if (!res.ok) {
    throw new Error(`Failed to update profile: ${res.statusText}`)
  }

  return res.json()
}

export async function postJob(token: string | null, job: PostJobPayload): Promise<Job> {
  const res = await fetch(`${API_URL}/api/jobs`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(job),
  })

  if (!res.ok) {
    throw new Error(`Failed to post job: ${res.statusText}`)
  }

  return res.json()
}

export async function getMyBusinessJobs(token: string | null): Promise<{ jobs: Job[]; total: number }> {
  const res = await fetch(`${API_URL}/api/businesses/me/jobs`, {
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error(`Failed to fetch jobs: ${res.statusText}`)
  return res.json()
}

export async function updateJob(token: string | null, jobId: string, updates: Partial<PostJobPayload>): Promise<Job> {
  const res = await fetch(`${API_URL}/api/jobs/${jobId}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(updates),
  })
  if (!res.ok) throw new Error(`Failed to update job: ${res.statusText}`)
  return res.json()
}

export async function deleteJob(token: string | null, jobId: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/jobs/${jobId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error(`Failed to delete job: ${res.statusText}`)
}

export async function getCounsel(token: string | null): Promise<CounselResponse> {
  const res = await fetch(`${API_URL}/api/counsel`, {
    method: 'POST',
    headers: authHeaders(token),
  })

  if (!res.ok) {
    throw new Error(`Failed to get counsel: ${res.statusText}`)
  }

  return res.json()
}

export async function registerBusiness(
  token: string | null,
  business: RegisterBusinessPayload
): Promise<Business> {
  const res = await fetch(`${API_URL}/api/businesses`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(business),
  })

  if (!res.ok) {
    throw new Error(`Failed to register business: ${res.statusText}`)
  }

  return res.json()
}

export async function getJob(id: string): Promise<Job> {
  const res = await fetch(`${API_URL}/api/jobs/${id}`, {
    headers: { 'Content-Type': 'application/json' },
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch job: ${res.statusText}`)
  }

  return res.json()
}

export async function getSkillsGap(token: string | null, jobId: string): Promise<SkillsGapResponse> {
  const res = await fetch(`${API_URL}/api/jobs/${jobId}/skills-gap`, {
    method: 'POST',
    headers: authHeaders(token),
  })

  if (!res.ok) {
    throw new Error(`Failed to get skills gap: ${res.statusText}`)
  }

  return res.json()
}

export async function getSalaryInsight(
  role: string,
  location: string,
  skills: string[]
): Promise<SalaryInsightResponse> {
  const res = await fetch(`${API_URL}/api/insights/salary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role, location, skills }),
  })

  if (!res.ok) {
    throw new Error(`Failed to get salary insight: ${res.statusText}`)
  }

  return res.json()
}

export async function importResume(token: string | null, file: File): Promise<Profile> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${API_URL}/api/resume/import`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  })

  if (!res.ok) {
    throw new Error(`Failed to import resume: ${res.statusText}`)
  }

  return res.json()
}

export async function generateResume(token: string | null): Promise<Blob> {
  const res = await fetch(`${API_URL}/api/resume/generate`, {
    headers: authHeaders(token),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Failed to generate resume: ${text || res.statusText}`)
  }

  return res.blob()
}

export async function generateCoverLetter(
  token: string | null,
  jobId: string
): Promise<CoverLetterResponse> {
  const res = await fetch(`${API_URL}/api/resume/cover-letter`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ job_id: jobId }),
  })

  if (!res.ok) {
    throw new Error(`Failed to generate cover letter: ${res.statusText}`)
  }

  return res.json()
}

// Streaming helper: reads SSE chunks from a ReadableStream, calls onChunk with each text piece,
// and resolves with the final accumulated text when [DONE] is received.
export async function readSSEStream(
  response: Response,
  onChunk: (text: string) => void
): Promise<string> {
  if (!response.body) throw new Error('No response body')
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let accumulated = ''
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const parts = buffer.split('\n\n')
    buffer = parts.pop() ?? ''

    for (const part of parts) {
      for (const line of part.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue
        const data = trimmed.slice(5).trim()
        if (data === '[DONE]') return accumulated
        if (data.startsWith('[ERROR]')) throw new Error(data.slice(7).trim())
        accumulated += data
        onChunk(accumulated)
      }
    }
  }

  return accumulated
}

export async function streamCounsel(
  token: string | null,
  onChunk: (text: string) => void
): Promise<string> {
  const response = await fetch(`${API_URL}/api/counsel/stream`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({}),
  })

  if (!response.ok) {
    throw new Error(`Failed to stream counsel: ${response.statusText}`)
  }

  return readSSEStream(response, onChunk)
}

export async function streamCoverLetter(
  token: string | null,
  jobId: string,
  onChunk: (text: string) => void
): Promise<string> {
  const response = await fetch(`${API_URL}/api/resume/cover-letter/stream`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ job_id: jobId }),
  })

  if (!response.ok) {
    throw new Error(`Failed to stream cover letter: ${response.statusText}`)
  }

  return readSSEStream(response, onChunk)
}

export async function getInterviewPrep(
  token: string,
  jobId: string
): Promise<InterviewPrepResponse> {
  const res = await fetch(`${API_URL}/api/jobs/${jobId}/interview-prep`, {
    method: 'POST',
    headers: authHeaders(token),
  })

  if (!res.ok) {
    throw new Error(`Failed to get interview prep: ${res.statusText}`)
  }

  return res.json()
}

export async function translateJobJargon(
  jobId: string,
  language: string = 'English'
): Promise<JargonTranslationResponse> {
  const res = await fetch(`${API_URL}/api/jobs/${jobId}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language }),
  })

  if (!res.ok) {
    throw new Error(`Failed to translate jargon: ${res.statusText}`)
  }

  return res.json()
}

export async function getFirstWeekPrep(
  token: string | null,
  jobId: string
): Promise<FirstWeekPrepResponse> {
  const res = await fetch(`${API_URL}/api/jobs/${jobId}/first-week-prep`, {
    method: 'POST',
    headers: authHeaders(token),
  })

  if (!res.ok) {
    throw new Error(`Failed to get first week prep: ${res.statusText}`)
  }

  return res.json()
}

export async function setUserRole(token: string | null, role: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/auth/set-role`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ role }),
  })

  if (!res.ok) {
    throw new Error(`Failed to set role: ${res.statusText}`)
  }
}

export async function getQuizQuestion(
  category?: string,
  language: string = 'English'
): Promise<QuizQuestion> {
  const res = await fetch(`${API_URL}/api/quiz/question`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category, language }),
  })

  if (!res.ok) {
    throw new Error(`Failed to get quiz question: ${res.statusText}`)
  }

  return res.json()
}

export async function evaluateQuizAnswer(
  question: string,
  options: string[],
  selected_answer: string,
  language: string = 'English'
): Promise<QuizEvaluationResponse> {
  const res = await fetch(`${API_URL}/api/quiz/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, options, selected_answer, language }),
  })

  if (!res.ok) {
    throw new Error(`Failed to evaluate answer: ${res.statusText}`)
  }

  return res.json()
}

export async function getPersonalJobs(token: string | null): Promise<Job[]> {
  const res = await fetch(`${API_URL}/api/jobs/personal`, {
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error(`Failed to fetch tracked jobs: ${res.statusText}`)
  const data = await res.json()
  return data.jobs
}

export async function createPersonalJob(token: string | null, job: PostJobPayload): Promise<Job> {
  const res = await fetch(`${API_URL}/api/jobs/personal`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(job),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Failed to create tracked job')
  }
  return res.json()
}

export async function deletePersonalJob(token: string | null, jobId: string): Promise<void> {
  const headers: HeadersInit = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API_URL}/api/jobs/personal/${jobId}`, {
    method: 'DELETE',
    headers,
  })
  if (!res.ok) throw new Error('Failed to delete tracked job')
}

export async function updateJobStatus(token: string | null, jobId: string, status: string): Promise<Job> {
  const res = await fetch(`${API_URL}/api/jobs/personal/${jobId}/status`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ status }),
  })
  if (!res.ok) throw new Error('Failed to update job status')
  return res.json()
}

export async function generateOutreachMessage(token: string | null, jobId: string): Promise<OutreachResponse> {
  const res = await fetch(`${API_URL}/api/jobs/${jobId}/outreach`, {
    method: 'POST',
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error(`Failed to generate outreach message: ${res.statusText}`)
  return res.json()
}

export async function generateOutreachFromText(
  token: string | null,
  jobTitle: string,
  jobDescription: string,
  companyName?: string
): Promise<OutreachResponse> {
  const res = await fetch(`${API_URL}/api/outreach`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ job_title: jobTitle, job_description: jobDescription, company_name: companyName }),
  })
  if (!res.ok) throw new Error(`Failed to generate outreach message: ${res.statusText}`)
  return res.json()
}

export async function explainPaycheck(
  token: string | null,
  salary: number,
  province: string
): Promise<PaycheckExplanation> {
  const res = await fetch(`${API_URL}/api/paycheck/explain`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ salary, province }),
  })
  if (!res.ok) throw new Error(`Failed to explain paycheck: ${res.statusText}`)
  return res.json()
}
