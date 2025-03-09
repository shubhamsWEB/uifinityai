// server/controllers/aiGenerationController.js
const asyncHandler = require('../utils/asyncHandler');
const promptService = require('../services/ai/promptService');
const componentMatcherService = require('../services/ai/componentMatcherService');
const layoutGeneratorService = require('../services/ai/layoutGeneratorService');
const styleApplicationService = require('../services/ai/styleApplicationService');
const codeGeneratorService = require('../services/ai/codeGeneratorService');
const GeneratedUI = require('../models/GeneratedUI');

/**
 * @desc    Generate UI from natural language prompt
 * @route   POST /api/ai/generate
 * @access  Private
 */
const generateUI = asyncHandler(async (req, res) => {
  const { prompt, designSystemId, framework, styleLibrary } = req.body;
  
  if (!prompt || !designSystemId) {
    return res.status(400).json({
      success: false,
      error: 'Prompt and design system ID are required'
    });
  }
  
  try {
    // Step 1: Process the prompt
    console.log('Processing prompt...');
    const structuredRequirements = await promptService.processPrompt(prompt, designSystemId);
    console.log("🚀 ~ generateUI ~ structuredRequirements:", structuredRequirements);
    
    // Step 2: Match components from the design system
    console.log('Matching components...');
    const matchedComponents = await componentMatcherService.findMatchingComponents(
      structuredRequirements,
      designSystemId
    );
    
    // Step 3: Generate layout
    console.log('Generating layout...');
    const layoutData = await layoutGeneratorService.generateLayout(
      matchedComponents,
      designSystemId
    );
    
    // Step 4: Apply styles
    console.log('Applying styles...');
    try {
      const styledLayout = await styleApplicationService.applyStyles(
        layoutData,
        designSystemId
      );
      console.log('Styles applied successfully');
      
      // Step 5: Generate code
      console.log('Generating code...');
      try {
        const generatedCode = await codeGeneratorService.generateCode(
          styledLayout,
          designSystemId,
          framework || 'react',
          styleLibrary || 'tailwind'
        );
        console.log('Code generated successfully');
        
        // Save the generated UI to the database
        const generatedUI = await GeneratedUI.create({
          prompt,
          designSystemId,
          userId: req.user.id,
          structuredRequirements,
          matchedComponents,
          layoutData,
          styledLayout,
          generatedCode: {
            mainComponent: generatedCode.mainComponent,
            subComponents: generatedCode.subComponents,
            utilityFiles: generatedCode.utilityFiles,
            styleDefinitions: generatedCode.styleDefinitions
          },
          framework: framework || 'react',
          styleLibrary: styleLibrary || 'tailwind',
          createdAt: new Date()
        });
        
        res.status(200).json({
          success: true,
          data: {
            generatedUI: {
              id: generatedUI._id,
              prompt,
              designSystemId,
              framework: framework || 'react',
              styleLibrary: styleLibrary || 'tailwind',
              code: generatedCode
            }
          }
        });
      } catch (codeError) {
        console.error('Error generating code:', codeError);
        throw new Error(`Failed to generate code: ${codeError.message}`);
      }
    } catch (styleError) {
      console.error('Error applying styles:', styleError);
      throw new Error(`Failed to apply styles: ${styleError.message}`);
    }
  } catch (error) {
    console.error('Error generating UI:', error);
    res.status(500).json({
      success: false,
      error: `Failed to generate UI: ${error.message}`
    });
  }
});

/**
 * @desc    Get a generated UI by ID
 * @route   GET /api/ai/generate/:id
 * @access  Private
 */
const getGeneratedUI = asyncHandler(async (req, res) => {
  const generatedUI = await GeneratedUI.findById(req.params.id);
  
  if (!generatedUI) {
    return res.status(404).json({
      success: false,
      error: 'Generated UI not found'
    });
  }
  
  // Check ownership
  if (generatedUI.userId.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to access this resource'
    });
  }
  
  res.status(200).json({
    success: true,
    data: {
      generatedUI: {
        id: generatedUI._id,
        prompt: generatedUI.prompt,
        designSystemId: generatedUI.designSystemId,
        framework: generatedUI.framework,
        styleLibrary: generatedUI.styleLibrary,
        code: generatedUI.generatedCode,
        createdAt: generatedUI.createdAt
      }
    }
  });
});

/**
 * @desc    Get all generated UIs for a user
 * @route   GET /api/ai/generate
 * @access  Private
 */
const getAllGeneratedUIs = asyncHandler(async (req, res) => {
  const generatedUIs = await GeneratedUI.find({ userId: req.user.id });
  
  res.status(200).json({
    success: true,
    count: generatedUIs.length,
    data: {
      generatedUIs: generatedUIs.map(ui => ({
        id: ui._id,
        prompt: ui.prompt,
        designSystemId: ui.designSystemId,
        framework: ui.framework,
        styleLibrary: ui.styleLibrary,
        createdAt: ui.createdAt
      }))
    }
  });
});

/**
 * @desc    Update generated UI feedback
 * @route   PUT /api/ai/generate/:id/feedback
 * @access  Private
 */
const updateFeedback = asyncHandler(async (req, res) => {
  const { feedback, rating } = req.body;
  
  if (!feedback || !rating) {
    return res.status(400).json({
      success: false,
      error: 'Feedback and rating are required'
    });
  }
  
  const generatedUI = await GeneratedUI.findById(req.params.id);
  
  if (!generatedUI) {
    return res.status(404).json({
      success: false,
      error: 'Generated UI not found'
    });
  }
  
  // Check ownership
  if (generatedUI.userId.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to update this resource'
    });
  }
  
  generatedUI.feedback = feedback;
  generatedUI.rating = rating;
  await generatedUI.save();
  
  res.status(200).json({
    success: true,
    data: {
      message: 'Feedback updated successfully'
    }
  });
});

/**
 * @desc    Delete generated UI
 * @route   DELETE /api/ai/generate/:id
 * @access  Private
 */
const deleteGeneratedUI = asyncHandler(async (req, res) => {
  const generatedUI = await GeneratedUI.findById(req.params.id);
  
  if (!generatedUI) {
    return res.status(404).json({
      success: false,
      error: 'Generated UI not found'
    });
  }
  
  // Check ownership
  if (generatedUI.userId.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to delete this resource'
    });
  }
  
  await generatedUI.remove();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

/**
 * @desc    Regenerate UI code
 * @route   POST /api/ai/generate/:id/regenerate
 * @access  Private
 */
const regenerateUI = asyncHandler(async (req, res) => {
  const { framework, styleLibrary } = req.body;
  
  const generatedUI = await GeneratedUI.findById(req.params.id);
  
  if (!generatedUI) {
    return res.status(404).json({
      success: false,
      error: 'Generated UI not found'
    });
  }
  
  // Check ownership
  if (generatedUI.userId.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to regenerate this resource'
    });
  }
  
  try {
    // Regenerate code using the stored styledLayout
    const newGeneratedCode = await codeGeneratorService.generateCode(
      generatedUI.styledLayout,
      generatedUI.designSystemId,
      framework || generatedUI.framework,
      styleLibrary || generatedUI.styleLibrary
    );
    
    // Update the generated UI in the database
    generatedUI.generatedCode = {
      mainComponent: newGeneratedCode.mainComponent,
      subComponents: newGeneratedCode.subComponents,
      utilityFiles: newGeneratedCode.utilityFiles,
      styleDefinitions: newGeneratedCode.styleDefinitions
    };
    
    if (framework) generatedUI.framework = framework;
    if (styleLibrary) generatedUI.styleLibrary = styleLibrary;
    
    await generatedUI.save();
    
    res.status(200).json({
      success: true,
      data: {
        generatedUI: {
          id: generatedUI._id,
          prompt: generatedUI.prompt,
          designSystemId: generatedUI.designSystemId,
          framework: generatedUI.framework,
          styleLibrary: generatedUI.styleLibrary,
          code: generatedUI.generatedCode
        }
      }
    });
  } catch (error) {
    console.error('Error regenerating UI:', error);
    res.status(500).json({
      success: false,
      error: `Failed to regenerate UI: ${error.message}`
    });
  }
});

/**
 * @desc    Refine UI with feedback
 * @route   POST /api/ai/generate/:id/refine
 * @access  Private
 */
const refineUI = asyncHandler(async (req, res) => {
  const { feedback } = req.body;
  
  if (!feedback) {
    return res.status(400).json({
      success: false,
      error: 'Feedback is required for refinement'
    });
  }
  
  const generatedUI = await GeneratedUI.findById(req.params.id);
  
  if (!generatedUI) {
    return res.status(404).json({
      success: false,
      error: 'Generated UI not found'
    });
  }
  
  // Check ownership
  if (generatedUI.userId.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to refine this resource'
    });
  }
  
  try {
    // Use OpenAI to refine the code based on feedback
    const refinedCode = await codeGeneratorService.refineCode(
      generatedUI.generatedCode,
      feedback,
      generatedUI.framework,
      generatedUI.styleLibrary
    );
    
    // Update the generated UI in the database
    generatedUI.generatedCode = refinedCode;
    generatedUI.refinementHistory = generatedUI.refinementHistory || [];
    generatedUI.refinementHistory.push({
      feedback,
      timestamp: new Date()
    });
    
    await generatedUI.save();
    
    res.status(200).json({
      success: true,
      data: {
        generatedUI: {
          id: generatedUI._id,
          prompt: generatedUI.prompt,
          designSystemId: generatedUI.designSystemId,
          framework: generatedUI.framework,
          styleLibrary: generatedUI.styleLibrary,
          code: generatedUI.generatedCode
        }
      }
    });
  } catch (error) {
    console.error('Error refining UI:', error);
    res.status(500).json({
      success: false,
      error: `Failed to refine UI: ${error.message}`
    });
  }
});

module.exports = {
  generateUI,
  getGeneratedUI,
  getAllGeneratedUIs,
  updateFeedback,
  deleteGeneratedUI,
  regenerateUI,
  refineUI
};