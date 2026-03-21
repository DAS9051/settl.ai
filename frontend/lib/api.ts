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
} from './types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

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
