'use client'

import { useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { registerBusiness } from '@/lib/api'
import type { Business } from '@/lib/types'
import { useLanguage } from '@/contexts/LanguageContext'

const inputClass =
  'w-full border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300'

export default function RegisterBusinessPage() {
  const { getToken } = useAuth()
  const { t } = useLanguage()

  const [name, setName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [businessNumber, setBusinessNumber] = useState('')
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
        business_number: businessNumber.trim() || undefined,
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
        <h1 className="text-2xl font-bold text-gray-900 mb-3">{t.bizRegistered}</h1>
        <p className="text-gray-500 text-sm mb-2">
          <strong>{registered.name}</strong> has been submitted for verification.
        </p>
        <p className="text-gray-400 text-xs mb-8">
          Once verified, you will be able to post job listings. Contact ID: {registered.id}
        </p>
        <a
          href="/jobs"
          className="px-6 py-2 bg-blue-800 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          Browse Jobs
        </a>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{t.bizTitle}</h1>
        <p className="text-sm text-gray-500 mt-1">{t.bizSubtitle}</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl border border-gray-200 p-8 space-y-5 shadow-sm"
      >
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {t.bizCompanyName} <span className="text-red-500">*</span>
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
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {t.bizEmail} <span className="text-red-500">*</span>
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {t.bizNumber}{' '}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={businessNumber}
            onChange={(e) => setBusinessNumber(e.target.value)}
            placeholder="e.g. 123456789"
            className={inputClass}
          />
          <p className="text-xs text-gray-400 mt-1">{t.bizNumberHint}</p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-blue-800 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? t.bizRegistering : t.bizRegister}
        </button>
      </form>

      <p className="text-xs text-gray-400 mt-4 text-center">
        Businesses are subject to verification before job posts are published.
      </p>
    </div>
  )
}
