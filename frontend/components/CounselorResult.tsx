import type { CounselResponse } from '@/lib/types'
import JobCard from './JobCard'

interface CounselorResultProps {
  result: CounselResponse
}

export default function CounselorResult({ result }: CounselorResultProps) {
  return (
    <div className="space-y-6">
      {/* Career Roadmap */}
      <section className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="border-l-4 border-blue-600 px-6 py-5">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Career Roadmap</h2>
          <p className="text-xs text-gray-500">Your personalised step-by-step action plan</p>
        </div>
        <div className="px-6 pb-6">
          {result.roadmap.length === 0 ? (
            <p className="text-sm text-gray-500">No roadmap steps returned.</p>
          ) : (
            <ol className="space-y-3">
              {result.roadmap.map((step, idx) => (
                <li key={idx} className="flex gap-4 text-sm">
                  <span className="shrink-0 w-7 h-7 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs border border-blue-200">
                    {idx + 1}
                  </span>
                  <span className="text-gray-700 leading-relaxed pt-1">{step}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      {/* Matching Jobs */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-6 rounded-full bg-emerald-500" />
          <h2 className="text-base font-semibold text-gray-900">Matching Jobs</h2>
          {result.current_matches.length > 0 && (
            <span className="text-xs font-medium bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
              {result.current_matches.length} found
            </span>
          )}
        </div>
        {result.current_matches.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-sm text-gray-500">
            No matching jobs found based on your current profile.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.current_matches.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </section>

      {/* Board Recommendations */}
      <section className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="border-l-4 border-violet-500 px-6 py-5">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Board Recommendations</h2>
          <p className="text-xs text-gray-500">Tailored suggestions for your career path</p>
        </div>
        <div className="px-6 pb-6">
          {result.board_recommendations.length === 0 ? (
            <p className="text-sm text-gray-500">No recommendations available.</p>
          ) : (
            <ul className="space-y-3">
              {result.board_recommendations.map((rec, idx) => (
                <li key={idx} className="flex gap-3 text-sm">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center mt-0.5 border border-violet-200">
                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <span className="text-gray-700 leading-relaxed">{rec}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}
