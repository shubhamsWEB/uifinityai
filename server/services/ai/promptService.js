// server/services/ai/promptService.js
const { OpenAI } = require('openai');
const DesignSystem = require('../../models/DesignSystem');

class PromptService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * Process a natural language prompt into structured UI requirements
   * @param {string} prompt - User's natural language prompt
   * @param {string} designSystemId - ID of the design system to use
   * @returns {Promise<Object>} Structured UI requirements
   */
  async processPrompt(prompt, designSystemId) {
    try {
      // Retrieve design system for context
      const designSystem = await DesignSystem.findById(designSystemId).populate('components');
      
      if (!designSystem) {
        throw new Error('Design system not found');
      }
      
      // Extract relevant design system details for the prompt
      const designSystemContext = this.prepareDesignSystemContext(designSystem);
      
      // Construct the system prompt with design system context
      const systemPrompt = this.buildSystemPrompt(designSystemContext);
      
      // Call the OpenAI API
      const response = await this.openai.chat.completions.create({
        model: "gpt-4-turbo",
        temperature: 0.7,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });
      
      // Parse the response
      const parsedResponse = JSON.parse(response.choices[0].message.content);
      
      // Add design system reference
      parsedResponse.designSystemId = designSystemId;
      
      return parsedResponse;
    } catch (error) {
      console.error('Error processing prompt:', error);
      throw error;
    }
  }
  
  /**
   * Prepare design system context for the prompt
   * @param {Object} designSystem - The design system
   * @returns {Object} Relevant design system context
   */
  prepareDesignSystemContext(designSystem) {
    // Extract color tokens
    const colorTokens = {};
    designSystem.tokens.colors.forEach((value, key) => {
      colorTokens[key] = value;
    });
    
    // Extract typography tokens
    const typographyTokens = {};
    designSystem.tokens.typography.forEach((value, key) => {
      typographyTokens[key] = value;
    });
    
    // Extract component information
    const components = designSystem.components.map(comp => ({
      id: comp._id,
      name: comp.name,
      type: comp.type,
      variantProperties: comp.variantProperties
    }));
    
    // Extract component set information
    const componentSets = {};
    for (const [key, value] of Object.entries(designSystem.componentSets)) {
      componentSets[key] = {
        name: value.name,
        type: value.type,
        variantProperties: value.variantProperties
      };
    }
    
    return {
      name: designSystem.name,
      colorTokens,
      typographyTokens,
      components,
      componentSets
    };
  }
  
  /**
   * Build the system prompt with design system context
   * @param {Object} designSystemContext - Design system context
   * @returns {string} System prompt
   */
  buildSystemPrompt(designSystemContext) {
    return `You are an expert UI developer who understands design systems and UI requirements.
Your task is to analyze a natural language prompt for UI generation and convert it into structured requirements.
You will extract key information: UI elements, their properties, layout preferences, and key functionality needs.

Use the following design system context to inform your analysis:
Design System: ${designSystemContext.name}

Available Colors:
${JSON.stringify(designSystemContext.colorTokens, null, 2)}

Available Typography:
${JSON.stringify(designSystemContext.typographyTokens, null, 2)}

Available Components:
${JSON.stringify(designSystemContext.components, null, 2)}

Component Sets (with variants):
${JSON.stringify(designSystemContext.componentSets, null, 2)}

Analyze the user's prompt and output a JSON object with the following structure:
{
  "layout": {
    "type": "container type (card, page, section, etc.)",
    "width": "container width",
    "flow": "vertical or horizontal",
    "spacing": "spacing between elements",
    "alignment": "alignment of elements"
  },
  "elements": [
    {
      "type": "component type (button, input, card, etc.)",
      "content": "text content if applicable",
      "variant": "component variant if applicable",
      "style": {
        "color": "color token name",
        "typography": "typography token name",
        "size": "size description"
      },
      "properties": {
        // Additional properties specific to this component
      },
      "children": [
        // Nested elements if applicable
      ]
    }
  ],
  "functionality": [
    "description of functional requirements"
  ],
  "constraints": [
    "any design or functional constraints"
  ]
}

Use only component types and tokens that exist in the provided design system context.
Be specific and detailed in your analysis to ensure the generated UI matches the user's intent.`;
  }
}

module.exports = new PromptService();