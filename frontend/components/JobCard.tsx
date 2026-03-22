import Link from 'next/link'
import type { Job } from '@/lib/types'

interface JobCardProps {
  job: Job
  matchPct?: number
}

export default function JobCard({ job, matchPct }: JobCardProps) {
  const matchColor =
    matchPct === undefined ? null
    : matchPct >= 70 ? 'bg-green-100 text-green-700 border-green-200'
    : matchPct >= 40 ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
    : 'bg-gray-100 text-gray-500 border-gray-200'

  return (
    <Link href={`/jobs/${job.id}`} className="block group">
      <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md hover:border-brand-teal/50 hover:-translate-y-0.5 transition-all duration-200 dark:bg-brand-navy-dark dark:border-brand-teal/20 dark:hover:border-brand-teal/40">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-brand-navy leading-tight group-hover:text-brand-teal transition-colors truncate dark:text-brand-cream dark:group-hover:text-brand-olive">
              {job.title}
            </h3>
            {job.business_name && (
              <p className="text-sm text-brand-teal font-medium mt-0.5 truncate dark:text-brand-sage">{job.business_name}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {job.category === 'short_term' && (
              <span className="inline-flex items-center text-xs font-semibold px-2 py-1 rounded-full border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700/40">
                Short Term
              </span>
            )}
            {matchColor !== null && (
              <span className={`inline-flex items-center text-xs font-semibold px-2 py-1 rounded-full border ${matchColor}`}>
                {Math.round(matchPct!)}% match
              </span>
            )}
            {job.verified && (
              <span className="inline-flex items-center gap-1 text-xs font-medium bg-brand-sage/20 text-brand-sage-dark px-2 py-1 rounded-full border border-brand-sage dark:bg-brand-teal/20 dark:text-brand-cream dark:border-brand-teal/40">
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
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 mb-4 dark:text-gray-300">{job.description}</p>

        {/* Location + Salary row */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-4 dark:text-brand-sage/80">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            {job.location}
          </span>
          {job.salary_range && (
            <>
              <span className="text-gray-300 dark:text-brand-teal/40">·</span>
              <span className="flex items-center gap-1 font-medium text-gray-600 dark:text-brand-olive">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {job.salary_range}
              </span>
            </>
          )}
          <span className="ml-auto flex items-center gap-1 text-gray-400 dark:text-brand-sage/60">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {new Date(job.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
          </span>
        </div>

        {/* Skills badges */}
        {job.skills_required.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {job.skills_required.map((skill) => (
              <span
                key={skill}
                className="text-xs font-medium bg-gray-100 text-brand-navy border border-gray-200 px-2.5 py-0.5 rounded-full dark:bg-brand-teal/20 dark:text-brand-cream dark:border-brand-teal/30"
              >
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
