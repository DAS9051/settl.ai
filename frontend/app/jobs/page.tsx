'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { getJobs } from '@/lib/api'
import type { Job, JobFilters } from '@/lib/types'
import JobCard from '@/components/JobCard'

export default function JobsPage() {
  const { user, isLoaded } = useUser()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [skillFilter, setSkillFilter] = useState('')
  const [locationFilter, setLocationFilter] = useState('')

  const isBusinessUser =
    isLoaded &&
    user !== null &&
    (user.publicMetadata as { role?: string })?.role === 'business'

  const fetchJobs = useCallback(async (filters?: JobFilters) => {
    setLoading(true)
    setError(null)
    try {
      const data = await getJobs(filters)
      setJobs(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    fetchJobs({
      skill: skillFilter.trim() || undefined,
      location: locationFilter.trim() || undefined,
    })
  }

  function handleClear() {
    setSkillFilter('')
    setLocationFilter('')
    fetchJobs()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Job Board</h1>
          <p className="text-sm text-gray-500 mt-1">Browse local business opportunities</p>
        </div>
        {isBusinessUser && (
          <Link
            href="/jobs/post"
            className="px-4 py-2 bg-blue-800 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            + Post a Job
          </Link>
        )}
      </div>

      {/* Filters */}
      <form
        onSubmit={handleSearch}
        className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-col sm:flex-row gap-3"
      >
        <input
          type="text"
          placeholder="Filter by skill (e.g. React)"
          value={skillFilter}
          onChange={(e) => setSkillFilter(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <input
          type="text"
          placeholder="Filter by location (e.g. Austin)"
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <button
          type="submit"
          className="px-5 py-2 bg-blue-800 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          Search
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="px-5 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
        >
          Clear
        </button>
      </form>

      {/* Job List */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <svg
            className="animate-spin w-6 h-6 mr-2"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
          Loading jobs...
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 text-sm font-medium">{error}</p>
          <button
            onClick={() => fetchJobs()}
            className="mt-3 text-sm text-red-600 underline"
          >
            Try again
          </button>
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500 text-sm">No jobs found matching your filters.</p>
          <button
            onClick={handleClear}
            className="mt-3 text-sm text-blue-700 underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  )
}
