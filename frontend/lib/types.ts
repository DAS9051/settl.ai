export interface Job {
  id: string
  business_id?: string | null
  business_name?: string
  clerk_user_id?: string | null
  is_personal?: boolean
  title: string
  description: string
  location: string
  salary_range: string | null
  skills_required: string[]
  application_link?: string | null
  company_name?: string | null
  category?: string
  verified: boolean
  created_at: string
  status?: string
}

export interface EducationEntry {
  school: string
  degree: string
  year?: string
}

export interface ExperienceEntry {
  company: string
  role: string
  start_year: string
  end_year?: string
  description?: string
}

export interface Profile {
  skills: string[]
  education: EducationEntry[]
  certifications: string[]
  experience: ExperienceEntry[]
  target_roles: string[]
  preferred_language: string
  province: string
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
  business_number?: string | null
  verified: boolean
  created_at: string
}

export interface JobFilters {
  skill?: string
  location?: string
  category?: string
}

export interface PostJobPayload {
  title: string
  description: string
  location: string
  salary_range: string | null
  skills_required: string[]
  application_link?: string | null
  company_name?: string | null
  category?: string
}

export interface RegisterBusinessPayload {
  name: string
  contact_email: string
  business_number?: string
}

export interface SkillsGapResponse {
  missing_skills: string[]
  matching_skills: string[]
  gap_analysis: string
  recommendations: string[]
}

export interface SalaryInsightResponse {
  role: string
  location: string
  estimated_min: number
  estimated_max: number
  median: number
  notes: string
}

export interface CoverLetterResponse {
  cover_letter: string
}

export interface InterviewQuestion {
  question: string
  answer_framework: string
}

export interface InterviewPrepResponse {
  questions: InterviewQuestion[]
}

export interface GlossaryTerm {
  term: string
  explanation: string
}

export interface JargonTranslationResponse {
  original: string
  translated: string
  glossary: GlossaryTerm[]
}

export interface FirstWeekPrepResponse {
  tips: string[]
}

export interface QuizQuestion {
  question: string
  options: string[]
  category: string
}

export interface QuizEvaluationResponse {
  correct: boolean
  correct_answer: string
  feedback: string
}

export interface OutreachResponse {
  subject: string
  body: string
}

export interface PaycheckDeduction {
  name: string
  amount: number
  explanation: string
}

export interface PaycheckExplanation {
  gross: number
  estimated_net: number
  deductions: PaycheckDeduction[]
  plain_summary: string
}
