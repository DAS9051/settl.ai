'use client'

import Link from 'next/link'
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import ThemeToggle from '@/components/ThemeToggle'
import { useLanguage } from '@/contexts/LanguageContext'

export default function Nav() {
  const { t } = useLanguage()

  return (
    <nav className="bg-brand-navy border-b border-brand-navy-dark sticky top-0 z-50 shadow-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 py-3">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-brand-cream hover:text-brand-cream-light transition-colors"
          >
            settl.ai
          </Link>

          <div className="flex items-center gap-1">
            <Link
              href="/jobs"
              className="px-3 py-1.5 text-sm font-medium text-brand-cream/80 hover:text-brand-cream hover:bg-brand-navy-light rounded-md transition-all"
            >
              {t.navJobs}
            </Link>
            <SignedIn>
              <Link
                href="/counsel"
                className="px-3 py-1.5 text-sm font-medium text-brand-cream/80 hover:text-brand-cream hover:bg-brand-navy-light rounded-md transition-all"
              >
                {t.navCounsel}
              </Link>
              <Link
                href="/profile"
                className="px-3 py-1.5 text-sm font-medium text-brand-cream/80 hover:text-brand-cream hover:bg-brand-navy-light rounded-md transition-all"
              >
                {t.navProfile}
              </Link>
              <Link
                href="/resume"
                className="px-3 py-1.5 text-sm font-medium text-brand-cream/80 hover:text-brand-cream hover:bg-brand-navy-light rounded-md transition-all"
              >
                {t.navResume}
              </Link>
              <Link
                href="/jobs/tracked"
                className="px-3 py-1.5 text-sm font-medium text-brand-cream/80 hover:text-brand-cream hover:bg-brand-navy-light rounded-md transition-all"
              >
                {t.navMyTracker}
              </Link>
              <Link
                href="/quiz"
                className="px-3 py-1.5 text-sm font-medium text-brand-cream/80 hover:text-brand-cream hover:bg-brand-navy-light rounded-md transition-all"
              >
                {t.navCulturalGuide}
              </Link>
              <Link
                href="/jobs/post"
                className="ml-2 px-3.5 py-1.5 text-sm font-semibold text-brand-navy bg-brand-cream hover:bg-brand-cream-light rounded-md transition-all"
              >
                {t.navPostJob}
              </Link>
            </SignedIn>
            <SignedOut>
              <Link
                href="/sign-in"
                className="ml-2 px-3.5 py-1.5 text-sm font-semibold text-brand-navy bg-brand-cream hover:bg-brand-cream-light rounded-md transition-all"
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
