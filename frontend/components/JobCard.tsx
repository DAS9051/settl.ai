import Link from 'next/link'
import type { Job } from '@/lib/types'

interface JobCardProps {
  job: Job
}

export default function JobCard({ job }: JobCardProps) {
  return (
    <Link href={`/jobs/${job.id}`} className="block group">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-700 hover:-translate-y-0.5 transition-all duration-200">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 leading-tight group-hover:text-blue-800 dark:group-hover:text-blue-400 transition-colors truncate">
              {job.title}
            </h3>
            {job.business_name && (
              <p className="text-sm text-blue-700 dark:text-blue-400 font-medium mt-0.5 truncate">{job.business_name}</p>
            )}
          </div>
          {job.verified && (
            <span className="shrink-0 inline-flex items-center gap-1 text-xs font-medium bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 px-2 py-1 rounded-full border border-green-200 dark:border-green-900">
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

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2 mb-4">{job.description}</p>

        {/* Location + Salary row */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-4">
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
              <span className="text-gray-300 dark:text-gray-600">·</span>
              <span className="flex items-center gap-1 font-medium text-gray-600 dark:text-gray-300">
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
          <span className="ml-auto flex items-center gap-1 text-gray-400 dark:text-gray-500">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {new Date(job.created_at).toLocaleDateString()}
          </span>
        </div>

        {/* Skills badges */}
        {job.skills_required.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {job.skills_required.map((skill) => (
              <span
                key={skill}
                className="text-xs font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900 px-2.5 py-0.5 rounded-full"
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
