// Format bytes to human readable
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Truncate long strings
export function truncate(str: string, max: number): string {
  if (!str || str.length <= max) return str
  return str.slice(0, max) + '…'
}

// Copy text to clipboard, returns success bool
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

// Validate a resume file (type + size)
export function validateResumeFile(file: File): string | null {
  const maxSize = parseInt(import.meta.env.VITE_MAX_RESUME_SIZE || '5242880', 10)
  const allowed = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
  ]
  if (!allowed.includes(file.type)) {
    return 'Unsupported file type. Upload PDF, DOCX, JPG, or PNG.'
  }
  if (file.size > maxSize) {
    return `File is too large. Maximum size is ${formatFileSize(maxSize)}.`
  }
  return null
}

// Format ISO date string as "DD MMM YYYY"
export function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

// Status label map
export const STATUS_LABELS: Record<string, string> = {
  pending:   'Saved',
  applied:   'Applied',
  interview: 'Interview',
  rejected:  'Rejected',
  offer:     'Offer 🎉',
}

export const STATUS_OPTIONS = [
  { value: 'pending',   label: 'Saved' },
  { value: 'applied',   label: 'Applied' },
  { value: 'interview', label: 'Interview' },
  { value: 'rejected',  label: 'Rejected' },
  { value: 'offer',     label: 'Offer 🎉' },
]

export const EXPERIENCE_OPTIONS = [
  { value: '',           label: 'Select experience level' },
  { value: '0-1 years',  label: 'Entry level (0–1 years)' },
  { value: '1-2 years',  label: 'Junior (1–2 years)' },
  { value: '2-4 years',  label: 'Mid-level (2–4 years)' },
  { value: '4-6 years',  label: 'Senior (4–6 years)' },
  { value: '6-10 years', label: 'Lead (6–10 years)' },
  { value: '10+ years',  label: 'Principal / Staff (10+ years)' },
]

export const POPULAR_SKILLS = [
  'React', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'Next.js',
  'Vue.js', 'Angular', 'GraphQL', 'PostgreSQL', 'MongoDB', 'Redis',
  'AWS', 'Docker', 'Kubernetes', 'Go', 'Rust', 'Java', 'Spring Boot',
  'Tailwind CSS', 'CSS', 'HTML', 'Git', 'REST APIs', 'Microservices',
  'CI/CD', 'Jest', 'Cypress', 'SQL', 'Machine Learning', 'FastAPI',
]
