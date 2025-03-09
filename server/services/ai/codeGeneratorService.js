// server/services/ai/codeGeneratorService.js
const { OpenAI } = require('openai');
const DesignSystem = require('../../models/DesignSystem');

class CodeGeneratorService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * Generate React component code from styled layout
   * @param {Object} styledLayout - Styled layout data
   * @param {string} designSystemId - ID of the design system to use
   * @param {string} framework - Target framework (react, next)
   * @param {string} styleLibrary - Target style library (tailwind, chakra, styled-components)
   * @returns {Promise<Object>} Generated code
   */
  async generateCode(styledLayout, designSystemId, framework = 'react', styleLibrary = 'tailwind') {
    try {
      // Retrieve design system
      const designSystem = await DesignSystem.findById(designSystemId).populate('components');
      
      if (!designSystem) {
        throw new Error('Design system not found');
      }
      
      // Build component references
      const componentReferences = this.buildComponentReferences(designSystem, styledLayout);
      
      // Call the OpenAI API
      const systemPrompt = this.buildCodeGenerationPrompt(framework, styleLibrary, componentReferences);
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4-turbo",
        temperature: 0.3,
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: `Generate React component code for the following styled layout: ${JSON.stringify(styledLayout, null, 2)}`
          }
        ]
      });
      
      // Parse the code blocks from the response
      const generatedCode = this.extractCodeBlocks(response.choices[0].message.content);
      
      // Generate additional utility files if needed
      const utilityFiles = await this.generateUtilityFiles(framework, styleLibrary, styledLayout);
      
      return {
        mainComponent: generatedCode.mainComponent,
        subComponents: generatedCode.subComponents,
        utilityFiles,
        styleDefinitions: generatedCode.styleDefinitions
      };
    } catch (error) {
      console.error('Error generating code:', error);
      throw error;
    }
  }
  
  /**
   * Build component references for code generation
   * @param {Object} designSystem - The design system
   * @param {Object} styledLayout - Styled layout data
   * @returns {Object} Component references
   */
  buildComponentReferences(designSystem, styledLayout) {
    const references = {};
    
    // Find all unique components in the layout
    const uniqueComponentIds = new Set();
    
    // Function to extract component IDs recursively
    const extractComponentIds = (elements) => {
      if (!elements || !Array.isArray(elements)) return;
      
      for (const element of elements) {
        if (element.component?.id) {
          uniqueComponentIds.add(element.component.id.toString());
        }
        
        if (element.children && Array.isArray(element.children)) {
          extractComponentIds(element.children);
        }
      }
    };
    
    // Extract component IDs from the layout
    extractComponentIds(styledLayout.structuredElements);
    
    // Build references for each component
    for (const id of uniqueComponentIds) {
      const component = designSystem.components.find(comp => comp._id.toString() === id);
      
      if (component) {
        references[id] = {
          name: this.formatComponentName(component.name),
          type: component.type,
          variant: component.variantProperties
        };
      }
    }
    
    return references;
  }
  
  /**
   * Format component name to React component name
   * @param {string} name - Original component name
   * @returns {string} Formatted component name
   */
  formatComponentName(name) {
    // Remove any Figma path structure
    const baseName = name.split('/').pop().trim();
    
    // Convert to PascalCase
    return baseName
      .replace(/[\s-_]+(\w)/g, (_, c) => c.toUpperCase())
      .replace(/^(.)/, (_, c) => c.toUpperCase());
  }
  
  /**
   * Extract code blocks from AI response
   * @param {string} response - AI response text
   * @returns {Object} Extracted code blocks
   */
  extractCodeBlocks(response) {
    const result = {
      mainComponent: '',
      subComponents: {},
      styleDefinitions: {}
    };
    
    // Extract main component
    const mainComponentMatch = response.match(/```jsx\s*(function|const|export|import|\/\/)[\s\S]*?\n```/);
    if (mainComponentMatch) {
      result.mainComponent = mainComponentMatch[0]
        .replace(/```jsx\s*/, '')
        .replace(/\n```$/, '');
    }
    
    // Extract sub-components
    const subComponentMatches = response.matchAll(/```jsx\s*\/\/ SubComponent: ([^\n]*)\n([\s\S]*?)\n```/g);
    for (const match of subComponentMatches) {
      const componentName = match[1].trim();
      const componentCode = match[2].trim();
      result.subComponents[componentName] = componentCode;
    }
    
    // Extract style definitions
    const styleMatch = response.match(/```css\s*([\s\S]*?)\n```/);
    if (styleMatch) {
      result.styleDefinitions.css = styleMatch[1];
    }
    
    // Extract tailwind config if exists
    const tailwindMatch = response.match(/```js\s*\/\/ tailwind.config.js\n([\s\S]*?)\n```/);
    if (tailwindMatch) {
      result.styleDefinitions.tailwindConfig = tailwindMatch[1];
    }
    
    return result;
  }
  
  /**
   * Generate utility files based on framework and style library
   * @param {string} framework - Target framework
   * @param {string} styleLibrary - Target style library
   * @param {Object} styledLayout - Styled layout data
   * @returns {Promise<Object>} Utility files
   */
  async generateUtilityFiles(framework, styleLibrary, styledLayout) {
    const utilityFiles = {};
    
    // Generate theme file for certain style libraries
    if (styleLibrary === 'chakra' || styleLibrary === 'styled-components') {
      const themePrompt = `Generate a theme file for ${styleLibrary} based on this styled layout: ${JSON.stringify(styledLayout.globalStyles || {}, null, 2)}`;
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4-turbo",
        temperature: 0.3,
        messages: [
          { role: "system", content: `You are an expert in ${framework} development with ${styleLibrary}. Generate a theme file based on the global styles provided.` },
          { role: "user", content: themePrompt }
        ]
      });
      
      const themeMatch = response.choices[0].message.content.match(/```jsx\s*([\s\S]*?)\n```/);
      if (themeMatch) {
        utilityFiles.theme = themeMatch[1];
      }
    }
    
    // For Next.js, generate pages structure if needed
    if (framework === 'next') {
      utilityFiles.pageStructure = `
// pages structure for Next.js
const pageStructure = {
  'index.js': 'Main component',
  '_app.js': 'App wrapper with providers',
  'api/': 'API routes folder'
};
      `.trim();
    }
    
    return utilityFiles;
  }
  
  /**
   * Build prompt for code generation
   * @param {string} framework - Target framework
   * @param {string} styleLibrary - Target style library
   * @param {Object} componentReferences - Component references
   * @returns {string} Code generation prompt
   */
  buildCodeGenerationPrompt(framework, styleLibrary, componentReferences) {
    return `You are an expert ${framework} developer with deep knowledge of ${styleLibrary}.
Your task is to generate high-quality, production-ready React components based on a styled layout specification.

Component References:
${JSON.stringify(componentReferences, null, 2)}

Follow these guidelines:
1. Generate clean, well-structured, and maintainable code
2. Use modern ${framework} patterns and best practices
3. Implement the styling using ${styleLibrary}
4. Include appropriate props and PropTypes
5. Handle responsive design as specified
6. Implement dark mode support if specified
7. Add accessibility attributes (aria-* attributes, role, etc.)
8. Include comments for complex logic or components
9. Split complex components into smaller, reusable components
10. Follow a consistent naming convention

${this.getFrameworkSpecificGuidelines(framework, styleLibrary)}

Format your response as follows:
1. Main component code in a \`\`\`jsx code block
2. Sub-components in separate \`\`\`jsx code blocks, each prefixed with "// SubComponent: ComponentName"
3. Any necessary style definitions in a \`\`\`css code block
4. For Tailwind, include any necessary tailwind.config.js modifications in a \`\`\`js code block

Include imports for all required dependencies.
Make sure the component is fully functional and matches the layout and styling specifications.`;
  }
  
  /**
   * Get framework-specific guidelines
   * @param {string} framework - Target framework
   * @param {string} styleLibrary - Target style library
   * @returns {string} Framework-specific guidelines
   */
  getFrameworkSpecificGuidelines(framework, styleLibrary) {
    let guidelines = '';
    
    // Framework-specific guidelines
    if (framework === 'react') {
      guidelines += `
For React:
- Use functional components with hooks
- Implement useState for any state management
- Use useEffect for side effects
- Add appropriate key props for list items
`;
    } else if (framework === 'next') {
      guidelines += `
For Next.js:
- Use the App Router pattern with proper file structure
- Create page components in the app/ directory
- Use Next.js Link component for navigation
- Implement appropriate data fetching methods
- Consider using server components where appropriate
`;
    }
    
    // Style library-specific guidelines
    if (styleLibrary === 'tailwind') {
      guidelines += `
For Tailwind CSS:
- Use Tailwind utility classes for styling
- Implement responsive variants (sm:, md:, lg:, etc.)
- Use dark: variant for dark mode styles
- Extract common patterns to custom components
- Use @apply in CSS for complex or repeated patterns
`;
    } else if (styleLibrary === 'chakra') {
      guidelines += `
For Chakra UI:
- Use Chakra UI components for all UI elements
- Implement the theme for consistent styling
- Use Chakra's style props for inline styling
- Use the Box component as a base building block
- Implement responsive styles using the array syntax
- Use Chakra's color mode for dark mode
`;
    } else if (styleLibrary === 'styled-components') {
      guidelines += `
For styled-components:
- Create styled components for all UI elements
- Use props to create dynamic styles
- Implement the ThemeProvider with a theme object
- Use the css helper for complex styles
- Implement GlobalStyle for global styles
- Use the theme for consistent styling
`;
    }
    
    return guidelines;
  }
}

module.exports = new CodeGeneratorService();