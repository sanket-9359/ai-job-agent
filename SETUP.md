# AI Job Agent — Setup Guide

## Prerequisites

| Tool       | Version  | Install                          |
|------------|----------|----------------------------------|
| Node.js    | 18+      | https://nodejs.org               |
| Python     | 3.11+    | https://python.org               |
| MongoDB    | Atlas    | https://mongodb.com/cloud/atlas  |
| Git        | any      | https://git-scm.com              |

---

## Step 1 — API Keys

### Groq (required for AI features)
1. Go to https://console.groq.com/keys
2. Sign up (free, no credit card)
3. Click **Create API Key** → copy it

### RapidAPI JSearch (required for live job listings)
1. Go to https://rapidapi.com/laxaryan/api/jsearch
2. Subscribe to the **Basic** free plan (50 calls/month)
3. Copy your **X-RapidAPI-Key**

### MongoDB Atlas (required for data persistence)
1. Go to https://mongodb.com/cloud/atlas
2. Create a free M0 cluster
3. Create a database user (username + password)
4. Whitelist IP: `0.0.0.0/0` (or your IP)
5. Click **Connect → Drivers** → copy the connection string
6. Replace `<password>` with your user's password

---

## Step 2 — Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env`:
```
PORT=5000
MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_PASS@YOUR_CLUSTER.mongodb.net/ai-job-agent
RAPIDAPI_KEY=your_rapidapi_key_here
RAPIDAPI_HOST=jsearch.p.rapidapi.com
AI_SERVICE_URL=http://localhost:8000
NODE_ENV=development
```

Start the backend:
```bash
npm run dev
# ✅ Backend running on http://localhost:5000
```

---

## Step 3 — AI Service Setup

```bash
cd ai
python -m venv venv

# macOS / Linux
source venv/bin/activate

# Windows
venv\Scripts\activate

pip install -r requirements.txt
cp .env.example .env
```

Edit `ai/.env`:
```
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_MODEL=llama3-8b-8192
AI_SERVICE_PORT=8000
ENVIRONMENT=development
```

Start the AI service:
```bash
python main.py
# ✅ AI Service running on http://localhost:8000
```

Verify: http://localhost:8000/health → `{"status":"ok","service":"ai"}`

---

## Step 4 — Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
```

Edit `frontend/.env.local`:
```
VITE_API_URL=http://localhost:5000
VITE_AI_SERVICE_URL=http://localhost:8000
```

Start the frontend:
```bash
npm run dev
# ✅ Frontend running on http://localhost:5173
```

---

## Step 5 — Verify End-to-End

Open http://localhost:5173 and:

1. **Profile**: Enter "Frontend Developer", select "2-4 years", add "React" and "TypeScript"
2. **Search**: Click "Find Jobs by Role" → jobs should appear with ✔/✖ indicators
3. **AI Email**: Click "AI Email" on any card → unique email generates in ~3s
4. **Save**: Click bookmark icon → job appears in Saved Jobs tab
5. **Dashboard**: Check the pipeline view updates

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Cannot connect to MongoDB` | Check MONGODB_URI, whitelist IP in Atlas |
| `No jobs returned` | JSearch quota may be exhausted — demo jobs will show |
| `AI email fails` | Check GROQ_API_KEY in `ai/.env`, restart AI service |
| `CORS error in browser` | Verify CORS_ORIGIN in `backend/.env` matches frontend URL |
| `Resume parse fails` | Check file is not password-protected, try a different format |
| `500 error on /generate-email` | AI service not running — start with `python main.py` |

---

## Production Deployment

### Frontend → Vercel
```bash
# Push to GitHub, import at vercel.com
# Set env vars:
# VITE_API_URL = https://your-backend.onrender.com
```

### Backend → Render
- Build: `npm install`
- Start: `npm start`
- Add all env vars as secrets in Render dashboard

### AI Service → Render (separate service)
- Build: `pip install -r requirements.txt`
- Start: `python main.py`
- Add `GROQ_API_KEY` as secret

---

## Architecture Summary

```
Browser (React) → Backend (Express/Node) → MongoDB
                                         → JSearch API
                                         → AI Service (FastAPI/Python)
                                                    → Groq LLM
```

All services are stateless except MongoDB. The AI service never crashes —
every endpoint has a fallback template response if Groq is unavailable.
