import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider, UserButton, SignedIn, SignedOut } from '@clerk/nextjs'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

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
      <html lang="en" className={inter.variable}>
        <body className="min-h-screen bg-gray-50 text-gray-900 font-sans antialiased">
          <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/80 sticky top-0 z-50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-15 py-3">
                {/* Logo */}
                <Link
                  href="/"
                  className="text-xl font-bold tracking-tight text-blue-800 hover:text-blue-700 transition-colors"
                >
                  settl.ai
                </Link>

                {/* Nav Links */}
                <div className="flex items-center gap-1">
                  <Link
                    href="/jobs"
                    className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-all"
                  >
                    Jobs
                  </Link>
                  <SignedIn>
                    <Link
                      href="/counsel"
                      className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-all"
                    >
                      Counsel
                    </Link>
                    <Link
                      href="/profile"
                      className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-all"
                    >
                      Profile
                    </Link>
                    <Link
                      href="/resume"
                      className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-all"
                    >
                      Resume
                    </Link>
                    <Link
                      href="/jobs/post"
                      className="ml-2 px-3.5 py-1.5 text-sm font-semibold text-white bg-blue-800 hover:bg-blue-700 rounded-md transition-all"
                    >
                      Post a Job
                    </Link>
                  </SignedIn>
                  <SignedOut>
                    <Link
                      href="/sign-in"
                      className="ml-2 px-3.5 py-1.5 text-sm font-semibold text-white bg-blue-800 hover:bg-blue-700 rounded-md transition-all"
                    >
                      Sign In
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

          <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  )
}
