import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero */}
      <section className="relative text-center py-24 w-full overflow-hidden">
        {/* Subtle background gradient */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-blue-50/60 to-transparent rounded-3xl" />

        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-6 tracking-wide uppercase">
          Powered by Claude AI
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-5 leading-tight tracking-tight">
          Your career,{' '}
          <span className="text-blue-800">sorted.</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-lg mx-auto mb-10 leading-relaxed">
          Browse local job listings and get a personalised AI career roadmap — all in one place.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/jobs"
            className="px-7 py-3 bg-blue-800 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-sm text-sm"
          >
            Browse Jobs
          </Link>
          <Link
            href="/counsel"
            className="px-7 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-blue-300 hover:text-blue-800 hover:bg-blue-50 transition-all text-sm"
          >
            Get Career Advice
          </Link>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full mt-4">
        {[
          {
            href: '/jobs',
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            ),
            title: 'Job Board',
            desc: 'Browse verified local listings filtered by skills and location.',
          },
          {
            href: '/counsel',
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            ),
            title: 'AI Counselor',
            desc: 'Get a personalised roadmap and job matches from Claude.',
          },
          {
            href: '/resume',
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            ),
            title: 'Resume Builder',
            desc: 'Import your PDF or generate a polished resume from your profile.',
          },
          {
            href: '/jobs',
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            ),
            title: 'Skills Gap',
            desc: 'See exactly what skills you need for any role and how to get them.',
          },
        ].map(({ href, icon, title, desc }) => (
          <Link
            key={title}
            href={href}
            className="group flex flex-col gap-3 bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md hover:border-blue-200 transition-all"
          >
            <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-blue-50 text-blue-700 group-hover:bg-blue-100 transition-colors">
              {icon}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-blue-800 transition-colors">
                {title}
              </h2>
              <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
            </div>
          </Link>
        ))}
      </section>

      {/* Footer blurb */}
      <p className="mt-16 text-xs text-gray-400 tracking-wide">
        settl.ai · Powered by Anthropic Claude
      </p>
    </div>
  )
}
