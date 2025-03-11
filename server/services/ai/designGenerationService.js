// server/services/ai/designGenerationService.js
const { OpenAI } = require('openai');
const { Anthropic } = require('@anthropic-ai/sdk');
const DesignSystem = require('../../models/DesignSystem');
const promptService = require('./designPromptService');

class DesignGenerationService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Generate a design preview based on user prompt and design system
   * @param {string} prompt - User's prompt for what they want to design
   * @param {string} designSystemId - ID of the design system to use
   * @returns {Promise<Object>} Generated design preview
   */
  async generateDesignPreview(prompt, designSystemId) {
    try {
      // 1. Retrieve the design system
      const designSystem = await DesignSystem.findById(designSystemId).populate('components');
      
      if (!designSystem) {
        throw new Error('Design system not found');
      }
      
      // 2. Process the prompt using GPT-4 to extract structured requirements
      const requirements = await this.processPromptWithGPT(prompt, designSystem);
      
      // 3. Generate design using Claude 3.7 Sonnet
      const designPreview = await this.generateWithClaude(requirements, designSystem);
      
      // 4. Parse the generated design into a usable format
      return {
        prompt,
        designSystemId,
        requirements,
        design: designPreview,
        createdAt: new Date()
      };
    } catch (error) {
      console.error('Error generating design preview:', error);
      throw error;
    }
  }
  
  /**
   * Process prompt with GPT-4 to extract structured design requirements
   * @param {string} prompt - User's design prompt
   * @param {Object} designSystem - The design system 
   * @returns {Promise<Object>} Structured design requirements
   */
  async processPromptWithGPT(prompt, designSystem) {
    // Create a context with the design system information
    const designSystemContext = this.prepareDesignSystemContext(designSystem);
    
    // Create a system prompt that instructs GPT-4 on how to process the user's request
    const systemPrompt = `You are an expert UI designer familiar with design systems. 
Your task is to analyze a user's request for generating a UI design and extract structured requirements.
You will be provided with a design system containing colors, typography, spacing, and components.

Design System Context:
${JSON.stringify(designSystemContext, null, 2)}

Based on the user's prompt, provide a detailed specification for the UI that includes:
1. Layout structure and hierarchy
2. Which components from the design system to use
3. Color scheme from the design system's palette
4. Typography choices from the design system
5. Spacing and alignment guidelines
6. Content structure and hierarchy

Output a JSON object with the following structure:
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
}`;

    try {
      // Call GPT-4 to process the prompt
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.7,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });
      
      // Parse the response into a structured format
      const requirements = JSON.parse(response.choices[0].message.content);
      
      return requirements;
    } catch (error) {
      console.error('Error processing prompt with GPT-4:', error);
      throw new Error(`Failed to process design requirements: ${error.message}`);
    }
  }
  
  /**
   * Generate design with Claude 3.7 Sonnet
   * @param {Object} requirements - Structured design requirements
   * @param {Object} designSystem - The design system
   * @returns {Promise<Object>} Generated design
   */
  async generateWithClaude(requirements, designSystem) {
    // Prepare context for Claude with design system and requirements
    const designSystemContext = this.prepareDesignSystemContext(designSystem);
    
    // Create a system prompt for Claude that instructs it to generate an SVG preview
    const claudePrompt = `You are an expert UI designer who creates high-quality UI designs based on design systems.
    
Design System Context:
${JSON.stringify(designSystemContext, null, 2)}

Design Requirements:
${JSON.stringify(requirements, null, 2)}

Your task is to create an SVG representation of a UI design based on these requirements and design system.
The SVG should be a visual representation of how the UI would look, using the exact colors, typography, and component styles from the design system.

Please create the SVG with the following specifications:
1. Size: 800x600 pixels
2. Use the exact color values from the design system tokens
3. Implement the layout structure specified in the requirements
4. Include all the components mentioned in the requirements
5. Apply the typography and spacing according to the design system
6. Make it visually appealing and professional
7. Add placeholder text/content that makes sense for the purpose

Return ONLY the SVG code for the UI design, starting with <svg> and ending with </svg>.
The SVG should be complete and ready to render without any additional processing.`;

    try {
      // Call Claude 3.7 Sonnet to generate the design
      const response = await this.anthropic.messages.create({
        model: "claude-3-sonnet-20240229",
        max_tokens: 4000,
        temperature: 0.7,
        system: claudePrompt,
        messages: [
          { role: "user", content: "Generate the UI design SVG based on the requirements." }
        ]
      });
      
      // Extract the SVG from the response
      const svgMatch = response.content[0].text.match(/<svg[\s\S]*<\/svg>/);
      
      if (!svgMatch) {
        throw new Error('No SVG found in the response');
      }
      
      const svgContent = svgMatch[0];
      
      // Return the SVG along with the original requirements
      return {
        svg: svgContent,
        width: 800,
        height: 600,
        format: 'svg'
      };
    } catch (error) {
      console.error('Error generating design with Claude:', error);
      throw new Error(`Failed to generate design preview: ${error.message}`);
    }
  }
  
  /**
   * Prepare design system context for AI models
   * @param {Object} designSystem - The design system
   * @returns {Object} Simplified design system context
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
      components,
      componentSets
    };
  }
}

module.exports = new DesignGenerationService();