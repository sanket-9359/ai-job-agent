const Application = require('../models/Application');
const Job = require('../models/Job');
const { formatDate, addDays } = require('../utils/dateHelper');
const logger = require('../utils/logger');

// ─── Helper ──────────────────────────────────────────────────────────────────
function formatApplication(app) {
  const obj = app.toObject ? app.toObject() : { ...app };
  return {
    ...obj,
    savedAtFormatted:    formatDate(obj.savedAt),
    appliedAtFormatted: formatDate(obj.appliedAt),
    updatedAtFormatted: formatDate(obj.updatedAt),
  };
}

// ─── Create Application ──────────────────────────────────────────────────────
exports.createApplication = async (req, res) => {
  try {
    // FIX: Accept both 'jobId' (from our new frontend) or 'job' (from old tests)
    const jobId = req.body.jobId || req.body.job;
    
    if (!jobId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Job ID is required (use key "jobId").' 
      });
    }

    // Verify job exists in MongoDB
    let job;
    try {
      // Try finding by MongoDB _id first
      job = await Job.findById(jobId);
      if (!job) {
        // Fallback to searching by the string 'jobId' field
        job = await Job.findOne({ jobId: jobId });
      }
    } catch (_) {
      // If jobId wasn't a valid ObjectId, search by the string field
      job = await Job.findOne({ jobId: jobId });
    }

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found in database.' });
    }

    // Check if user already saved this job
    const existing = await Application.findOne({ job: job._id, user: req.user._id });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Job already saved.' });
    }

    // Create the application record
    const application = await Application.create({ 
      user: req.user._id,
      job: job._id,
      status: 'pending',
      savedAt: new Date()
    });
    
    logger.info(`Application created for job: ${job.title} by user ${req.user.email}`);

    // Return the formatted application
    const savedApp = await Application.findById(application._id).populate('job');
    return res.status(201).json({ success: true, data: formatApplication(savedApp) });

  } catch (err) {
    logger.error('createApplication error:', err);
    return res.status(500).json({ success: false, message: 'Failed to save application.' });
  }
};

// ─── Get All Applications ────────────────────────────────────────────────────
exports.getApplications = async (req, res) => {
  try {
    const apps = await Application.find({ user: req.user._id })
      .populate('job')
      .sort({ savedAt: -1 })
      .lean();

    return res.json({
      success: true,
      data: apps.map(a => ({
        ...a,
        savedAtFormatted:    formatDate(a.savedAt),
        appliedAtFormatted: formatDate(a.appliedAt),
        updatedAtFormatted: formatDate(a.updatedAt),
      })),
    });
  } catch (err) {
    logger.error('getApplications error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch applications.' });
  }
};

// ─── Get Application by ID ────────────────────────────────────────────────────
exports.getApplicationById = async (req, res) => {
  try {
    const app = await Application.findOne({ _id: req.params.id, user: req.user._id }).populate('job').lean();
    if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });

    return res.json({
      success: true,
      data: {
        ...app,
        savedAtFormatted:    formatDate(app.savedAt),
        appliedAtFormatted: formatDate(app.appliedAt),
      },
    });
  } catch (err) {
    logger.error('getApplicationById error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch application.' });
  }
};

// ─── Update Application ───────────────────────────────────────────────────────
exports.updateApplication = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const app = await Application.findOne({ _id: req.params.id, user: req.user._id });
    if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });

    if (status) {
      const validStatuses = ['pending', 'applied', 'interview', 'rejected', 'offer'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
      }
      app.status = status;
      if (status === 'applied' && !app.appliedAt) {
        app.appliedAt  = new Date();
        app.reminderAt = addDays(new Date(), 7);
      }
    }

    if (notes !== undefined) app.notes = notes;
    app.updatedAt = new Date();
    await app.save();

    const updatedApp = await Application
      .findById(app._id)
      .populate('job');

    logger.info(
      `Application ${app._id} updated to status: ${app.status}`
    );


    return res.json({
      success: true,
      data: formatApplication(updatedApp)
    });
      } catch (err) {
        logger.error('updateApplication error:', err);
        return res.status(500).json({ success: false, message: 'Failed to update application.' });
      }
    };

// ─── Delete Application ───────────────────────────────────────────────────────
exports.deleteApplication = async (req, res) => {
  try {
    const app = await Application.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });
    logger.info(`Application ${req.params.id} deleted by user ${req.user.email}`);
    return res.json({ success: true, message: 'Application deleted.' });
  } catch (err) {
    logger.error('deleteApplication error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete application.' });
  }
};