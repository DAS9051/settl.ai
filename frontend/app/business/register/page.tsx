'use client'

import { useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { registerBusiness } from '@/lib/api'
import type { Business } from '@/lib/types'

const inputClass =
  'w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-600'

export default function RegisterBusinessPage() {
  const { getToken } = useAuth()

  const [name, setName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [registered, setRegistered] = useState<Business | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const token = await getToken()
      const business = await registerBusiness(token, {
        name: name.trim(),
        contact_email: contactEmail.trim(),
      })
      setRegistered(business)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register business')
    } finally {
      setSubmitting(false)
    }
  }

  if (registered) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-3">Business Registered!</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
          <strong>{registered.name}</strong> has been submitted for verification.
        </p>
        <p className="text-gray-400 dark:text-gray-500 text-xs mb-8">
          Once verified, you will be able to post job listings. Contact ID: {registered.id}
        </p>
        <a
          href="/jobs"
          className="px-6 py-2 bg-blue-800 dark:bg-blue-700 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
        >
          Browse Jobs
        </a>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Register Your Business</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Create a business account to start posting job listings
        </p>
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Company Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Acme Corp"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Contact Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            required
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="hiring@yourcompany.com"
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-blue-800 dark:bg-blue-700 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Registering...' : 'Register Business'}
        </button>
      </form>

      <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 text-center">
        Businesses are subject to verification before job posts are published.
      </p>
    </div>
  )
}
