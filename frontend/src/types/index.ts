// ─── Profile ─────────────────────────────────────────────────────────────────
export interface UserProfile {
  targetRole:  string;
  experience:  string;
  skills:      string[];
  resumeText:  string;
  resumeFile:  File | null;
}

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

// ─── Job ──────────────────────────────────────────────────────────────────────
export interface MatchMetadata {
  roleMatch:           boolean;
  experienceMatch:     boolean;
  matchedSkills:       string[];
  unmatchedSkills:     string[];
  requiredExperience:  number | null;
  userExperienceLevel: number;
  whyJobFitsYou:       string[];
}

export interface Job {
  _id:           string;
  jobId:         string;
  title:         string;
  company:       string;
  location?:     string | null;
  salary?:       string | null;
  description?:  string;
  skills?:       string[];
  jobType?:      string | null;
  workMode?:     string | null;
  url?:          string | null;
  source:        'live' | 'cache' | 'demo';
  fetchedAt?:    string;
  matchMetadata: MatchMetadata;
  whyJobFitsYou: string[];
}

// ─── Application ──────────────────────────────────────────────────────────────
export type ApplicationStatus = 'pending' | 'applied' | 'interview' | 'rejected' | 'offer';

export interface GeneratedAnalysis {
  strongPoints: string[];
  weakPoints:   string[];
  suggestions:  string[];
  rawText:      string;
}

export interface Application {
  _id:                string;
  job:                Job;
  status:             ApplicationStatus;
  savedAt:            string;
  appliedAt:          string | null;
  reminderAt:         string | null;
  updatedAt:          string;
  generatedEmail:     string;
  generatedAnalysis:  GeneratedAnalysis;
  notes:              string;
  savedAtFormatted?:  string;
  appliedAtFormatted?: string;
  updatedAtFormatted?: string;
}

// ─── API responses ────────────────────────────────────────────────────────────
export interface SearchResponse {
  jobs:   Job[];
  total:  number;
  source: 'live' | 'cache' | 'demo';
}

export interface EmailResponse {
  email:     string;
  subject:   string;
  body:      string;
  _fallback: boolean;
}

export interface BulletsResponse {
  resume:       string;
  strongPoints: string[];
  weakPoints:   string[];
  suggestions:  string[];
  _fallback:    boolean;
}

export interface ResumeAnalysisResponse {
  strengths:       string[];
  weaknesses:      string[];
  match_percentage: number;
  _fallback:       boolean;
}

// ─── Search mode ──────────────────────────────────────────────────────────────
export type SearchMode = 'primary' | 'secondary';
