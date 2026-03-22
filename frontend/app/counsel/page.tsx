'use client'

import { useState, useEffect } from 'react'
import { useAuth, useUser } from '@clerk/nextjs'
import { getProfile, getCounsel } from '@/lib/api'
import type { Profile, CounselResponse } from '@/lib/types'
import CounselorResult from '@/components/CounselorResult'
import { useLanguage } from '@/contexts/LanguageContext'

const CACHE_KEY_PREFIX = 'counselResult_'

export default function CounselPage() {
  const { getToken } = useAuth()
  const { user } = useUser()
  const { t } = useLanguage()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [counselLoading, setCounselLoading] = useState(false)
  const [result, setResult] = useState<CounselResponse | null>(null)
  const [cachedAt, setCachedAt] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  const cacheKey = user ? `${CACHE_KEY_PREFIX}${user.id}` : null

  // Load cached result on mount
  useEffect(() => {
    if (!cacheKey) return
    try {
      const raw = localStorage.getItem(cacheKey)
      if (raw) {
        const parsed = JSON.parse(raw)
        setResult(parsed.result)
        setCachedAt(new Date(parsed.savedAt))
      }
    } catch {
      // Ignore corrupted cache
    }
  }, [cacheKey])

  useEffect(() => {
    async function fetchProfile() {
      try {
        const token = await getToken()
        const data = await getProfile(token)
        setProfile(data)
      } catch (err) {
        const msg = err instanceof Error ? err.message : ''
        if (!msg.includes('404') && !msg.toLowerCase().includes('not found')) {
          setProfileError('Could not load profile. Please try again.')
        }
      } finally {
        setProfileLoading(false)
      }
    }
    fetchProfile()
  }, [getToken])

  async function handleGetAdvice() {
    setCounselLoading(true)
    setError(null)
    try {
      const token = await getToken()
      const data = await getCounsel(token)
      setResult(data)
      const now = new Date()
      setCachedAt(now)
      if (cacheKey) {
        localStorage.setItem(cacheKey, JSON.stringify({ result: data, savedAt: now.toISOString() }))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get career advice')
    } finally {
      setCounselLoading(false)
    }
  }

  function handleClearCache() {
    if (cacheKey) localStorage.removeItem(cacheKey)
    setResult(null)
    setCachedAt(null)
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t.counselTitle}</h1>
        <p className="text-sm text-gray-500 mt-1">{t.counselSubtitle}</p>
      </div>

      {/* Profile Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">{t.counselProfileSummary}</h2>

        {profileLoading ? (
          <p className="text-sm text-gray-400">{t.counselLoadingProfile}</p>
        ) : profile === null ? (
          profileError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
              {profileError}
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              <p className="mb-2">{t.counselNoProfile}</p>
              <a href="/profile" className="text-blue-700 underline">
                {t.counselSetupProfile}
              </a>{' '}
              to get personalized advice.
            </div>
          )
        ) : (
          <div className="space-y-3 text-sm">
            <div>
              <span className="font-bold text-gray-900">{t.counselSkills}: </span>
              {profile.skills.length > 0 ? (
                <span className="text-gray-600">{profile.skills.join(', ')}</span>
              ) : (
                <span className="text-gray-400 italic">None added</span>
              )}
            </div>
            <div>
              <span className="font-bold text-gray-900">{t.counselTargetRoles}: </span>
              {profile.target_roles.length > 0 ? (
                <span className="text-gray-600">{profile.target_roles.join(', ')}</span>
              ) : (
                <span className="text-gray-400 italic">None added</span>
              )}
            </div>
            <div>
              <span className="font-bold text-gray-900">{t.counselCertifications}: </span>
              {profile.certifications.length > 0 ? (
                <span className="text-gray-600">{profile.certifications.join(', ')}</span>
              ) : (
                <span className="text-gray-400 italic">None added</span>
              )}
            </div>
            {profile.education.length > 0 && (
              <div>
                <span className="font-bold text-gray-900">{t.counselEducation}: </span>
                <span className="text-gray-600">
                  {profile.education.map((e) => `${e.degree} at ${e.school}`).join(', ')}
                </span>
              </div>
            )}
            {profile.experience.length > 0 && (
              <div>
                <span className="font-bold text-gray-900">{t.counselExperience}: </span>
                <span className="text-gray-600">
                  {profile.experience.map((e) => `${e.role} at ${e.company}`).join(', ')}
                </span>
              </div>
            )}
            <div className="pt-1">
              <a href="/profile" className="text-blue-700 text-xs underline">
                {t.counselEditProfile}
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={handleGetAdvice}
          disabled={counselLoading || profileLoading}
          className="flex-1 py-3 bg-blue-800 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {counselLoading ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              {t.counselGenerating}
            </>
          ) : result ? (
            t.counselRegenerate
          ) : (
            t.counselGetAdvice
          )}
        </button>
        {result && (
          <button
            onClick={handleClearCache}
            className="px-4 py-3 border border-gray-200 text-gray-500 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            {t.clear}
          </button>
        )}
      </div>

      {/* Cache timestamp */}
      {cachedAt && !counselLoading && (
        <p className="text-xs text-gray-400 mb-4 -mt-2">
          Last generated {cachedAt.toLocaleDateString()} at {cachedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {t.counselSavedLocally}
        </p>
      )}

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
