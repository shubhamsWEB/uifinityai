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
      
      // Get component data from Figma
      const componentsData = await figmaApiService.getFileComponents(fileKey);
      console.log('Found components:', componentsData.meta.components.length);
      
      let componentSetsData = { meta: { component_sets: [] } };
      try {
        componentSetsData = await figmaApiService.getComponentSets(fileKey);
        console.log('Found component sets:', componentSetsData.meta.component_sets.length);
      } catch (error) {
        console.warn('Error fetching component sets:', error.message);
      }
      
      // Get additional node data for components
      const componentIds = componentsData.meta.components.map(comp => comp.node_id);
      const componentSetIds = componentSetsData.meta.component_sets.map(set => set.node_id);
      
      const allNodeIds = [...componentIds, ...componentSetIds];
      
      if (allNodeIds.length === 0) {
        console.log('No components or component sets found');
        return {
          components: {},
          componentSets: {},
          componentPreviews: {}
        };
      }
      
      console.log('Fetching node data for components...');
      const nodesData = await figmaApiService.getNodes(fileKey, allNodeIds);
      
      // Process components and component sets
      console.log('Processing components...');
      const components = await this.processComponents(
        componentsData.meta.components,
        nodesData.nodes
      );
      
      console.log('Processing component sets...');
      const componentSets = await this.processComponentSets(
        componentSetsData.meta.component_sets,
        nodesData.nodes,
        components
      );
      
      // Get image previews for components
      console.log('Fetching component previews...');
      const componentPreviews = await this.getComponentPreviews(fileKey, componentIds);
      
      console.log('Component extraction complete:');
      console.log(`- ${Object.keys(components).length} components`);
      console.log(`- ${Object.keys(componentSets).length} component sets`);
      console.log(`- ${Object.keys(componentPreviews).length} component previews`);
      
      return {
        components,
        componentSets,
        componentPreviews
      };
    } catch (error) {
      console.error('Error extracting components:', error);
      throw error;
    }
  }

  /**
   * Process component data
   * @param {Array} components - Array of components from Figma
   * @param {Object} nodesData - Node data for the components
   * @returns {Object} Processed components
   */
  async processComponents(components, nodesData) {
    const processedComponents = {};
    
    for (const component of components) {
      const nodeId = component.node_id;
      const nodeData = nodesData[nodeId];
      
      if (nodeData) {
        const node = nodeData.document;
        
        processedComponents[nodeId] = {
          id: nodeId,
          name: component.name,
          description: component.description || '',
          key: component.key,
          componentSetId: component.containing_frame?.node_id,
          // Extract properties from the component
          properties: this.extractComponentProperties(node),
          // Extract constraints and layout
          layout: this.extractLayoutProperties(node),
          // Extract styles
          styles: this.extractStyleReferences(node),
          // Extract size and constraints
          size: node.absoluteBoundingBox ? {
            width: node.absoluteBoundingBox.width,
            height: node.absoluteBoundingBox.height
          } : null,
          // Extract variant properties if it's part of a component set
          variantProperties: component.containing_frame ? 
            this.extractVariantProperties(component.name) : null
        };
      }
    }
    
    return processedComponents;
  }

  /**
   * Process component set data
   * @param {Array} componentSets - Array of component sets from Figma
   * @param {Object} nodesData - Node data for the component sets
   * @param {Object} components - Processed components data
   * @returns {Object} Processed component sets
   */
  async processComponentSets(componentSets, nodesData, components) {
    const processedComponentSets = {};
    
    for (const componentSet of componentSets) {
      const nodeId = componentSet.node_id;
      const nodeData = nodesData[nodeId];
      
      if (nodeData) {
        const node = nodeData.document;
        
        // Find all components that belong to this component set
        const childComponents = Object.values(components).filter(
          comp => comp.componentSetId === nodeId
        );
        
        // Extract variant properties
        const variantProperties = this.extractComponentSetVariantProperties(childComponents);
        
        processedComponentSets[nodeId] = {
          id: nodeId,
          name: componentSet.name,
          description: componentSet.description || '',
          key: componentSet.key,
          // Components in this set
          components: childComponents.map(comp => comp.id),
          // Variant properties (dimension names and values)
          variantProperties,
          // Component type classification
          type: this.classifyComponentType(componentSet.name, variantProperties)
        };
      }
    }
    
    return processedComponentSets;
  }

  /**
   * Get image previews for components
   * @param {string} fileKey - The Figma file key
   * @param {Array} componentIds - Array of component IDs
   * @returns {Object} Map of component ID to image URL
   */
  async getComponentPreviews(fileKey, componentIds) {
    try {
      // Only get previews if there are components
      if (!componentIds || componentIds.length === 0) {
        return {};
      }
      
      const imageData = await figmaApiService.getImages(fileKey, componentIds);
      
      const previews = {};
      if (imageData.images) {
        for (const [nodeId, imageUrl] of Object.entries(imageData.images)) {
          previews[nodeId] = imageUrl;
        }
      }
      
      return previews;
    } catch (error) {
      console.error('Error getting component previews:', error);
      return {};
    }
  }

  /**
   * Extract properties from a component
   * @param {Object} node - The component node
   * @returns {Object} The component properties
   */
  extractComponentProperties(node) {
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
    
    // Extract input properties if it looks like an input (common patterns in Figma)
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
  }
  
  /**
   * Find text content in child nodes
   * @param {Object} node - The parent node
   * @param {Array} keywords - Keywords to look for in node names
   * @returns {string} The text content if found
   */
  findTextNodeContent(node, keywords) {
    if (!node.children) return '';
    
    // Find a text node that has one of the keywords in its name
    const textNode = node.children.find(child => 
      child.type === 'TEXT' && 
      keywords.some(keyword => child.name.toLowerCase().includes(keyword))
    );
    
    return textNode ? textNode.characters : '';
  }
  
  /**
   * Determine the position of an icon relative to its parent
   * @param {Object} parentNode - The parent node
   * @param {Object} iconNode - The icon node
   * @returns {string} The position (left, right, top, bottom)
   */
  determineIconPosition(parentNode, iconNode) {
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
  }
  
  /**
   * Extract layout properties from a node
   * @param {Object} node - The node to extract from
   * @returns {Object} The layout properties
   */
  extractLayoutProperties(node) {
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
  }
  
  /**
   * Extract style references from a node
   * @param {Object} node - The node to extract from
   * @returns {Object} The style references
   */
  extractStyleReferences(node) {
    const styles = {};
    
    if (node.styles) {
      if (node.styles.fill) styles.fill = node.styles.fill;
      if (node.styles.text) styles.text = node.styles.text;
      if (node.styles.effect) styles.effect = node.styles.effect;
      if (node.styles.stroke) styles.stroke = node.styles.stroke;
      if (node.styles.grid) styles.grid = node.styles.grid;
    }
    
    return styles;
  }
  
  /**
   * Extract variant properties from a component name
   * @param {string} componentName - The component name
   * @returns {Object} The variant properties
   */
  extractVariantProperties(componentName) {
    // Component names in Figma often follow the pattern: "Component=Variant1, Property=Value"
    const variantProperties = {};
    
    // Split the name and look for key-value pairs
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
  
  /**
   * Extract variant properties from a component set
   * @param {Array} components - Array of components in the set
   * @returns {Object} The variant property definitions
   */
  extractComponentSetVariantProperties(components) {
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
  }
  
  /**
   * Classify the component type based on name and variants
   * @param {string} name - Component set name
   * @param {Object} variantProperties - The variant properties
   * @returns {string} Component type classification
   */
  classifyComponentType(name, variantProperties) {
    // Get component type from name
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
    
    // Determine from variant properties
    if (variantProperties) {
      const hasSize = 'Size' in variantProperties;
      const hasVariant = 'Variant' in variantProperties;
      const hasState = 'State' in variantProperties;
      
      if (hasState && (hasVariant || hasSize)) {
        // Components with state and variants are likely interactive
        if (variantProperties.State.includes('Hover') || 
            variantProperties.State.includes('Pressed') || 
            variantProperties.State.includes('Focus')) {
          return 'interactive';
        }
      }
    }
    
    return 'component';
  }
}

module.exports = new ComponentExtractor();