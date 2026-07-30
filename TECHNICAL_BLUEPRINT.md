# AI Job Agent - Complete Technical Blueprint

Generated from the current workspace state on 2026-07-30.

This document describes the implementation as it exists in the repository today. It is based on the source code in the frontend, backend, and AI service directories rather than on assumptions or a generic architecture template.

---

## 1. Project Overview

AI Job Agent is a full-stack job search and application assistant with three main layers:

1. Frontend: React + TypeScript + Vite + Tailwind UI
2. Backend: Node.js + Express + Mongoose API
3. AI Service: Python + FastAPI + LangChain + Groq

The application allows a user to:
- register and log in
- search for jobs by role or by skills
- upload and parse a resume
- generate AI-assisted cold emails
- analyze a resume against a job description
- save jobs as applications and track them by status

The codebase is intentionally split into three independently deployable services:
- frontend for the browser experience
- backend for business logic, authentication, persistence, and API orchestration
- AI service for LLM-driven generation

---

## 2. Architectural Summary

### Runtime topology

```text
Browser / User
  └─ React + TypeScript frontend
       └─ Axios calls to backend API
            └─ Express + Mongoose backend
                 ├─ MongoDB Atlas
                 ├─ JWT auth middleware
                 └─ axios calls to FastAPI AI service
                      └─ Groq LLM via LangChain
```

### Current implementation characteristics
- Authentication is implemented and active.
- The application uses localStorage in the browser for JWT and auth user persistence.
- Job search uses live JSearch API when configured, and falls back to cached MongoDB jobs.
- Resume parsing is implemented server-side, with support for PDF, DOCX, JPG, and PNG.
- AI-generated email and resume analysis use fallback templates when the AI service is unavailable.
- The frontend uses React state and props rather than a global state library.

---

## 3. Complete Folder Tree

The repository structure relevant to the implemented project is:

```text
ai/
  llm_generator.py
  main.py
  requirements.txt
  .env.example
backend/
  .env.example
  package.json
  eng.traineddata
  src/
    index.js
    controllers/
      aiController.js
      applicationsController.js
      authController.js
      jobsController.js
    middleware/
      authMiddleware.js
      errorHandler.js
    models/
      Application.js
      Job.js
      User.js
    routes/
      ai.js
      applications.js
      auth.js
      jobs.js
    utils/
      dateHelper.js
      demoJobs.js
      fallbackTemplates.js
      jsearch.js
      logger.js
      matchHelper.js
frontend/
  .env.example
  index.html
  package.json
  postcss.config.js
  tailwind.config.js
  tsconfig.json
  tsconfig.node.json
  vite.config.ts
  src/
    App.tsx
    index.css
    main.tsx
    api/
      index.ts
    components/
      JobCard.tsx
      Navbar.tsx
      ProfileForm.tsx
    pages/
      ApplicationsPage.tsx
      DashboardPage.tsx
      LoginPage.tsx
      RegisterPage.tsx
      SearchPage.tsx
    types/
      index.ts
    utils/
      helpers.ts
PROJECT_BLUEPRINT.md
SETUP.md
TECHNICAL_BLUEPRINT.md
```

> Note: dependencies installed in local node_modules and Python virtual environments are not listed because they are not part of the source-controlled project structure.

---

## 4. Runtime Requirements and Tooling

### Required Node.js version
There is no explicit `engines` field in [backend/package.json](backend/package.json) or [frontend/package.json](frontend/package.json).

The current environment used for verification is:
- Node.js: `v24.14.0`
- npm: `11.12.0`

Practical requirement for this project: use Node.js 18+ or newer. The current environment verified successfully with Node 24.x.

### Required Python version
The AI service is written for Python 3.10+ and was verified in this environment with:
- Python: `3.14.3`

### Required npm version
The current environment used:
- npm: `11.12.0`

### Frontend dependencies and why they are used

From [frontend/package.json](frontend/package.json):
- `react` and `react-dom`: UI rendering
- `axios`: HTTP requests from frontend to backend
- `lucide-react`: iconography for UI components
- `vite`: development server and production build tool
- `typescript`: static typing and compile-time checks
- `@vitejs/plugin-react`: React support in Vite
- `tailwindcss`, `postcss`, `autoprefixer`: styling system
- `@types/react`, `@types/react-dom`: TypeScript definitions for React

### Backend dependencies and why they are used

From [backend/package.json](backend/package.json):
- `express`: HTTP server and routing
- `cors`: cross-origin request handling
- `dotenv`: loading environment variables from `.env`
- `mongoose`: MongoDB object modeling and connection
- `jsonwebtoken`: JWT creation and verification
- `bcrypt`: password hashing
- `multer`: handling multipart file uploads
- `pdf-parse`: extracting text from PDF resumes
- `mammoth`: extracting text from DOCX resumes
- `tesseract.js`: OCR for image-based resumes
- `axios`: outbound HTTP calls to the AI service and external APIs
- `nodemon`: automatic restart during backend development

### AI service dependencies and why they are used

From [ai/requirements.txt](ai/requirements.txt):
- `fastapi`: API layer for the AI service
- `uvicorn[standard]`: ASGI server for FastAPI
- `pydantic`: request/response schema validation
- `python-dotenv`: loading environment variables
- `langchain`: LLM orchestration and prompt chaining
- `langchain-groq`: Groq LLM integration
- `langchain-core`: core prompt/output parsing abstractions
- `httpx`: HTTP client support

---

## 5. Frontend Architecture

### 5.1 Frontend entry points

- [frontend/src/main.tsx](frontend/src/main.tsx): mounts the React app into the `root` element and enables React strict mode.
- [frontend/src/App.tsx](frontend/src/App.tsx): top-level application shell. It switches between login/register and the authenticated app experience.
- [frontend/src/index.css](frontend/src/index.css): Tailwind base and component layer styling, global theme colors, and reusable classes.

### 5.2 Frontend pages

| File | Purpose |
|---|---|
| [frontend/src/pages/SearchPage.tsx](frontend/src/pages/SearchPage.tsx) | Main job-search workspace. Displays profile form, search results, and job cards. |
| [frontend/src/pages/ApplicationsPage.tsx](frontend/src/pages/ApplicationsPage.tsx) | Lists saved jobs/applications and allows status changes and deletion. |
| [frontend/src/pages/DashboardPage.tsx](frontend/src/pages/DashboardPage.tsx) | Displays saved applications statistics and pipeline metrics. |
| [frontend/src/pages/LoginPage.tsx](frontend/src/pages/LoginPage.tsx) | Login form and submission flow. |
| [frontend/src/pages/RegisterPage.tsx](frontend/src/pages/RegisterPage.tsx) | Registration form with password complexity validation. |

### 5.3 Frontend components

| File | Purpose |
|---|---|
| [frontend/src/components/Navbar.tsx](frontend/src/components/Navbar.tsx) | Sidebar/mobile navigation between search, saved jobs, and dashboard. |
| [frontend/src/components/ProfileForm.tsx](frontend/src/components/ProfileForm.tsx) | Profile form used for role, experience, skills, and resume upload. |
| [frontend/src/components/JobCard.tsx](frontend/src/components/JobCard.tsx) | Displays a job card with match information, actions, AI email generation, and resume analysis. |

### 5.4 Frontend helper and types

- [frontend/src/api/index.ts](frontend/src/api/index.ts): centralized Axios client and API methods for auth, jobs, AI, and applications.
- [frontend/src/utils/helpers.ts](frontend/src/utils/helpers.ts): file validation, formatting, date formatting, clipboard copy, and options used in the UI.
- [frontend/src/types/index.ts](frontend/src/types/index.ts): TypeScript interfaces for user profile, auth response, jobs, applications, and API response payloads.

### 5.5 Frontend state flow

The app uses local component state and prop-driven state flow:
- [frontend/src/App.tsx](frontend/src/App.tsx) holds the current page, user profile, saved-count, refresh trigger, and auth state.
- [frontend/src/pages/SearchPage.tsx](frontend/src/pages/SearchPage.tsx) manages the job search results and loading/error states.
- [frontend/src/components/ProfileForm.tsx](frontend/src/components/ProfileForm.tsx) manages skill input and resume-file state.
- [frontend/src/components/JobCard.tsx](frontend/src/components/JobCard.tsx) manages email panel state, resume-analysis panel state, save button state, and error state.
- [frontend/src/pages/ApplicationsPage.tsx](frontend/src/pages/ApplicationsPage.tsx) fetches applications from the backend and updates them locally after mutation.

### 5.6 Important frontend file inventory

- [frontend/src/App.tsx](frontend/src/App.tsx)
  - Purpose: overall page routing and auth gating
  - Main functions: `App()`; `handleAuthSuccess`; `handleLogout`
  - Imports: [frontend/src/components/Navbar.tsx](frontend/src/components/Navbar.tsx), [frontend/src/pages/SearchPage.tsx](frontend/src/pages/SearchPage.tsx), [frontend/src/pages/ApplicationsPage.tsx](frontend/src/pages/ApplicationsPage.tsx), [frontend/src/pages/DashboardPage.tsx](frontend/src/pages/DashboardPage.tsx), [frontend/src/pages/LoginPage.tsx](frontend/src/pages/LoginPage.tsx), [frontend/src/pages/RegisterPage.tsx](frontend/src/pages/RegisterPage.tsx), [frontend/src/types/index.ts](frontend/src/types/index.ts)
  - Imported by: [frontend/src/main.tsx](frontend/src/main.tsx)

- [frontend/src/main.tsx](frontend/src/main.tsx)
  - Purpose: React bootstrapping
  - Imports: [frontend/src/App.tsx](frontend/src/App.tsx), [frontend/src/index.css](frontend/src/index.css)
  - Imported by: none directly; Vite loads it through the HTML entry point

- [frontend/src/api/index.ts](frontend/src/api/index.ts)
  - Purpose: Axios client and all API methods used by the frontend
  - Main functions: `registerUser`, `loginUser`, `searchJobs`, `parsResume`, `generateEmail`, `generateBullets`, `analyzeResume`, `getApplications`, `createApplication`, `updateApplication`, `deleteApplication`
  - Imports: [frontend/src/types/index.ts](frontend/src/types/index.ts)
  - Imported by: [frontend/src/pages/SearchPage.tsx](frontend/src/pages/SearchPage.tsx), [frontend/src/components/ProfileForm.tsx](frontend/src/components/ProfileForm.tsx), [frontend/src/components/JobCard.tsx](frontend/src/components/JobCard.tsx), [frontend/src/pages/ApplicationsPage.tsx](frontend/src/pages/ApplicationsPage.tsx), [frontend/src/pages/DashboardPage.tsx](frontend/src/pages/DashboardPage.tsx), [frontend/src/pages/LoginPage.tsx](frontend/src/pages/LoginPage.tsx), [frontend/src/pages/RegisterPage.tsx](frontend/src/pages/RegisterPage.tsx)

- [frontend/src/components/ProfileForm.tsx](frontend/src/components/ProfileForm.tsx)
  - Purpose: candidate profile form for role/experience/skills/resume upload
  - Main functions: `ProfileForm`, `addSkill`, `removeSkill`, `handleFile`, `validatePrimary`, `validateSecondary`
  - Imports: [frontend/src/utils/helpers.ts](frontend/src/utils/helpers.ts), [frontend/src/types/index.ts](frontend/src/types/index.ts)
  - Imported by: [frontend/src/pages/SearchPage.tsx](frontend/src/pages/SearchPage.tsx)

- [frontend/src/components/JobCard.tsx](frontend/src/components/JobCard.tsx)
  - Purpose: job card UI with matching metadata and AI actions
  - Main functions: `JobCard`, `handleGenerateEmail`, `handleAnalyzeResume`, `handleSave`, `handleCopy`
  - Imports: [frontend/src/api/index.ts](frontend/src/api/index.ts), [frontend/src/utils/helpers.ts](frontend/src/utils/helpers.ts), [frontend/src/types/index.ts](frontend/src/types/index.ts)
  - Imported by: [frontend/src/pages/SearchPage.tsx](frontend/src/pages/SearchPage.tsx)

- [frontend/src/pages/SearchPage.tsx](frontend/src/pages/SearchPage.tsx)
  - Purpose: search workspace and result rendering
  - Main functions: `SearchPage`, `handleSearch`, `handleParseResume`
  - Imports: [frontend/src/components/ProfileForm.tsx](frontend/src/components/ProfileForm.tsx), [frontend/src/components/JobCard.tsx](frontend/src/components/JobCard.tsx), [frontend/src/api/index.ts](frontend/src/api/index.ts), [frontend/src/types/index.ts](frontend/src/types/index.ts)
  - Imported by: [frontend/src/App.tsx](frontend/src/App.tsx)

- [frontend/src/pages/ApplicationsPage.tsx](frontend/src/pages/ApplicationsPage.tsx)
  - Purpose: saved jobs list and application lifecycle management
  - Main functions: `ApplicationsPage`, `load`, `handleStatus`, `handleDelete`
  - Imports: [frontend/src/api/index.ts](frontend/src/api/index.ts), [frontend/src/types/index.ts](frontend/src/types/index.ts), [frontend/src/utils/helpers.ts](frontend/src/utils/helpers.ts)
  - Imported by: [frontend/src/App.tsx](frontend/src/App.tsx)

- [frontend/src/pages/DashboardPage.tsx](frontend/src/pages/DashboardPage.tsx)
  - Purpose: pipeline metrics dashboard
  - Main functions: `DashboardPage`, `load`
  - Imports: [frontend/src/api/index.ts](frontend/src/api/index.ts), [frontend/src/types/index.ts](frontend/src/types/index.ts), [frontend/src/utils/helpers.ts](frontend/src/utils/helpers.ts)
  - Imported by: [frontend/src/App.tsx](frontend/src/App.tsx)

- [frontend/src/pages/LoginPage.tsx](frontend/src/pages/LoginPage.tsx)
  - Purpose: login UI and validation
  - Main functions: `LoginPage`, `validate`, `handleSubmit`
  - Imports: [frontend/src/api/index.ts](frontend/src/api/index.ts), [frontend/src/types/index.ts](frontend/src/types/index.ts)
  - Imported by: [frontend/src/App.tsx](frontend/src/App.tsx)

- [frontend/src/pages/RegisterPage.tsx](frontend/src/pages/RegisterPage.tsx)
  - Purpose: registration UI and validation
  - Main functions: `RegisterPage`, `validate`, `handleSubmit`
  - Imports: [frontend/src/api/index.ts](frontend/src/api/index.ts), [frontend/src/types/index.ts](frontend/src/types/index.ts)
  - Imported by: [frontend/src/App.tsx](frontend/src/App.tsx)

---

## 6. Backend Architecture

### 6.1 Backend entry point

- [backend/src/index.js](backend/src/index.js): Express application bootstrap. It configures CORS, JSON body parsing, request logging, mounts routes, exposes health check, and connects to MongoDB.

### 6.2 Backend route modules

| File | Purpose |
|---|---|
| [backend/src/routes/auth.js](backend/src/routes/auth.js) | Auth endpoints for register/login |
| [backend/src/routes/jobs.js](backend/src/routes/jobs.js) | Job search, listing, lookup, and resume-summary generation |
| [backend/src/routes/ai.js](backend/src/routes/ai.js) | AI generation endpoints |
| [backend/src/routes/applications.js](backend/src/routes/applications.js) | Auth-protected routes for saving and managing applications |

### 6.3 Backend controllers

| File | Purpose |
|---|---|
| [backend/src/controllers/authController.js](backend/src/controllers/authController.js) | Registers and logs in users; hashes passwords and issues JWTs |
| [backend/src/controllers/jobsController.js](backend/src/controllers/jobsController.js) | Searches for jobs, caches results, parses resumes, and attaches match metadata |
| [backend/src/controllers/applicationsController.js](backend/src/controllers/applicationsController.js) | Creates, lists, updates, and deletes user-scoped applications |
| [backend/src/controllers/aiController.js](backend/src/controllers/aiController.js) | Calls the AI service for email and resume analysis and uses fallbacks if needed |

### 6.4 Backend middleware

- [backend/src/middleware/authMiddleware.js](backend/src/middleware/authMiddleware.js): validates Bearer JWTs and attaches the authenticated user to `req.user`.
- [backend/src/middleware/errorHandler.js](backend/src/middleware/errorHandler.js): centralizes error responses.

### 6.5 Backend models

- [backend/src/models/User.js](backend/src/models/User.js): user schema with `fullName`, `email`, `passwordHash`, timestamps.
- [backend/src/models/Job.js](backend/src/models/Job.js): job schema with title, company, description, location, skills, experience, source, URL, fetched date.
- [backend/src/models/Application.js](backend/src/models/Application.js): application schema linking a user to a job and tracking status, timestamps, generated email, and generated analysis.

### 6.6 Backend utilities

- [backend/src/utils/jsearch.js](backend/src/utils/jsearch.js): calls RapidAPI JSearch and normalizes the response into the internal job schema.
- [backend/src/utils/matchHelper.js](backend/src/utils/matchHelper.js): builds role match, experience match, skill match, and `whyJobFitsYou` metadata.
- [backend/src/utils/fallbackTemplates.js](backend/src/utils/fallbackTemplates.js): builds fallback email and resume analysis when the AI service is unavailable.
- [backend/src/utils/dateHelper.js](backend/src/utils/dateHelper.js): date formatting and date offset helpers.
- [backend/src/utils/logger.js](backend/src/utils/logger.js): small logging wrapper that writes to stdout with level control.

### 6.7 Important backend file inventory

- [backend/src/index.js](backend/src/index.js)
  - Purpose: application bootstrap and middleware registration
  - Main functions: `start()`
  - Imports: [backend/src/routes/jobs.js](backend/src/routes/jobs.js), [backend/src/routes/ai.js](backend/src/routes/ai.js), [backend/src/routes/applications.js](backend/src/routes/applications.js), [backend/src/routes/auth.js](backend/src/routes/auth.js), [backend/src/middleware/errorHandler.js](backend/src/middleware/errorHandler.js), [backend/src/utils/logger.js](backend/src/utils/logger.js)
  - Imported by: none; executed as the main Node entry point

- [backend/src/controllers/authController.js](backend/src/controllers/authController.js)
  - Purpose: register/login logic
  - Main functions: `register`, `login`, `buildUserPayload`, `buildToken`
  - Imports: [backend/src/models/User.js](backend/src/models/User.js), [backend/src/utils/logger.js](backend/src/utils/logger.js)
  - Imported by: [backend/src/routes/auth.js](backend/src/routes/auth.js)

- [backend/src/controllers/jobsController.js](backend/src/controllers/jobsController.js)
  - Purpose: search jobs, cache them, parse resumes, and attach match metadata
  - Main functions: `searchJobs`, `getAllJobs`, `getJobById`, `generateSummary`, `upsertJobs`, `getCachedJobs`, `attachMatchMetadata`
  - Imports: [backend/src/models/Job.js](backend/src/models/Job.js), [backend/src/utils/jsearch.js](backend/src/utils/jsearch.js), [backend/src/utils/matchHelper.js](backend/src/utils/matchHelper.js), [backend/src/utils/logger.js](backend/src/utils/logger.js)
  - Imported by: [backend/src/routes/jobs.js](backend/src/routes/jobs.js)

- [backend/src/controllers/applicationsController.js](backend/src/controllers/applicationsController.js)
  - Purpose: application CRUD scoped to the authenticated user
  - Main functions: `createApplication`, `getApplications`, `getApplicationById`, `updateApplication`, `deleteApplication`
  - Imports: [backend/src/models/Application.js](backend/src/models/Application.js), [backend/src/models/Job.js](backend/src/models/Job.js), [backend/src/utils/dateHelper.js](backend/src/utils/dateHelper.js), [backend/src/utils/logger.js](backend/src/utils/logger.js)
  - Imported by: [backend/src/routes/applications.js](backend/src/routes/applications.js)

- [backend/src/controllers/aiController.js](backend/src/controllers/aiController.js)
  - Purpose: orchestrates AI calls and fallback handling
  - Main functions: `generateEmail`, `generateBullets`, `findJob`
  - Imports: [backend/src/models/Job.js](backend/src/models/Job.js), [backend/src/models/Application.js](backend/src/models/Application.js), [backend/src/utils/fallbackTemplates.js](backend/src/utils/fallbackTemplates.js), [backend/src/utils/logger.js](backend/src/utils/logger.js)
  - Imported by: [backend/src/routes/ai.js](backend/src/routes/ai.js)

- [backend/src/middleware/authMiddleware.js](backend/src/middleware/authMiddleware.js)
  - Purpose: JWT authorization guard
  - Main functions: `requireAuth`
  - Imports: [backend/src/models/User.js](backend/src/models/User.js)
  - Imported by: [backend/src/routes/applications.js](backend/src/routes/applications.js)

- [backend/src/middleware/errorHandler.js](backend/src/middleware/errorHandler.js)
  - Purpose: standard error response shape
  - Imports: [backend/src/utils/logger.js](backend/src/utils/logger.js)
  - Imported by: [backend/src/index.js](backend/src/index.js)

- [backend/src/models/User.js](backend/src/models/User.js)
  - Purpose: user schema for auth records
  - Imported by: [backend/src/controllers/authController.js](backend/src/controllers/authController.js), [backend/src/middleware/authMiddleware.js](backend/src/middleware/authMiddleware.js)

- [backend/src/models/Application.js](backend/src/models/Application.js)
  - Purpose: application persistence
  - Imported by: [backend/src/controllers/applicationsController.js](backend/src/controllers/applicationsController.js), [backend/src/controllers/aiController.js](backend/src/controllers/aiController.js)

- [backend/src/models/Job.js](backend/src/models/Job.js)
  - Purpose: cached/live job persistence
  - Imported by: [backend/src/controllers/jobsController.js](backend/src/controllers/jobsController.js), [backend/src/controllers/applicationsController.js](backend/src/controllers/applicationsController.js), [backend/src/controllers/aiController.js](backend/src/controllers/aiController.js)

- [backend/src/utils/jsearch.js](backend/src/utils/jsearch.js)
  - Purpose: JSearch API adapter
  - Main functions: `fetchJobsFromJSearch`, `normalizeJob`, `parseExperience`, `buildSalaryString`
  - Imports: [backend/src/utils/logger.js](backend/src/utils/logger.js)
  - Imported by: [backend/src/controllers/jobsController.js](backend/src/controllers/jobsController.js)

- [backend/src/utils/matchHelper.js](backend/src/utils/matchHelper.js)
  - Purpose: job matching heuristics
  - Main functions: `parseUserExperience`, `checkRoleMatch`, `checkExperienceMatch`, `computeSkillMatches`, `buildMatchMetadata`
  - Imported by: [backend/src/controllers/jobsController.js](backend/src/controllers/jobsController.js)

- [backend/src/utils/fallbackTemplates.js](backend/src/utils/fallbackTemplates.js)
  - Purpose: fallback AI content when the AI service is unavailable
  - Main functions: `buildFallbackEmail`, `buildFallbackAnalysis`
  - Imported by: [backend/src/controllers/aiController.js](backend/src/controllers/aiController.js)

---

## 7. AI Service Architecture

### 7.1 AI entry point

- [ai/main.py](ai/main.py): FastAPI application. It exposes `/health`, `/generate-email`, and `/generate-bullets` (plus `/analyze-resume`, which is routed through the same handler). It validates incoming payloads using Pydantic models and wraps the LLM generation code.

### 7.2 AI generator module

- [ai/llm_generator.py](ai/llm_generator.py): builds LangChain prompt chains and calls Groq. It provides:
  - `generate_cold_email`
  - `generate_resume_bullets`
  - `analyze_resume_match`

### 7.3 Important AI file inventory

- [ai/main.py](ai/main.py)
  - Purpose: FastAPI web service for AI endpoints
  - Main functions: `health`, `email_endpoint`, `analysis_endpoint`
  - Imports: [ai/llm_generator.py](ai/llm_generator.py)
  - Imported by: none directly; launched with Uvicorn

- [ai/llm_generator.py](ai/llm_generator.py)
  - Purpose: prompt construction and LLM invocation
  - Main functions: `get_llm`, `build_email_chain`, `build_resume_chain`, `build_resume_match_chain`, `generate_cold_email`, `generate_resume_bullets`, `analyze_resume_match`
  - Imports: `langchain_groq`, `langchain_core.prompts`, `langchain_core.output_parsers`
  - Imported by: [ai/main.py](ai/main.py)

---

## 8. API Endpoint Reference

All routes are mounted under `/api` in the backend, except the AI service endpoints which are served directly on the AI service host.

### Authentication endpoints

| Method | Route | Request | Response |
|---|---|---|---|
| POST | `/api/auth/register` | `{ fullName, email, password }` | `201` with `{ success: true, data: { user, token } }` |
| POST | `/api/auth/login` | `{ email, password }` | `200` with `{ success: true, data: { user, token } }` |

### Job endpoints

| Method | Route | Request | Response |
|---|---|---|---|
| POST | `/api/jobs/search` | `{ mode, targetRole, experience, skills, resumeText }` | `{ success, data: { jobs, total, source } }` |
| GET | `/api/jobs` | none | `{ success, data: jobs[] }` |
| GET | `/api/jobs/:id` | path param `id` | `{ success, data: job }` |
| POST | `/api/jobs/generate-summary` | multipart form field `resume` | `{ success, data: { summary } }` |

### AI endpoints

| Method | Route | Request | Response |
|---|---|---|---|
| POST | `/api/ai/generate-email` | `{ jobId, profile }` | `{ success, data: { email, subject, body, _fallback } }` |
| POST | `/api/ai/generate-bullets` | `{ jobId, profile }` | `{ success, data: { strongPoints, weakPoints, suggestions, rawText, _fallback } }` |

### Application endpoints

All application routes are protected by JWT authentication middleware.

| Method | Route | Request | Response |
|---|---|---|---|
| POST | `/api/applications` | `{ jobId, jobData }` | created application |
| GET | `/api/applications` | none | list of applications for the authenticated user |
| GET | `/api/applications/:id` | path param `id` | single application |
| PUT | `/api/applications/:id` | `{ status?, notes? }` | updated application |
| DELETE | `/api/applications/:id` | path param `id` | deletion confirmation |

### AI service endpoints

| Method | Route | Request | Response |
|---|---|---|---|
| GET | `/health` | none | `{ status: 'ok', service: 'ai' }` |
| POST | `/generate-email` | `{ job, profile }` | email payload |
| POST | `/generate-bullets` | `{ job, profile }` | analysis payload |
| POST | `/analyze-resume` | `{ job, profile }` | same handler as `/generate-bullets` |

> Important implementation note: the frontend also contains an `analyzeResume` helper calling `/api/ai/analyze-resume`, but the current backend route file only registers `/generate-email` and `/generate-bullets`. In the current codebase, the backend does not expose `/api/ai/analyze-resume`.

---

## 9. MongoDB Collections and Schemas

The backend connects to MongoDB using Mongoose. The database connection is created in [backend/src/index.js](backend/src/index.js) via `mongoose.connect(process.env.MONGODB_URI)`.

### 9.1 Collection: users

Schema: [backend/src/models/User.js](backend/src/models/User.js)

Fields:
- `fullName` (required string, trimmed, min length 2)
- `email` (required, unique, lowercase, indexed)
- `passwordHash` (required string)
- timestamps: `createdAt`, `updatedAt`

Used for:
- auth registration/login
- JWT user lookup
- user ownership of applications

### 9.2 Collection: jobs

Schema: [backend/src/models/Job.js](backend/src/models/Job.js)

Fields:
- `jobId` (unique, indexed)
- `title` (required)
- `company` (required)
- `location`
- `salary`
- `currency` (defaults to `USD`)
- `description`
- `requiredExperience`
- `skills` (array)
- `jobType`
- `workMode`
- `source` (enum: `jsearch`, `cache`, `demo`)
- `url`
- `postedDate`
- `fetchedAt` (default `Date.now`, indexed)
- timestamps

Used for:
- storing live jobs fetched from JSearch
- caching job results for fallback
- associating applications with a job record

### 9.3 Collection: applications

Schema: [backend/src/models/Application.js](backend/src/models/Application.js)

Fields:
- `user` (ObjectId ref `User`, required, indexed)
- `job` (ObjectId ref `Job`, required, indexed)
- `status` (enum: `pending`, `applied`, `interview`, `rejected`, `offer`, default `pending`)
- `savedAt` (default `Date.now`, indexed)
- `appliedAt`
- `reminderAt`
- `generatedEmail`
- `generatedAnalysis` with subfields `strongPoints`, `weakPoints`, `suggestions`, `rawText`
- `notes`
- timestamps

Used for:
- saved-job tracking
- status updates
- storing AI-generated email and analysis per saved application

---

## 10. Authentication Flow (Implemented)

### 10.1 Registration flow

1. The user opens the register page in [frontend/src/pages/RegisterPage.tsx](frontend/src/pages/RegisterPage.tsx).
2. The form validates full name, email, and password using client-side regex rules.
3. On submission, [frontend/src/api/index.ts](frontend/src/api/index.ts) sends `POST /api/auth/register` with `{ fullName, email, password }`.
4. The backend controller [backend/src/controllers/authController.js](backend/src/controllers/authController.js) validates the payload.
5. The password is hashed with `bcrypt` and stored in `passwordHash`.
6. The backend creates a JWT using the `JWT_SECRET` (or a fallback in non-production environments).
7. The backend responds with the new user and token.
8. The frontend stores the token in `localStorage` under `authToken` and stores the user in `localStorage` under `authUser`.
9. The app switches into the authenticated experience.

### 10.2 Login flow

1. The user uses the login page in [frontend/src/pages/LoginPage.tsx](frontend/src/pages/LoginPage.tsx).
2. The form validates the email and password format.
3. The frontend calls `POST /api/auth/login`.
4. The backend looks up the user by normalized email.
5. The backend uses `bcrypt.compare` to verify the password.
6. If correct, the backend issues a JWT and returns it.
7. The frontend stores the token and user and transitions to the main app.

### 10.3 JWT implementation details

- JWT library: `jsonwebtoken`
- Token issued by [backend/src/controllers/authController.js](backend/src/controllers/authController.js)
- Payload contains:
  - `userId`
  - `email`
- Default expiration: `7d`
- Secret source:
  - `process.env.JWT_SECRET`
  - fallback secret: `change-me-in-production`
- Verification is performed in [backend/src/middleware/authMiddleware.js](backend/src/middleware/authMiddleware.js)

### 10.4 Frontend auth persistence

The frontend stores:
- `authToken` in localStorage
- `authUser` in localStorage

The app state in [frontend/src/App.tsx](frontend/src/App.tsx) initializes from `authUser` on page load and removes it on logout.

### 10.5 Route protection flow

- Application routes are mounted in [backend/src/routes/applications.js](backend/src/routes/applications.js).
- The router calls `requireAuth` before any application route handler.
- The middleware reads the `Authorization` header, expects `Bearer <token>`, verifies it, loads the user, and attaches it to `req.user`.
- If the token is invalid or missing, the API returns `401` with a JSON error message.

---

## 11. AI Processing Flow (Implemented)

### 11.1 Email generation flow

1. The user clicks the “AI Email” action on a job card in [frontend/src/components/JobCard.tsx](frontend/src/components/JobCard.tsx).
2. The frontend calls [frontend/src/api/index.ts](frontend/src/api/index.ts) → `generateEmail(jobId, profile)`.
3. The backend route [backend/src/routes/ai.js](backend/src/routes/ai.js) receives `POST /api/ai/generate-email`.
4. The controller [backend/src/controllers/aiController.js](backend/src/controllers/aiController.js) loads the job by `jobId` from MongoDB.
5. The controller builds a payload with the job metadata and the current profile.
6. The controller sends an HTTP request to the AI service at `${AI_URL}/generate-email`.
7. The AI service [ai/main.py](ai/main.py) validates the payload and calls [ai/llm_generator.py](ai/llm_generator.py) to generate the email.
8. If the response is valid, the backend responds to the frontend with the email subject/body.
9. If the AI service fails or returns incomplete content, the controller uses [backend/src/utils/fallbackTemplates.js](backend/src/utils/fallbackTemplates.js) to generate a template-based email.
10. The generated email is optionally persisted to the most relevant application record.

### 11.2 Resume analysis flow

1. The user clicks “Analyze Resume” on a job card.
2. The frontend calls `generateBullets(jobId, profile)`.
3. The backend route [backend/src/routes/ai.js](backend/src/routes/ai.js) receives `POST /api/ai/generate-bullets`.
4. The backend loads the job and checks that the profile includes resume text.
5. The controller sends a request to `${AI_URL}/generate-bullets`.
6. The AI service returns analysis sections (`strongPoints`, `weakPoints`, `suggestions`) and a raw analysis.
7. The backend normalizes the response and persists it to the application record in MongoDB.
8. The frontend renders the analysis in the resume-analysis panel.

### 11.3 Fallback behavior

If the AI service is unavailable or returns low-quality output:
- the backend uses fallback templates from [backend/src/utils/fallbackTemplates.js](backend/src/utils/fallbackTemplates.js)
- the frontend still displays an analysis/email instead of failing hard
- the response includes `_fallback: true`

---

## 12. Frontend → Backend Communication

The frontend uses a single Axios client configured in [frontend/src/api/index.ts](frontend/src/api/index.ts):

- base URL: `${VITE_API_URL || 'http://localhost:5000'}/api`
- default timeout: `35000ms`

### Request interceptor

The client adds an Authorization header automatically when `authToken` exists in `localStorage`:

```ts
Authorization: Bearer <token>
```

### Current API calls from the frontend

- auth: register/login
- jobs: search / list / lookup / summary generation
- AI: email generation / bullets generation
- applications: create/list/update/delete

### Notes on actual implementation

- The frontend uses `import.meta.env.VITE_API_URL` to determine the backend base URL.
- The frontend expects the backend to be available at the URL pointed by that variable.
- The Vite dev server also configures a proxy for `/api` to `http://localhost:5000` in [frontend/vite.config.ts](frontend/vite.config.ts).

---

## 13. Backend → AI Communication

The backend uses Axios to reach the AI service.

### AI service URL

- Configured from `process.env.AI_SERVICE_URL || 'http://localhost:8000'`
- Used in [backend/src/controllers/aiController.js](backend/src/controllers/aiController.js)

### Timeouts

- The current implementation uses a hardcoded timeout of `60000` ms in [backend/src/controllers/aiController.js](backend/src/controllers/aiController.js).
- The `.env.example` includes `AI_SERVICE_TIMEOUT`, but the current code does not read it.

### Payloads sent to the AI service

The backend sends the job and profile object in a structure like:

```json
{
  "job": {
    "title": "...",
    "company": "...",
    "description": "..."
  },
  "profile": {
    "targetRole": "...",
    "experience": "...",
    "skills": ["..."],
    "resume_text": "..."
  }
}
```

### AI service response expectations

The backend expects:
- email: `email`, `subject`, `body`
- analysis: `strongPoints`, `weakPoints`, `suggestions`, and/or `analysis`

If the AI service returns malformed or empty output, fallback templates are used.

---

## 14. Database Interactions

### 14.1 Job search and caching

During job search, the backend:
1. Builds a search query from the role and/or skills
2. Tries to fetch live jobs from JSearch
3. Upserts the jobs into MongoDB using `Job.bulkWrite`
4. Falls back to cached jobs from MongoDB if the live API fails or returns zero results

### 14.2 Saving applications

When the user saves a job:
1. The backend resolves the job by Mongo ID or by the custom `jobId` field
2. It checks whether the same user already saved that same job
3. If not, it creates an `Application` document linking the user and the job

### 14.3 Updating application status

When the user changes application status:
- the backend validates the allowed status values
- if the status is `applied`, it sets `appliedAt` and `reminderAt`
- it updates the document in MongoDB

### 14.4 Storing AI results

When email or resume analysis is generated:
- the backend updates the relevant `Application` record with `generatedEmail` or `generatedAnalysis`
- the results are then available for the dashboard and applications page

---

## 15. File Upload Flow (Implemented)

### 15.1 Frontend upload flow

1. The user uploads a resume in [frontend/src/components/ProfileForm.tsx](frontend/src/components/ProfileForm.tsx).
2. The component validates the file type and size via [frontend/src/utils/helpers.ts](frontend/src/utils/helpers.ts).
3. The file is passed to the `parseResume` callback in [frontend/src/pages/SearchPage.tsx](frontend/src/pages/SearchPage.tsx).

### 15.2 Backend parsing flow

1. The frontend sends the file to `POST /api/jobs/generate-summary`.
2. The backend uses `multer` with `memoryStorage()`.
3. File size limit: `5 MB`.
4. Allowed MIME types:
   - PDF
   - DOCX
   - JPEG
   - PNG
5. The controller parses the text using:
   - `pdf-parse` for PDFs
   - `mammoth` for DOCX
   - `tesseract.js` for image files
6. The backend trims the text, enforces a minimum length, and returns a summary string.
7. The frontend stores the extracted text into the profile state as `profile.resumeText`.

### 15.3 Important note

The frontend uses [frontend/src/utils/helpers.ts](frontend/src/utils/helpers.ts) to validate the upload size/type on the client side using `VITE_MAX_RESUME_SIZE` and allowed MIME types. The backend also performs validation independently.

---

## 16. Resume Analysis Flow (Implemented)

The resume analysis flow is implemented as follows:

1. The user has already uploaded a resume and it has been parsed into text.
2. The user clicks the “Analyze Resume” action on a job card.
3. The frontend sends `{ jobId, profile }` to `/api/ai/generate-bullets`.
4. The backend loads the job from MongoDB.
5. The backend sends the job and profile to the AI service.
6. The AI service generates a structured response.
7. The backend normalizes this into:
   - `strongPoints`
   - `weakPoints`
   - `suggestions`
   - `rawText`
8. The results are stored in the relevant application record and shown in the UI.

---

## 17. Job Recommendation Flow

The current implementation does not use a trained ML model. The “recommendation” logic is implemented as a heuristic match engine in [backend/src/utils/matchHelper.js](backend/src/utils/matchHelper.js).

### Match logic

For each job, the backend computes:
- role match: checks whether the title is compatible with the user’s target role
- experience match: checks whether the job’s required experience fits the user’s experience level
- skill match: checks whether the user’s skills appear in the job description, title, or required skills list

The results are passed to the frontend and rendered as match badges and a reasons list.

### Search modes

- primary search: role-based search, filters to jobs that match the target role and experience fit
- secondary search: skill-based search, returns jobs that contain at least one matching skill

---

## 18. Error Handling

### Backend error handling

- The app uses [backend/src/middleware/errorHandler.js](backend/src/middleware/errorHandler.js) as the central Express error handler.
- Each controller catches its own errors and returns a JSON response with `success: false` and a `message`.
- Common HTTP status codes:
  - `400`: validation or bad request
  - `401`: missing/invalid authorization token
  - `404`: missing job/application/user
  - `409`: duplicate registration or duplicate saved job
  - `500`: internal server failure

### Frontend error handling

- The UI surfaces API errors from the API client into the page UI
- Validation errors are shown inline in forms
- The job card displays inline error messages for save/email/analysis failures

### AI fallback behavior

- If the AI service fails or provides incomplete data, fallback templates are used
- The UI still succeeds gracefully rather than failing completely

---

## 19. Environment Variables

The code uses environment variables from `.env` files. The examples are in:
- [backend/.env.example](backend/.env.example)
- [frontend/.env.example](frontend/.env.example)
- [ai/.env.example](ai/.env.example)

### 19.1 Backend environment variables

| Variable | Required? | Used by | Purpose |
|---|---|---|---|
| `PORT` | no | [backend/src/index.js](backend/src/index.js) | HTTP port for backend |
| `NODE_ENV` | no | runtime | Node environment label |
| `CORS_ORIGIN` | no | [backend/src/index.js](backend/src/index.js) | Comma-separated allowed origins |
| `MONGODB_URI` | yes | [backend/src/index.js](backend/src/index.js) | MongoDB Atlas connection string |
| `RAPIDAPI_KEY` | no | [backend/src/utils/jsearch.js](backend/src/utils/jsearch.js) | RapidAPI JSearch access |
| `RAPIDAPI_HOST` | no | [backend/src/utils/jsearch.js](backend/src/utils/jsearch.js) | RapidAPI host |
| `AI_SERVICE_URL` | no | [backend/src/controllers/aiController.js](backend/src/controllers/aiController.js) | Base URL for the AI service |
| `AI_SERVICE_TIMEOUT` | no | example only | Not currently read by the implemented controller |
| `CACHE_EXPIRY_DAYS` | no | example only | Not currently read by the implemented controller; hardcoded to 7 days |
| `LOG_LEVEL` | no | [backend/src/utils/logger.js](backend/src/utils/logger.js) | Logging verbosity |
| `JWT_SECRET` | strongly recommended | [backend/src/controllers/authController.js](backend/src/controllers/authController.js), [backend/src/middleware/authMiddleware.js](backend/src/middleware/authMiddleware.js) | JWT signing/verification secret |

### 19.2 Frontend environment variables

| Variable | Required? | Used by | Purpose |
|---|---|---|---|
| `VITE_API_URL` | yes for real deployment | [frontend/src/api/index.ts](frontend/src/api/index.ts) | Backend base URL |
| `VITE_AI_SERVICE_URL` | no | currently not used by the main frontend flow | AI service base URL placeholder |
| `VITE_MAX_RESUME_SIZE` | no | [frontend/src/utils/helpers.ts](frontend/src/utils/helpers.ts) | Max allowed resume file size |
| `VITE_RESUME_CHAR_LIMIT` | no | currently not used by the implementation | character limit placeholder |

### 19.3 AI service environment variables

| Variable | Required? | Used by | Purpose |
|---|---|---|---|
| `GROQ_API_KEY` | yes for real AI generation | [ai/llm_generator.py](ai/llm_generator.py) | Groq API access |
| `GROQ_MODEL` | no | example only | Current implementation hardcodes `llama-3.1-8b-instant` |
| `GROQ_TEMPERATURE` | no | example only | Current implementation hardcodes `0.3` |
| `GROQ_MAX_TOKENS` | no | example only | Current implementation hardcodes `250` |
| `AI_SERVICE_HOST` | no | [ai/main.py](ai/main.py) | Host binding for FastAPI |
| `AI_SERVICE_PORT` | no | [ai/main.py](ai/main.py) | Port for FastAPI |
| `ENVIRONMENT` | no | example only | Not actively consumed |
| `LOG_LEVEL` | no | [ai/main.py](ai/main.py) | Logging level |

> Security note: never commit real secrets. Use placeholders in source control and populate real values in deployment environments only.

---

## 20. Build Commands

### Frontend build

From [frontend/package.json](frontend/package.json):

```bash
cd frontend
npm install
npm run build
```

The current verified build command was:

```bash
cd frontend
npm run build
```

Verified result:
- Vite production build completed successfully
- TypeScript compile passed

### Backend syntax check

```bash
cd backend
node --check src/index.js
```

### AI service syntax check

```bash
cd ai
python -m py_compile main.py llm_generator.py
```

---

## 21. Run Commands

### Frontend development server

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server uses port `5173` by default as configured in [frontend/vite.config.ts](frontend/vite.config.ts).

### Backend development server

```bash
cd backend
npm install
npm run dev
```

The backend uses Nodemon and starts the Express app via [backend/src/index.js](backend/src/index.js).

### AI service

```bash
cd ai
pip install -r requirements.txt
python main.py
```

The AI service runs on port `8000` by default unless overridden by `AI_SERVICE_PORT`.

---

## 22. Production Build Commands

### Frontend production build

```bash
cd frontend
npm install
npm run build
```

### Backend production start

```bash
cd backend
npm install
npm start
```

### AI service production start

```bash
cd ai
pip install -r requirements.txt
python main.py
```

Or, if using a production ASGI invocation:

```bash
cd ai
uvicorn main:app --host 0.0.0.0 --port 8000
```

---

## 23. CORS Configuration

CORS is configured in [backend/src/index.js](backend/src/index.js):

- it reads the comma-separated `CORS_ORIGIN` environment variable
- it accepts requests from listed origins
- it allows requests with `credentials: true`
- it rejects other origins with an error

### Current behavior

- development default origin: `http://localhost:5173`
- additional origins can be added via `CORS_ORIGIN`

### Important note

If the frontend is deployed on Vercel and the backend on Render, both origins must be listed in `CORS_ORIGIN` on the backend service.

---

## 24. Deployment Architecture Diagram (ASCII)

```text
┌─────────────────────┐      ┌──────────────────────────┐
│   Vercel Frontend   │      │   Render Backend API     │
│   React/Vite        │─────▶│   Express + Mongoose     │
│   Static Site       │      │   Auth + Jobs + Apps     │
└─────────────────────┘      └──────────────┬───────────┘
                                              │
                                              │ HTTPS
                                              ▼
                                   ┌──────────────────────────┐
                                   │   Render AI Service      │
                                   │   FastAPI + LangChain    │
                                   │   Groq LLM               │
                                   └──────────────────────────┘
                                              │
                                              ▼
                                   ┌──────────────────────────┐
                                   │   MongoDB Atlas          │
                                   │   users/jobs/apps        │
                                   └──────────────────────────┘
```

---

## 25. GitHub Repository Structure

The repository is organized as a monorepo-like structure with three runtime directories:
- [frontend](frontend)
- [backend](backend)
- [ai](ai)

The root contains project-level documentation and the top-level blueprint files.

### Repository root files
- [PROJECT_BLUEPRINT.md](PROJECT_BLUEPRINT.md)
- [SETUP.md](SETUP.md)
- [TECHNICAL_BLUEPRINT.md](TECHNICAL_BLUEPRINT.md)

---

## 26. Exactly Which Folders Are Deployed to Vercel

For a Vercel deployment, deploy the contents of the [frontend](frontend) folder as the application root.

### Vercel deployment root
- [frontend](frontend)

### Do not deploy to Vercel
- [backend](backend)
- [ai](ai)
- root documentation files unless you intentionally want them in the repo

### Vercel build settings
- Build command: `npm install && npm run build`
- Output directory: `dist`
- Root directory: `frontend`

### Vercel environment variables

| Variable | Required | Example |
|---|---|---|
| `VITE_API_URL` | yes | `https://your-backend.onrender.com` |
| `VITE_AI_SERVICE_URL` | optional | `https://your-ai.onrender.com` |
| `VITE_MAX_RESUME_SIZE` | optional | `5242880` |
| `VITE_RESUME_CHAR_LIMIT` | optional | `20000` |

---

## 27. Exactly Which Folders Are Deployed to Render

### Render backend service
Deploy the [backend](backend) folder as the app root.

### Render AI service
Deploy the [ai](ai) folder as the app root.

### Render backend startup command
- `npm start`

### Render backend build command
- `npm install`

### Render AI startup command
- `python main.py`

### Render AI build command
- `pip install -r requirements.txt`

---

## 28. Every Environment Variable Needed on Vercel

For the Vercel frontend deployment, the actual frontend code reads only the Vite-prefixed variables.

| Variable | Why it is needed |
|---|---|
| `VITE_API_URL` | tells the React app where the backend lives |
| `VITE_AI_SERVICE_URL` | optional but available in the example config |
| `VITE_MAX_RESUME_SIZE` | client-side resume validation |
| `VITE_RESUME_CHAR_LIMIT` | optional placeholder; not actively used by current code |

### Example Vercel values
- `VITE_API_URL=https://your-backend-service.onrender.com`
- `VITE_AI_SERVICE_URL=https://your-ai-service.onrender.com`
- `VITE_MAX_RESUME_SIZE=5242880`
- `VITE_RESUME_CHAR_LIMIT=20000`

---

## 29. Every Environment Variable Needed on Render (Backend)

The backend service should include:

| Variable | Why it is needed |
|---|---|
| `PORT` | Express listen port |
| `NODE_ENV` | runtime environment label |
| `CORS_ORIGIN` | allowed frontend origins |
| `MONGODB_URI` | connection string to MongoDB Atlas |
| `RAPIDAPI_KEY` | optional live job API access |
| `RAPIDAPI_HOST` | optional live job API host |
| `AI_SERVICE_URL` | where the backend reaches the AI service |
| `LOG_LEVEL` | logging verbosity |
| `JWT_SECRET` | secure signing secret for auth |

### Example values
- `PORT=10000` (Render will usually inject this automatically, but you can define it)
- `NODE_ENV=production`
- `CORS_ORIGIN=https://your-frontend.vercel.app`
- `MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<db>?retryWrites=true&w=majority`
- `RAPIDAPI_KEY=your-rapidapi-key`
- `RAPIDAPI_HOST=jsearch.p.rapidapi.com`
- `AI_SERVICE_URL=https://your-ai-service.onrender.com`
- `LOG_LEVEL=info`
- `JWT_SECRET=replace-with-long-random-secret`

---

## 30. Every Environment Variable Needed on Render (AI)

The AI service should include:

| Variable | Why it is needed |
|---|---|
| `GROQ_API_KEY` | required for the LLM integration |
| `AI_SERVICE_HOST` | host binding |
| `AI_SERVICE_PORT` | port binding |
| `LOG_LEVEL` | logging verbosity |

### Example values
- `GROQ_API_KEY=your-groq-key`
- `AI_SERVICE_HOST=0.0.0.0`
- `AI_SERVICE_PORT=8000`
- `LOG_LEVEL=INFO`

> The current Python implementation uses hardcoded LLM settings and ignores the example `GROQ_MODEL`, `GROQ_TEMPERATURE`, and `GROQ_MAX_TOKENS` values. The code path in [ai/llm_generator.py](ai/llm_generator.py) currently hardcodes the model and token settings at runtime.

---

## 31. MongoDB Atlas Configuration Requirements

To make the app work, the MongoDB Atlas cluster must be configured as follows:

1. Create a MongoDB Atlas cluster.
2. Create a database user with read/write access.
3. Whitelist the backend deployment IPs or use `0.0.0.0/0` for development/testing.
4. Copy the connection string into `MONGODB_URI`.
5. Ensure the database contains the three collections used by the app:
   - `users`
   - `jobs`
   - `applications`

### Important implementation note

The code does not create collections manually. Mongoose creates them when documents are inserted, but the database user must be able to create and modify them.

### Recommended Atlas connection string shape

```text
mongodb+srv://<username>:<password>@<cluster-host>/<database-name>?retryWrites=true&w=majority
```

---

## 32. Common Deployment Issues and Fixes

### 32.1 CORS errors between frontend and backend

Symptoms:
- frontend requests fail with CORS-related errors

Fix:
- add the frontend origin to `CORS_ORIGIN` on the backend service
- ensure the frontend is using the correct backend URL in `VITE_API_URL`

### 32.2 JWT auth fails after deployment

Symptoms:
- login succeeds but application routes return `401`

Fix:
- set `JWT_SECRET` on the backend deployment
- ensure the frontend sends the token in the `Authorization` header
- confirm the token is not being stripped by the host or proxy

### 32.3 MongoDB connection fails

Symptoms:
- backend exits or reports connection failure

Fix:
- verify `MONGODB_URI`
- ensure the Atlas IP access list allows the backend deployment
- ensure the database user has write permission

### 32.4 AI service unavailable

Symptoms:
- email generation and analysis fall back to templates

Fix:
- verify `GROQ_API_KEY`
- verify the AI service is reachable from the backend at `AI_SERVICE_URL`
- confirm the AI service is listening on the expected port

### 32.5 Frontend build fails on Vercel

Symptoms:
- Vercel build fails in the frontend step

Fix:
- ensure the project root is set to [frontend](frontend)
- confirm dependencies are installed from [frontend/package.json](frontend/package.json)
- use `npm run build`

### 32.6 Backend route 404s

Symptoms:
- frontend calls `/api/jobs/...` or `/api/applications/...` and receives route not found

Fix:
- verify the backend route files are mounted in [backend/src/index.js](backend/src/index.js)
- ensure the path is exactly `/api/...` as implemented

### 32.7 Resume upload fails

Symptoms:
- file upload returns an error or parse failure

Fix:
- ensure the file is within the 5 MB limit
- use an allowed MIME type
- ensure the backend is receiving the multipart field named `resume`

---

## 33. Complete Deployment Checklist from Start to Finish

### Phase 1: Prepare the codebase
1. Ensure the repo contains the three deployable directories:
   - [frontend](frontend)
   - [backend](backend)
   - [ai](ai)
2. Confirm the environment example files are present.
3. Make sure the current Node and Python dependencies are installed locally.

### Phase 2: Configure MongoDB Atlas
1. Create an Atlas cluster.
2. Create a database user.
3. Copy the connection string.
4. Add the connection string to the backend environment variables.

### Phase 3: Configure the AI service
1. Create a Groq account and obtain an API key.
2. Deploy the AI service using [ai](ai).
3. Set `GROQ_API_KEY`.
4. Verify the AI service health endpoint.

### Phase 4: Configure the backend
1. Deploy [backend](backend) to Render.
2. Set all backend environment variables.
3. Set `CORS_ORIGIN` to include the Vercel frontend domain.
4. Set `AI_SERVICE_URL` to the deployed AI service URL.
5. Set `JWT_SECRET` to a secure random value.
6. Start the backend and verify `/health`.

### Phase 5: Configure the frontend
1. Deploy [frontend](frontend) to Vercel.
2. Set `VITE_API_URL` to the deployed backend URL.
3. Optionally set `VITE_AI_SERVICE_URL` for compatibility.
4. Build and verify the frontend deployment.

### Phase 6: Verify end-to-end behavior
1. Register an account.
2. Log in.
3. Search for jobs.
4. Save a job.
5. Upload a resume.
6. Generate an email.
7. Analyze a resume.
8. Confirm the application appears in the saved-jobs view.

---

## 34. Deployment Handoff for Another AI

Use the following checklist as the complete deployment handoff. This section contains everything another AI should need to deploy the project without inspecting the source again.

### 34.1 Deployment target plan
- Frontend: Vercel
- Backend: Render
- AI service: Render
- Database: MongoDB Atlas

### 34.2 Source roots
- Frontend app root: [frontend](frontend)
- Backend app root: [backend](backend)
- AI app root: [ai](ai)

### 34.3 Build and start commands

Frontend:
- Build: `cd frontend && npm install && npm run build`
- Start locally: `cd frontend && npm run dev`

Backend:
- Build: `cd backend && npm install`
- Start locally: `cd backend && npm run dev`
- Production start: `cd backend && npm start`

AI:
- Build: `cd ai && pip install -r requirements.txt`
- Start locally: `cd ai && python main.py`
- Production start: `cd ai && uvicorn main:app --host 0.0.0.0 --port 8000`

### 34.4 Required environment variables

Vercel frontend:
- `VITE_API_URL`
- `VITE_AI_SERVICE_URL` (optional)
- `VITE_MAX_RESUME_SIZE` (optional)
- `VITE_RESUME_CHAR_LIMIT` (optional)

Render backend:
- `PORT`
- `NODE_ENV`
- `CORS_ORIGIN`
- `MONGODB_URI`
- `RAPIDAPI_KEY`
- `RAPIDAPI_HOST`
- `AI_SERVICE_URL`
- `LOG_LEVEL`
- `JWT_SECRET`

Render AI:
- `GROQ_API_KEY`
- `AI_SERVICE_HOST`
- `AI_SERVICE_PORT`
- `LOG_LEVEL`

### 34.5 Important implementation facts
- The frontend uses [frontend/src/api/index.ts](frontend/src/api/index.ts) and expects the backend at `VITE_API_URL`.
- The backend uses [backend/src/index.js](backend/src/index.js) as the Express entrypoint.
- The backend uses [backend/src/middleware/authMiddleware.js](backend/src/middleware/authMiddleware.js) for JWT route protection.
- The backend uses [backend/src/controllers/aiController.js](backend/src/controllers/aiController.js) to call the AI service.
- The AI service uses [ai/main.py](ai/main.py) and [ai/llm_generator.py](ai/llm_generator.py).
- The current AI code hardcodes the Groq model settings in [ai/llm_generator.py](ai/llm_generator.py), so the env vars `GROQ_MODEL`, `GROQ_TEMPERATURE`, and `GROQ_MAX_TOKENS` are not currently driving the runtime behavior.
- The current backend also hardcodes the AI timeout to `60000` ms in [backend/src/controllers/aiController.js](backend/src/controllers/aiController.js), even though the `.env.example` includes `AI_SERVICE_TIMEOUT`.
- The current backend does not expose `/api/ai/analyze-resume`; the frontend helper exists but the backend route is not implemented.

### 34.6 Deployment order
1. Deploy MongoDB Atlas and obtain the connection string.
2. Deploy the AI service and verify `/health`.
3. Deploy the backend and set all required env vars.
4. Deploy the frontend and set `VITE_API_URL`.
5. Verify auth, jobs, resume upload, AI email generation, and saved applications.

### 34.7 Final validation checklist
- backend `/health` returns `ok`
- frontend loads and login/register pages render
- auth token is stored and used for application routes
- job search returns data or empty results without crashing
- resume upload parses successfully
- AI email generation works or falls back gracefully
- saved applications appear in the applications view

---

## 35. Verified Status from the Current Workspace

The following commands were run successfully in this workspace:

- Frontend build: `cd frontend && npm run build`
- Backend syntax check: `cd backend && node --check src/index.js`
- AI syntax check: `cd ai && python -m py_compile main.py llm_generator.py`

These checks confirm that the current source tree is syntactically consistent and the frontend build completes successfully.
