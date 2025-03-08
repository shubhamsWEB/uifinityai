const Organization = require('../models/Organization');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Get all organizations
 * @route   GET /api/organizations
 * @access  Private
 */
const getOrganizations = asyncHandler(async (req, res) => {
  // Find organizations where user is a member
  const organizations = await Organization.find({
    'members.user': req.user.id
  }).populate({
    path: 'members.user',
    select: 'name email'
  });
  
  res.status(200).json({
    success: true,
    count: organizations.length,
    organizations
  });
});

/**
 * @desc    Get single organization
 * @route   GET /api/organizations/:id
 * @access  Private
 */
const getOrganization = asyncHandler(async (req, res) => {
  const organization = await Organization.findById(req.params.id).populate({
    path: 'members.user',
    select: 'name email'
  });
  
  if (!organization) {
    return res.status(404).json({
      success: false,
      error: 'Organization not found'
    });
  }
  
  // Check if user is a member
  const isMember = organization.members.some(
    member => member.user.id.toString() === req.user.id
  );
  
  if (!isMember) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to access this organization'
    });
  }
  
  res.status(200).json({
    success: true,
    organization
  });
});

/**
 * @desc    Create organization
 * @route   POST /api/organizations
 * @access  Private
 */
const createOrganization = asyncHandler(async (req, res) => {
  // Add owner to members list
  const members = [
    {
      user: req.user.id,
      role: 'owner'
    }
  ];
  
  // Create organization
  const organization = await Organization.create({
    ...req.body,
    owner: req.user.id,
    members
  });
  
  res.status(201).json({
    success: true,
    organization
  });
});

/**
 * @desc    Update organization
 * @route   PUT /api/organizations/:id
 * @access  Private
 */
const updateOrganization = asyncHandler(async (req, res) => {
  let organization = await Organization.findById(req.params.id);
  
  if (!organization) {
    return res.status(404).json({
      success: false,
      error: 'Organization not found'
    });
  }
  
  // Check if user is owner or admin
  const member = organization.members.find(
    member => member.user.toString() === req.user.id
  );
  
  if (!member || !['owner', 'admin'].includes(member.role)) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to update this organization'
    });
  }
  
  // Update organization
  organization = await Organization.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );
  
  res.status(200).json({
    success: true,
    organization
  });
});

/**
 * @desc    Delete organization
 * @route   DELETE /api/organizations/:id
 * @access  Private
 */
const deleteOrganization = asyncHandler(async (req, res) => {
  const organization = await Organization.findById(req.params.id);
  
  if (!organization) {
    return res.status(404).json({
      success: false,
      error: 'Organization not found'
    });
  }
  
  // Check if user is owner
  const isOwner = organization.owner.toString() === req.user.id;
  
  if (!isOwner) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to delete this organization'
    });
  }
  
  await organization.remove();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

/**
 * @desc    Add member to organization
 * @route   POST /api/organizations/:id/members
 * @access  Private
 */
const addMember = asyncHandler(async (req, res) => {
  const { email, role } = req.body;
  
  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'Please provide an email'
    });
  }
  
  // Find user by email
  const user = await User.findOne({ email });
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }
  
  // Get organization
  const organization = await Organization.findById(req.params.id);
  
  if (!organization) {
    return res.status(404).json({
      success: false,
      error: 'Organization not found'
    });
  }
  
  // Check if user is owner or admin
  const member = organization.members.find(
    member => member.user.toString() === req.user.id
  );
  
  if (!member || !['owner', 'admin'].includes(member.role)) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to add members to this organization'
    });
  }
  
  // Check if user is already a member
  const isAlreadyMember = organization.members.some(
    member => member.user.toString() === user.id
  );
  
  if (isAlreadyMember) {
    return res.status(400).json({
      success: false,
      error: 'User is already a member of this organization'
    });
  }
  
  // Add member
  organization.members.push({
    user: user.id,
    role: role || 'member'
  });
  
  await organization.save();
  
  res.status(200).json({
    success: true,
    organization
  });
});

/**
 * @desc    Remove member from organization
 * @route   DELETE /api/organizations/:id/members/:userId
 * @access  Private
 */
const removeMember = asyncHandler(async (req, res) => {
  // Get organization
  const organization = await Organization.findById(req.params.id);
  
  if (!organization) {
    return res.status(404).json({
      success: false,
      error: 'Organization not found'
    });
  }
  
  // Check if user is owner or admin
  const currentMember = organization.members.find(
    member => member.user.toString() === req.user.id
  );
  
  if (!currentMember || !['owner', 'admin'].includes(currentMember.role)) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to remove members from this organization'
    });
  }
  
  // Find member to remove
  const memberIndex = organization.members.findIndex(
    member => member.user.toString() === req.params.userId
  );
  
  if (memberIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'Member not found'
    });
  }
  
  // Prevent removing owner
  const memberToRemove = organization.members[memberIndex];
  if (memberToRemove.role === 'owner') {
    return res.status(400).json({
      success: false,
      error: 'Cannot remove the owner of the organization'
    });
  }
  
  // Remove member
  organization.members.splice(memberIndex, 1);
  await organization.save();
  
  res.status(200).json({
    success: true,
    organization
  });
});

module.exports = {
  getOrganizations,
  getOrganization,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  addMember,
  removeMember
};