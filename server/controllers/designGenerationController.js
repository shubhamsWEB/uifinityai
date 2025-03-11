// server/controllers/designGenerationController.js
const asyncHandler = require('../utils/asyncHandler');
const GeneratedDesign = require('../models/GeneratedDesign');
const designGenerationService = require('../services/ai/designGenerationService');

/**
 * @desc    Generate design from natural language prompt
 * @route   POST /api/designs/generate
 * @access  Private
 */
const generateDesign = asyncHandler(async (req, res) => {
  const { prompt, designSystemId } = req.body;
  
  if (!prompt || !designSystemId) {
    return res.status(400).json({
      success: false,
      error: 'Prompt and design system ID are required'
    });
  }
  
  try {
    // Generate the design preview
    const designData = await designGenerationService.generateDesignPreview(prompt, designSystemId);
    
    // Save the generated design to the database
    const generatedDesign = await GeneratedDesign.create({
      prompt,
      designSystemId,
      userId: req.user.id,
      requirements: designData.requirements,
      design: designData.design,
      createdAt: new Date()
    });
    
    res.status(200).json({
      success: true,
      data: {
        generatedDesign: {
          id: generatedDesign._id,
          prompt,
          designSystemId,
          design: generatedDesign.design,
          requirements: generatedDesign.requirements
        }
      }
    });
  } catch (error) {
    console.error('Error generating design:', error);
    res.status(500).json({
      success: false,
      error: `Failed to generate design: ${error.message}`
    });
  }
});

/**
 * @desc    Get a generated design by ID
 * @route   GET /api/designs/:id
 * @access  Private
 */
const getGeneratedDesign = asyncHandler(async (req, res) => {
  const generatedDesign = await GeneratedDesign.findById(req.params.id);
  
  if (!generatedDesign) {
    return res.status(404).json({
      success: false,
      error: 'Generated design not found'
    });
  }
  
  // Check ownership
  if (generatedDesign.userId.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to access this resource'
    });
  }
  
  res.status(200).json({
    success: true,
    data: {
      generatedDesign: {
        id: generatedDesign._id,
        prompt: generatedDesign.prompt,
        designSystemId: generatedDesign.designSystemId,
        design: generatedDesign.design,
        requirements: generatedDesign.requirements,
        createdAt: generatedDesign.createdAt
      }
    }
  });
});

/**
 * @desc    Get all generated designs for a user
 * @route   GET /api/designs
 * @access  Private
 */
const getAllGeneratedDesigns = asyncHandler(async (req, res) => {
  const generatedDesigns = await GeneratedDesign.find({ userId: req.user.id });
  
  res.status(200).json({
    success: true,
    count: generatedDesigns.length,
    data: {
      generatedDesigns: generatedDesigns.map(design => ({
        id: design._id,
        prompt: design.prompt,
        designSystemId: design.designSystemId,
        createdAt: design.createdAt,
        previewUrl: design.design.svg ? '/api/designs/preview/' + design._id : null
      }))
    }
  });
});

/**
 * @desc    Update generated design feedback
 * @route   PUT /api/designs/:id/feedback
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
  
  const generatedDesign = await GeneratedDesign.findById(req.params.id);
  
  if (!generatedDesign) {
    return res.status(404).json({
      success: false,
      error: 'Generated design not found'
    });
  }
  
  // Check ownership
  if (generatedDesign.userId.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to update this resource'
    });
  }
  
  generatedDesign.feedback = feedback;
  generatedDesign.rating = rating;
  await generatedDesign.save();
  
  res.status(200).json({
    success: true,
    data: {
      message: 'Feedback updated successfully'
    }
  });
});

/**
 * @desc    Delete generated design
 * @route   DELETE /api/designs/:id
 * @access  Private
 */
const deleteGeneratedDesign = asyncHandler(async (req, res) => {
  const generatedDesign = await GeneratedDesign.findById(req.params.id);
  
  if (!generatedDesign) {
    return res.status(404).json({
      success: false,
      error: 'Generated design not found'
    });
  }
  
  // Check ownership
  if (generatedDesign.userId.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to delete this resource'
    });
  }
  
  await generatedDesign.remove();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

/**
 * @desc    Regenerate design
 * @route   POST /api/designs/:id/regenerate
 * @access  Private
 */
const regenerateDesign = asyncHandler(async (req, res) => {
  const { prompt } = req.body;
  
  const generatedDesign = await GeneratedDesign.findById(req.params.id);
  
  if (!generatedDesign) {
    return res.status(404).json({
      success: false,
      error: 'Generated design not found'
    });
  }
  
  // Check ownership
  if (generatedDesign.userId.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to regenerate this resource'
    });
  }
  
  try {
    // Save current design to history
    if (!generatedDesign.regenerationHistory) {
      generatedDesign.regenerationHistory = [];
    }
    
    generatedDesign.regenerationHistory.push({
      design: generatedDesign.design,
      prompt: generatedDesign.prompt,
      timestamp: new Date()
    });
    
    // Generate new design using the new prompt or the original one
    const newPrompt = prompt || generatedDesign.prompt;
    const designData = await designGenerationService.generateDesignPreview(
      newPrompt,
      generatedDesign.designSystemId
    );
    
    // Update the design
    generatedDesign.design = designData.design;
    generatedDesign.requirements = designData.requirements;
    if (prompt) {
      generatedDesign.prompt = prompt;
    }
    generatedDesign.updatedAt = new Date();
    
    await generatedDesign.save();
    
    res.status(200).json({
      success: true,
      data: {
        generatedDesign: {
          id: generatedDesign._id,
          prompt: generatedDesign.prompt,
          designSystemId: generatedDesign.designSystemId,
          design: generatedDesign.design,
          requirements: generatedDesign.requirements
        }
      }
    });
  } catch (error) {
    console.error('Error regenerating design:', error);
    res.status(500).json({
      success: false,
      error: `Failed to regenerate design: ${error.message}`
    });
  }
});

/**
 * @desc    Get SVG preview of a design
 * @route   GET /api/designs/preview/:id
 * @access  Private
 */
const getDesignPreview = asyncHandler(async (req, res) => {
  const generatedDesign = await GeneratedDesign.findById(req.params.id);
  
  if (!generatedDesign) {
    return res.status(404).json({
      success: false,
      error: 'Generated design not found'
    });
  }
  
  // Check ownership
  if (generatedDesign.userId.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to access this resource'
    });
  }
  
  if (!generatedDesign.design || !generatedDesign.design.svg) {
    return res.status(404).json({
      success: false,
      error: 'Design preview not available'
    });
  }
  
  // Set the appropriate content type
  res.setHeader('Content-Type', 'image/svg+xml');
  
  // Send the SVG content
  res.send(generatedDesign.design.svg);
});

module.exports = {
  generateDesign,
  getGeneratedDesign,
  getAllGeneratedDesigns,
  updateFeedback,
  deleteGeneratedDesign,
  regenerateDesign,
  getDesignPreview
};