'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import ThemeToggle from '@/components/ThemeToggle'
import { useLanguage } from '@/contexts/LanguageContext'

function ToolsDropdown({ t }: { t: Record<string, string> }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const tools = [
    { href: '/counsel', label: t.navCounsel || 'AI Counsel' },
    { href: '/resume', label: t.navResume || 'Resume' },
    { href: '/outreach', label: 'Email Helper' },
    { href: '/quiz', label: t.navCulturalGuide || 'Cultural Guide' },
    { href: '/rights', label: t.navRights || 'Know Your Rights' },
  ]

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-brand-cream/80 hover:text-brand-cream hover:bg-brand-navy-light rounded-md transition-all"
      >
        Tools
        <svg className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1 w-44 bg-brand-navy border border-brand-teal/30 rounded-lg shadow-xl py-1 z-50">
          {tools.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-brand-cream/80 hover:text-brand-cream hover:bg-brand-navy-light transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Nav() {
  const { t } = useLanguage()

  return (
    <nav className="bg-brand-navy border-b border-brand-navy-dark sticky top-0 z-50 shadow-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 py-3">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight hover:opacity-90 transition-opacity"
          >
            <span className="text-white">settl.</span><span className="text-brand-olive">ai</span>
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
                href="/jobs/tracked"
                className="px-3 py-1.5 text-sm font-medium text-brand-cream/80 hover:text-brand-cream hover:bg-brand-navy-light rounded-md transition-all"
              >
                {t.navMyTracker}
              </Link>
              <ToolsDropdown t={t} />
              <Link
                href="/business/manage"
                className="px-3 py-1.5 text-sm font-medium text-brand-cream/80 hover:text-brand-cream hover:bg-brand-navy-light rounded-md transition-all"
              >
                My Business
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
                <UserButton />
              </div>
            </SignedIn>
          </div>
        </div>
      </div>
    </nav>
  )
}
