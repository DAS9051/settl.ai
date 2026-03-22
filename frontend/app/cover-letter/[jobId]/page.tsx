'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth, useUser } from '@clerk/nextjs'
import { getJob, streamCoverLetter } from '@/lib/api'
import type { Job } from '@/lib/types'

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}

export default function CoverLetterPage() {
  const { jobId } = useParams<{ jobId: string }>()
  const { getToken } = useAuth()
  const { isSignedIn } = useUser()

  const [job, setJob] = useState<Job | null>(null)
  const [jobLoading, setJobLoading] = useState(true)

  const [clLoading, setClLoading] = useState(false)
  const [clError, setClError] = useState<string | null>(null)
  const [coverLetter, setCoverLetter] = useState<string>('')
  const [streaming, setStreaming] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function loadJob() {
      try {
        const data = await getJob(jobId)
        setJob(data)
      } catch {
        // Job info is best-effort for context
      } finally {
        setJobLoading(false)
      }
    }
    loadJob()
  }, [jobId])

  const generate = useCallback(async () => {
    setClLoading(true)
    setClError(null)
    setCoverLetter('')
    setStreaming(true)
    try {
      const token = await getToken()
      await streamCoverLetter(token, jobId, (text) => setCoverLetter(text))
    } catch (err) {
      setClError(err instanceof Error ? err.message : 'Failed to generate cover letter')
    } finally {
      setClLoading(false)
      setStreaming(false)
    }
  }, [getToken, jobId])

  // Auto-generate on mount once signed in
  useEffect(() => {
    if (isSignedIn && !jobLoading) {
      generate()
    }
  }, [isSignedIn, jobLoading, generate])

  function handleCopy() {
    if (!coverLetter) return
    navigator.clipboard.writeText(coverLetter).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (!isSignedIn) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <p className="text-gray-600">Please sign in to generate a cover letter.</p>
        <Link href="/sign-in" className="mt-3 inline-block text-brand-teal underline text-sm">
          Sign In
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back */}
      <Link
        href={`/jobs/${jobId}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-navy mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Job
      </Link>

      {/* Context header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Cover Letter</h1>
        {!jobLoading && job && (
          <p className="text-sm text-gray-500 mt-1">
            For <span className="font-medium text-brand-teal">{job.title}</span>
            {job.business_name && (
              <> at <span className="font-medium text-gray-700">{job.business_name}</span></>
            )}
          </p>
        )}
      </div>

      {/* Error */}
      {clError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600 mb-4">
          {clError}
        </div>
      )}

      {/* Loading */}
      {clLoading && (
        <div className="flex items-center gap-2 py-8 text-gray-400 text-sm">
          <Spinner /> Generating your cover letter...
        </div>
      )}

      {/* Cover letter display */}
      {coverLetter && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-4">
          {/* Letter paper styling */}
          <div className="px-10 py-10" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            {coverLetter
              .split(/\n{2,}/)
              .filter(p => p.trim())
              .map((para, i) => {
                const lines = para.split('\n').filter(l => l.trim())
                const isLastPara = i === coverLetter.split(/\n{2,}/).filter(p => p.trim()).length - 1
                return (
                  <p
                    key={i}
                    className="text-gray-800 leading-relaxed mb-5 last:mb-0"
                    style={{ fontSize: '15px' }}
                  >
                    {lines.map((line, j) => (
                      <span key={j}>
                        {line}
                        {j < lines.length - 1 && <br />}
                      </span>
                    ))}
                    {isLastPara && streaming && <span className="animate-pulse ml-0.5">|</span>}
                  </p>
                )
              })}
            {streaming && coverLetter.endsWith('\n') && (
              <span className="animate-pulse text-gray-800" style={{ fontSize: '15px' }}>|</span>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      {!clLoading && (
        <div className="flex flex-wrap gap-3">
          {coverLetter && !streaming && (
            <button
              onClick={handleCopy}
              className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </button>
          )}
          <button
            onClick={generate}
            disabled={clLoading}
            className="px-4 py-2 bg-brand-navy text-white rounded-lg text-sm font-semibold hover:bg-brand-navy-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {clLoading ? (
              <>
                <Spinner /> Generating...
              </>
            ) : (
              'Regenerate'
            )}
          </button>
        </div>
      )}
    </div>
  )
}
