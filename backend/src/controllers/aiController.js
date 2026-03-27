const axios = require('axios');
const Job = require('../models/Job');
const Application = require('../models/Application');
const { buildFallbackEmail, buildFallbackAnalysis } = require('../utils/fallbackTemplates');
const logger = require('../utils/logger');

const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const TIMEOUT = parseInt(process.env.AI_SERVICE_TIMEOUT || '30000', 10);

// ─── Helper ──────────────────────────────────────────────────────────────────
async function findJob(jobId) {
  if (!jobId) return null;
  try {
    // Try MongoDB ObjectId first
    const byId = await Job.findById(jobId).lean();
    if (byId) return byId;
  } catch (_) { /* not a valid ObjectId */ }
  // Fallback to searching by the string jobId field
  return Job.findOne({ jobId }).lean();
}

// ─── Generate Cold Email ─────────────────────────────────────────────────────
exports.generateEmail = async (req, res) => {
  try {
    const { jobId, profile } = req.body;
    
    if (!jobId) return res.status(400).json({ success: false, message: 'jobId is required.' });
    if (!profile) return res.status(400).json({ success: false, message: 'Profile is required.' });

    const job = await findJob(jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });

    let emailData;
    let isFallback = false;

    try {
      // FIX: Mapping our job object to the specific keys the Python AI service expects
      const aiPayload = {
        job_title: job.title,
        company_name: job.company,
        // This is the key fix for the "Fresher" logic
        user_experience: profile.experience == 0 ? "Fresher/Entry-level" : `${profile.experience} years`,
        resume_text: profile.resumeText || "No resume provided - use general professional tone",
        job_description: job.description
      };

      const aiResponse = await axios.post(`${AI_URL}/generate-email`, aiPayload, { timeout: TIMEOUT });
      emailData = aiResponse.data;
    } catch (err) {
      logger.warn(`AI service /generate-email failed: ${err.message}. Using fallback.`);
      emailData = buildFallbackEmail(job, profile);
      isFallback = true;
    }

    // Save to application (using job._id which is the MongoDB ID)
    try {
      await Application.findOneAndUpdate(
        { job: job._id },
        { generatedEmail: emailData.email || emailData.body || '' },
        { sort: { savedAt: -1 }, upsert: false }
      );
    } catch (saveErr) {
      logger.warn('Could not save email to application:', saveErr.message);
    }

    return res.json({
      success: true,
      data: { ...emailData, _fallback: isFallback },
    });
  } catch (err) {
    logger.error('generateEmail error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate email.' });
  }
};

// ─── Generate Resume Analysis ─────────────────────────────────────────────────
exports.generateBullets = async (req, res) => {
  try {
    const { jobId, profile } = req.body;
    
    if (!jobId) return res.status(400).json({ success: false, message: 'jobId is required.' });
    if (!profile?.resumeText || profile.resumeText.length < 50) {
      return res.status(400).json({ success: false, message: 'Resume is too short (min 50 chars).' });
    }

    const job = await findJob(jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });

    let analysis;
    let isFallback = false;

    try {
      // FIX: Mapping to Python AI expected keys for gap analysis
      const aiPayload = {
        job_title: job.title,
        job_description: job.description,
        company_name: job.company,
        resume_text: profile.resumeText,
        analysis_type: "gap_analysis" // Specify gap analysis
      };

      const aiResponse = await axios.post(`${AI_URL}/generate-bullets`, aiPayload, { timeout: TIMEOUT });
      analysis = aiResponse.data;
    } catch (err) {
      logger.warn(`AI service /generate-bullets failed: ${err.message}. Using fallback.`);
      analysis = buildFallbackAnalysis(job, profile);
      isFallback = true;
    }

    // Save to application
    try {
      const rawAnalysisText = analysis.resume || analysis.rawText || analysis.analysis || '';
      const parsedSections = parseAnalysisText(rawAnalysisText);
      
      await Application.findOneAndUpdate(
        { job: job._id },
        {
          generatedAnalysis: {
            ...parsedSections,
            rawText: rawAnalysisText,
          },
        },
        { sort: { savedAt: -1 }, upsert: false }
      );
    } catch (saveErr) {
      logger.warn('Could not save analysis to application:', saveErr.message);
    }

    return res.json({
      success: true,
      data: { ...analysis, _fallback: isFallback },
    });
  } catch (err) {
    logger.error('generateBullets error:', err);
    return res.status(500).json({ success: false, message: 'Failed to analyze resume.' });
  }
};

function parseAnalysisText(text) {
  if (!text) return { strongPoints: [], weakPoints: [], suggestions: [] };
  
  const extract = (label) => {
    const regex = new RegExp(`${label}[:\\s]*(.*?)(?=STRONG|WEAK|SUGGEST|$)`, 'is');
    const match = text.match(regex);
    if (!match) return [];
    return match[1]
      .split('\n')
      .map(l => l.replace(/^[•\-*]\s*/, '').trim())
      .filter(l => l.length > 5);
  };

  return {
    strongPoints: extract('STRONG POINTS'),
    weakPoints:   extract('WEAK POINTS'),
    suggestions:  extract('SUGGESTIONS'),
  };
}