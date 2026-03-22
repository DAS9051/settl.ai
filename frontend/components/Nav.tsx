'use client'

import Link from 'next/link'
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import ThemeToggle from '@/components/ThemeToggle'
import { useLanguage } from '@/contexts/LanguageContext'

export default function Nav() {
  const { t } = useLanguage()

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/80 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 py-3">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-blue-800 hover:text-blue-700 transition-colors"
          >
            settl.ai
          </Link>

          <div className="flex items-center gap-1">
            <Link
              href="/jobs"
              className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-all"
            >
              {t.navJobs}
            </Link>
            <SignedIn>
              <Link
                href="/counsel"
                className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-all"
              >
                {t.navCounsel}
              </Link>
              <Link
                href="/profile"
                className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-all"
              >
                {t.navProfile}
              </Link>
              <Link
                href="/resume"
                className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-all"
              >
                {t.navResume}
              </Link>
              <Link
                href="/jobs/tracked"
                className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-all"
              >
                {t.navMyTracker}
              </Link>
              <Link
                href="/quiz"
                className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-all"
              >
                {t.navCulturalGuide}
              </Link>
              <Link
                href="/jobs/post"
                className="ml-2 px-3.5 py-1.5 text-sm font-semibold text-white bg-blue-800 hover:bg-blue-700 rounded-md transition-all"
              >
                {t.navPostJob}
              </Link>
            </SignedIn>
            <SignedOut>
              <Link
                href="/sign-in"
                className="ml-2 px-3.5 py-1.5 text-sm font-semibold text-white bg-blue-800 hover:bg-blue-700 rounded-md transition-all"
              >
                {t.navSignIn}
              </Link>
            </SignedOut>
            <ThemeToggle />
            <SignedIn>
              <div className="ml-1">
                <UserButton afterSignOutUrl="/" />
              </div>
            </SignedIn>
          </div>
        </div>
      </div>
    </nav>
  )
}
