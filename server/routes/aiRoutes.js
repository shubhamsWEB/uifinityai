// server/routes/aiRoutes.js
const express = require('express');
const {
  generateUI,
  getGeneratedUI,
  getAllGeneratedUIs,
  updateFeedback,
  deleteGeneratedUI,
  regenerateUI,
  refineUI
} = require('../controllers/aiGenerationController');

const router = express.Router();

// Middleware
const { protect } = require('../middleware/auth');

// Apply protection to all routes
router.use(protect);

// Generation routes
router.route('/generate')
  .post(generateUI)
  .get(getAllGeneratedUIs);

router.route('/generate/:id')
  .get(getGeneratedUI)
  .delete(deleteGeneratedUI);

router.route('/generate/:id/feedback')
  .put(updateFeedback);

router.route('/generate/:id/regenerate')
  .post(regenerateUI);

router.route('/generate/:id/refine')
  .post(refineUI);

module.exports = router;