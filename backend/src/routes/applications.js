const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/applicationsController');
const { requireAuth } = require('../middleware/authMiddleware');

router.use(requireAuth);
router.post('/',     ctrl.createApplication);
router.get('/',      ctrl.getApplications);
router.get('/:id',   ctrl.getApplicationById);
router.put('/:id',   ctrl.updateApplication);
router.delete('/:id', ctrl.deleteApplication);

module.exports = router;
