'use client'

import { useState } from 'react'
import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  const [step, setStep] = useState<'pick' | 'signup'>('pick')

  function selectRole(role: 'worker' | 'business') {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pendingRole', role)
    }
    setStep('signup')
  }

  if (step === 'signup') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <SignUp afterSignUpUrl="/" />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to settl.ai</h1>
          <p className="text-gray-500">How will you use settl.ai?</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Worker card */}
          <button
            onClick={() => selectRole('worker')}
            className="group bg-white rounded-2xl border-2 border-gray-200 hover:border-blue-500 p-8 text-left transition-all shadow-sm hover:shadow-md"
          >
            <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center mb-5 group-hover:bg-blue-100 transition-colors">
              <svg className="w-7 h-7 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">I'm looking for work</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Find local jobs, get AI career counseling, and build your resume with personalized guidance for newcomers.
            </p>
            <div className="mt-5 flex items-center gap-1 text-blue-700 text-sm font-semibold group-hover:gap-2 transition-all">
              Get started
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* Business card */}
          <button
            onClick={() => selectRole('business')}
            className="group bg-white rounded-2xl border-2 border-gray-200 hover:border-emerald-500 p-8 text-left transition-all shadow-sm hover:shadow-md"
          >
            <div className="w-14 h-14 rounded-xl bg-emerald-50 flex items-center justify-center mb-5 group-hover:bg-emerald-100 transition-colors">
              <svg className="w-7 h-7 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">I'm a business owner</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Post jobs, connect with diverse local talent, and build an inclusive workforce in your community.
            </p>
            <div className="mt-5 flex items-center gap-1 text-emerald-700 text-sm font-semibold group-hover:gap-2 transition-all">
              Get started
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Already have an account?{' '}
          <a href="/sign-in" className="text-blue-700 hover:underline">Sign in</a>
        </p>
      </div>
    </div>
  )
}
