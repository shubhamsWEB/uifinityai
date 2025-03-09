// server/controllers/figmaController.js
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
  try {
    console.log('Initializing Figma API with token');
    figmaApiService.initializeWithPersonalToken(token);
    console.log('Figma API initialized successfully');
  } catch (error) {
    console.error('Error initializing Figma API:', error);
    throw new Error(`Failed to initialize Figma API: ${error.message}`);
  }
};

/**
 * Validate and ensure the Figma API is initialized
 * @param {string} userId - The user ID
 * @returns {Promise<boolean>} Success status
 */
const ensureFigmaApiInitialized = async (userId) => {
  // Check if API is already initialized
  let isInitialized = false;
  
  try {
    // Simple test to check if apiClient exists and is valid
    if (figmaApiService.apiClient) {
      // Try a simple request to verify token is working
      await figmaApiService.getUser();
      isInitialized = true;
      console.log('Figma API is already initialized and token is valid');
    }
  } catch (error) {
    console.log('Figma API not initialized or token is invalid, will try to initialize');
    isInitialized = false;
  }
  
  if (!isInitialized) {
    try {
      // Get the user's token from the database
      const user = await User.findById(userId).select('+figmaTokens.personalAccessToken');
      
      if (!user || !user.figmaTokens || !user.figmaTokens.personalAccessToken) {
        console.error('No Figma token found for user');
        return false;
      }
      
      // Initialize the API with the user's token
      initializeFigmaApi(user.figmaTokens.personalAccessToken);
      console.log('Successfully initialized Figma API with stored token');
      return true;
    } catch (error) {
      console.error('Error initializing Figma API with stored token:', error);
      return false;
    }
  }
  
  return isInitialized;
};

/**
 * @desc    Extract a complete design system from Figma
 * @route   POST /api/figma/extract
 * @access  Private
 */
const extractDesignSystem = asyncHandler(async (req, res) => {
  const { fileKey } = req.body;
  
  if (!fileKey) {
    return res.status(400).json({
      success: false,
      error: 'File key is required'
    });
  }
  
  // Ensure API is initialized
  const apiInitialized = await ensureFigmaApiInitialized(req.user.id);
  
  if (!apiInitialized) {
    return res.status(400).json({
      success: false,
      error: 'Figma API not initialized. Please provide your Figma token first.'
    });
  }
  
  try {
    // Get file information
    console.log(`Getting file information for: ${fileKey}`);
    const fileInfo = await figmaApiService.getFile(fileKey);
    const designSystemName = fileInfo.name || 'Design System';
    
    console.log(`Extracting design system from "${designSystemName}" (${fileKey})...`);
    
    // Extract design tokens
    console.log('Extracting design tokens...');
    const designTokens = await tokenExtractor.extractDesignTokens(fileKey);
    
    // Extract components with improved error handling
    console.log('Extracting components...');
    const componentData = await componentExtractor.extractComponents(fileKey);
    
    // Combine all data into a design system object
    const designSystem = {
      name: designSystemName,
      description: fileInfo.description || '',
      figmaFileKey: fileKey,
      tokens: designTokens,
      components: componentData.components || {},
      componentSets: componentData.componentSets || {},
      componentPreviews: componentData.componentPreviews || {},
    };
    
    console.log('Design system extraction complete!');
    console.log(`- ${Object.keys(designTokens.colors || {}).length} color tokens`);
    console.log(`- ${Object.keys(designTokens.typography || {}).length} typography tokens`);
    console.log(`- ${Object.keys(designTokens.spacing || {}).length} spacing tokens`);
    console.log(`- ${Object.keys(designSystem.components || {}).length} components`);
    console.log(`- ${Object.keys(designSystem.componentSets || {}).length} component sets`);
    
    res.status(200).json({
      success: true,
      designSystem
    });
  } catch (error) {
    console.error('Error extracting design system:', error);
    res.status(500).json({
      success: false,
      error: `Failed to extract design system: ${error.message}`
    });
  }
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
  
  try {
    const savedDesignSystem = await designSystemStore.saveDesignSystem(
      designSystem,
      userId,
      organizationId
    );
    
    res.status(200).json({
      success: true,
      designSystem: savedDesignSystem
    });
  } catch (error) {
    console.error('Error saving design system:', error);
    res.status(500).json({
      success: false,
      error: `Failed to save design system: ${error.message}`
    });
  }
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
  
  if (!fileKey) {
    return res.status(400).json({
      success: false,
      error: 'File key is required'
    });
  }
  
  // Ensure API is initialized
  const apiInitialized = await ensureFigmaApiInitialized(req.user.id);
  
  if (!apiInitialized) {
    return res.status(400).json({
      success: false,
      error: 'Figma API not initialized. Please provide your Figma token first.'
    });
  }
  
  try {
    // Get file information
    console.log(`Getting file information for: ${fileKey}`);
    const fileInfo = await figmaApiService.getFile(fileKey);
    const designSystemName = fileInfo.name || 'Design System';
    
    console.log(`Extracting design system from "${designSystemName}" (${fileKey})...`);
    
    // Extract design tokens with robust error handling
    console.log('Extracting design tokens...');
    let designTokens = { colors: {}, typography: {}, spacing: {}, shadows: {}, borders: {} };
    try {
      designTokens = await tokenExtractor.extractDesignTokens(fileKey);
    } catch (tokenError) {
      console.error('Error extracting design tokens:', tokenError);
      // Continue with empty tokens instead of failing the whole process
    }
    
    // Extract components with robust error handling
    console.log('Extracting components...');
    let componentData = { components: {}, componentSets: {}, componentPreviews: {} };
    try {
      componentData = await componentExtractor.extractComponents(fileKey);
    } catch (componentError) {
      console.error('Error extracting components:', componentError);
      // Continue with empty components instead of failing the whole process
    }
    
    // Combine all data into a design system object
    const designSystem = {
      name: designSystemName,
      description: fileInfo.description || '',
      figmaFileKey: fileKey,
      tokens: designTokens,
      components: componentData.components || {},
      componentSets: componentData.componentSets || {},
      componentPreviews: componentData.componentPreviews || {},
    };
    
    console.log('Design system extraction complete!');
    console.log(`- ${Object.keys(designTokens.colors || {}).length} color tokens`);
    console.log(`- ${Object.keys(designTokens.typography || {}).length} typography tokens`);
    console.log(`- ${Object.keys(designTokens.spacing || {}).length} spacing tokens`);
    console.log(`- ${Object.keys(designSystem.components || {}).length} components`);
    console.log(`- ${Object.keys(designSystem.componentSets || {}).length} component sets`);
    
    // Save to database
    console.log('Saving design system to database...');
    const savedDesignSystem = await designSystemStore.saveDesignSystem(
      designSystem,
      userId,
      organizationId
    );
    
    res.status(200).json({
      success: true,
      designSystem: savedDesignSystem
    });
  } catch (error) {
    console.error('Error extracting and saving design system:', error);
    res.status(500).json({
      success: false,
      error: `Failed to extract and save design system: ${error.message}`
    });
  }
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
  try {
    initializeFigmaApi(token);
    
    // Verify the token works by making a test request
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
    console.error('Error authorizing with Figma:', error);
    return res.status(401).json({
      success: false,
      error: `Invalid Figma token: ${error.message}`
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