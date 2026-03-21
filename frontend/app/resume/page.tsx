'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth, useUser } from '@clerk/nextjs'
import { importResume, generateResume } from '@/lib/api'

type Tab = 'import' | 'generate'

function Spinner({ label }: { label: string }) {
  return (
    <span className="flex items-center gap-2">
      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
      {label}
    </span>
  )
}

export default function ResumePage() {
  const { getToken } = useAuth()
  const { isSignedIn } = useUser()

  const [tab, setTab] = useState<Tab>('import')

  // Import tab
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [importLoading, setImportLoading] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState(false)

  // Generate tab
  const [genLoading, setGenLoading] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)
  const [genSuccess, setGenSuccess] = useState(false)

  if (!isSignedIn) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <p className="text-gray-600 dark:text-gray-400">Please sign in to use the resume tools.</p>
        <Link href="/sign-in" className="mt-3 inline-block text-blue-700 dark:text-blue-400 underline text-sm">
          Sign In
        </Link>
      </div>
    )
  }

  async function handleImport(e: React.FormEvent) {
    e.preventDefault()
    if (!resumeFile) return
    setImportLoading(true)
    setImportError(null)
    setImportSuccess(false)
    try {
      const token = await getToken()
      await importResume(token, resumeFile)
      setImportSuccess(true)
      setResumeFile(null)
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Failed to import resume')
    } finally {
      setImportLoading(false)
    }
  }

  async function handleGenerate() {
    setGenLoading(true)
    setGenError(null)
    setGenSuccess(false)
    try {
      const token = await getToken()
      const blob = await generateResume(token)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'resume.pdf'
      a.click()
      URL.revokeObjectURL(url)
      setGenSuccess(true)
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Failed to generate resume')
    } finally {
      setGenLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Resume</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Import your existing resume or generate one from your profile</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        {(['import', 'generate'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t
                ? 'border-blue-800 dark:border-blue-500 text-blue-800 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {t === 'import' ? 'Import Resume' : 'Generate Resume'}
          </button>
        ))}
      </div>

      {/* Import Tab */}
      {tab === 'import' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">Import Resume</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Upload your resume as a PDF. Our AI will parse it and update your profile automatically.
          </p>

          {importSuccess && (
            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg px-4 py-3 mb-4 flex items-center justify-between">
              <span className="text-sm text-green-800 dark:text-green-400 font-medium">Profile updated from resume!</span>
              <Link href="/profile" className="text-sm text-green-700 dark:text-green-400 underline hover:text-green-900 dark:hover:text-green-300">
                Review profile
              </Link>
            </div>
          )}

          {importError && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg px-4 py-3 mb-4">
              <p className="text-sm text-red-600 dark:text-red-400">{importError}</p>
            </div>
          )}

          <form onSubmit={handleImport} className="space-y-4">
            <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors">
              <div className="flex flex-col items-center gap-1 text-gray-500 dark:text-gray-400">
                <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {resumeFile ? (
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-400">{resumeFile.name}</span>
                ) : (
                  <>
                    <span className="text-sm font-medium">Click to upload PDF</span>
                    <span className="text-xs">PDF files only</span>
                  </>
                )}
              </div>
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <button
              type="submit"
              disabled={importLoading || !resumeFile}
              className="px-6 py-2.5 bg-blue-800 dark:bg-blue-700 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {importLoading ? <Spinner label="Parsing resume with AI..." /> : 'Import & Update Profile'}
            </button>
          </form>
        </div>
      )}

      {/* Generate Tab */}
      {tab === 'generate' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Generate Resume</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Generate a polished resume from your profile data. Make sure your{' '}
            <Link href="/profile" className="text-blue-700 dark:text-blue-400 underline">
              profile
            </Link>{' '}
            is up to date first.
          </p>

          {genError && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg px-4 py-3 mb-4">
              <p className="text-sm text-red-600 dark:text-red-400">{genError}</p>
            </div>
          )}

          {genSuccess && (
            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg px-4 py-3 mb-4">
              <p className="text-sm text-green-800 dark:text-green-400 font-medium">
                Resume downloaded as <strong>resume.pdf</strong>
              </p>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={genLoading}
            className="px-6 py-2.5 bg-blue-800 dark:bg-blue-700 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {genLoading ? <Spinner label="Compiling PDF..." /> : genSuccess ? 'Download Again' : 'Generate & Download PDF'}
          </button>
        </div>
      )}
    </div>
  )
}
