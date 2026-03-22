import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import Nav from '@/components/Nav'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { PostSignupRoleSync } from '@/components/PostSignupRoleSync'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const runtime = 'nodejs'

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
        <body className="min-h-screen bg-gray-50 text-gray-900 font-sans antialiased" suppressHydrationWarning>
          <LanguageProvider>
            <Nav />
            <PostSignupRoleSync />
            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
          </LanguageProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
