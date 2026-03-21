export interface Job {
  id: string
  business_id: string
  title: string
  description: string
  location: string
  salary_range: string | null
  skills_required: string[]
  verified: boolean
  created_at: string
  business_name?: string
}

export interface EducationEntry {
  school: string
  degree: string
  year: string
}

export interface ExperienceEntry {
  company: string
  role: string
  start_year: string
  end_year: string
  description: string
}

export interface Profile {
  skills: string[]
  education: EducationEntry[]
  certifications: string[]
  experience: ExperienceEntry[]
  target_roles: string[]
}

export interface CounselResponse {
  roadmap: string[]
  current_matches: Job[]
  board_recommendations: string[]
}

export interface Business {
  id: string
  name: string
  contact_email: string
  verified: boolean
  created_at: string
}

export interface JobFilters {
  skill?: string
  location?: string
}

export interface PostJobPayload {
  title: string
  description: string
  location: string
  salary_range: string
  skills_required: string[]
}

export interface RegisterBusinessPayload {
  name: string
  contact_email: string
}
