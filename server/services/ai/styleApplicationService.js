const { OpenAI } = require('openai');
const DesignSystem = require('../../models/DesignSystem');

class StyleApplicationService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * Apply design system styles to components
   * @param {Object} layoutData - Layout data with components
   * @param {string} designSystemId - ID of the design system to use
   * @returns {Promise<Object>} Styled layout
   */
  async applyStyles(layoutData, designSystemId) {
    try {
      // Retrieve design system
      const designSystem = await DesignSystem.findById(designSystemId);
      
      if (!designSystem) {
        throw new Error('Design system not found');
      }
      
      // Extract and format tokens from design system
      const designTokens = this.extractDesignTokens(designSystem);
      
      // Generate a style map using AI
      const styleMap = await this.generateStyleMap(layoutData, designTokens);
      
      // Apply the style map to the layout
      return this.applyStyleMap(layoutData, styleMap);
    } catch (error) {
      console.error('Error applying styles:', error);
      throw error;
    }
  }
  
  /**
   * Extract and format design tokens
   * @param {Object} designSystem - The design system
   * @returns {Object} Formatted design tokens
   */
  extractDesignTokens(designSystem) {
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
    
    // Extract border tokens
    const borderTokens = {};
    designSystem.tokens.borders.forEach((value, key) => {
      borderTokens[key] = value;
    });
    
    return {
      colors: colorTokens,
      typography: typographyTokens,
      spacing: spacingTokens,
      shadows: shadowTokens,
      borders: borderTokens
    };
  }
  
  /**
   * Generate a style map for components using AI
   * @param {Object} layoutData - Layout data with components
   * @param {Object} designTokens - Design system tokens
   * @returns {Promise<Object>} Style map
   */
  async generateStyleMap(layoutData, designTokens) {
    try {
      // Generate a detailed prompt for the AI
      const prompt = this.buildStylePrompt(layoutData, designTokens);
      
      // Call the OpenAI API
      const response = await this.openai.chat.completions.create({
        model: "gpt-4-turbo",
        temperature: 0.3,
        messages: [
          { role: "system", content: prompt },
          { 
            role: "user", 
            content: "Generate appropriate styles for all components in this layout."
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 4000  // Add a higher token limit to ensure complete responses
      });
      
      // Parse the response with error handling
      const content = response.choices[0].message.content;
      
      if (!content || typeof content !== 'string') {
        throw new Error('Empty or invalid response from OpenAI API');
      }
      
      try {
        return JSON.parse(content);
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', content);
        throw new Error('Invalid JSON response from OpenAI API');
      }
    } catch (error) {
      console.error('Error generating style map:', error);
      throw error;
    }
  }
  
  /**
   * Apply the style map to the layout
   * @param {Object} layoutData - Layout data with components
   * @param {Object} styleMap - Generated style map
   * @returns {Object} Styled layout
   */
  applyStyleMap(layoutData, styleMap) {
    // Create a deep copy of the layout data
    const styledLayout = JSON.parse(JSON.stringify(layoutData));
    
    // Apply global styles
    if (styleMap.globalStyles) {
      styledLayout.globalStyles = styleMap.globalStyles;
    }
    
    // Apply component styles recursively
    this.applyStylesRecursively(styledLayout.structuredElements, styleMap.componentStyles);
    
    // Apply responsive styles
    if (styleMap.responsiveStyles) {
      styledLayout.responsiveStyles = styleMap.responsiveStyles;
    }
    
    // Add theme mode alternates if available
    if (styleMap.darkModeStyles) {
      styledLayout.darkModeStyles = styleMap.darkModeStyles;
    }
    
    return styledLayout;
  }
  
  /**
   * Apply styles recursively to elements and their children
   * @param {Array} elements - Elements to style
   * @param {Object} componentStyles - Style map for components
   * @returns {void}
   */
  applyStylesRecursively(elements, componentStyles) {
    if (!elements || !Array.isArray(elements)) return;
    
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      
      // If component has an ID and styles exist for it
      if (element.component?.id && componentStyles[element.component.id]) {
        element.styles = componentStyles[element.component.id];
      }
      // Or if it's a container and has a type
      else if (element.type && componentStyles[`container-${element.type}`]) {
        element.styles = componentStyles[`container-${element.type}`];
      }
      // Or if it has a generic type
      else if (element.type && componentStyles[element.type]) {
        element.styles = componentStyles[element.type];
      }
      
      // Process children recursively
      if (element.children && Array.isArray(element.children)) {
        this.applyStylesRecursively(element.children, componentStyles);
      }
    }
  }
  
  /**
   * Build a prompt for style generation
   * @param {Object} layoutData - Layout data with components
   * @param {Object} designTokens - Design system tokens
   * @returns {string} Prompt for the AI
   */
  buildStylePrompt(layoutData, designTokens) {
    return `You are an expert UI designer who understands design systems and styling.
Your task is to apply appropriate styles to UI components based on design system tokens.

Use the following design system tokens for styling:

Colors:
${JSON.stringify(designTokens.colors, null, 2)}

Typography:
${JSON.stringify(designTokens.typography, null, 2)}

Spacing:
${JSON.stringify(designTokens.spacing, null, 2)}

Shadows:
${JSON.stringify(designTokens.shadows, null, 2)}

Borders:
${JSON.stringify(designTokens.borders, null, 2)}

Here is the layout structure with components:
${JSON.stringify(layoutData, null, 2)}

Generate a style map that:
1. Uses appropriate color tokens for text, backgrounds, and accents
2. Applies typography tokens to text elements
3. Uses spacing tokens for margins, padding, and gaps
4. Adds shadow and border tokens where appropriate
5. Ensures sufficient contrast and visual hierarchy
6. Considers component hierarchy and relationships
7. Maintains consistency throughout the UI

Output a JSON object with the following structure:
{
  "globalStyles": {
    "backgroundColor": "string", // Background color for the entire UI
    "textColor": "string", // Default text color
    "fontFamily": "string" // Default font family
  },
  "componentStyles": {
    "componentId1": {
      "backgroundColor": "string",
      "color": "string",
      "typography": "string",
      "padding": "string",
      "margin": "string",
      "border": "string",
      "shadow": "string",
      "states": {
        "hover": { /* Style overrides for hover state */ },
        "active": { /* Style overrides for active state */ },
        "focus": { /* Style overrides for focus state */ }
      }
    },
    "componentId2": {
      // Similar style properties
    },
    // Add styles for container types if needed
    "container-card": {
      // Styles for card containers
    },
    // Add styles for generic element types
    "button": {
      // Generic button styles
    }
  },
  "responsiveStyles": {
    "tablet": {
      "componentId1": { /* Tablet-specific style overrides */ }
    },
    "mobile": {
      "componentId1": { /* Mobile-specific style overrides */ }
    }
  },
  "darkModeStyles": {
    "globalStyles": { /* Dark mode global style overrides */ },
    "componentStyles": {
      "componentId1": { /* Dark mode style overrides */ }
    }
  }
}

All values should reference design system tokens when possible.
For colors, use token names or values from the design system.
For typography, use token names.
For spacing, borders, and shadows, use token names or values.`;
  }
}

module.exports = new StyleApplicationService();