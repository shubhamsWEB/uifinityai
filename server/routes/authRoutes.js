const express = require('express');
const {
  register,
  login,
  getMe,
  updateDetails,
  updatePassword,
  saveFigmaToken
} = require('../controllers/authController');

const router = express.Router();

// Middleware
const { protect } = require('../middleware/auth');

// Routes
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, updateDetails);
router.put('/updatepassword', protect, updatePassword);
router.post('/figma-token', protect, saveFigmaToken);

module.exports = router;