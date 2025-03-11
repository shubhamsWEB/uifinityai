// server/routes/designRoutes.js
const express = require('express');
const {
  generateDesign,
  getGeneratedDesign,
  getAllGeneratedDesigns,
  updateFeedback,
  deleteGeneratedDesign,
  regenerateDesign,
  getDesignPreview
} = require('../controllers/designGenerationController');

const router = express.Router();

// Middleware
const { protect } = require('../middleware/auth');

// Apply protection to all routes
router.use(protect);

// Design generation routes
router.route('/')
  .post(generateDesign)
  .get(getAllGeneratedDesigns);

router.route('/:id')
  .get(getGeneratedDesign)
  .delete(deleteGeneratedDesign);

router.route('/:id/feedback')
  .put(updateFeedback);

router.route('/:id/regenerate')
  .post(regenerateDesign);

router.route('/preview/:id')
  .get(getDesignPreview);

module.exports = router;