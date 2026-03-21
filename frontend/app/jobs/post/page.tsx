'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, useUser } from '@clerk/nextjs'
import { postJob } from '@/lib/api'

const inputClass =
  'w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-600'

const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5'

export default function PostJobPage() {
  const router = useRouter()
  const { getToken } = useAuth()
  const { user, isLoaded } = useUser()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [salaryRange, setSalaryRange] = useState('')
  const [skillsInput, setSkillsInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isBusinessUser =
    isLoaded &&
    user !== null &&
    (user.publicMetadata as { role?: string })?.role === 'business'

  if (isLoaded && !user) {
    return (
      <div className="text-center py-16 text-gray-500 dark:text-gray-400">
        Please sign in to post a job.
      </div>
    )
  }

  if (isLoaded && !isBusinessUser) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-3">Business Account Required</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
          Only verified business accounts can post jobs. Register your business first.
        </p>
        <a
          href="/business/register"
          className="px-6 py-2 bg-blue-800 dark:bg-blue-700 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
        >
          Register a Business
        </a>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const token = await getToken()
      const skills = skillsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)

      await postJob(token, {
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        salary_range: salaryRange.trim(),
        skills_required: skills,
      })

      router.push('/jobs')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post job')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Post a Job</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Fill in the details for your job listing</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 space-y-5 shadow-sm"
      >
        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-4 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div>
          <label className={labelClass}>
            Job Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Frontend Developer"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the role, responsibilities, and requirements..."
            className={`${inputClass} resize-none`}
          />
        </div>

        <div>
          <label className={labelClass}>
            Location <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Austin, TX or Remote"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>
            Salary Range
          </label>
          <input
            type="text"
            value={salaryRange}
            onChange={(e) => setSalaryRange(e.target.value)}
            placeholder="e.g. $60,000 - $80,000"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>
            Required Skills
          </label>
          <input
            type="text"
            value={skillsInput}
            onChange={(e) => setSkillsInput(e.target.value)}
            placeholder="e.g. React, TypeScript, Node.js (comma-separated)"
            className={inputClass}
          />
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Separate multiple skills with commas</p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-blue-800 dark:bg-blue-700 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Posting...' : 'Post Job'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/jobs')}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
