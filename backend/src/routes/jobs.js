const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/jobsController');

router.post('/search',           ctrl.searchJobs);
router.get('/',                  ctrl.getAllJobs);
router.get('/:id',               ctrl.getJobById);
router.post('/generate-summary', ctrl.uploadMiddleware, ctrl.generateSummary);

module.exports = router;
