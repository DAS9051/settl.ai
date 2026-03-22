import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero */}
      <section className="relative text-center py-24 w-full overflow-hidden">
        {/* Background gradient using brand palette */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-cream/30 via-brand-cream-light/20 to-transparent rounded-3xl dark:from-brand-navy/60 dark:via-brand-navy-dark/30 dark:to-transparent" />

        <div className="inline-flex items-center gap-2 bg-brand-navy text-brand-cream text-xs font-semibold px-3 py-1 rounded-full mb-6 tracking-wide uppercase shadow-sm dark:bg-brand-teal dark:text-brand-cream">
          Powered by Claude AI
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold text-brand-navy mb-5 leading-tight tracking-tight dark:text-brand-cream">
          Your career,{' '}
          <span className="text-brand-teal dark:text-brand-olive">sorted.</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-lg mx-auto mb-10 leading-relaxed dark:text-brand-sage">
          Browse local job listings and get a personalised AI career roadmap — all in one place.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/jobs"
            className="px-7 py-3 bg-brand-navy text-white rounded-lg font-semibold hover:bg-brand-navy-light transition-all shadow-sm text-sm dark:bg-brand-teal dark:hover:bg-brand-teal-light"
          >
            Browse Jobs
          </Link>
          <Link
            href="/counsel"
            className="px-7 py-3 border border-brand-teal text-brand-teal rounded-lg font-semibold hover:bg-brand-teal hover:text-white transition-all text-sm dark:border-brand-teal dark:text-brand-cream dark:hover:bg-brand-teal"
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
            iconBg: 'bg-gray-100 text-brand-navy dark:bg-brand-teal/20 dark:text-brand-cream',
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
            iconBg: 'bg-gray-100 text-brand-navy dark:bg-brand-teal/20 dark:text-brand-cream',
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
            iconBg: 'bg-gray-100 text-brand-navy dark:bg-brand-teal/20 dark:text-brand-cream',
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
            iconBg: 'bg-gray-100 text-brand-navy dark:bg-brand-teal/20 dark:text-brand-cream',
          },
        ].map(({ href, icon, title, desc, iconBg }) => (
          <Link
            key={title}
            href={href}
            className="group flex flex-col gap-3 bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md hover:border-brand-teal/50 hover:-translate-y-0.5 transition-all dark:bg-brand-navy-dark dark:border-brand-teal/20 dark:hover:border-brand-teal/50"
          >
            <div className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${iconBg}`}>
              {icon}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-brand-navy mb-1 group-hover:text-brand-teal transition-colors dark:text-brand-cream dark:group-hover:text-brand-olive">
                {title}
              </h2>
              <p className="text-gray-500 text-xs leading-relaxed dark:text-brand-sage">{desc}</p>
            </div>
          </Link>
        ))}
      </section>

      {/* Footer blurb */}
      <p className="mt-16 text-xs text-gray-400 tracking-wide dark:text-brand-sage/60">
        settl.ai · Powered by Anthropic Claude
      </p>
    </div>
  )
}
