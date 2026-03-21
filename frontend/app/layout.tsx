import type { Metadata } from 'next'
import { ClerkProvider, UserButton, SignedIn, SignedOut } from '@clerk/nextjs'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: 'settl.ai',
  description: 'Find your next career move with AI-powered counseling and local job listings',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="min-h-screen bg-gray-50 text-gray-900">
          <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                {/* Logo */}
                <Link
                  href="/"
                  className="text-xl font-bold text-blue-800 tracking-tight hover:text-blue-700 transition-colors"
                >
                  settl.ai
                </Link>

                {/* Nav Links */}
                <div className="flex items-center gap-6">
                  <Link
                    href="/jobs"
                    className="text-sm font-medium text-gray-600 hover:text-blue-800 transition-colors"
                  >
                    Jobs
                  </Link>
                  <SignedIn>
                    <Link
                      href="/counsel"
                      className="text-sm font-medium text-gray-600 hover:text-blue-800 transition-colors"
                    >
                      Counsel
                    </Link>
                    <Link
                      href="/profile"
                      className="text-sm font-medium text-gray-600 hover:text-blue-800 transition-colors"
                    >
                      Profile
                    </Link>
                    <Link
                      href="/jobs/post"
                      className="text-sm font-medium text-gray-600 hover:text-blue-800 transition-colors"
                    >
                      Post a Job
                    </Link>
                  </SignedIn>
                  <SignedOut>
                    <Link
                      href="/sign-in"
                      className="text-sm font-medium text-gray-600 hover:text-blue-800 transition-colors"
                    >
                      Sign In
                    </Link>
                  </SignedOut>
                  <SignedIn>
                    <UserButton afterSignOutUrl="/" />
                  </SignedIn>
                </div>
              </div>
            </div>
          </nav>

          <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  )
}
