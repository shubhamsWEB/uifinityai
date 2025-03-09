// server/services/ai/layoutGeneratorService.js
const { OpenAI } = require('openai');
const DesignSystem = require('../../models/DesignSystem');

class LayoutGeneratorService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * Generate a layout from UI requirements and matched components
   * @param {Object} matchedRequirements - Requirements with matched components
   * @param {string} designSystemId - ID of the design system to use
   * @returns {Promise<Object>} Layout structure
   */
  async generateLayout(matchedRequirements, designSystemId) {
    try {
      // Retrieve design system for tokens
      const designSystem = await DesignSystem.findById(designSystemId);
      
      if (!designSystem) {
        throw new Error('Design system not found');
      }
      
      // Extract relevant design system tokens
      const spacingTokens = {};
      designSystem.tokens.spacing.forEach((value, key) => {
        spacingTokens[key] = value;
      });
      
      // Call the OpenAI API for layout generation
      const response = await this.openai.chat.completions.create({
        model: "gpt-4-turbo",
        temperature: 0.5,
        messages: [
          { 
            role: "system", 
            content: this.buildLayoutSystemPrompt(spacingTokens)
          },
          { 
            role: "user", 
            content: `Generate a layout structure for these UI requirements and matched components: ${JSON.stringify(matchedRequirements, null, 2)}`
          }
        ],
        response_format: { type: "json_object" }
      });
      
      // Parse the response
      const layoutStructure = JSON.parse(response.choices[0].message.content);
      
      return this.applyComponentPlacement({
        ...matchedRequirements,
        layout: layoutStructure.layout,
        structure: layoutStructure.structure
      });
    } catch (error) {
      console.error('Error generating layout:', error);
      throw error;
    }
  }
  
  /**
   * Apply component placement based on layout structure
   * @param {Object} layoutRequirements - Layout requirements and structure
   * @returns {Object} Layout with placed components
   */
  applyComponentPlacement(layoutRequirements) {
    // Convert the flat element structure to nested structure based on layout
    const structuredElements = this.buildNestedElements(
      layoutRequirements.elements,
      layoutRequirements.structure
    );
    
    return {
      ...layoutRequirements,
      structuredElements
    };
  }
  
  /**
   * Build nested elements structure from flat elements and layout structure
   * @param {Array} elements - Flat list of elements with matched components
   * @param {Object} structure - Nested structure definition
   * @returns {Array} Nested elements
   */
  buildNestedElements(elements, structure) {
    const result = [];
    
    for (const item of structure) {
      if (item.elementIndex !== undefined) {
        // This is a reference to an element in the flat list
        const element = elements[item.elementIndex];
        result.push({
          ...element,
          layout: item.layout
        });
      } else if (item.container) {
        // This is a container with children
        const children = this.buildNestedElements(elements, item.children || []);
        result.push({
          type: item.container.type,
          layout: item.container.layout,
          children
        });
      }
    }
    
    return result;
  }
  
  /**
   * Build system prompt for layout generation
   * @param {Object} spacingTokens - Spacing tokens from design system
   * @returns {string} System prompt
   */
  buildLayoutSystemPrompt(spacingTokens) {
    return `You are an expert UI layout designer who understands responsive design patterns and best practices.
Your task is to analyze UI requirements and matched components to generate an optimal layout structure.

Available Spacing Tokens:
${JSON.stringify(spacingTokens, null, 2)}

When designing layouts, follow these principles:
1. Use appropriate container elements (section, card, grid, etc.) to group related elements
2. Apply proper alignment and distribution of elements
3. Respect the flow direction specified in requirements (vertical vs horizontal)
4. Use design system spacing tokens for gaps and padding
5. Consider responsive behavior (desktop vs mobile)
6. Ensure proper nesting of components

Output a JSON object with the following structure:
{
  "layout": {
    // Global layout properties
    "containerType": "string", // The main container type (div, section, main, etc.)
    "maxWidth": "string", // Maximum width of the container
    "padding": "string", // Padding token or value
    "gap": "string", // Gap between elements using a token or value
    "responsive": {
      "desktop": { /* Desktop-specific overrides */ },
      "tablet": { /* Tablet-specific overrides */ },
      "mobile": { /* Mobile-specific overrides */ }
    }
  },
  "structure": [
    // Either a direct reference to an element
    { 
      "elementIndex": 0, // Index in the original elements array
      "layout": {
        "width": "string", // Width of this element
        "height": "string", // Height of this element
        "margin": "string", // Margin around this element
        "alignment": "string" // Alignment of this element
      }
    },
    // Or a container with children
    {
      "container": {
        "type": "string", // Container type (div, section, card, etc.)
        "layout": {
          "direction": "string", // flex-row or flex-col
          "gap": "string", // Gap between children
          "padding": "string", // Padding inside container
          "alignment": "string" // Alignment of children
        }
      },
      "children": [
        // Recursively defined structure
        { "elementIndex": 1 },
        { "elementIndex": 2 }
        // ...or nested containers
      ]
    }
  ]
}

Use proper CSS values or token references for all dimensions and spacing.
Ensure the layout is accessible and follows best practices for responsive design.`;
  }
}

module.exports = new LayoutGeneratorService();