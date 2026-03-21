'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth, useUser } from '@clerk/nextjs'
import { getJob, getSkillsGap, getSalaryInsight, streamCoverLetter, getInterviewPrep } from '@/lib/api'
import type { Job, SkillsGapResponse, SalaryInsightResponse, InterviewPrepResponse } from '@/lib/types'

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { getToken } = useAuth()
  const { isSignedIn } = useUser()

  const [job, setJob] = useState<Job | null>(null)
  const [jobLoading, setJobLoading] = useState(true)
  const [jobError, setJobError] = useState<string | null>(null)

  // Skills gap
  const [gapLoading, setGapLoading] = useState(false)
  const [gapError, setGapError] = useState<string | null>(null)
  const [gap, setGap] = useState<SkillsGapResponse | null>(null)

  // Salary insight
  const [salaryOpen, setSalaryOpen] = useState(false)
  const [salaryLoading, setSalaryLoading] = useState(false)
  const [salaryError, setSalaryError] = useState<string | null>(null)
  const [salary, setSalary] = useState<SalaryInsightResponse | null>(null)

  // Cover letter — streaming
  const [clLoading, setClLoading] = useState(false)
  const [clError, setClError] = useState<string | null>(null)
  const [coverLetterText, setCoverLetterText] = useState<string | null>(null)
  const [clStreaming, setClStreaming] = useState(false)
  const [clCopied, setClCopied] = useState(false)

  // Interview prep
  const [prepLoading, setPrepLoading] = useState(false)
  const [prepError, setPrepError] = useState<string | null>(null)
  const [prep, setPrep] = useState<InterviewPrepResponse | null>(null)
  const [openQuestions, setOpenQuestions] = useState<Set<number>>(new Set())

  useEffect(() => {
    async function load() {
      setJobLoading(true)
      setJobError(null)
      try {
        const data = await getJob(id)
        setJob(data)
      } catch (err) {
        setJobError(err instanceof Error ? err.message : 'Failed to load job')
      } finally {
        setJobLoading(false)
      }
    }
    load()
  }, [id])

  async function handleSkillsGap() {
    setGapLoading(true)
    setGapError(null)
    setGap(null)
    try {
      const token = await getToken()
      const data = await getSkillsGap(token, id)
      setGap(data)
    } catch (err) {
      setGapError(err instanceof Error ? err.message : 'Failed to analyze skills gap')
    } finally {
      setGapLoading(false)
    }
  }

  async function handleSalaryInsight() {
    if (!job) return
    setSalaryLoading(true)
    setSalaryError(null)
    setSalary(null)
    try {
      const data = await getSalaryInsight(job.title, job.location, job.skills_required)
      setSalary(data)
    } catch (err) {
      setSalaryError(err instanceof Error ? err.message : 'Failed to get salary insight')
    } finally {
      setSalaryLoading(false)
    }
  }

  async function handleCoverLetter() {
    setClLoading(true)
    setClStreaming(true)
    setClError(null)
    setCoverLetterText('')
    try {
      const token = await getToken()
      const finalText = await streamCoverLetter(token, id, (accumulated) => {
        setCoverLetterText(accumulated)
      })
      setCoverLetterText(finalText)
    } catch (err) {
      setClError(err instanceof Error ? err.message : 'Failed to generate cover letter')
      setCoverLetterText(null)
    } finally {
      setClLoading(false)
      setClStreaming(false)
    }
  }

  function handleCopyLetter() {
    if (!coverLetterText) return
    navigator.clipboard.writeText(coverLetterText).then(() => {
      setClCopied(true)
      setTimeout(() => setClCopied(false), 2000)
    })
  }

  async function handleInterviewPrep() {
    setPrepLoading(true)
    setPrepError(null)
    setPrep(null)
    setOpenQuestions(new Set())
    try {
      const token = await getToken()
      if (!token) throw new Error('Not authenticated')
      const data = await getInterviewPrep(token, id)
      setPrep(data)
    } catch (err) {
      setPrepError(err instanceof Error ? err.message : 'Failed to load interview prep')
    } finally {
      setPrepLoading(false)
    }
  }

  function toggleQuestion(idx: number) {
    setOpenQuestions((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) {
        next.delete(idx)
      } else {
        next.add(idx)
      }
      return next
    })
  }

  if (jobLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">
        <Spinner />
        <span className="ml-2">Loading job...</span>
      </div>
    )
  }

  if (jobError || !job) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600 text-sm font-medium">{jobError ?? 'Job not found'}</p>
        <Link href="/jobs" className="mt-3 inline-block text-sm text-red-600 underline">
          Back to Jobs
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back */}
      <Link
        href="/jobs"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-800 mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Jobs
      </Link>

      {/* Header card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4 shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">{job.title}</h1>
            {job.business_name && (
              <p className="text-base text-blue-700 font-medium mt-1">{job.business_name}</p>
            )}
          </div>
          {job.verified && (
            <span className="shrink-0 inline-flex items-center gap-1 text-xs font-medium bg-green-100 text-green-700 px-2 py-1 rounded-full">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Verified
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {job.location}
          </span>
          {job.salary_range && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {job.salary_range}
            </span>
          )}
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {new Date(job.created_at).toLocaleDateString()}
          </span>
        </div>

        {/* Skills */}
        {job.skills_required.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Skills Required</p>
            <div className="flex flex-wrap gap-2">
              {job.skills_required.map((skill) => (
                <span key={skill} className="text-xs font-medium bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-100">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Description</p>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{job.description}</p>
        </div>

        {/* Apply button */}
        <div className="mt-6">
          {(job as Job & { apply_url?: string }).apply_url ? (
            <a
              href={(job as Job & { apply_url?: string }).apply_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-2.5 bg-blue-800 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Apply Now
            </a>
          ) : (
            <p className="text-sm text-gray-500 italic">Contact the business directly to apply.</p>
          )}
        </div>
      </div>

      {/* Salary Insight */}
      <div className="bg-white rounded-xl border border-gray-200 mb-4 overflow-hidden shadow-sm">
        <button
          onClick={() => {
            setSalaryOpen((prev) => !prev)
            if (!salaryOpen && !salary) handleSalaryInsight()
          }}
          className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-900">Salary Insight</span>
          </div>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${salaryOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {salaryOpen && (
          <div className="px-6 pb-6 border-t border-gray-100">
            {salaryLoading ? (
              <div className="flex items-center gap-2 py-4 text-gray-400 text-sm">
                <Spinner /> Fetching salary data...
              </div>
            ) : salaryError ? (
              <div className="py-4">
                <p className="text-sm text-red-600 mb-2">{salaryError}</p>
                <button onClick={handleSalaryInsight} className="text-sm text-blue-700 underline">
                  Retry
                </button>
              </div>
            ) : salary ? (
              <div className="pt-4">
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  ${salary.estimated_min.toLocaleString()} – ${salary.estimated_max.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 mb-3">
                  Median: <span className="font-medium text-gray-700">${salary.median.toLocaleString()}</span>
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">{salary.notes}</p>
              </div>
            ) : (
              <div className="py-4">
                <button
                  onClick={handleSalaryInsight}
                  className="px-4 py-2 bg-blue-800 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                  Get Salary Estimate
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Skills Gap — signed-in only */}
      {isSignedIn && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-gray-900">Skills Gap Analysis</h2>
          </div>
          <button
            onClick={handleSkillsGap}
            disabled={gapLoading}
            className="px-4 py-2 bg-blue-800 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {gapLoading ? (
              <>
                <Spinner /> Analyzing...
              </>
            ) : (
              'Analyze Skills Gap'
            )}
          </button>

          {gapError && (
            <p className="mt-3 text-sm text-red-600">{gapError}</p>
          )}

          {gap && (
            <div className="mt-5 space-y-4">
              {gap.matching_skills.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Matching Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {gap.matching_skills.map((s) => (
                      <span key={s} className="text-xs font-medium bg-green-100 text-green-800 px-2.5 py-1 rounded-full border border-green-200">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {gap.missing_skills.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Missing Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {gap.missing_skills.map((s) => (
                      <span key={s} className="text-xs font-medium bg-red-100 text-red-800 px-2.5 py-1 rounded-full border border-red-200">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Analysis</p>
                <p className="text-sm text-gray-700 leading-relaxed">{gap.gap_analysis}</p>
              </div>

              {gap.recommendations.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Recommendations</p>
                  <ol className="space-y-2">
                    {gap.recommendations.map((r, i) => (
                      <li key={i} className="flex gap-3 text-sm text-gray-700">
                        <span className="shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs">
                          {i + 1}
                        </span>
                        <span className="leading-relaxed pt-0.5">{r}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}

          {/* Interview Prep button — below skills gap */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center">
                <svg className="w-4 h-4 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900">Interview Prep</h3>
            </div>
            <button
              onClick={handleInterviewPrep}
              disabled={prepLoading}
              className="px-4 py-2 bg-sky-700 text-white rounded-lg text-sm font-semibold hover:bg-sky-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {prepLoading ? (
                <>
                  <Spinner /> Loading questions...
                </>
              ) : (
                'Generate Interview Questions'
              )}
            </button>

            {prepError && (
              <p className="mt-3 text-sm text-red-600">{prepError}</p>
            )}

            {prep && prep.questions.length > 0 && (
              <div className="mt-4 space-y-3">
                {prep.questions.map((q, idx) => (
                  <div
                    key={idx}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => toggleQuestion(idx)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-sm font-semibold text-gray-900 pr-4">{q.question}</span>
                      <ChevronDown open={openQuestions.has(idx)} />
                    </button>
                    {openQuestions.has(idx) && (
                      <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{q.answer_framework}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cover Letter — signed-in only */}
      {isSignedIn && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-gray-900">Cover Letter</h2>
            </div>
            <Link
              href={`/cover-letter/${job.id}`}
              className="text-xs text-blue-700 underline hover:text-blue-900"
            >
              Open full page
            </Link>
          </div>

          <button
            onClick={handleCoverLetter}
            disabled={clLoading}
            className="px-4 py-2 bg-blue-800 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {clLoading ? (
              <>
                <Spinner /> Generating...
              </>
            ) : (
              'Generate Cover Letter'
            )}
          </button>

          {clError && (
            <p className="mt-3 text-sm text-red-600">{clError}</p>
          )}

          {coverLetterText !== null && (
            <div className="mt-4">
              <div className="relative">
                <textarea
                  readOnly
                  value={coverLetterText}
                  rows={12}
                  className="w-full border border-gray-200 rounded-lg p-4 text-sm text-gray-800 font-mono bg-gray-50 resize-none focus:outline-none"
                />
                {clStreaming && (
                  <span className="absolute bottom-5 left-4 inline-block w-0.5 h-4 bg-blue-600 animate-pulse" />
                )}
              </div>
              {!clStreaming && coverLetterText && (
                <button
                  onClick={handleCopyLetter}
                  className="mt-2 px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  {clCopied ? 'Copied!' : 'Copy to Clipboard'}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
