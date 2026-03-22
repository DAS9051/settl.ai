'use client'

import { useState } from 'react'
import { useAuth, useUser } from '@clerk/nextjs'
import { generateOutreachFromText } from '@/lib/api'
import type { OutreachResponse } from '@/lib/types'

const inputClass =
  'w-full border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/40 dark:bg-brand-navy-dark dark:border-brand-teal/30 dark:text-brand-cream dark:placeholder-brand-sage/60'

export default function OutreachPage() {
  const { getToken } = useAuth()
  const { user, isLoaded } = useUser()

  const [jobTitle, setJobTitle] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<OutreachResponse | null>(null)
  const [copied, setCopied] = useState(false)

  if (isLoaded && !user) {
    return (
      <div className="text-center py-16 text-gray-500 dark:text-brand-sage">
        Please <a href="/sign-in" className="text-brand-teal underline">sign in</a> to use the Email Helper.
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!jobDescription.trim() || !jobTitle.trim()) {
      setError('Please fill in the job title and description.')
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const token = await getToken()
      const data = await generateOutreachFromText(token, jobTitle.trim(), jobDescription.trim(), companyName.trim() || undefined)
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate email.')
    } finally {
      setLoading(false)
    }
  }

  function handleCopy() {
    if (!result) return
    navigator.clipboard.writeText(`Subject: ${result.subject}\n\n${result.body}`).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-navy dark:text-brand-cream mb-2">Email Helper</h1>
        <p className="text-gray-500 text-sm dark:text-brand-sage">
          Paste any job posting and get a professional cold outreach email — tailored to your profile and culturally appropriate for Canadian employers.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4 mb-6 dark:bg-brand-navy-dark dark:border-brand-teal/30"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-brand-cream/80">Job Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Customer Service Representative"
              value={jobTitle}
              onChange={e => setJobTitle(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-brand-cream/80">Company Name (optional)</label>
            <input
              type="text"
              placeholder="e.g. Tim Hortons"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-brand-cream/80">Job Description *</label>
          <textarea
            required
            rows={8}
            placeholder="Paste the full job posting here..."
            value={jobDescription}
            onChange={e => setJobDescription(e.target.value)}
            className={`${inputClass} resize-none`}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-brand-navy text-white rounded-lg text-sm font-semibold hover:bg-brand-navy-light transition-colors disabled:opacity-50"
        >
          {loading ? 'Writing your email...' : 'Generate Outreach Email'}
        </button>
      </form>

      {result && (
        <div className="space-y-3">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4 dark:bg-brand-navy-dark dark:border-brand-teal/30">
            <div className="bg-brand-teal/10 border border-brand-teal/20 rounded-lg p-4 dark:bg-brand-teal/20 dark:border-brand-teal/40">
              <p className="text-xs font-semibold text-brand-teal uppercase tracking-wide mb-1">Subject Line</p>
              <p className="text-sm font-medium text-gray-900 dark:text-brand-cream">{result.subject}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 dark:bg-brand-navy-dark/50">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 dark:text-brand-sage">Email Body</p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap dark:text-brand-cream/80">{result.body}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="px-4 py-2 border border-brand-teal/40 text-brand-teal rounded-lg text-sm font-semibold hover:bg-brand-teal/10 transition-colors"
              >
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </button>
              <button
                onClick={handleSubmit as never}
                className="px-4 py-2 border border-gray-200 text-gray-500 rounded-lg text-sm hover:bg-gray-50 transition-colors dark:border-brand-teal/20 dark:text-brand-sage dark:hover:bg-brand-teal/10"
              >
                Regenerate
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-400 text-center dark:text-brand-sage/60">Review before sending — personalize with specific details about why you want this role.</p>
        </div>
      )}
    </div>
  )
}
