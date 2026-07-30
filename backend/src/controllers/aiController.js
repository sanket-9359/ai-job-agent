const axios = require('axios');
const Job = require('../models/Job');
const Application = require('../models/Application');
const { buildFallbackEmail, buildFallbackAnalysis } = require('../utils/fallbackTemplates');
const logger = require('../utils/logger');

const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
// Increased default timeout to 60 seconds for heavy AI processing
const TIMEOUT = 60000;

// ─── Helper: Finds job by Mongo ID or Custom Job ID String ───────────────────
async function findJob(jobId) {
  if (!jobId) return null;
  try {
    // Try MongoDB ObjectId first
    const byId = await Job.findById(jobId).lean();
    if (byId) return byId;
  } catch (_) { /* not a valid ObjectId */ }
  // Fallback to searching by the custom string jobId field
  return Job.findOne({ jobId }).lean();
}

// ─── Generate Cold Email ─────────────────────────────────────────────────────
// ─── Generate Cold Email ─────────────────────────────────────────────────────
exports.generateEmail = async (req, res) => {
  try {
    const { jobId, profile } = req.body;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: 'jobId is required.'
      });
    }

    if (!profile) {
      return res.status(400).json({
        success: false,
        message: 'Profile is required.'
      });
    }

    const job = await findJob(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found.'
      });
    }

    let emailData;
    let isFallback = false;

    try {
      const aiPayload = {
        job: {
          title: job.title,
          company: job.company,
          description:
            job.description ||
            job.snippet ||
            'No description provided'
        },
        profile: {
          targetRole: profile.targetRole || job.title,
          experience: profile.experience || '0',
          skills: profile.skills || [],
          resume_text: profile.resumeText || ''
        }
      };

      const aiResponse = await axios.post(
        `${AI_URL}/generate-email`,
        aiPayload,
        { timeout: TIMEOUT }
      );

      // FIXED RESPONSE HANDLING
      const responseData = aiResponse.data.data || aiResponse.data;

      // Validate email content
      if (!responseData.email && !responseData.body) {
        throw new Error('AI returned empty email body');
      }

      emailData = {
        email:
          responseData.email ||
          responseData.body ||
          '',

        subject:
          responseData.subject ||
          'Job Application',

        body:
          responseData.body ||
          responseData.email ||
          'No email generated'
      };

    } catch (err) {
      logger.warn(
        `AI service /generate-email failed: ${err.message}. Using fallback.`
      );

      emailData = buildFallbackEmail(job, profile);
      isFallback = true;
    }

    // Save generated email
    try {
      await Application.findOneAndUpdate(
        { job: job._id },
        {
          generatedEmail:
            emailData.email ||
            emailData.body ||
            ''
        },
        {
          sort: { savedAt: -1 },
          upsert: false
        }
      );
    } catch (saveErr) {
      logger.warn(
        'Could not save email to application:',
        saveErr.message
      );
    }

    return res.json({
      success: true,
      data: {
        ...emailData,
        _fallback: isFallback
      }
    });

  } catch (err) {
    logger.error('generateEmail error:', err);

    return res.status(500).json({
      success: false,
      message: 'Failed to generate email.'
    });
  }
};

// ─── Generate Resume Analysis ─────────────────────────────────────────────────
exports.generateBullets = async (req, res) => {
  try {
    const { jobId, profile } = req.body;
    
    if (!jobId) return res.status(400).json({ success: false, message: 'jobId is required.' });
    if (!profile?.resumeText || profile.resumeText.length < 20) {
      return res.status(400).json({ success: false, message: 'Resume is too short for analysis.' });
    }

    const job = await findJob(jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });

    let aiResult;
    let isFallback = false;

    try {
      const aiPayload = {
        job: {
          title: job.title,
          company: job.company,
          description: job.description || job.snippet || "No description provided"
        },
        profile: {
          targetRole: profile.targetRole || job.title,
          experience: profile.experience || "0",
          skills: profile.skills || [],
          resume_text: profile.resumeText
        }
      };

      const aiResponse = await axios.post(`${AI_URL}/generate-bullets`, aiPayload, { timeout: TIMEOUT });
      
      // CRITICAL CHECK: If strongPoints is missing or empty, force fallback
      if (!aiResponse.data || !aiResponse.data.strongPoints || aiResponse.data.strongPoints.length === 0) {
        throw new Error('AI returned incomplete analysis data');
      }

      aiResult = aiResponse.data;
    } catch (err) {
      logger.warn(`AI service /generate-bullets failed: ${err.message}. Using fallback.`);
      aiResult = buildFallbackAnalysis(job, profile);
      isFallback = true;
    }

    // Prepare standardized data for MongoDB
    const analysisData = {
      strongPoints: aiResult.strongPoints || [],
      weakPoints: aiResult.weakPoints || [],
      suggestions: aiResult.suggestions || [],
      rawText: aiResult.analysis || aiResult.resume || '', 
    };

    // Persistence: Update the most recent application for this job
    try {
      await Application.findOneAndUpdate(
        { job: job._id },
        { generatedAnalysis: analysisData },
        { sort: { savedAt: -1 }, upsert: false }
      );
    } catch (saveErr) {
      logger.warn('Could not save analysis to application:', saveErr.message);
    }

    return res.json({
      success: true,
      data: { ...aiResult, ...analysisData, _fallback: isFallback },
    });
  } catch (err) {
    logger.error('generateBullets error:', err);
    return res.status(500).json({ success: false, message: 'Failed to analyze resume.' });
  }
};