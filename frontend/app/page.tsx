import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero */}
      <section className="text-center py-20 w-full">
        <h1 className="text-5xl font-extrabold text-blue-900 mb-4 leading-tight">
          Find Your Next Career Move
        </h1>
        <p className="text-xl text-gray-500 max-w-xl mx-auto mb-10">
          Explore local job opportunities or get personalized AI career advice — all in one place.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/jobs"
            className="px-8 py-3 bg-blue-800 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm"
          >
            Browse Jobs
          </Link>
          <Link
            href="/counsel"
            className="px-8 py-3 border border-blue-800 text-blue-800 rounded-lg font-semibold hover:bg-blue-50 transition-colors text-sm"
          >
            Get Career Advice
          </Link>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-3xl mt-4">
        <Link
          href="/jobs"
          className="group block bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-md hover:border-blue-200 transition-all"
        >
          <div className="text-3xl mb-4">💼</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-800 transition-colors">
            Browse Jobs
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Search verified local business listings. Filter by skills, location, and salary to find the right fit.
          </p>
        </Link>

        <Link
          href="/counsel"
          className="group block bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-md hover:border-blue-200 transition-all"
        >
          <div className="text-3xl mb-4">🤖</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-800 transition-colors">
            AI Career Counselor
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Get a personalized career roadmap and job matches powered by Claude AI, tailored to your skills and goals.
          </p>
        </Link>
      </section>

      {/* Footer blurb */}
      <p className="mt-16 text-xs text-gray-400">
        settl.ai · Powered by Anthropic Claude
      </p>
    </div>
  )
}
