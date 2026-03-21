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
