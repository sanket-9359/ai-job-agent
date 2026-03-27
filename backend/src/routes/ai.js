const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/aiController');

router.post('/generate-email',   ctrl.generateEmail);
router.post('/generate-bullets', ctrl.generateBullets);

module.exports = router;
