'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { getProfile, updateProfile } from '@/lib/api'
import type { Profile, EducationEntry, ExperienceEntry } from '@/lib/types'

const emptyEducation = (): EducationEntry => ({ school: '', degree: '', year: '' })
const emptyExperience = (): ExperienceEntry => ({
  company: '',
  role: '',
  start_year: '',
  end_year: '',
  description: '',
})

const inputClass =
  'w-full border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300'

export default function ProfilePage() {
  const { getToken } = useAuth()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [skillsInput, setSkillsInput] = useState('')
  const [certificationsInput, setCertificationsInput] = useState('')
  const [targetRolesInput, setTargetRolesInput] = useState('')
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
        education: education.filter((e) => e.school.trim() || e.degree.trim()),
        experience: experience.filter((e) => e.company.trim() || e.role.trim()),
      }
      await updateProfile(token, profile)
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
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Keep your profile up to date for better AI career advice</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-600">{error}</div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-700">
            Profile saved successfully!
          </div>
        )}

        {/* Skills */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Skills</h2>
          <input
            type="text"
            value={skillsInput}
            onChange={(e) => setSkillsInput(e.target.value)}
            placeholder="e.g. JavaScript, Python, SQL (comma-separated)"
            className={inputClass}
          />
        </div>

        {/* Target Roles */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Target Roles</h2>
          <input
            type="text"
            value={targetRolesInput}
            onChange={(e) => setTargetRolesInput(e.target.value)}
            placeholder="e.g. Software Engineer, Data Analyst (comma-separated)"
            className={inputClass}
          />
        </div>

        {/* Certifications */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Certifications</h2>
          <input
            type="text"
            value={certificationsInput}
            onChange={(e) => setCertificationsInput(e.target.value)}
            placeholder="e.g. AWS Solutions Architect, PMP (comma-separated)"
            className={inputClass}
          />
        </div>

        {/* Education */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Education</h2>
            <button
              type="button"
              onClick={addEducation}
              className="text-sm text-blue-700 font-medium hover:underline"
            >
              + Add
            </button>
          </div>
          <div className="space-y-4">
            {education.map((entry, idx) => (
              <div key={idx} className="border border-gray-100 rounded-lg p-4 relative bg-gray-50/50">
                {education.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEducation(idx)}
                    className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-xs"
                  >
                    Remove
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
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Experience</h2>
            <button
              type="button"
              onClick={addExperience}
              className="text-sm text-blue-700 font-medium hover:underline"
            >
              + Add
            </button>
          </div>
          <div className="space-y-4">
            {experience.map((entry, idx) => (
              <div key={idx} className="border border-gray-100 rounded-lg p-4 relative bg-gray-50/50">
                {experience.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeExperience(idx)}
                    className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-xs"
                  >
                    Remove
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
          className="w-full py-3 bg-blue-800 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  )
}
