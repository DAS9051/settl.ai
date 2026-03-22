'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { getProfile, updateProfile } from '@/lib/api'
import type { Profile, EducationEntry, ExperienceEntry } from '@/lib/types'
import { useLanguage } from '@/contexts/LanguageContext'
import type { Language } from '@/lib/translations'

const emptyEducation = (): EducationEntry => ({ school: '', degree: '', year: '' })
const emptyExperience = (): ExperienceEntry => ({
  company: '',
  role: '',
  start_year: '',
  end_year: '',
  description: '',
})

const inputClass =
  'w-full border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal'

export default function ProfilePage() {
  const { getToken } = useAuth()
  const { t, setLanguage } = useLanguage()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [skillsInput, setSkillsInput] = useState('')
  const [certificationsInput, setCertificationsInput] = useState('')
  const [targetRolesInput, setTargetRolesInput] = useState('')
  const [preferredLanguage, setPreferredLanguage] = useState('English')
  const [province, setProvince] = useState('Ontario')
  const [education, setEducation] = useState<EducationEntry[]>([emptyEducation()])
  const [experience, setExperience] = useState<ExperienceEntry[]>([emptyExperience()])

  useEffect(() => {
    async function fetchProfile() {
      try {
        const token = await getToken()
        const data = await getProfile(token)
        setSkillsInput(data.skills.join(', '))
        setCertificationsInput(data.certifications.join(', '))
        setTargetRolesInput(data.target_roles.join(', '))
        const lang = data.preferred_language || 'English'
        setPreferredLanguage(lang)
        setLanguage(lang as Language)
        setProvince(data.province || 'Ontario')
        setEducation(data.education.length > 0 ? data.education : [emptyEducation()])
        setExperience(data.experience.length > 0 ? data.experience : [emptyExperience()])
      } catch {
        // Profile may not exist yet — start with empty form
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [getToken])

  function csvToArray(val: string): string[] {
    return val
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const token = await getToken()
      const profile: Profile = {
        skills: csvToArray(skillsInput),
        certifications: csvToArray(certificationsInput),
        target_roles: csvToArray(targetRolesInput),
        preferred_language: preferredLanguage,
        province,
        education: education.filter((e) => e.school.trim() || e.degree.trim()),
        experience: experience.filter((e) => e.company.trim() || e.role.trim()),
      }
      await updateProfile(token, profile)
      setLanguage(preferredLanguage as Language)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  // Education helpers
  function updateEducation(idx: number, field: keyof EducationEntry, value: string) {
    setEducation((prev) => prev.map((e, i) => (i === idx ? { ...e, [field]: value } : e)))
  }
  function addEducation() {
    setEducation((prev) => [...prev, emptyEducation()])
  }
  function removeEducation(idx: number) {
    setEducation((prev) => prev.filter((_, i) => i !== idx))
  }

  // Experience helpers
  function updateExperience(idx: number, field: keyof ExperienceEntry, value: string) {
    setExperience((prev) => prev.map((e, i) => (i === idx ? { ...e, [field]: value } : e)))
  }
  function addExperience() {
    setExperience((prev) => [...prev, emptyExperience()])
  }
  function removeExperience(idx: number) {
    setExperience((prev) => prev.filter((_, i) => i !== idx))
  }

  // Profile completeness calculation (based on live form state, not saved data)
  const skills = csvToArray(skillsInput)
  const certifications = csvToArray(certificationsInput)
  const targetRoles = csvToArray(targetRolesInput)
  const validEducation = education.filter((e) => e.school.trim() || e.degree.trim())
  const validExperience = experience.filter((e) => e.company.trim() || e.role.trim())

  const completenessFields = [
    skills.length > 0,
    certifications.length > 0,
    targetRoles.length > 0,
    validEducation.length > 0,
    validExperience.length > 0,
  ]
  const filledCount = completenessFields.filter(Boolean).length
  const totalFields = completenessFields.length
  const completenessPercent = Math.round((filledCount / totalFields) * 100)

  const missingLabels: string[] = []
  if (skills.length === 0) missingLabels.push('skills')
  if (certifications.length === 0) missingLabels.push('certifications')
  if (targetRoles.length === 0) missingLabels.push('target roles')
  if (validEducation.length === 0) missingLabels.push('education')
  if (validExperience.length === 0) missingLabels.push('experience')

  const barColor =
    completenessPercent === 100
      ? 'bg-green-500'
      : completenessPercent >= 50
      ? 'bg-yellow-400'
      : 'bg-red-500'

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">
        <svg className="animate-spin w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        Loading profile...
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-brand-navy dark:text-brand-cream">{t.profileTitle}</h1>
        <p className="text-sm text-gray-500 mt-1 dark:text-brand-sage">{t.profileSubtitle}</p>
      </div>

      {/* Profile Completeness Bar */}
      {!loading && (
        <div className="bg-white rounded-xl border-2 border-gray-200 p-5 mb-6 shadow-sm dark:bg-brand-navy-dark dark:border-brand-teal/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-brand-navy dark:text-brand-cream">{t.profileCompleteness}</span>
            <span
              className={`text-sm font-bold ${
                completenessPercent === 100
                  ? 'text-green-600'
                  : completenessPercent >= 50
                  ? 'text-yellow-600'
                  : 'text-red-600'
              }`}
            >
              {completenessPercent}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div
              className={`${barColor} h-2.5 rounded-full transition-all duration-500`}
              style={{ width: `${completenessPercent}%` }}
            />
          </div>
          {missingLabels.length > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              Add {missingLabels.join(', ')} to improve your matches
            </p>
          )}
          {completenessPercent === 100 && (
            <p className="text-xs text-green-600 mt-2 font-medium">{t.profileComplete}</p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-600">{error}</div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-700">
            {t.profileSaved}
          </div>
        )}

        {/* Skills */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm dark:bg-brand-navy-dark dark:border-brand-teal/30">
          <h2 className="text-sm font-semibold text-brand-teal uppercase tracking-wide mb-3 dark:text-brand-sage">{t.profileSkills}</h2>
          <input
            type="text"
            value={skillsInput}
            onChange={(e) => setSkillsInput(e.target.value)}
            placeholder={t.profileSkillsPlaceholder}
            className={inputClass}
          />
        </div>

        {/* Target Roles */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm dark:bg-brand-navy-dark dark:border-brand-teal/30">
          <h2 className="text-sm font-semibold text-brand-teal uppercase tracking-wide mb-3 dark:text-brand-sage">{t.profileTargetRoles}</h2>
          <input
            type="text"
            value={targetRolesInput}
            onChange={(e) => setTargetRolesInput(e.target.value)}
            placeholder={t.profileTargetRolesPlaceholder}
            className={inputClass}
          />
        </div>

        {/* Certifications */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm dark:bg-brand-navy-dark dark:border-brand-teal/30">
          <h2 className="text-sm font-semibold text-brand-teal uppercase tracking-wide mb-3 dark:text-brand-sage">{t.profileCertifications}</h2>
          <input
            type="text"
            value={certificationsInput}
            onChange={(e) => setCertificationsInput(e.target.value)}
            placeholder={t.profileCertificationsPlaceholder}
            className={inputClass}
          />
        </div>

        {/* Preferred Language */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm dark:bg-brand-navy-dark dark:border-brand-teal/30">
          <h2 className="text-sm font-semibold text-brand-teal uppercase tracking-wide mb-3 dark:text-brand-sage">{t.profilePreferredLanguage}</h2>
          <p className="text-xs text-gray-400 mb-3">{t.profileLanguageHint}</p>
          <select
            value={preferredLanguage}
            onChange={(e) => setPreferredLanguage(e.target.value)}
            className={inputClass}
          >
            <option value="English">English</option>
            <option value="Spanish">Español (Spanish)</option>
            <option value="French">Français (French)</option>
            <option value="Hindi">हिन्दी (Hindi)</option>
            <option value="Tagalog">Tagalog</option>
            <option value="Punjabi">ਪੰਜਾਬੀ (Punjabi)</option>
            <option value="Mandarin (Simplified)">中文简体 (Mandarin Simplified)</option>
            <option value="Korean">한국어 (Korean)</option>
          </select>
        </div>

        {/* Province */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Province / Territory</h2>
          <p className="text-xs text-gray-400 mb-3">Used to show you accurate minimum wage, rights, and paycheck info for your area.</p>
          <select
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            className={inputClass}
          >
            <option value="Ontario">Ontario</option>
            <option value="British Columbia">British Columbia</option>
            <option value="Alberta">Alberta</option>
            <option value="Quebec">Quebec</option>
            <option value="Manitoba">Manitoba</option>
            <option value="Saskatchewan">Saskatchewan</option>
            <option value="Nova Scotia">Nova Scotia</option>
            <option value="New Brunswick">New Brunswick</option>
            <option value="Prince Edward Island">Prince Edward Island</option>
            <option value="Newfoundland and Labrador">Newfoundland and Labrador</option>
            <option value="Northwest Territories">Northwest Territories</option>
            <option value="Yukon">Yukon</option>
            <option value="Nunavut">Nunavut</option>
          </select>
        </div>

        {/* Education */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm dark:bg-brand-navy-dark dark:border-brand-teal/30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-brand-teal uppercase tracking-wide dark:text-brand-sage">{t.profileEducation}</h2>
            <button
              type="button"
              onClick={addEducation}
              className="text-sm text-brand-teal font-medium hover:underline"
            >
              {t.add}
            </button>
          </div>
          <div className="space-y-4">
            {education.map((entry, idx) => (
              <div key={idx} className="border border-brand-teal/20 rounded-lg p-4 relative bg-brand-cream/10 dark:bg-brand-navy/40 dark:border-brand-teal/20">
                {education.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEducation(idx)}
                    className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-xs"
                  >
                    {t.remove}
                  </button>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="School / University"
                    value={entry.school}
                    onChange={(e) => updateEducation(idx, 'school', e.target.value)}
                    className={inputClass}
                  />
                  <input
                    type="text"
                    placeholder="Degree / Field"
                    value={entry.degree}
                    onChange={(e) => updateEducation(idx, 'degree', e.target.value)}
                    className={inputClass}
                  />
                  <input
                    type="text"
                    placeholder="Graduation Year"
                    value={entry.year}
                    onChange={(e) => updateEducation(idx, 'year', e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Experience */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm dark:bg-brand-navy-dark dark:border-brand-teal/30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-brand-teal uppercase tracking-wide dark:text-brand-sage">{t.profileExperience}</h2>
            <button
              type="button"
              onClick={addExperience}
              className="text-sm text-brand-teal font-medium hover:underline"
            >
              {t.add}
            </button>
          </div>
          <div className="space-y-4">
            {experience.map((entry, idx) => (
              <div key={idx} className="border border-brand-teal/20 rounded-lg p-4 relative bg-brand-cream/10 dark:bg-brand-navy/40 dark:border-brand-teal/20">
                {experience.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeExperience(idx)}
                    className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-xs"
                  >
                    {t.remove}
                  </button>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <input
                    type="text"
                    placeholder="Company"
                    value={entry.company}
                    onChange={(e) => updateExperience(idx, 'company', e.target.value)}
                    className={inputClass}
                  />
                  <input
                    type="text"
                    placeholder="Role / Title"
                    value={entry.role}
                    onChange={(e) => updateExperience(idx, 'role', e.target.value)}
                    className={inputClass}
                  />
                  <input
                    type="text"
                    placeholder="Start Year"
                    value={entry.start_year}
                    onChange={(e) => updateExperience(idx, 'start_year', e.target.value)}
                    className={inputClass}
                  />
                  <input
                    type="text"
                    placeholder="End Year (or Present)"
                    value={entry.end_year}
                    onChange={(e) => updateExperience(idx, 'end_year', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <textarea
                  placeholder="Brief description of responsibilities..."
                  rows={2}
                  value={entry.description}
                  onChange={(e) => updateExperience(idx, 'description', e.target.value)}
                  className={`${inputClass} resize-none`}
                />
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-brand-navy text-white rounded-lg text-sm font-semibold hover:bg-brand-teal transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-brand-teal dark:hover:bg-brand-teal-light"
        >
          {saving ? t.profileSaving : t.profileSave}
        </button>
      </form>
    </div>
  )
}
