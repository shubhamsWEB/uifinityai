const express = require('express');
const {
  getOrganizations,
  getOrganization,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  addMember,
  removeMember
} = require('../controllers/organizationController');

const router = express.Router();

// Middleware
const { protect } = require('../middleware/auth');

// Apply protection to all routes
router.use(protect);

// Organization routes
router.route('/')
  .get(getOrganizations)
  .post(createOrganization);

router.route('/:id')
  .get(getOrganization)
  .put(updateOrganization)
  .delete(deleteOrganization);

// Member management routes
router.route('/:id/members')
  .post(addMember);

router.route('/:id/members/:userId')
  .delete(removeMember);

module.exports = router;