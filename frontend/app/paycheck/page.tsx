'use client'

import { useState } from 'react'
import { useAuth, useUser } from '@clerk/nextjs'
import { explainPaycheck } from '@/lib/api'
import type { PaycheckExplanation } from '@/lib/types'

const PROVINCES = [
  'Ontario',
  'British Columbia',
  'Alberta',
  'Quebec',
  'Manitoba',
  'Saskatchewan',
  'Nova Scotia',
  'New Brunswick',
  'Prince Edward Island',
  'Newfoundland and Labrador',
  'Northwest Territories',
  'Yukon',
  'Nunavut',
]

const inputClass =
  'w-full border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300'

function fmt(n: number) {
  return `$${n.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function PaycheckPage() {
  const { getToken } = useAuth()
  const { user, isLoaded } = useUser()

  const [salary, setSalary] = useState('')
  const [province, setProvince] = useState('Ontario')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<PaycheckExplanation | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const salaryNum = parseFloat(salary.replace(/,/g, ''))
    if (isNaN(salaryNum) || salaryNum <= 0) {
      setError('Please enter a valid salary.')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const token = await getToken()
      const data = await explainPaycheck(token, salaryNum, province)
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to explain paycheck.')
    } finally {
      setLoading(false)
    }
  }

  const totalDeductions = result
    ? result.deductions.reduce((sum, d) => sum + d.amount, 0)
    : 0

  if (isLoaded && !user) {
    return (
      <div className="text-center py-16 text-gray-500">
        Please <a href="/sign-in" className="text-blue-700 underline">sign in</a> to use the Paycheck Explainer.
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Paycheck Explainer</h1>
        <p className="text-gray-500 text-sm">
          Enter your gross salary and province to understand your Canadian paycheck deductions
          — CPP, EI, federal and provincial income tax — and estimate your take-home pay.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4 mb-6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Annual Gross Salary (CAD) *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 55000"
              value={salary}
              onChange={e => setSalary(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Province *</label>
            <select
              value={province}
              onChange={e => setProvince(e.target.value)}
              className={inputClass}
            >
              {PROVINCES.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-blue-800 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Calculating...' : 'Explain My Paycheck'}
        </button>
      </form>

      {result && (
        <div className="space-y-4">
          {/* Summary card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Estimated Annual Breakdown</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Gross Pay</span>
                <span className="font-semibold text-gray-900">{fmt(result.gross)}</span>
              </div>
              {result.deductions.map((d) => (
                <div key={d.name} className="flex justify-between text-sm">
                  <span className="text-gray-500">− {d.name}</span>
                  <span className="text-red-600 font-medium">−{fmt(d.amount)}</span>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between text-sm font-semibold">
                <span className="text-gray-700">Total Deductions</span>
                <span className="text-red-600">−{fmt(totalDeductions)}</span>
              </div>
              <div className="flex justify-between text-base font-bold">
                <span className="text-gray-900">Estimated Net Pay</span>
                <span className="text-green-700">{fmt(result.estimated_net)}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Monthly take-home: ≈ {fmt(result.estimated_net / 12)} &nbsp;|&nbsp;
                Bi-weekly: ≈ {fmt(result.estimated_net / 26)}
              </p>
            </div>
          </div>

          {/* Deduction explanations */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-4">What Are These Deductions?</h2>
            <div className="space-y-4">
              {result.deductions.map((d) => (
                <div key={d.name}>
                  <div className="flex justify-between items-baseline mb-0.5">
                    <span className="text-sm font-semibold text-gray-800">{d.name}</span>
                    <span className="text-sm text-red-600 font-medium">−{fmt(d.amount)}/yr</span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{d.explanation}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Plain summary */}
          {result.plain_summary && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
              <p className="text-sm text-blue-900 leading-relaxed">{result.plain_summary}</p>
            </div>
          )}

          <p className="text-xs text-gray-400 text-center">
            These are estimates based on 2024 tax rates. Actual amounts vary based on deductions, credits, and other income.
          </p>
        </div>
      )}
    </div>
  )
}
