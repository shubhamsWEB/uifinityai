// server/services/ai/designPromptService.js
const { OpenAI } = require('openai');
const DesignSystem = require('../../models/DesignSystem');

class DesignPromptService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * Process a natural language prompt into structured design requirements
   * @param {string} prompt - User's prompt for design
   * @param {string} designSystemId - ID of the design system to use
   * @returns {Promise<Object>} Structured design requirements
   */
  async processDesignPrompt(prompt, designSystemId) {
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
      console.log("🚀 ~ DesignPromptService ~ processDesignPrompt ~ systemPrompt:", systemPrompt);
      
      // Call the OpenAI API
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
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
      console.error('Error processing design prompt:', error);
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
    
    // Extract spacing tokens
    const spacingTokens = {};
    designSystem.tokens.spacing.forEach((value, key) => {
      spacingTokens[key] = value;
    });
    
    // Extract shadow tokens
    const shadowTokens = {};
    designSystem.tokens.shadows.forEach((value, key) => {
      shadowTokens[key] = value;
    });
    
    // Extract component information
    const components = designSystem.components.map(comp => ({
      id: comp._id.toString(),
      name: comp.name,
      type: comp.type,
      variantProperties: comp.variantProperties || {}
    }));
    
    // Extract component set information
    const componentSets = {};
    for (const [key, value] of Object.entries(designSystem.componentSets || {})) {
      componentSets[key] = {
        name: value.name,
        type: value.type,
        variantProperties: value.variantProperties || {}
      };
    }
    
    return {
      name: designSystem.name,
      colorTokens,
      typographyTokens,
      spacingTokens,
      shadowTokens,
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
    return `You are an expert UI designer who understands design systems and UI requirements.
Your task is to analyze a natural language prompt for UI design generation and convert it into structured design requirements.
You will extract key information: layout structure, color scheme, typography choices, component usage, and content structure.

Use the following design system context to inform your analysis:
Design System: ${designSystemContext.name}

Available Colors:
${JSON.stringify(designSystemContext.colorTokens, null, 2)}

Available Typography:
${JSON.stringify(designSystemContext.typographyTokens, null, 2)}

Available Spacing:
${JSON.stringify(designSystemContext.spacingTokens, null, 2)}

Available Components:
${JSON.stringify(designSystemContext.components, null, 2)}

Component Sets (with variants):
${JSON.stringify(designSystemContext.componentSets, null, 2)}

Analyze the user's prompt and output a JSON object with the following structure:
{
  "layout": {
    "type": string, // e.g., "page", "card", "form", "dashboard"
    "structure": string, // description of the layout structure
    "width": string, // e.g., "full", "container", "narrow"
    "responsive": boolean // whether the design should be responsive
  },
  "components": [
    {
      "type": string, // component type from design system
      "purpose": string, // what this component is used for
      "content": string, // description of the content
      "styling": { // specific styling for this component
        "colors": [string], // color tokens from design system
        "typography": string, // typography token
        "spacing": [string] // spacing tokens
      },
      "children": [] // nested components if applicable
    }
  ],
  "colorScheme": [string], // list of color tokens to use
  "typography": {
    "headings": string, // typography token for headings
    "body": string, // typography token for body text
    "other": {} // any other typography specifications
  },
  "spacing": [string], // list of spacing tokens to use
  "contentRequirements": string // description of content needs
}

Use only component types and tokens that exist in the provided design system context.
Be specific and detailed in your analysis to ensure the generated design matches the user's intent.`;
  }
}

module.exports = new DesignPromptService();