import axios, { AxiosHeaders, type AxiosRequestHeaders } from 'axios'
import type {
  UserProfile, SearchResponse, EmailResponse,
  BulletsResponse, Application, ApplicationStatus,
  AuthResponse
} from '../types'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const api = axios.create({
  baseURL: `${BASE}/api`,
  timeout: 35000,
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken')
  if (token) {
    const headers = config.headers as AxiosRequestHeaders | undefined
    config.headers = new AxiosHeaders({
      ...headers,
      Authorization: `Bearer ${token}`,
    })
  }
  return config
})

// ─── Authentication ──────────────────────────────────────────────────────────
export async function registerUser(
  fullName: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  const { data } = await api.post('/auth/register', { fullName, email, password })
  if (!data.success) throw new Error(data.message || 'Registration failed')
  return data.data
}

export async function loginUser(
  email: string,
  password: string
): Promise<AuthResponse> {
  const { data } = await api.post('/auth/login', { email, password })
  if (!data.success) throw new Error(data.message || 'Login failed')
  return data.data
}

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

  const { data } = await api.post(
    '/ai/generate-email',
    { jobId, profile }
  )

  if (!data.success)
    throw new Error(
      data.message || 'Email generation failed'
    )

  const emailData = data.data || {}

  const subject = String(
    emailData.subject || 'Job Application'
  ).trim()

  const email = String(
    emailData.email || emailData.body || ''
  ).trim()

  const body = String(
    emailData.body || emailData.email || ''
  ).trim()

  return {
    subject,
    email,
    body,
    _fallback: emailData._fallback || false
  }
}
export async function generateBullets(
  jobId: string,
  profile: UserProfile
): Promise<BulletsResponse> {
  const { data } = await api.post('/ai/generate-bullets', { jobId, profile })
  if (!data.success) throw new Error(data.message || 'Resume analysis failed')
  return data.data
}

export async function analyzeResume(
  resumeText: string,
  jobDescription: string,
  jobTitle?: string,
  companyName?: string
): Promise<{ strengths: string[]; weaknesses: string[]; match_percentage: number }> {
  const { data } = await api.post('/ai/analyze-resume', {
    resume_text: resumeText,
    job_description: jobDescription,
    job_title: jobTitle,
    company_name: companyName
  })
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
