const express = require('express');
const {
  initializeFigmaApi,
  extractDesignSystem,
  saveDesignSystem,
  extractAndSaveDesignSystem,
  getDesignSystemById,
  getDesignSystemsByUser,
  deleteDesignSystem,
  exportDesignSystem,
  importDesignSystem,
  authorizeFigma
} = require('../controllers/figmaController');

const router = express.Router();

// Middleware
const { protect } = require('../middleware/auth');

// Routes
router.post('/auth', protect, authorizeFigma);
router.post('/extract', protect, extractDesignSystem);
router.post('/save', protect, saveDesignSystem);
router.post('/extract-and-save', protect, extractAndSaveDesignSystem);
router.get('/design-systems', protect, getDesignSystemsByUser);
router.get('/design-systems/:id', protect, getDesignSystemById);
router.delete('/design-systems/:id', protect, deleteDesignSystem);
router.get('/export/:id', protect, exportDesignSystem);
router.post('/import', protect, importDesignSystem);

module.exports = router;