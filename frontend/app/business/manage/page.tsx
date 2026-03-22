'use client'

import { useState, useEffect } from 'react'
import { useAuth, useUser } from '@clerk/nextjs'
import { getMyBusinessJobs, postJob, updateJob, deleteJob } from '@/lib/api'
import type { Job } from '@/lib/types'

const inputClass =
  'w-full border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal dark:bg-brand-navy-dark dark:border-brand-teal/30 dark:text-brand-cream'

const labelClass = 'block text-sm font-medium text-gray-700 dark:text-brand-cream/80 mb-1'

type EditState = {
  title: string
  description: string
  location: string
  salary_range: string
  skills: string
  application_link: string
  category: string
}

function toEditState(job: Job): EditState {
  return {
    title: job.title,
    description: job.description,
    location: job.location,
    salary_range: job.salary_range || '',
    skills: job.skills_required.join(', '),
    application_link: job.application_link || '',
    category: job.category || 'long_term',
  }
}

export default function BusinessManagePage() {
  const { getToken } = useAuth()
  const { user, isLoaded } = useUser()

  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editState, setEditState] = useState<EditState | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [addState, setAddState] = useState<EditState>({
    title: '', description: '', location: '', salary_range: '', skills: '', application_link: '', category: 'long_term',
  })
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (!isLoaded || !user) { setLoading(false); return }
    async function load() {
      try {
        const token = await getToken()
        const data = await getMyBusinessJobs(token)
        setJobs(data.jobs)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load jobs.')
      } finally {
        setLoading(false)
      }
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user])

  if (isLoaded && !user) {
    return <div className="text-center py-16 text-gray-500">Please sign in to manage your business.</div>
  }

  function startEdit(job: Job) {
    setEditingId(job.id)
    setEditState(toEditState(job))
  }

  function cancelEdit() {
    setEditingId(null)
    setEditState(null)
  }

  async function handleSave(jobId: string) {
    if (!editState) return
    setSaving(true)
    setError(null)
    try {
      const token = await getToken()
      const updated = await updateJob(token, jobId, {
        title: editState.title.trim(),
        description: editState.description.trim(),
        location: editState.location.trim(),
        salary_range: editState.salary_range.trim() || null,
        skills_required: editState.skills.split(',').map(s => s.trim()).filter(Boolean),
        application_link: editState.application_link.trim() || null,
        category: editState.category,
      })
      setJobs(prev => prev.map(j => j.id === jobId ? updated : j))
      cancelEdit()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save changes.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(jobId: string) {
    if (!confirm('Delete this job posting? This cannot be undone.')) return
    setDeletingId(jobId)
    setError(null)
    try {
      const token = await getToken()
      await deleteJob(token, jobId)
      setJobs(prev => prev.filter(j => j.id !== jobId))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete job.')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setAdding(true)
    setError(null)
    try {
      const token = await getToken()
      const created = await postJob(token, {
        title: addState.title.trim(),
        description: addState.description.trim(),
        location: addState.location.trim(),
        salary_range: addState.salary_range.trim() || null,
        skills_required: addState.skills.split(',').map(s => s.trim()).filter(Boolean),
        application_link: addState.application_link.trim() || null,
        category: addState.category,
      })
      setJobs(prev => [created, ...prev])
      setShowAdd(false)
      setAddState({ title: '', description: '', location: '', salary_range: '', skills: '', application_link: '', category: 'long_term' })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to post job.')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-brand-cream">Manage Jobs</h1>
          <p className="text-sm text-gray-500 dark:text-brand-sage mt-1">Edit, add, or remove your job postings</p>
        </div>
        <button
          onClick={() => setShowAdd(v => !v)}
          className="px-4 py-2 bg-brand-navy text-white rounded-lg text-sm font-semibold hover:bg-brand-navy-light transition-colors"
        >
          {showAdd ? 'Cancel' : '+ Add Job'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-600 mb-4">
          {error}
        </div>
      )}

      {/* Add job form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white dark:bg-brand-navy-dark rounded-xl border border-gray-200 dark:border-brand-teal/30 p-6 mb-6 space-y-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-brand-cream uppercase tracking-wide">New Job Posting</h2>
          <div>
            <label className={labelClass}>Job Title *</label>
            <input required value={addState.title} onChange={e => setAddState(s => ({ ...s, title: e.target.value }))} placeholder="e.g. Cashier" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Description *</label>
            <textarea required rows={4} value={addState.description} onChange={e => setAddState(s => ({ ...s, description: e.target.value }))} placeholder="Describe the role..." className={`${inputClass} resize-none`} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Location *</label>
              <input required value={addState.location} onChange={e => setAddState(s => ({ ...s, location: e.target.value }))} placeholder="e.g. Toronto, ON" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Salary Range</label>
              <input value={addState.salary_range} onChange={e => setAddState(s => ({ ...s, salary_range: e.target.value }))} placeholder="e.g. $50,000 - $65,000" className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Required Skills</label>
            <input value={addState.skills} onChange={e => setAddState(s => ({ ...s, skills: e.target.value }))} placeholder="Customer Service, Driving (comma-separated)" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Application Link</label>
            <input type="url" value={addState.application_link} onChange={e => setAddState(s => ({ ...s, application_link: e.target.value }))} placeholder="https://..." className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Job Type</label>
            <div className="flex gap-2">
              {(['long_term', 'short_term'] as const).map(cat => (
                <button key={cat} type="button" onClick={() => setAddState(s => ({ ...s, category: cat }))}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-medium border transition-colors ${addState.category === cat ? 'bg-brand-navy text-white border-brand-navy' : 'bg-white text-gray-600 border-gray-300 hover:border-brand-teal dark:bg-brand-navy dark:text-brand-cream/70 dark:border-brand-teal/30'}`}>
                  {cat === 'long_term' ? 'Long Term' : 'Short Term'}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" disabled={adding} className="w-full py-2.5 bg-brand-navy text-white rounded-lg text-sm font-semibold hover:bg-brand-navy-light transition-colors disabled:opacity-50">
            {adding ? 'Posting...' : 'Post Job'}
          </button>
        </form>
      )}

      {/* Job list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-2/3 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white dark:bg-brand-navy-dark rounded-xl border border-gray-200 dark:border-brand-teal/30 p-16 text-center shadow-sm">
          <div className="text-4xl mb-4">📋</div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-brand-cream mb-2">No job postings yet</h2>
          <p className="text-sm text-gray-500 dark:text-brand-sage mb-5">Add your first job posting above.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map(job => (
            <div key={job.id} className="bg-white dark:bg-brand-navy-dark rounded-xl border border-gray-200 dark:border-brand-teal/30 p-5 shadow-sm">
              {editingId === job.id && editState ? (
                <div className="space-y-3">
                  <div>
                    <label className={labelClass}>Job Title</label>
                    <input value={editState.title} onChange={e => setEditState(s => s ? { ...s, title: e.target.value } : s)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Description</label>
                    <textarea rows={4} value={editState.description} onChange={e => setEditState(s => s ? { ...s, description: e.target.value } : s)} className={`${inputClass} resize-none`} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Location</label>
                      <input value={editState.location} onChange={e => setEditState(s => s ? { ...s, location: e.target.value } : s)} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Salary Range</label>
                      <input value={editState.salary_range} onChange={e => setEditState(s => s ? { ...s, salary_range: e.target.value } : s)} className={inputClass} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Skills (comma-separated)</label>
                    <input value={editState.skills} onChange={e => setEditState(s => s ? { ...s, skills: e.target.value } : s)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Application Link</label>
                    <input value={editState.application_link} onChange={e => setEditState(s => s ? { ...s, application_link: e.target.value } : s)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Job Type</label>
                    <div className="flex gap-2">
                      {(['long_term', 'short_term'] as const).map(cat => (
                        <button key={cat} type="button" onClick={() => setEditState(s => s ? { ...s, category: cat } : s)}
                          className={`flex-1 py-1.5 rounded-lg text-sm font-medium border transition-colors ${editState.category === cat ? 'bg-brand-navy text-white border-brand-navy' : 'bg-white text-gray-600 border-gray-300 hover:border-brand-teal dark:bg-brand-navy dark:text-brand-cream/70 dark:border-brand-teal/30'}`}>
                          {cat === 'long_term' ? 'Long Term' : 'Short Term'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => handleSave(job.id)} disabled={saving} className="px-4 py-1.5 bg-brand-navy text-white rounded-lg text-sm font-semibold hover:bg-brand-navy-light disabled:opacity-50 transition-colors">
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button onClick={cancelEdit} className="px-4 py-1.5 border border-gray-300 text-gray-600 dark:text-brand-cream/70 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-brand-navy transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-brand-cream">{job.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-brand-sage mt-0.5">{job.location}{job.salary_range ? ` · ${job.salary_range}` : ''}</p>
                    {job.skills_required.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {job.skills_required.slice(0, 4).map(s => (
                          <span key={s} className="text-xs bg-brand-teal/10 text-brand-teal-dark dark:text-brand-cream px-2 py-0.5 rounded-full">{s}</span>
                        ))}
                        {job.skills_required.length > 4 && <span className="text-xs text-gray-400">+{job.skills_required.length - 4} more</span>}
                      </div>
                    )}
                    {job.application_link && (
                      <p className="text-xs text-brand-teal mt-1.5 truncate">{job.application_link}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => startEdit(job)} className="px-3 py-1.5 text-xs font-semibold text-brand-navy dark:text-brand-cream border border-brand-teal/40 rounded-lg hover:bg-brand-cream-light dark:hover:bg-brand-navy transition-colors">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(job.id)} disabled={deletingId === job.id} className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-red-500 border border-gray-200 rounded-lg hover:border-red-200 transition-colors disabled:opacity-50">
                      {deletingId === job.id ? '...' : 'Delete'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
