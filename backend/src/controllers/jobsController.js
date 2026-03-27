const Job = require('../models/Job');
const { fetchJobsFromJSearch } = require('../utils/jsearch');
const DEMO_JOBS = require('../utils/demoJobs');
const { buildMatchMetadata } = require('../utils/matchHelper');
const logger = require('../utils/logger');
const multer = require('multer');
const path = require('path');

// ─── Multer Setup ────────────────────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Unsupported file type. Upload PDF, DOCX, JPG, or PNG.'));
  },
});
exports.uploadMiddleware = upload.single('resume');

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function upsertJobs(jobs) {
  const ops = jobs.map(j => ({
    updateOne: {
      filter: { jobId: j.jobId },
      update: { $set: j },
      upsert: true,
    },
  }));
  if (ops.length > 0) await Job.bulkWrite(ops);
}

async function getCachedJobs(query, maxAge = 7) {
  const cutoff = new Date(Date.now() - maxAge * 24 * 60 * 60 * 1000);
  const keywords = query.toLowerCase().split(/\s+/);
  const regex = keywords.map(k => new RegExp(k, 'i'));
  return Job.find({
    fetchedAt: { $gte: cutoff },
    $or: [
      { title: { $in: regex } },
      { description: { $in: regex } },
    ],
  }).lean();
}

function attachMatchMetadata(jobs, profile) {
  return jobs.map(job => ({
    ...job,
    matchMetadata: buildMatchMetadata(job, profile),
    whyJobFitsYou: buildMatchMetadata(job, profile).whyJobFitsYou,
  }));
}

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * POST /api/jobs/search
 * mode: 'primary' | 'secondary'
 */
exports.searchJobs = async (req, res) => {
  try {
    const { mode = 'primary', targetRole, experience, skills = [], resumeText } = req.body;

    // ── Validate ──
    if (mode === 'primary' && !targetRole) {
      return res.status(400).json({ success: false, message: 'Target role is required for primary search.' });
    }
    if (mode === 'secondary' && (!skills || skills.length === 0)) {
      return res.status(400).json({ success: false, message: 'At least one skill is required for skills search.' });
    }

    const profile = { targetRole, experience, skills, resumeText };
    const query = mode === 'primary' ? targetRole : skills.join(' ');

    // ── 1. Try JSearch API ──
    let rawJobs = [];
    let source = 'live';
    try {
      rawJobs = await fetchJobsFromJSearch(query);
      if (rawJobs.length > 0) await upsertJobs(rawJobs);
    } catch (err) {
      logger.warn('JSearch failed:', err.message);
    }

    // ── 2. Fall back to cache ──
    if (rawJobs.length === 0) {
      logger.info('Falling back to cache...');
      rawJobs = await getCachedJobs(query);
      source = rawJobs.length > 0 ? 'cache' : 'demo';
    }

    // ── 3. Fall back to demo ──
    if (rawJobs.length === 0) {
      logger.info('Falling back to demo jobs');
      rawJobs = DEMO_JOBS;
      source = 'demo';
    }

    // ── Filter ──
    let filtered;
    if (mode === 'primary') {
      filtered = rawJobs.filter(job => {
        const meta = buildMatchMetadata(job, profile);
        return meta.roleMatch && meta.experienceMatch;
      });
    } else {
      // secondary: need ≥1 matched skill
      filtered = rawJobs.filter(job => {
        const meta = buildMatchMetadata(job, profile);
        return meta.matchedSkills.length > 0;
      });
    }

    const jobs = attachMatchMetadata(filtered, profile);

    return res.json({
      success: true,
      data: { jobs, total: jobs.length, source },
    });
  } catch (err) {
    logger.error('searchJobs error:', err);
    return res.status(500).json({ success: false, message: 'Failed to search jobs.' });
  }
};

/**
 * GET /api/jobs
 */
exports.getAllJobs = async (_req, res) => {
  try {
    const jobs = await Job.find().sort({ fetchedAt: -1 }).limit(100).lean();
    return res.json({ success: true, data: jobs });
  } catch (err) {
    logger.error('getAllJobs error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch jobs.' });
  }
};

/**
 * GET /api/jobs/:id
 */
exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).lean();
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });
    return res.json({ success: true, data: job });
  } catch (err) {
    logger.error('getJobById error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch job.' });
  }
};

/**
 * POST /api/jobs/generate-summary
 * Parses uploaded resume file to text.
 */
exports.generateSummary = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const { buffer, mimetype, originalname } = req.file;
    let text = '';

    if (mimetype === 'application/pdf') {
      const pdfParse = require('pdf-parse');
      const result = await pdfParse(buffer);
      text = result.text;
    } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (['image/jpeg', 'image/png'].includes(mimetype)) {
      const Tesseract = require('tesseract.js');
      const { data } = await Tesseract.recognize(buffer, 'eng', { logger: () => {} });
      text = data.text;
    } else {
      return res.status(400).json({ success: false, message: 'Unsupported file type.' });
    }

    text = text.trim();
    if (text.length < 50) {
      return res.status(400).json({ success: false, message: 'Resume appears unreadable or too short. Please upload a clearer file.' });
    }

    // Cap at 20,000 chars
    const summary = text.slice(0, 20000);

    logger.info(`Resume parsed from ${originalname}: ${summary.length} chars`);
    return res.json({ success: true, data: { summary } });
  } catch (err) {
    logger.error('generateSummary error:', err);
    return res.status(500).json({ success: false, message: 'Failed to parse resume. Please try a different file.' });
  }
};
