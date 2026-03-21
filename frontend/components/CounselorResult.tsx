import type { CounselResponse } from '@/lib/types'
import JobCard from './JobCard'

interface CounselorResultProps {
  result: CounselResponse
}

export default function CounselorResult({ result }: CounselorResultProps) {
  return (
    <div className="space-y-8">
      {/* Career Roadmap */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-blue-700">🗺️</span> Career Roadmap
        </h2>
        {result.roadmap.length === 0 ? (
          <p className="text-sm text-gray-500">No roadmap steps returned.</p>
        ) : (
          <ol className="space-y-3">
            {result.roadmap.map((step, idx) => (
              <li key={idx} className="flex gap-3 text-sm text-gray-700">
                <span className="shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs">
                  {idx + 1}
                </span>
                <span className="leading-relaxed pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Matching Jobs */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-blue-700">💼</span> Matching Jobs
        </h2>
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
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-blue-700">📋</span> Board Recommendations
        </h2>
        {result.board_recommendations.length === 0 ? (
          <p className="text-sm text-gray-500">No recommendations available.</p>
        ) : (
          <ul className="space-y-2">
            {result.board_recommendations.map((rec, idx) => (
              <li key={idx} className="flex gap-2 text-sm text-gray-700">
                <span className="text-blue-500 shrink-0 mt-0.5">•</span>
                <span className="leading-relaxed">{rec}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
