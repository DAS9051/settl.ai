import type { CounselResponse } from '@/lib/types'
import JobCard from './JobCard'

interface CounselorResultProps {
  result: CounselResponse
}

function renderWithLinks(text: string) {
  const urlRegex = /https?:\/\/[^\s)>\]"]+/g
  const parts: (string | JSX.Element)[] = []
  let last = 0
  let match: RegExpExecArray | null
  while ((match = urlRegex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index))
    const url = match[0]
    let label: string
    try {
      label = new URL(url).hostname.replace(/^www\./, '')
    } catch {
      label = url
    }
    parts.push(
      <a
        key={match.index}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-teal/10 text-brand-teal border border-brand-teal/30 hover:bg-brand-teal hover:text-white transition-colors mx-0.5"
      >
        {label}
        <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    )
    last = match.index + match[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}

export default function CounselorResult({ result }: CounselorResultProps) {
  return (
    <div className="space-y-6">
      {/* Career Roadmap — vertical timeline */}
      <section className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="border-l-4 border-brand-teal px-6 py-5">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Career Roadmap</h2>
          <p className="text-xs text-gray-500">Your personalised step-by-step action plan</p>
        </div>
        <div className="px-6 pb-6">
          {result.roadmap.length === 0 ? (
            <p className="text-sm text-gray-500">No roadmap steps returned.</p>
          ) : (
            <ol className="space-y-0">
              {result.roadmap.map((step, idx) => {
                const isLast = idx === result.roadmap.length - 1
                // Try to split "Step N: Title\nDescription" or "Step N: Title — Description"
                const colonIdx = step.indexOf(':')
                const hasStepPrefix = step.toLowerCase().startsWith('step')
                let title = step
                let description = ''
                if (hasStepPrefix && colonIdx !== -1) {
                  const rest = step.slice(colonIdx + 1).trim()
                  const dashIdx = rest.search(/\s—\s|\n/)
                  if (dashIdx !== -1) {
                    title = rest.slice(0, dashIdx).trim()
                    description = rest.slice(dashIdx).replace(/^(\s—\s|\n)/, '').trim()
                  } else {
                    title = rest
                  }
                }

                return (
                  <li key={idx} className="flex gap-4">
                    {/* Left column: circle + connecting line */}
                    <div className="flex flex-col items-center">
                      <div className="w-4 h-4 rounded-full bg-brand-teal border-2 border-brand-teal-light shrink-0 mt-1" />
                      {!isLast && (
                        <div className="w-0.5 bg-brand-sage flex-1 mt-1 mb-0 min-h-[1.5rem]" />
                      )}
                    </div>

                    {/* Right column: content */}
                    <div className={`pb-6 flex-1 group ${isLast ? 'pb-0' : ''}`}>
                      <div className="rounded-lg px-4 py-3 border border-transparent hover:border-brand-sage hover:bg-brand-cream-light/40 transition-colors cursor-default">
                        <p className="text-sm font-semibold text-gray-900 leading-snug">
                          <span className="text-brand-teal mr-2 text-xs font-bold uppercase tracking-wide">
                            Step {idx + 1}
                          </span>
                          {renderWithLinks(hasStepPrefix ? title : step)}
                        </p>
                        {description && (
                          <p className="text-sm text-gray-600 mt-1 leading-relaxed">{renderWithLinks(description)}</p>
                        )}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      </section>

      {/* Matching Jobs */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-6 rounded-full bg-brand-sage" />
          <h2 className="text-base font-semibold text-gray-900">Matching Jobs</h2>
          {result.current_matches.length > 0 && (
            <span className="text-xs font-medium bg-brand-cream-light text-brand-navy px-2 py-0.5 rounded-full border border-brand-cream">
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
        <div className="border-l-4 border-brand-olive px-6 py-5">
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
                  <span className="shrink-0 w-5 h-5 rounded-full bg-brand-cream-light text-brand-teal flex items-center justify-center mt-0.5 border border-brand-cream">
                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <span className="text-gray-700 leading-relaxed">{renderWithLinks(rec)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}
