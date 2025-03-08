// server/services/figma/componentExtractor.js
const figmaApiService = require('./apiService');

class ComponentExtractor {
  /**
   * Extract all components from a Figma file
   * @param {string} fileKey - The Figma file key
   * @returns {Promise<Object>} The extracted components
   */
  async extractComponents(fileKey) {
    try {
      console.log('Extracting components from file:', fileKey);
      
      // Step 1: Get file data to have the complete document structure
      const fileData = await figmaApiService.getFile(fileKey);
      console.log('File data retrieved:', fileData.name);
      
      // Step 2: Get component data from Figma
      const componentsData = await figmaApiService.getFileComponents(fileKey);
      console.log('Found components:', Object.keys(componentsData.meta.components).length);
      
      // Step 3: Get component sets data
      try {
        console.log('Found component sets:', Object.keys(componentsData.meta.component_sets).length);
      } catch (error) {
        console.warn('Error fetching component sets:', error.message);
      }
      
      // Step 4: Get additional node data for components and component sets
      const componentIds = Object.keys(componentsData.meta.components);
      const componentSetIds = Object.keys(componentsData.meta.component_sets);
      
      const allNodeIds = [...componentIds, ...componentSetIds];
      
      if (allNodeIds.length === 0) {
        console.log('No components or component sets found');
        return {
          components: {},
          componentSets: {},
          componentPreviews: {}
        };
      }
      
      console.log('Fetching node data for components and component sets...');
      const nodesData = { nodes: {} };
      
      // Process in chunks to avoid API limits
      const maxIdsPerRequest = 100;
      for (let i = 0; i < allNodeIds.length; i += maxIdsPerRequest) {
        const chunk = allNodeIds.slice(i, i + maxIdsPerRequest);
        try {
          console.log(`Fetching data for ${chunk.length} nodes...`);
          const chunkData = await figmaApiService.getNodes(fileKey, chunk);
          if (chunkData && chunkData.nodes) {
            Object.assign(nodesData.nodes, chunkData.nodes);
          }
        } catch (error) {
          console.error(`Error fetching nodes chunk: ${error.message}`);
        }
      }
      
      console.log(`Retrieved data for ${Object.keys(nodesData.nodes).length} nodes`);
      
      // Step 5: Process component sets first to establish the structure
      console.log('Processing component sets...');
      const componentSets = {};
      for (const [nodeId, componentSet] of Object.entries(componentsData.meta.component_sets)) {
        const nodeData = nodesData.nodes[nodeId];
        
        if (nodeData && nodeData.document) {
          componentSets[nodeId] = {
            id: nodeId,
            name: componentSet.name,
            description: componentSet.description || '',
            key: componentSet.key,
            components: [], // Will be populated later
            variantProperties: {}, // Will be populated later
            type: this.inferComponentTypeFromName(componentSet.name)
          };
        }
      }
      
      // Step 6: Process components
      console.log('Processing components...');
      const components = {};
      
      // Map to organize components by their component set
      const componentsBySetId = {};
      
      for (const [nodeId, component] of Object.entries(componentsData.meta.components)) {
        const nodeData = nodesData.nodes[nodeId];
        
        if (!nodeData || !nodeData.document) {
          console.log(`Missing node data for component: ${component.name}`);
          continue;
        }
        
        const node = nodeData.document;
        
        // Important: Use the componentSetId property from the API response
        const componentSetId = component.componentSetId || null;
        
        // Extract variant properties from component name or other sources
        const variantProperties = this.extractVariantProperties(component.name);
        
        // Store the component
        components[nodeId] = {
          id: nodeId,
          name: component.name,
          description: component.description || '',
          key: component.key,
          componentSetId: componentSetId,
          properties: this.extractComponentProperties(node),
          layout: this.extractLayoutProperties(node),
          styles: this.extractStyleReferences(node),
          size: node.absoluteBoundingBox ? {
            width: node.absoluteBoundingBox.width,
            height: node.absoluteBoundingBox.height
          } : null,
          variantProperties: variantProperties
        };
        
        // Organize components by their component set
        if (componentSetId) {
          if (!componentsBySetId[componentSetId]) {
            componentsBySetId[componentSetId] = [];
          }
          componentsBySetId[componentSetId].push(nodeId);
        }
      }
      
      // Step 7: Update component sets with their components
      for (const [setId, componentIds] of Object.entries(componentsBySetId)) {
        if (componentSets[setId]) {
          // Add component IDs to the component set
          componentSets[setId].components = componentIds;
          
          // Extract variant properties from all components in this set
          const componentsInSet = componentIds.map(id => components[id]).filter(Boolean);
          const variantProperties = this.extractComponentSetVariantProperties(componentsInSet);
          componentSets[setId].variantProperties = variantProperties;
          
          // Update component type based on the variant properties and name
          componentSets[setId].type = this.classifyComponentType(
            componentSets[setId].name, 
            variantProperties
          );
        }
      }
      
      // Step 8: Get image previews for components
      console.log('Fetching component previews...');
      const componentPreviews = await this.getComponentPreviews(fileKey, componentIds);
      
      console.log('Component extraction complete:');
      console.log(`- ${Object.keys(components).length} components`);
      console.log(`- ${Object.keys(componentSets).length} component sets`);
      console.log(`- ${Object.keys(componentPreviews).length} component previews`);
      
      console.log("🚀 ~ ComponentExtractor ~ extractComponents ~ componentPreviews:", componentPreviews);
      return {
        components,
        componentSets,
        componentPreviews
      };
    } catch (error) {
      console.error('Error extracting components:', error);
      // Return empty result instead of throwing to prevent cascading failures
      return {
        components: {},
        componentSets: {},
        componentPreviews: {}
      };
    }
  }

  /**
   * Get image previews for components
   * @param {string} fileKey - The Figma file key
   * @param {Array} componentIds - Array of component IDs
   * @returns {Promise<Object>} Map of component ID to image URL
   */
  async getComponentPreviews(fileKey, componentIds) {
    try {
      if (!componentIds || componentIds.length === 0) {
        return {};
      }
      
      const previews = {};
      
      // Process in chunks to avoid API limits
      const maxIdsPerRequest = 100;
      for (let i = 0; i < componentIds.length; i += maxIdsPerRequest) {
        const chunk = componentIds.slice(i, i + maxIdsPerRequest);
        try {
          console.log(`Fetching images for ${chunk.length} components...`);
          const imageData = await figmaApiService.getImages(fileKey, chunk);
          
          if (imageData && imageData.images) {
            Object.assign(previews, imageData.images);
          }
        } catch (error) {
          console.error(`Error fetching images chunk: ${error.message}`);
        }
      }
      
      return previews;
    } catch (error) {
      console.error('Error getting component previews:', error);
      return {};
    }
  }
  
  /**
   * Infer component type from name
   * @param {string} name - The component name
   * @returns {string} Inferred component type
   */
  inferComponentTypeFromName(name) {
    const nameLower = name.toLowerCase();
    
    if (nameLower.includes('button')) return 'button';
    if (nameLower.includes('input') || nameLower.includes('field')) return 'input';
    if (nameLower.includes('card')) return 'card';
    if (nameLower.includes('icon')) return 'icon';
    if (nameLower.includes('avatar')) return 'avatar';
    if (nameLower.includes('checkbox')) return 'checkbox';
    if (nameLower.includes('radio')) return 'radio';
    if (nameLower.includes('toggle') || nameLower.includes('switch')) return 'toggle';
    if (nameLower.includes('dropdown') || nameLower.includes('select')) return 'select';
    if (nameLower.includes('menu')) return 'menu';
    if (nameLower.includes('tab')) return 'tab';
    if (nameLower.includes('alert') || nameLower.includes('notification')) return 'alert';
    if (nameLower.includes('modal') || nameLower.includes('dialog')) return 'modal';
    if (nameLower.includes('tooltip')) return 'tooltip';
    if (nameLower.includes('badge')) return 'badge';
    if (nameLower.includes('progress')) return 'progress';
    if (nameLower.includes('pagination')) return 'pagination';
    if (nameLower.includes('slider')) return 'slider';
    if (nameLower.includes('table')) return 'table';
    
    return 'component';
  }

  /**
   * Extract properties from a component
   * @param {Object} node - The component node
   * @returns {Object} The component properties
   */
  extractComponentProperties(node) {
    try {
      const properties = {};
      
      // Extract text content if it's a text node
      if (node.type === 'TEXT') {
        properties.text = node.characters || '';
        properties.textStyles = node.style || {};
      }
      
      // Extract image properties if it's an image
      if (node.type === 'RECTANGLE' && node.fills && node.fills.some(fill => fill.type === 'IMAGE')) {
        properties.isImage = true;
      }
      
      // Extract input properties if it looks like an input
      if (node.name.toLowerCase().includes('input') || 
          node.name.toLowerCase().includes('field') || 
          node.name.toLowerCase().includes('text box')) {
        properties.isInput = true;
        properties.placeholder = this.findTextNodeContent(node, ['placeholder', 'hint']);
      }
      
      // Look for interactive states
      if (node.name.toLowerCase().includes('hover') || 
          node.name.toLowerCase().includes('pressed') || 
          node.name.toLowerCase().includes('focused')) {
        properties.hasStates = true;
      }
      
      // Check for children with specific names that indicate properties
      if (node.children) {
        const iconNode = node.children.find(child => 
          child.name.toLowerCase().includes('icon') || 
          child.type === 'VECTOR'
        );
        
        if (iconNode) {
          properties.hasIcon = true;
          properties.iconPosition = this.determineIconPosition(node, iconNode);
        }
        
        // Look for label
        const labelNode = node.children.find(child => 
          child.name.toLowerCase().includes('label') ||
          (child.type === 'TEXT' && !child.name.toLowerCase().includes('placeholder'))
        );
        
        if (labelNode) {
          properties.hasLabel = true;
          properties.label = labelNode.characters || '';
        }
      }
      
      return properties;
    } catch (error) {
      console.error('Error extracting component properties:', error);
      return {};
    }
  }
  
  /**
   * Find text content in child nodes
   * @param {Object} node - The parent node
   * @param {Array} keywords - Keywords to look for in node names
   * @returns {string} The text content if found
   */
  findTextNodeContent(node, keywords) {
    if (!node.children) return '';
    
    try {
      // Find a text node that has one of the keywords in its name
      const textNode = node.children.find(child => 
        child.type === 'TEXT' && 
        keywords.some(keyword => child.name.toLowerCase().includes(keyword))
      );
      
      return textNode ? textNode.characters : '';
    } catch (error) {
      console.error('Error finding text node content:', error);
      return '';
    }
  }
  
  /**
   * Determine the position of an icon relative to its parent
   * @param {Object} parentNode - The parent node
   * @param {Object} iconNode - The icon node
   * @returns {string} The position (left, right, top, bottom)
   */
  determineIconPosition(parentNode, iconNode) {
    try {
      if (!parentNode.absoluteBoundingBox || !iconNode.absoluteBoundingBox) {
        return 'unknown';
      }
      
      const parent = parentNode.absoluteBoundingBox;
      const icon = iconNode.absoluteBoundingBox;
      
      // Calculate center points
      const parentCenterX = parent.x + parent.width / 2;
      const parentCenterY = parent.y + parent.height / 2;
      const iconCenterX = icon.x + icon.width / 2;
      const iconCenterY = icon.y + icon.height / 2;
      
      // Calculate distances from center
      const xDiff = iconCenterX - parentCenterX;
      const yDiff = iconCenterY - parentCenterY;
      
      // Determine position based on distance
      if (Math.abs(xDiff) > Math.abs(yDiff)) {
        return xDiff > 0 ? 'right' : 'left';
      } else {
        return yDiff > 0 ? 'bottom' : 'top';
      }
    } catch (error) {
      console.error('Error determining icon position:', error);
      return 'unknown';
    }
  }
  
  /**
   * Extract layout properties from a node
   * @param {Object} node - The node to extract from
   * @returns {Object} The layout properties
   */
  extractLayoutProperties(node) {
    try {
      const layout = {};
      
      // Extract layout mode
      if (node.layoutMode) {
        layout.type = node.layoutMode.toLowerCase(); // HORIZONTAL or VERTICAL
        layout.padding = {
          top: node.paddingTop || 0,
          right: node.paddingRight || 0,
          bottom: node.paddingBottom || 0,
          left: node.paddingLeft || 0
        };
        layout.spacing = node.itemSpacing || 0;
      } else {
        layout.type = 'none';
      }
      
      // Extract constraints
      if (node.constraints) {
        layout.constraints = {
          horizontal: node.constraints.horizontal.toLowerCase(),
          vertical: node.constraints.vertical.toLowerCase()
        };
      }
      
      // Extract auto layout properties
      if (node.primaryAxisAlignItems) {
        layout.primaryAxisAlignment = node.primaryAxisAlignItems.toLowerCase();
      }
      if (node.counterAxisAlignItems) {
        layout.counterAxisAlignment = node.counterAxisAlignItems.toLowerCase();
      }
      
      return layout;
    } catch (error) {
      console.error('Error extracting layout properties:', error);
      return { type: 'none' };
    }
  }
  
  /**
   * Extract style references from a node
   * @param {Object} node - The node to extract from
   * @returns {Object} The style references
   */
  extractStyleReferences(node) {
    try {
      const styles = {};
      
      if (node.styles) {
        if (node.styles.fill) styles.fill = node.styles.fill;
        if (node.styles.text) styles.text = node.styles.text;
        if (node.styles.effect) styles.effect = node.styles.effect;
        if (node.styles.stroke) styles.stroke = node.styles.stroke;
        if (node.styles.grid) styles.grid = node.styles.grid;
      }
      
      return styles;
    } catch (error) {
      console.error('Error extracting style references:', error);
      return {};
    }
  }
  
  /**
   * Extract variant properties from a component name
   * @param {string} componentName - The component name
   * @returns {Object} The variant properties
   */
  extractVariantProperties(componentName) {
    try {
      const variantProperties = {};
      
      // Try different naming patterns
      
      // Pattern 1: "Component=Value, Property=Value"
      if (componentName.includes(',') && componentName.includes('=')) {
        const parts = componentName.split(',').map(part => part.trim());
        
        for (const part of parts) {
          const keyValue = part.split('=').map(item => item.trim());
          
          if (keyValue.length === 2) {
            const [key, value] = keyValue;
            variantProperties[key] = value;
          }
        }
        return variantProperties;
      }
      
      // Pattern 2: "Component/Property=Value/Property=Value"
      if (componentName.includes('/') && componentName.includes('=')) {
        const parts = componentName.split('/').map(part => part.trim());
        
        // Skip the first part as it's usually the base component name
        for (let i = 1; i < parts.length; i++) {
          const part = parts[i];
          if (part.includes('=')) {
            const keyValue = part.split('=').map(item => item.trim());
            
            if (keyValue.length === 2) {
              const [key, value] = keyValue;
              variantProperties[key] = value;
            }
          }
        }
        return variantProperties;
      }
      
      // Pattern 3: Material Design style - "Button/Filled/Small"
      if (componentName.includes('/') && !componentName.includes('=')) {
        const parts = componentName.split('/').map(part => part.trim());
        
        if (parts.length >= 2) {
          // First part is typically the component type
          // Second part is usually the variant
          if (parts.length >= 2) variantProperties['Variant'] = parts[1];
          
          // Third part is often size or other property
          if (parts.length >= 3) {
            const thirdPart = parts[2].toLowerCase();
            
            if (thirdPart.includes('small') || thirdPart.includes('large') || 
                thirdPart.includes('medium') || thirdPart.includes('xl')) {
              variantProperties['Size'] = parts[2];
            } else {
              variantProperties['State'] = parts[2];
            }
          }
          
          // Fourth part and beyond are usually states or other properties
          if (parts.length >= 4) {
            variantProperties['State'] = parts[3];
          }
        }
        return variantProperties;
      }
      
      // Pattern 4: Material 3 style - "Button: primary--large--disabled"
      if (componentName.includes(':')) {
        const baseName = componentName.split(':')[0].trim();
        const variants = componentName.split(':')[1].trim();
        
        if (variants.includes('--')) {
          const variantParts = variants.split('--').map(p => p.trim());
          
          if (variantParts.length > 0) {
            variantProperties['Variant'] = variantParts[0];
            
            if (variantParts.length > 1) {
              variantProperties['Size'] = variantParts[1];
            }
            
            if (variantParts.length > 2) {
              variantProperties['State'] = variantParts[2];
            }
          }
          return variantProperties;
        }
      }
      
      return variantProperties;
    } catch (error) {
      console.error('Error extracting variant properties:', error);
      return {};
    }
  }
  
  /**
   * Extract variant properties from a component set
   * @param {Array} components - Array of components in the set
   * @returns {Object} The variant property definitions
   */
  extractComponentSetVariantProperties(components) {
    try {
      // Collect all unique property keys and their possible values
      const propertyMap = {};
      
      for (const component of components) {
        if (component.variantProperties) {
          for (const [key, value] of Object.entries(component.variantProperties)) {
            if (!propertyMap[key]) {
              propertyMap[key] = new Set();
            }
            propertyMap[key].add(value);
          }
        }
      }
      
      // Convert sets to arrays
      const result = {};
      for (const [key, valueSet] of Object.entries(propertyMap)) {
        result[key] = Array.from(valueSet);
      }
      
      return result;
    } catch (error) {
      console.error('Error extracting component set variant properties:', error);
      return {};
    }
  }
  
  /**
   * Classify the component type based on name and variants
   * @param {string} name - Component set name
   * @param {Object} variantProperties - The variant properties
   * @returns {string} Component type classification
   */
  classifyComponentType(name, variantProperties) {
    try {
      // First check the base name
      const baseType = this.inferComponentTypeFromName(name);
      if (baseType !== 'component') {
        return baseType;
      }
      
      // Then check variant properties for clues
      if (variantProperties && Object.keys(variantProperties).length > 0) {
        // Check for interactive components
        if (variantProperties.State) {
          const states = Array.isArray(variantProperties.State) 
            ? variantProperties.State 
            : [variantProperties.State];
            
          const interactiveStates = ['hover', 'focus', 'active', 'pressed', 'disabled'];
          
          for (const state of states) {
            if (state && interactiveStates.some(s => 
                state.toLowerCase().includes(s))) {
              return 'interactive';
            }
          }
        }
        
        // Check for input components
        if (variantProperties.Type && Array.isArray(variantProperties.Type)) {
          const types = variantProperties.Type;
          if (types.some(t => 
              t.toLowerCase().includes('input') || 
              t.toLowerCase().includes('field'))) {
            return 'input';
          }
        }
      }
      
      return 'component';
    } catch (error) {
      console.error('Error classifying component type:', error);
      return 'component';
    }
  }
}

module.exports = new ComponentExtractor();