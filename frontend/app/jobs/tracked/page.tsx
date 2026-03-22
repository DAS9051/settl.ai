'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, useUser } from '@clerk/nextjs'
import { getPersonalJobs, createPersonalJob, deletePersonalJob, updateJobStatus } from '@/lib/api'
import type { Job } from '@/lib/types'

const inputClass =
  'w-full border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal'

export default function TrackedJobsPage() {
  const { getToken } = useAuth()
  const { user, isLoaded } = useUser()
  const router = useRouter()

  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [salaryRange, setSalaryRange] = useState('')
  const [skillsInput, setSkillsInput] = useState('')

  useEffect(() => {
    async function load() {
      if (!isLoaded) return
      if (!user) { setLoading(false); return }
      try {
        const token = await getToken()
        setJobs(await getPersonalJobs(token))
      } catch {
        setError('Failed to load tracked jobs.')
      } finally {
        setLoading(false)
      }
    }
    load()
  // getToken is a stable Clerk reference — intentionally omitted from deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user])

  if (isLoaded && !user) {
    return (
      <div className="text-center py-16 text-gray-500">
        Please sign in to track jobs.
      </div>
    )
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const token = await getToken()
      const job = await createPersonalJob(token, {
        title: title.trim(),
        company_name: companyName.trim() || null,
        description: description.trim(),
        location: location.trim() || 'Unknown',
        salary_range: salaryRange.trim() || null,
        skills_required: skillsInput.split(',').map(s => s.trim()).filter(Boolean),
      })
      setJobs(prev => [job, ...prev])
      setShowForm(false)
      setTitle(''); setCompanyName(''); setDescription(''); setLocation(''); setSalaryRange(''); setSkillsInput('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add job')
    } finally {
      setSubmitting(false)
    }
  }

  const STATUS_OPTIONS = ['Saved', 'Applied', 'Interview', 'Offer', 'Rejected']
  const STATUS_COLORS: Record<string, string> = {
    Saved: 'bg-gray-100 text-gray-600',
    Applied: 'bg-blue-100 text-blue-700',
    Interview: 'bg-purple-100 text-purple-700',
    Offer: 'bg-green-100 text-green-700',
    Rejected: 'bg-red-100 text-red-600',
  }

  async function handleStatusChange(jobId: string, newStatus: string) {
    if (updatingStatusId === jobId) return
    setUpdatingStatusId(jobId)
    setError(null)
    try {
      const token = await getToken()
      const updated = await updateJobStatus(token, jobId, newStatus)
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: updated.status } : j))
    } catch {
      setError('Failed to update status.')
    } finally {
      setUpdatingStatusId(null)
    }
  }

  async function handleDelete(jobId: string) {
    setDeletingId(jobId)
    try {
      const token = await getToken()
      await deletePersonalJob(token, jobId)
      setJobs(prev => prev.filter(j => j.id !== jobId))
    } catch {
      setError('Failed to delete job.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Job Tracker</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track jobs from anywhere — use all AI features like interview prep and skills gap analysis
          </p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="px-4 py-2 bg-brand-navy text-white rounded-lg text-sm font-semibold hover:bg-brand-navy-light transition-colors"
        >
          {showForm ? 'Cancel' : '+ Track a Job'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-600 mb-4">
          {error}
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <form
          onSubmit={handleAdd}
          className="bg-white rounded-xl border border-gray-200 p-6 mb-6 space-y-4 shadow-sm"
        >
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Add a Job to Track</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
            <input
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Cashier, Delivery Driver, Software Engineer"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
            <input
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              placeholder="e.g. Amazon, Tim Hortons"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Job Description *</label>
            <textarea
              required
              rows={5}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Paste the full job description here for the best AI analysis..."
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Toronto, ON or Remote"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salary Range</label>
              <input
                value={salaryRange}
                onChange={e => setSalaryRange(e.target.value)}
                placeholder="e.g. $80,000 - $100,000"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Required Skills</label>
            <input
              value={skillsInput}
              onChange={e => setSkillsInput(e.target.value)}
              placeholder="e.g. Customer Service, Driving, Food Handling (comma-separated)"
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-brand-navy text-white rounded-lg text-sm font-semibold hover:bg-brand-navy-light transition-colors disabled:opacity-50"
          >
            {submitting ? 'Adding...' : 'Add to Tracker'}
          </button>
        </form>
      )}

      {/* Job list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-2/3 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center shadow-sm">
          <div className="text-4xl mb-4">📋</div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">No tracked jobs yet</h2>
          <p className="text-sm text-gray-500 mb-5">
            Add any job from the internet and use AI-powered interview prep, skills gap analysis, cover letters, and more.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-2 bg-brand-navy text-white rounded-lg text-sm font-semibold hover:bg-brand-navy-light transition-colors"
          >
            + Track Your First Job
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map(job => (
            <div
              key={job.id}
              className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:border-brand-teal transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs bg-brand-teal-light/30 text-brand-teal-dark font-medium px-2 py-0.5 rounded-full">
                      Personal
                    </span>
                    {job.location && (
                      <span className="text-xs text-gray-400">{job.location}</span>
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 truncate">{job.title}</h3>
                  {job.company_name && (
                    <p className="text-sm text-brand-teal font-medium mt-0.5 truncate dark:text-brand-sage">{job.company_name}</p>
                  )}
                  {job.salary_range && (
                    <p className="text-xs text-gray-500 mt-0.5">{job.salary_range}</p>
                  )}
                  {job.skills_required.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {job.skills_required.slice(0, 5).map(skill => (
                        <span key={skill} className="text-xs bg-brand-cream-light text-brand-navy px-2 py-0.5 rounded-full">
                          {skill}
                        </span>
                      ))}
                      {job.skills_required.length > 5 && (
                        <span className="text-xs text-gray-400">+{job.skills_required.length - 5} more</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={job.status || 'Saved'}
                    onChange={e => handleStatusChange(job.id, e.target.value)}
                    disabled={updatingStatusId === job.id}
                    className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50 ${STATUS_COLORS[job.status || 'Saved'] || STATUS_COLORS.Saved}`}
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => router.push(`/jobs/${job.id}`)}
                    className="px-3 py-1.5 text-xs font-semibold text-brand-navy border border-brand-teal/40 rounded-lg hover:bg-brand-cream-light transition-colors"
                  >
                    AI Tools →
                  </button>
                  <button
                    onClick={() => handleDelete(job.id)}
                    disabled={deletingId === job.id}
                    className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-red-500 border border-gray-200 rounded-lg hover:border-red-200 transition-colors disabled:opacity-50"
                  >
                    {deletingId === job.id ? '...' : 'Remove'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
