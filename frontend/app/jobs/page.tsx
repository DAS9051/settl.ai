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
        className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-col sm:flex-row gap-3 shadow-sm"
      >
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Filter by skill (e.g. React)"
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            className="w-full border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <input
            type="text"
            placeholder="Filter by location (e.g. Austin)"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="w-full border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
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
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-2 flex-1">
                    <div className="h-5 bg-gray-200 rounded w-3/4" />
                    <div className="h-3.5 bg-gray-100 rounded w-1/3" />
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="h-3 bg-gray-100 rounded w-full" />
                  <div className="h-3 bg-gray-100 rounded w-5/6" />
                  <div className="h-3 bg-gray-100 rounded w-4/6" />
                </div>
                <div className="flex gap-2">
                  <div className="h-5 bg-blue-50 rounded-full w-16" />
                  <div className="h-5 bg-blue-50 rounded-full w-20" />
                  <div className="h-5 bg-blue-50 rounded-full w-14" />
                </div>
              </div>
            ))}
          </div>
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
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-700 font-medium text-sm mb-1">No jobs found</p>
          <p className="text-gray-400 text-xs mb-4">No listings match your current filters.</p>
          <button
            onClick={handleClear}
            className="text-sm text-blue-700 underline"
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
