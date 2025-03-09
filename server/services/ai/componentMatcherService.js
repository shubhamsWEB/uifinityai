// server/services/ai/componentMatcherService.js
const { OpenAI } = require('openai');
const DesignSystem = require('../../models/DesignSystem');

class ComponentMatcherService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.embeddingCache = new Map();
    console.log('ComponentMatcherService initialized');
  }

  /**
   * Find matching components from the design system based on requirements
   * @param {Object} uiRequirements - Structured UI requirements
   * @param {string} designSystemId - ID of the design system to use
   * @returns {Promise<Object>} Matched components
   */
  async findMatchingComponents(uiRequirements, designSystemId) {
    try {
      console.log(`Finding matching components for design system ID: ${designSystemId}`);
      console.log(`UI requirements contain ${uiRequirements.elements?.length || 0} elements`);
      
      // Retrieve design system
      const designSystem = await DesignSystem.findById(designSystemId).populate('components');
      
      if (!designSystem) {
        console.error(`Design system with ID ${designSystemId} not found`);
        throw new Error('Design system not found');
      }
      
      console.log(`Design system "${designSystem.name}" loaded with ${designSystem.components.length} components and ${Object.keys(designSystem.componentSets || {}).length} component sets`);
      
      // Get or create design system embeddings
      console.log('Generating or retrieving design system embeddings...');
      const designSystemEmbeddings = await this.getDesignSystemEmbeddings(designSystem);
      console.log(`Embeddings ready for ${Object.keys(designSystemEmbeddings.components).length} components and ${Object.keys(designSystemEmbeddings.componentSets).length} component sets`);
      
      // Process each element in the UI requirements
      const matchedElements = [];
      
      for (const element of uiRequirements.elements) {
        console.log(`Matching component for element type: ${element.type || 'unknown'}`);
        const matchedComponent = await this.matchComponentForElement(element, designSystem, designSystemEmbeddings);
        console.log(`Matched component: ${matchedComponent.name || matchedComponent.id}`);
        
        matchedElements.push({
          ...element,
          component: matchedComponent
        });
        
        // Process nested elements if they exist
        if (element.children && element.children.length > 0) {
          console.log(`Processing ${element.children.length} child elements for parent type: ${element.type || 'unknown'}`);
          
          for (let i = 0; i < element.children.length; i++) {
            const childElement = element.children[i];
            console.log(`Matching component for child element type: ${childElement.type || 'unknown'}`);
            const matchedChildComponent = await this.matchComponentForElement(childElement, designSystem, designSystemEmbeddings);
            console.log(`Matched child component: ${matchedChildComponent.name || matchedChildComponent.id}`);
            
            element.children[i] = {
              ...childElement,
              component: matchedChildComponent
            };
          }
        }
      }
      
      console.log(`Component matching complete. Matched ${matchedElements.length} top-level elements.`);
      
      return {
        ...uiRequirements,
        elements: matchedElements
      };
    } catch (error) {
      console.error('Error finding matching components:', error);
      throw error;
    }
  }
  
  /**
   * Get or create design system embeddings
   * @param {Object} designSystem - The design system
   * @returns {Promise<Object>} Design system embeddings
   */
  async getDesignSystemEmbeddings(designSystem) {
    // Check if we have cached embeddings for this design system
    const designSystemId = designSystem._id.toString();
    if (this.embeddingCache.has(designSystemId)) {
      console.log(`Using cached embeddings for design system: ${designSystemId}`);
      return this.embeddingCache.get(designSystemId);
    }
    
    console.log(`Generating new embeddings for design system: ${designSystemId}`);
    const componentEmbeddings = {};
    
    // Generate embeddings for each component
    console.log(`Generating embeddings for ${designSystem.components.length} components...`);
    for (const component of designSystem.components) {
      const description = this.generateComponentDescription(component);
      console.log(`Component description for "${component.name}": ${description.substring(0, 100)}...`);
      const embedding = await this.generateEmbedding(description);
      componentEmbeddings[component._id.toString()] = {
        component,
        embedding
      };
    }
    
    // Generate embeddings for component sets
    console.log(`Generating embeddings for ${Object.keys(designSystem.componentSets || {}).length} component sets...`);
    const componentSetEmbeddings = {};
    for (const [key, value] of Object.entries(designSystem.componentSets || {})) {
      const description = this.generateComponentSetDescription(value);
      console.log(`Component set description for "${value.name}": ${description.substring(0, 100)}...`);
      const embedding = await this.generateEmbedding(description);
      componentSetEmbeddings[key] = {
        componentSet: value,
        embedding
      };
    }
    
    const embeddings = {
      components: componentEmbeddings,
      componentSets: componentSetEmbeddings
    };
    
    // Cache the embeddings
    console.log(`Caching embeddings for design system: ${designSystemId}`);
    this.embeddingCache.set(designSystemId, embeddings);
    
    return embeddings;
  }
  
  /**
   * Match a component for a UI element
   * @param {Object} element - UI element requirements
   * @param {Object} designSystem - The design system
   * @param {Object} designSystemEmbeddings - Design system embeddings
   * @returns {Promise<Object>} Matched component
   */
  async matchComponentForElement(element, designSystem, designSystemEmbeddings) {
    // If the element has a specific component type, try exact matching first
    if (element.type) {
      console.log(`Attempting exact type match for: ${element.type}`);
      
      // Try to find a component set that matches the type
      const matchingComponentSets = this.findComponentSetsByType(element.type, designSystem);
      console.log(`Found ${matchingComponentSets.length} matching component sets for type: ${element.type}`);
      
      if (matchingComponentSets.length > 0) {
        // If a variant is specified, try to find a matching variant
        if (element.variant && matchingComponentSets[0].components) {
          console.log(`Searching for variant: ${element.variant} in component set: ${matchingComponentSets[0].name}`);
          const componentIds = matchingComponentSets[0].components;
          const components = componentIds
            .map(id => designSystem.components.find(c => c._id.toString() === id.toString()))
            .filter(Boolean);
          
          console.log(`Found ${components.length} components in the component set to check for variant match`);
          const matchingVariant = this.findComponentWithVariant(components, element.variant);
          
          if (matchingVariant) {
            console.log(`Found matching variant component: ${matchingVariant.name}`);
            return this.buildComponentResponse(matchingVariant, matchingComponentSets[0]);
          } else {
            console.log(`No matching variant found for: ${element.variant}`);
          }
        }
        
        // If no variant is specified or no matching variant found, return the component set
        console.log(`Returning component set: ${matchingComponentSets[0].name}`);
        return this.buildComponentSetResponse(matchingComponentSets[0]);
      }
      
      // Try to find a component that matches the type
      const matchingComponents = this.findComponentsByType(element.type, designSystem);
      console.log(`Found ${matchingComponents.length} matching individual components for type: ${element.type}`);
      
      if (matchingComponents.length > 0) {
        console.log(`Returning component: ${matchingComponents[0].name}`);
        return this.buildComponentResponse(matchingComponents[0]);
      }
    }
    
    // If no exact match found, use semantic search with embeddings
    console.log(`No exact match found, using semantic search for element type: ${element.type || 'unknown'}`);
    const elementDescription = this.generateElementDescription(element);
    console.log(`Element description: ${elementDescription}`);
    const elementEmbedding = await this.generateEmbedding(elementDescription);
    
    // Find the closest matching component or component set
    console.log('Finding closest semantic match...');
    const { match, type } = this.findClosestMatch(elementEmbedding, designSystemEmbeddings);
    
    if (type === 'component') {
      console.log(`Found closest matching component: ${match.component.name}`);
      return this.buildComponentResponse(match.component);
    } else {
      console.log(`Found closest matching component set: ${match.componentSet.name}`);
      return this.buildComponentSetResponse(match.componentSet);
    }
  }
  
  /**
   * Generate an embedding for a text description
   * @param {string} text - Text to embed
   * @returns {Promise<Array>} Embedding vector
   */
  async generateEmbedding(text) {
    try {
      console.log(`Generating embedding for text (${text.length} chars)`);
      const result = await this.openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text
      });
      
      console.log(`Embedding generated successfully, vector length: ${result.data[0].embedding.length}`);
      return result.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }
  
  /**
   * Find the closest matching component or component set
   * @param {Array} queryEmbedding - Query embedding
   * @param {Object} designSystemEmbeddings - Design system embeddings
   * @returns {Object} The closest match and its type
   */
  findClosestMatch(queryEmbedding, designSystemEmbeddings) {
    let closestMatch = null;
    let closestDistance = Infinity;
    let matchType = null;
    
    // Check components
    console.log(`Checking similarity against ${Object.keys(designSystemEmbeddings.components).length} components`);
    for (const [id, data] of Object.entries(designSystemEmbeddings.components)) {
      const distance = this.cosineSimilarity(queryEmbedding, data.embedding);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestMatch = data;
        matchType = 'component';
      }
    }
    
    // Check component sets
    console.log(`Checking similarity against ${Object.keys(designSystemEmbeddings.componentSets).length} component sets`);
    for (const [id, data] of Object.entries(designSystemEmbeddings.componentSets)) {
      const distance = this.cosineSimilarity(queryEmbedding, data.embedding);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestMatch = data;
        matchType = 'componentSet';
      }
    }
    
    console.log(`Closest match is a ${matchType} with similarity distance: ${closestDistance}`);
    return { match: closestMatch, type: matchType };
  }
  
  /**
   * Calculate cosine similarity between two vectors
   * @param {Array} vec1 - First vector
   * @param {Array} vec2 - Second vector
   * @returns {number} Cosine similarity (-1 to 1)
   */
  cosineSimilarity(vec1, vec2) {
    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;
    
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      mag1 += vec1[i] * vec1[i];
      mag2 += vec2[i] * vec2[i];
    }
    
    mag1 = Math.sqrt(mag1);
    mag2 = Math.sqrt(mag2);
    
    if (mag1 === 0 || mag2 === 0) {
      return 0;
    }
    
    return 1 - (dotProduct / (mag1 * mag2));
  }
  
  /**
   * Find component sets by type
   * @param {string} type - Component type
   * @param {Object} designSystem - The design system
   * @returns {Array} Matching component sets
   */
  findComponentSetsByType(type, designSystem) {
    const matches = [];
    
    for (const [key, value] of Object.entries(designSystem.componentSets || {})) {
      if (value && value.type && value.type.toLowerCase() === type.toLowerCase()) {
        matches.push({
          id: key,
          ...value
        });
      }
    }
    
    return matches;
  }
  
  /**
   * Find components by type
   * @param {string} type - Component type
   * @param {Object} designSystem - The design system
   * @returns {Array} Matching components
   */
  findComponentsByType(type, designSystem) {
    return designSystem.components.filter(component => 
      component.type.toLowerCase() === type.toLowerCase()
    );
  }
  
  /**
   * Find a component with a specific variant
   * @param {Array} components - Components to search
   * @param {string} variant - Variant to find
   * @returns {Object} Matching component
   */
  findComponentWithVariant(components, variant) {
    for (const component of components) {
      if (component.variantProperties) {
        // Check if any variant property matches
        const variantEntries = Object.entries(component.variantProperties);
        for (const [key, value] of variantEntries) {
          if (value.toLowerCase() === variant.toLowerCase()) {
            return component;
          }
        }
      }
    }
    
    return null;
  }
  
  /**
   * Generate a text description of a component
   * @param {Object} component - The component
   * @returns {string} Component description
   */
  generateComponentDescription(component) {
    let description = `Component: ${component.name}. Type: ${component.type}.`;
    
    if (component.description) {
      description += ` Description: ${component.description}.`;
    }
    
    if (component.variantProperties) {
      const variants = Object.entries(component.variantProperties)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      description += ` Variants: ${variants}.`;
    }
    
    return description;
  }
  
  /**
   * Generate a text description of a component set
   * @param {Object} componentSet - The component set
   * @returns {string} Component set description
   */
  generateComponentSetDescription(componentSet) {
    let description = `Component Set: ${componentSet.name}. Type: ${componentSet.type}.`;
    
    if (componentSet.description) {
      description += ` Description: ${componentSet.description}.`;
    }
    
    if (componentSet.variantProperties) {
      const variantProps = Object.entries(componentSet.variantProperties)
        .map(([key, values]) => `${key}: ${values.join(', ')}`)
        .join('; ');
      description += ` Variant Properties: ${variantProps}.`;
    }
    
    return description;
  }
  
  /**
   * Generate a text description of a UI element
   * @param {Object} element - The UI element
   * @returns {string} Element description
   */
  generateElementDescription(element) {
    let description = `UI Element. Type: ${element.type || 'unknown'}.`;
    
    if (element.content) {
      description += ` Content: ${element.content}.`;
    }
    
    if (element.variant) {
      description += ` Variant: ${element.variant}.`;
    }
    
    if (element.style) {
      const style = Object.entries(element.style)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      description += ` Style: ${style}.`;
    }
    
    if (element.properties) {
      const props = Object.entries(element.properties)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      description += ` Properties: ${props}.`;
    }
    
    return description;
  }
  
  /**
   * Build a component response
   * @param {Object} component - The component
   * @param {Object} componentSet - Optional parent component set
   * @returns {Object} Component response
   */
  buildComponentResponse(component, componentSet = null) {
    const response = {
      id: component._id,
      name: component.name,
      type: component.type,
      variantProperties: component.variantProperties || {},
      previewUrl: component.previewUrl
    };
    
    if (componentSet) {
      response.componentSetId = componentSet.id;
      response.componentSetName = componentSet.name;
    }
    
    return response;
  }
  
  /**
   * Build a component set response
   * @param {Object} componentSet - The component set
   * @returns {Object} Component set response
   */
  buildComponentSetResponse(componentSet) {
    return {
      id: componentSet.id,
      name: componentSet.name,
      type: componentSet.type,
      isComponentSet: true,
      variantProperties: componentSet.variantProperties || {}
    };
  }
}

module.exports = new ComponentMatcherService();