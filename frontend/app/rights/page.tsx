'use client'

import { useState, useEffect } from 'react'
import { useAuth, useUser } from '@clerk/nextjs'
import { getProfile, explainPaycheck } from '@/lib/api'
import type { PaycheckExplanation } from '@/lib/types'

// Province-specific minimum wage data (current as of March 2026)
const PROVINCE_WAGES: Record<string, { rate: string; note: string }> = {
  'Ontario': { rate: '$17.60/hr', note: 'as of Oct 1, 2025. Expected ~$18.00 on Oct 1, 2026.' },
  'British Columbia': { rate: '$17.85/hr', note: 'rising to $18.25 on June 1, 2026.' },
  'Alberta': { rate: '$15.00/hr', note: 'frozen since Oct 1, 2018 — lowest in Canada.' },
  'Quebec': { rate: '$16.10/hr', note: 'rising to $16.60 on May 1, 2026.' },
  'Manitoba': { rate: '$15.80/hr', note: 'as of Oct 1, 2025.' },
  'Saskatchewan': { rate: '$15.35/hr', note: 'rising to $17.00 on April 1, 2026.' },
  'Nova Scotia': { rate: '$15.70/hr', note: 'as of April 1, 2025.' },
  'New Brunswick': { rate: '$15.65/hr', note: 'as of April 1, 2025.' },
  'Prince Edward Island': { rate: '$16.00/hr', note: 'as of April 1, 2025.' },
  'Newfoundland and Labrador': { rate: '$16.00/hr', note: 'as of April 1, 2025.' },
  'Northwest Territories': { rate: '$16.95/hr', note: 'as of Sept 1, 2025.' },
  'Yukon': { rate: '$17.94/hr', note: 'as of April 1, 2025.' },
  'Nunavut': { rate: '$19.75/hr', note: 'as of Sept 1, 2025 — highest in Canada.' },
}

const PROVINCES = Object.keys(PROVINCE_WAGES)

const inputClass =
  'w-full border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/40 dark:bg-brand-navy-dark dark:border-brand-teal/30 dark:text-brand-cream dark:placeholder-brand-sage/60'

function fmt(n: number) {
  return `$${n.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const RIGHTS_CONTENT = [
  {
    title: 'Right to Refuse Unsafe Work',
    icon: '🦺',
    content: `Under Canadian law, you have the right to refuse work you reasonably believe is dangerous to yourself or another person.
• Federal workers: Canada Labour Code, Part II, Section 128
• Provincial workers: each province has equivalent legislation (e.g. Ontario OHSA s. 43, BC WorkSafeBC Act)

Steps:
1. Report the concern to your supervisor immediately
2. Your employer must investigate
3. If unresolved, you may continue to refuse and a health & safety officer will be called
4. Exception: you cannot refuse if the danger is a normal condition of your job, or if refusing would endanger someone else

Your employer cannot fire or penalize you for refusing unsafe work in good faith (Canada Labour Code, s. 147).`,
  },
  {
    title: 'Rest Breaks & Meal Periods',
    icon: '☕',
    content: `Most jurisdictions require at least a 30-minute unpaid meal break after 5 consecutive hours of work:
• Federal, Ontario, BC, Alberta, Quebec, Manitoba, Saskatchewan: 30 min (unpaid) after 5 consecutive hours
• BC: break can be waived by mutual agreement if the shift is 6 hours or less

Additional paid rest breaks (typically 15 min per 4 hours) may also be required depending on your province and sector. These minimums cannot be removed by your employer.`,
  },
  {
    title: 'Protection from Discrimination',
    icon: '🤝',
    content: `The Canadian Human Rights Act (current to March 2026) prohibits workplace discrimination on 13 grounds:

1. Race  2. National or ethnic origin  3. Colour  4. Religion  5. Age  6. Sex (including pregnancy)  7. Sexual orientation  8. Gender identity or expression  9. Marital status  10. Family status  11. Genetic characteristics  12. Disability  13. Conviction for an offence for which a pardon has been granted

Each province also has its own human rights legislation. File a complaint with the Canadian Human Rights Commission (federal) or your provincial body — at no cost.`,
  },
  {
    title: 'Right to a Payslip',
    icon: '📄',
    content: `You have the right to receive a written pay statement (payslip) each time you are paid, showing:
• Gross wages (before deductions)
• All deductions: income tax, CPP, EI, and others
• Net (take-home) pay

Current deduction rates (2026):
• CPP: 5.95% of earnings between $3,500–$74,600
• EI: $1.63 per $100 of insurable earnings (up to $68,900)
• Income tax: varies by province and income

If your employer does not provide payslips, this violates employment standards. Keep copies — they are essential records for any wage dispute.`,
  },
  {
    title: 'If Your Employer Doesn\'t Pay You',
    icon: '⚠️',
    content: `If your employer fails to pay wages owed, you have strong protections — regardless of immigration status.

1. Raise the issue in writing with your employer (keep a copy)
2. File a wage claim with your provincial Ministry of Labour — free, no lawyer needed
3. In most provinces you can recover up to 2 years of unpaid wages

Employers cannot retaliate against you for asserting your right to be paid. Fear of immigration consequences should not stop you — employment standards apply to ALL workers in Canada.`,
  },
  {
    title: 'Notice & Termination Rights',
    icon: '📋',
    content: `If let go, you are generally entitled to notice or pay in lieu of notice:
• Less than 3 months: no minimum (provincial rules vary)
• 3 months – 2 years: typically 1–2 weeks
• 2–5 years: typically 2–4 weeks
• 5+ years: up to 8 weeks

You are also entitled to:
• All vacation pay earned, regardless of reason for termination
• A Record of Employment (ROE) within 5 calendar days — needed to apply for EI

If fired "for cause" (serious misconduct), notice may not apply. Consult a legal aid clinic if you are unsure.`,
  },
  {
    title: 'Emergency Contacts & Resources',
    icon: '📞',
    content: `Federal:
• Employment and Social Development Canada (ESDC): 1-800-641-4049

Provincial Employment Standards:
• Ontario: 1-800-531-5551 (Mon–Fri, 8:30am–5:00pm ET)
• British Columbia: 1-833-236-3700
• Alberta: 1-877-427-3731
• Quebec (CNESST): 1-844-838-0808

Human Rights:
• Canadian Human Rights Commission: 1-888-214-1090 (Mon–Fri, 8:00am–8:00pm ET)

Can't afford a lawyer? Search for a Legal Aid clinic in your province — free or low-cost legal help.`,
  },
]

function RightsCard({ title, icon, content }: { title: string; icon: string; content: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm dark:bg-brand-navy-dark dark:border-brand-teal/30">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-gray-50 transition-colors dark:hover:bg-brand-teal/10"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <span className="text-base font-semibold text-brand-navy dark:text-brand-cream">{title}</span>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform shrink-0 dark:text-brand-sage ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-5 pb-5 pt-0 border-t border-gray-100 dark:border-brand-teal/20">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line pt-4 dark:text-brand-cream/80">{content}</p>
        </div>
      )}
    </div>
  )
}

function PaycheckSection({ defaultProvince }: { defaultProvince: string }) {
  const { getToken } = useAuth()
  const [salary, setSalary] = useState('')
  const [province, setProvince] = useState(defaultProvince)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<PaycheckExplanation | null>(null)

  useEffect(() => { setProvince(defaultProvince) }, [defaultProvince])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const salaryNum = parseFloat(salary.replace(/,/g, ''))
    if (isNaN(salaryNum) || salaryNum <= 0) { setError('Please enter a valid salary.'); return }
    setLoading(true); setError(null); setResult(null)
    try {
      const token = await getToken()
      setResult(await explainPaycheck(token, salaryNum, province))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to explain paycheck.')
    } finally {
      setLoading(false)
    }
  }

  const totalDeductions = result ? result.deductions.reduce((sum, d) => sum + d.amount, 0) : 0

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4 dark:bg-brand-navy-dark dark:border-brand-teal/30">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-brand-cream/80">Annual Gross Salary (CAD) *</label>
            <input type="text" required placeholder="e.g. 55000" value={salary}
              onChange={e => setSalary(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-brand-cream/80">Province *</label>
            <select value={province} onChange={e => setProvince(e.target.value)} className={inputClass}>
              {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full py-2.5 bg-brand-navy text-white rounded-lg text-sm font-semibold hover:bg-brand-navy-light transition-colors disabled:opacity-50">
          {loading ? 'Calculating...' : 'Explain My Paycheck'}
        </button>
      </form>

      {result && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm dark:bg-brand-navy-dark dark:border-brand-teal/30">
            <h3 className="text-base font-semibold text-brand-navy mb-4 dark:text-brand-cream">Estimated Annual Breakdown</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-brand-cream/70">Gross Pay</span>
                <span className="font-semibold text-gray-900 dark:text-brand-cream">{fmt(result.gross)}</span>
              </div>
              {result.deductions.map((d) => (
                <div key={d.name} className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-brand-sage">− {d.name}</span>
                  <span className="text-red-600 font-medium">−{fmt(d.amount)}</span>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-2 flex justify-between text-sm font-semibold dark:border-brand-teal/20">
                <span className="text-gray-700 dark:text-brand-cream/80">Total Deductions</span>
                <span className="text-red-600">−{fmt(totalDeductions)}</span>
              </div>
              <div className="flex justify-between text-base font-bold">
                <span className="text-brand-navy dark:text-brand-cream">Estimated Net Pay</span>
                <span className="text-green-700">{fmt(result.estimated_net)}</span>
              </div>
              <p className="text-xs text-gray-400 dark:text-brand-sage/60">
                Monthly: ≈ {fmt(result.estimated_net / 12)} &nbsp;|&nbsp; Bi-weekly: ≈ {fmt(result.estimated_net / 26)}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm dark:bg-brand-navy-dark dark:border-brand-teal/30">
            <h3 className="text-base font-semibold text-brand-navy mb-4 dark:text-brand-cream">What Are These Deductions?</h3>
            <div className="space-y-4">
              {result.deductions.map((d) => (
                <div key={d.name}>
                  <div className="flex justify-between items-baseline mb-0.5">
                    <span className="text-sm font-semibold text-brand-navy dark:text-brand-cream">{d.name}</span>
                    <span className="text-sm text-red-600 font-medium">−{fmt(d.amount)}/yr</span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed dark:text-brand-cream/70">{d.explanation}</p>
                </div>
              ))}
            </div>
          </div>
          {result.plain_summary && (
            <div className="bg-brand-teal/10 border border-brand-teal/20 rounded-xl p-5 dark:bg-brand-teal/20 dark:border-brand-teal/40">
              <p className="text-sm text-brand-navy leading-relaxed dark:text-brand-cream">{result.plain_summary}</p>
            </div>
          )}
          <p className="text-xs text-gray-400 text-center dark:text-brand-sage/60">Estimates based on 2026 tax rates. Actual amounts vary based on deductions, credits, and other income.</p>
        </div>
      )}
    </div>
  )
}

export default function RightsPage() {
  const { getToken } = useAuth()
  const { user, isLoaded } = useUser()
  const [userProvince, setUserProvince] = useState('Ontario')
  const [paycheckOpen, setPaycheckOpen] = useState(false)

  useEffect(() => {
    if (!isLoaded || !user) return
    async function loadProvince() {
      try {
        const token = await getToken()
        const profile = await getProfile(token)
        if (profile.province) setUserProvince(profile.province)
      } catch {
        // No profile yet — default to Ontario
      }
    }
    loadProvince()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user])

  const wage = PROVINCE_WAGES[userProvince] || PROVINCE_WAGES['Ontario']

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-navy dark:text-brand-cream mb-2">Know Your Rights</h1>
        <p className="text-gray-500 text-sm leading-relaxed dark:text-brand-sage">
          As a worker in Canada, you have strong legal protections. These rights apply to almost all workers, regardless of immigration status.
        </p>
        <div className="mt-4 bg-brand-teal/10 border border-brand-teal/20 rounded-lg p-4 text-sm text-brand-navy dark:bg-brand-teal/20 dark:border-brand-teal/40 dark:text-brand-cream">
          <strong>Note:</strong> This is general information, not legal advice. For your specific situation, contact your provincial employment standards office or a legal aid clinic. Rates are current as of March 2026.
        </div>
      </div>

      {/* Province-specific minimum wage highlight */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4 shadow-sm dark:bg-brand-navy-dark dark:border-brand-teal/30">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">💵</span>
          <div>
            <h2 className="text-base font-semibold text-brand-navy dark:text-brand-cream">Minimum Wage — {userProvince}</h2>
            <p className="text-xs text-gray-400 dark:text-brand-sage/70">{isLoaded && user ? 'Based on your profile province' : 'Set your province in your profile for a personalized rate'}</p>
          </div>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-lg px-4 py-3 flex items-baseline gap-3">
          <span className="text-2xl font-bold text-green-700">{wage.rate}</span>
          <span className="text-sm text-green-600">{wage.note}</span>
        </div>
        <details className="mt-3">
          <summary className="text-xs text-brand-teal cursor-pointer hover:underline">View all provinces</summary>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {Object.entries(PROVINCE_WAGES).map(([prov, data]) => (
              <div key={prov} className={`flex justify-between text-xs px-2 py-1 rounded ${prov === userProvince ? 'bg-brand-teal/10 font-semibold text-brand-navy dark:bg-brand-teal/20 dark:text-brand-cream' : 'text-gray-600 dark:text-brand-sage'}`}>
                <span>{prov}</span>
                <span className="font-medium">{data.rate}</span>
              </div>
            ))}
          </div>
        </details>
      </div>

      {/* Other rights */}
      <div className="space-y-3 mb-4">
        {RIGHTS_CONTENT.map((right) => (
          <RightsCard key={right.title} {...right} />
        ))}
      </div>

      {/* Paycheck Explainer embedded */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm dark:bg-brand-navy-dark dark:border-brand-teal/30">
        <button
          onClick={() => setPaycheckOpen(v => !v)}
          className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-gray-50 transition-colors dark:hover:bg-brand-teal/10"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧮</span>
            <div>
              <span className="text-base font-semibold text-brand-navy dark:text-brand-cream">Paycheck Explainer</span>
              <p className="text-xs text-gray-400 mt-0.5 dark:text-brand-sage/70">Enter your salary to see a breakdown of deductions and take-home pay</p>
            </div>
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform shrink-0 dark:text-brand-sage ${paycheckOpen ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {paycheckOpen && (
          <div className="px-5 pb-5 border-t border-gray-100 pt-4 dark:border-brand-teal/20">
            {isLoaded && !user ? (
              <p className="text-sm text-gray-500 dark:text-brand-sage">
                Please <a href="/sign-in" className="text-brand-teal underline">sign in</a> to use the Paycheck Explainer.
              </p>
            ) : (
              <PaycheckSection defaultProvince={userProvince} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
