'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { getProfile, getCounsel } from '@/lib/api'
import type { Profile, CounselResponse } from '@/lib/types'
import CounselorResult from '@/components/CounselorResult'

export default function CounselPage() {
  const { getToken } = useAuth()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [counselLoading, setCounselLoading] = useState(false)
  const [result, setResult] = useState<CounselResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProfile() {
      try {
        const token = await getToken()
        const data = await getProfile(token)
        setProfile(data)
      } catch {
        setProfileError('Could not load profile. Please try again.')
      } finally {
        setProfileLoading(false)
      }
    }
    fetchProfile()
  }, [getToken])

  async function handleGetAdvice() {
    setCounselLoading(true)
    setError(null)
    setResult(null)
    try {
      const token = await getToken()
      const data = await getCounsel(token)
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get career advice')
    } finally {
      setCounselLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">AI Career Counselor</h1>
        <p className="text-sm text-gray-500 mt-1">
          Get personalized career advice powered by Claude AI based on your profile
        </p>
      </div>

      {/* Profile Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Your Profile Summary</h2>

        {profileLoading ? (
          <p className="text-sm text-gray-400">Loading profile...</p>
        ) : profile === null ? (
          profileError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
              {profileError}
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              <p className="mb-2">No profile found.</p>
              <a href="/profile" className="text-blue-700 underline">
                Set up your profile
              </a>{' '}
              to get personalized advice.
            </div>
          )
        ) : (
          <div className="space-y-3 text-sm">
            <div>
              <span className="font-medium text-gray-700">Skills: </span>
              {profile.skills.length > 0 ? (
                <span className="text-gray-600">{profile.skills.join(', ')}</span>
              ) : (
                <span className="text-gray-400 italic">None added</span>
              )}
            </div>
            <div>
              <span className="font-medium text-gray-700">Target Roles: </span>
              {profile.target_roles.length > 0 ? (
                <span className="text-gray-600">{profile.target_roles.join(', ')}</span>
              ) : (
                <span className="text-gray-400 italic">None added</span>
              )}
            </div>
            <div>
              <span className="font-medium text-gray-700">Certifications: </span>
              {profile.certifications.length > 0 ? (
                <span className="text-gray-600">{profile.certifications.join(', ')}</span>
              ) : (
                <span className="text-gray-400 italic">None added</span>
              )}
            </div>
            {profile.education.length > 0 && (
              <div>
                <span className="font-medium text-gray-700">Education: </span>
                <span className="text-gray-600">
                  {profile.education.map((e) => `${e.degree} at ${e.school}`).join(', ')}
                </span>
              </div>
            )}
            {profile.experience.length > 0 && (
              <div>
                <span className="font-medium text-gray-700">Experience: </span>
                <span className="text-gray-600">
                  {profile.experience.map((e) => `${e.role} at ${e.company}`).join(', ')}
                </span>
              </div>
            )}
            <div className="pt-1">
              <a href="/profile" className="text-blue-700 text-xs underline">
                Edit profile
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Action Button */}
      <button
        onClick={handleGetAdvice}
        disabled={counselLoading || profileLoading || profileError !== null}
        className="w-full py-3 bg-blue-800 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-6 flex items-center justify-center gap-2"
      >
        {counselLoading ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Generating advice...
          </>
        ) : (
          'Get Career Advice'
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600 mb-6">
          {error}
        </div>
      )}

      {/* Result */}
      {result && <CounselorResult result={result} />}
    </div>
  )
}
