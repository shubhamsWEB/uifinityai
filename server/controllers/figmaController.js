const asyncHandler = require('../utils/asyncHandler');
const { 
  figmaApiService, 
  componentExtractor, 
  tokenExtractor, 
  designSystemStore 
} = require('../services');
const User = require('../models/User');

/**
 * Initialize the Figma API service
 * @param {string} token - The Figma API token
 */
const initializeFigmaApi = (token) => {
  figmaApiService.initializeWithPersonalToken(token);
};

/**
 * @desc    Extract a complete design system from Figma
 * @route   POST /api/figma/extract
 * @access  Private
 */
const extractDesignSystem = asyncHandler(async (req, res) => {
  const { fileKey } = req.body;
  
  // Validate API is initialized
  if (!figmaApiService.apiClient) {
    throw new Error('Figma API not initialized. Call initializeFigmaApi() first.');
  }
  
  // Get file information
  const fileInfo = await figmaApiService.getFile(fileKey);
  const designSystemName = fileInfo.name || 'Design System';
  
  console.log(`Extracting design system from "${designSystemName}" (${fileKey})...`);
  
  // Extract design tokens
  console.log('Extracting design tokens...');
  const designTokens = await tokenExtractor.extractDesignTokens(fileKey);
  
  // Extract components
  console.log('Extracting components...');
  const componentData = await componentExtractor.extractComponents(fileKey);
  
  // Combine all data into a design system object
  const designSystem = {
    name: designSystemName,
    description: fileInfo.description || '',
    figmaFileKey: fileKey,
    tokens: designTokens,
    components: componentData.components,
    componentSets: componentData.componentSets,
    componentPreviews: componentData.componentPreviews,
  };
  
  console.log('Design system extraction complete!');
  console.log(`- ${Object.keys(designTokens.colors).length} color tokens`);
  console.log(`- ${Object.keys(designTokens.typography).length} typography tokens`);
  console.log(`- ${Object.keys(designTokens.spacing).length} spacing tokens`);
  console.log(`- ${Object.keys(designSystem.components).length} components`);
  console.log(`- ${Object.keys(designSystem.componentSets).length} component sets`);
  
  res.status(200).json({
    success: true,
    designSystem
  });
});

/**
 * @desc    Save a design system to the database
 * @route   POST /api/figma/save
 * @access  Private
 */
const saveDesignSystem = asyncHandler(async (req, res) => {
  const { designSystem } = req.body;
  const userId = req.user.id;
  const organizationId = req.user.organizationId || null;
  
  const savedDesignSystem = await designSystemStore.saveDesignSystem(
    designSystem,
    userId,
    organizationId
  );
  
  res.status(200).json({
    success: true,
    designSystem: savedDesignSystem
  });
});

/**
 * @desc    Extract and save a design system in one operation
 * @route   POST /api/figma/extract-and-save
 * @access  Private
 */
const extractAndSaveDesignSystem = asyncHandler(async (req, res) => {
  const { fileKey } = req.body;
  const userId = req.user.id;
  const organizationId = req.user.organizationId || null;
  
  // Validate API is initialized
  if (!figmaApiService.apiClient) {
    throw new Error('Figma API not initialized. Call initializeFigmaApi() first.');
  }
  
  // Get file information
  const fileInfo = await figmaApiService.getFile(fileKey);
  const designSystemName = fileInfo.name || 'Design System';
  
  // Extract design tokens
  const designTokens = await tokenExtractor.extractDesignTokens(fileKey);
  
  // Extract components
  const componentData = await componentExtractor.extractComponents(fileKey);
  
  // Combine all data into a design system object
  const designSystem = {
    name: designSystemName,
    description: fileInfo.description || '',
    figmaFileKey: fileKey,
    tokens: designTokens,
    components: componentData.components,
    componentSets: componentData.componentSets,
    componentPreviews: componentData.componentPreviews,
  };
  
  // Save to database
  const savedDesignSystem = await designSystemStore.saveDesignSystem(
    designSystem,
    userId,
    organizationId
  );
  
  res.status(200).json({
    success: true,
    designSystem: savedDesignSystem
  });
});

/**
 * @desc    Get a design system by ID
 * @route   GET /api/figma/design-systems/:id
 * @access  Private
 */
const getDesignSystemById = asyncHandler(async (req, res) => {
  const designSystem = await designSystemStore.getDesignSystemById(req.params.id);
  
  if (!designSystem) {
    return res.status(404).json({
      success: false,
      error: 'Design system not found'
    });
  }
  
  // Check ownership
  if (designSystem.userId.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to access this design system'
    });
  }
  
  res.status(200).json({
    success: true,
    designSystem
  });
});

/**
 * @desc    Get all design systems for a user
 * @route   GET /api/figma/design-systems
 * @access  Private
 */
const getDesignSystemsByUser = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  const designSystems = await designSystemStore.getDesignSystemsByUser(userId);
  
  res.status(200).json({
    success: true,
    count: designSystems.length,
    designSystems
  });
});

/**
 * @desc    Delete a design system
 * @route   DELETE /api/figma/design-systems/:id
 * @access  Private
 */
const deleteDesignSystem = asyncHandler(async (req, res) => {
  const designSystem = await designSystemStore.getDesignSystemById(req.params.id);
  
  if (!designSystem) {
    return res.status(404).json({
      success: false,
      error: 'Design system not found'
    });
  }
  
  // Check ownership
  if (designSystem.userId.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to delete this design system'
    });
  }
  
  await designSystemStore.deleteDesignSystem(req.params.id);
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

/**
 * @desc    Export a design system as JSON
 * @route   GET /api/figma/export/:id
 * @access  Private
 */
const exportDesignSystem = asyncHandler(async (req, res) => {
  const designSystem = await designSystemStore.getDesignSystemById(req.params.id);
  
  if (!designSystem) {
    return res.status(404).json({
      success: false,
      error: 'Design system not found'
    });
  }
  
  // Check ownership
  if (designSystem.userId.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to export this design system'
    });
  }
  
  const exportData = await designSystemStore.exportDesignSystem(req.params.id);
  
  res.status(200).json({
    success: true,
    designSystem: exportData
  });
});

/**
 * @desc    Import a design system from JSON
 * @route   POST /api/figma/import
 * @access  Private
 */
const importDesignSystem = asyncHandler(async (req, res) => {
  const { designSystem } = req.body;
  const userId = req.user.id;
  const organizationId = req.user.organizationId || null;
  
  if (!designSystem) {
    return res.status(400).json({
      success: false,
      error: 'Design system data is required'
    });
  }
  
  const importedDesignSystem = await designSystemStore.importDesignSystem(
    designSystem,
    userId,
    organizationId
  );
  
  res.status(200).json({
    success: true,
    designSystem: importedDesignSystem
  });
});

/**
 * @desc    Authorize with Figma
 * @route   POST /api/figma/auth
 * @access  Private
 */
const authorizeFigma = asyncHandler(async (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({
      success: false,
      error: 'Figma token is required'
    });
  }
  
  // Initialize the Figma API with the token
  initializeFigmaApi(token);
  
  // Verify the token works by making a test request
  try {
    const user = await figmaApiService.getUser();
    
    // Update user with new token
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { 'figmaTokens.personalAccessToken': token },
      { new: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Figma authentication successful',
      user: {
        name: user.name,
        email: user.email,
        id: user.id
      }
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid Figma token'
    });
  }
});

module.exports = {
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
};