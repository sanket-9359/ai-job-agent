import axios from 'axios'
import type {
  UserProfile, SearchResponse, EmailResponse,
  BulletsResponse, Application, ApplicationStatus
} from '../types'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const api = axios.create({
  baseURL: `${BASE}/api`,
  timeout: 35000,
})

// ─── Jobs ─────────────────────────────────────────────────────────────────────
export async function searchJobs(
  profile: UserProfile,
  mode: 'primary' | 'secondary'
): Promise<SearchResponse> {
  const { data } = await api.post('/jobs/search', {
    mode,
    targetRole:  profile.targetRole,
    experience:  profile.experience,
    skills:      profile.skills,
    resumeText:  profile.resumeText,
  })
  if (!data.success) throw new Error(data.message || 'Search failed')
  return data.data
}

export async function parsResume(file: File): Promise<string> {
  const form = new FormData()
  form.append('resume', file)
  const { data } = await api.post('/jobs/generate-summary', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  if (!data.success) throw new Error(data.message || 'Resume parsing failed')
  return data.data.summary
}

// ─── AI ───────────────────────────────────────────────────────────────────────
export async function generateEmail(
  jobId: string,
  profile: UserProfile
): Promise<EmailResponse> {
  const { data } = await api.post('/ai/generate-email', { jobId, profile })
  if (!data.success) throw new Error(data.message || 'Email generation failed')
  return data.data
}

export async function generateBullets(
  jobId: string,
  profile: UserProfile
): Promise<BulletsResponse> {
  const { data } = await api.post('/ai/generate-bullets', { jobId, profile })
  if (!data.success) throw new Error(data.message || 'Resume analysis failed')
  return data.data
}

// ─── Applications ─────────────────────────────────────────────────────────────
export async function getApplications(): Promise<Application[]> {
  const { data } = await api.get('/applications')
  if (!data.success) throw new Error(data.message || 'Failed to fetch applications')
  return data.data
}

// FIXED: Added jobData parameter to allow "Auto-Save" of new jobs
export async function createApplication(jobId: string, jobData?: any): Promise<Application> {
  const { data } = await api.post('/applications', { jobId, jobData }) 
  if (!data.success) throw new Error(data.message || 'Failed to save application')
  return data.data
}

export async function updateApplication(
  id: string,
  payload: { status?: ApplicationStatus; notes?: string }
): Promise<Application> {
  const { data } = await api.put(`/applications/${id}`, payload)
  if (!data.success) throw new Error(data.message || 'Failed to update application')
  return data.data
}

export async function deleteApplication(id: string): Promise<void> {
  const { data } = await api.delete(`/applications/${id}`)
  if (!data.success) throw new Error(data.message || 'Failed to delete application')
}