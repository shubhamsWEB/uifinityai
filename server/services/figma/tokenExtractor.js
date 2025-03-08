// lib/figma/tokenExtractor.js
const tinycolor = require('tinycolor2');
const figmaApiService = require('./apiService');

class DesignTokenExtractor {
  /**
   * Extract all design tokens from a Figma file
   * @param {string} fileKey - The Figma file key
   * @returns {Promise<Object>} The extracted design tokens
   */
  async extractDesignTokens(fileKey) {
    try {
      console.log('Starting design token extraction from file:', fileKey);
      
      // Get file data with styles
      const fileData = await figmaApiService.getFile(fileKey);
      console.log('File data retrieved:', fileData.name);
      
      // Check if styles property exists before accessing it
      const styles = fileData.styles || {};
      
      // Extract different token types
      const colorTokens = await this.extractColorTokens(fileKey, fileData, styles);
      const typographyTokens = await this.extractTypographyTokens(fileKey, fileData, styles);
      const spacingTokens = await this.extractSpacingTokens(fileKey, fileData);
      const shadowTokens = await this.extractShadowTokens(fileKey, fileData, styles);
      const borderTokens = await this.extractBorderTokens(fileKey, fileData, styles);
      
      // Log results
      console.log('Extracted tokens:', {
        colors: Object.keys(colorTokens).length,
        typography: Object.keys(typographyTokens).length,
        spacing: Object.keys(spacingTokens).length,
        shadows: Object.keys(shadowTokens).length,
        borders: Object.keys(borderTokens).length
      });
      
      // Combine all token types
      return {
        colors: colorTokens,
        typography: typographyTokens,
        spacing: spacingTokens,
        shadows: shadowTokens,
        borders: borderTokens,
      };
    } catch (error) {
      console.error('Error extracting design tokens:', error);
      // Return empty token collections instead of throwing
      return {
        colors: {},
        typography: {},
        spacing: {},
        shadows: {},
        borders: {}
      };
    }
  }

  /**
   * Extract color tokens from styles
   * @param {string} fileKey - The Figma file key
   * @param {Object} fileData - The complete file data
   * @param {Object} stylesData - The styles data
   * @returns {Object} The extracted color tokens
   */
  async extractColorTokens(fileKey, fileData, stylesData) {
    console.log('Extracting color tokens...');
    const colorTokens = {};
    
    // Filter color styles (FILL type)
    const colorStyles = stylesData.meta.styles.filter(style => 
      style.style_type === 'FILL'
    );
    console.log('Found color styles:', colorStyles.length);
    
    if (colorStyles.length === 0) {
      // Fallback to scanning the document for colors
      return this.extractColorsFromDocument(fileData.document);
    }
    
    // Get node IDs for all color styles
    const styleNodeIds = colorStyles.map(style => style.node_id);
    
    // Get node data for all style nodes
    console.log('Fetching node data for color styles...');
    const nodesData = await figmaApiService.getNodes(fileKey, styleNodeIds);
    
    // Process each color style
    for (const style of colorStyles) {
      const nodeId = style.node_id;
      
      // Get the node data
      const nodeData = nodesData.nodes[nodeId];
      if (!nodeData || !nodeData.document) {
        console.log(`No node data found for style: ${style.name} (${nodeId})`);
        continue;
      }
      
      const node = nodeData.document;
      
      // Extract fill color from the node
      if (node.fills && node.fills.length > 0) {
        const fill = node.fills.find(f => f.type === 'SOLID' && f.visible !== false);
        
        if (fill && fill.color) {
          const { r, g, b, a = 1 } = fill.color;
          
          // Convert to hex and rgba
          const color = tinycolor({
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255),
            a: a
          });
          
          const tokenName = this.formatTokenName(style.name);
          colorTokens[tokenName] = {
            hex: color.toHexString(),
            rgba: color.toRgbString(),
            value: color.toRgbString(),
            description: style.description || '',
            name: style.name
          };
          
          console.log(`Extracted color token: ${tokenName} = ${color.toRgbString()}`);
        }
      }
    }
    
    console.log(`Extracted ${Object.keys(colorTokens).length} color tokens`);
    
    // If no color tokens found using styles, try alternative method
    if (Object.keys(colorTokens).length === 0) {
      console.log('No color tokens found using styles, trying alternative method...');
      return this.extractColorsFromDocument(fileData.document);
    }
    
    return colorTokens;
  }

  /**
   * Extract colors directly from the document structure
   * @param {Object} document - The document object
   * @returns {Object} The extracted color tokens
   */
  async extractColorsFromDocument(document) {
    console.log('Using alternative color extraction method...');
    
    const colorSet = new Set();
    const colorTokens = {};
    
    // Function to traverse the document and collect colors
    const traverseForColors = (node) => {
      // Check for fills
      if (node.fills && node.fills.length > 0) {
        for (const fill of node.fills) {
          if (fill.type === 'SOLID' && fill.color && fill.visible !== false) {
            const { r, g, b, a = 1 } = fill.color;
            
            // Convert to hex and rgba
            const color = tinycolor({
              r: Math.round(r * 255),
              g: Math.round(g * 255),
              b: Math.round(b * 255),
              a: a
            });
            
            const colorValue = color.toRgbString();
            colorSet.add(colorValue);
          }
        }
      }
      
      // Check for strokes
      if (node.strokes && node.strokes.length > 0) {
        for (const stroke of node.strokes) {
          if (stroke.type === 'SOLID' && stroke.color && stroke.visible !== false) {
            const { r, g, b, a = 1 } = stroke.color;
            
            // Convert to hex and rgba
            const color = tinycolor({
              r: Math.round(r * 255),
              g: Math.round(g * 255),
              b: Math.round(b * 255),
              a: a
            });
            
            const colorValue = color.toRgbString();
            colorSet.add(colorValue);
          }
        }
      }
      
      // Recursively check children
      if (node.children) {
        for (const child of node.children) {
          traverseForColors(child);
        }
      }
    };
    
    // Start traversal from the document root
    traverseForColors(document);
    
    // Convert set to tokens
    let index = 1;
    for (const colorValue of colorSet) {
      const tokenName = `color${index}`;
      colorTokens[tokenName] = {
        value: colorValue,
        hex: tinycolor(colorValue).toHexString(),
        rgba: colorValue,
        name: tokenName,
        description: `Auto-extracted color ${index}`
      };
      index++;
    }
    
    console.log(`Alternative method found ${Object.keys(colorTokens).length} colors`);
    return colorTokens;
  }

  /**
   * Extract typography tokens from styles
   * @param {string} fileKey - The Figma file key
   * @param {Object} fileData - The complete file data
   * @param {Object} stylesData - The styles data
   * @returns {Object} The extracted typography tokens
   */
  async extractTypographyTokens(fileKey, fileData, stylesData) {
    console.log('Extracting typography tokens...');
    const typographyTokens = {};
    
    // Filter typography styles (TEXT type)
    const textStyles = stylesData.meta.styles.filter(style => 
      style.style_type === 'TEXT'
    );
    console.log('Found text styles:', textStyles.length);
    
    if (textStyles.length === 0) {
      // Fallback to scanning the document for text styles
      return this.extractTypographyFromDocument(fileData.document);
    }
    
    // Get node IDs for all text styles
    const styleNodeIds = textStyles.map(style => style.node_id);
    
    // Get node data for all style nodes
    console.log('Fetching node data for typography styles...');
    const nodesData = await figmaApiService.getNodes(fileKey, styleNodeIds);
    
    // Process each text style
    for (const style of textStyles) {
      const nodeId = style.node_id;
      
      // Get the node data
      const nodeData = nodesData.nodes[nodeId];
      if (!nodeData || !nodeData.document) {
        console.log(`No node data found for style: ${style.name} (${nodeId})`);
        continue;
      }
      
      const node = nodeData.document;
      
      // Extract typography from the node
      if (node.style) {
        const { fontFamily, fontWeight, fontSize, lineHeight, letterSpacing, textCase, textDecoration } = node.style;
        
        const tokenName = this.formatTokenName(style.name);
        typographyTokens[tokenName] = {
          fontFamily,
          fontWeight,
          fontSize: `${fontSize}px`,
          lineHeight: this.formatLineHeight(lineHeight),
          letterSpacing: this.formatLetterSpacing(letterSpacing),
          textCase: this.formatTextCase(textCase),
          textDecoration,
          value: `${fontWeight} ${fontSize}px/${this.formatLineHeight(lineHeight)} ${fontFamily}`,
          description: style.description || '',
          name: style.name
        };
        
        console.log(`Extracted typography token: ${tokenName}`);
      }
    }
    
    console.log(`Extracted ${Object.keys(typographyTokens).length} typography tokens`);
    
    // If no typography tokens found using styles, try alternative method
    if (Object.keys(typographyTokens).length === 0) {
      console.log('No typography tokens found using styles, trying alternative method...');
      return this.extractTypographyFromDocument(fileData.document);
    }
    
    return typographyTokens;
  }

  /**
   * Extract typography directly from the document structure
   * @param {Object} document - The document object
   * @returns {Object} The extracted typography tokens
   */
  async extractTypographyFromDocument(document) {
    console.log('Using alternative typography extraction method...');
    
    const typographySet = new Map();
    const typographyTokens = {};
    
    // Function to traverse the document and collect typography styles
    const traverseForTypography = (node) => {
      // Check for text nodes
      if (node.type === 'TEXT' && node.style) {
        const { fontFamily, fontWeight, fontSize, lineHeight, letterSpacing, textCase, textDecoration } = node.style;
        
        // Create a key for this typography style
        const styleKey = `${fontFamily}-${fontWeight}-${fontSize}`;
        
        // Only add if not already in the set
        if (!typographySet.has(styleKey)) {
          typographySet.set(styleKey, {
            fontFamily,
            fontWeight,
            fontSize,
            lineHeight,
            letterSpacing,
            textCase,
            textDecoration,
            nodeName: node.name
          });
        }
      }
      
      // Recursively check children
      if (node.children) {
        for (const child of node.children) {
          traverseForTypography(child);
        }
      }
    };
    
    // Start traversal from the document root
    traverseForTypography(document);
    
    // Convert map to tokens
    let index = 1;
    for (const [styleKey, styleProps] of typographySet.entries()) {
      const { fontFamily, fontWeight, fontSize, lineHeight, letterSpacing, textCase, textDecoration, nodeName } = styleProps;
      
      // Use node name if it looks like a token name, otherwise generate a name
      const tokenName = nodeName.includes('/') ? this.formatTokenName(nodeName) : `typography${index}`;
      
      typographyTokens[tokenName] = {
        fontFamily,
        fontWeight,
        fontSize: `${fontSize}px`,
        lineHeight: this.formatLineHeight(lineHeight),
        letterSpacing: this.formatLetterSpacing(letterSpacing),
        textCase: this.formatTextCase(textCase),
        textDecoration,
        value: `${fontWeight} ${fontSize}px/${this.formatLineHeight(lineHeight)} ${fontFamily}`,
        name: nodeName,
        description: `Auto-extracted typography style ${index}`
      };
      
      index++;
    }
    
    console.log(`Alternative method found ${Object.keys(typographyTokens).length} typography styles`);
    return typographyTokens;
  }

  /**
   * Extract spacing tokens from the document
   * @param {string} fileKey - The Figma file key
   * @param {Object} fileData - The complete file data
   * @returns {Object} The extracted spacing tokens
   */
  async extractSpacingTokens(fileKey, fileData) {
    console.log('Extracting spacing tokens...');
    const spacingTokens = {};
    
    // Look for frames or elements that follow spacing naming convention
    const spacingFrames = this.findNodesByPattern(fileData.document, node => {
      return (
        (node.name.toLowerCase().includes('spacing') || 
         node.name.toLowerCase().includes('space')) &&
        node.absoluteBoundingBox &&
        // Square shapes are likely spacing tokens
        Math.abs(node.absoluteBoundingBox.width - node.absoluteBoundingBox.height) < 1
      );
    });
    
    console.log('Found potential spacing nodes:', spacingFrames.length);
    
    for (const frame of spacingFrames) {
      if (frame.absoluteBoundingBox) {
        const { width, height } = frame.absoluteBoundingBox;
        
        // If width and height are the same, it's a square spacing token
        if (Math.abs(width - height) < 1) {
          const tokenName = this.formatTokenName(frame.name.split('/').pop());
          spacingTokens[tokenName] = {
            value: `${Math.round(width)}px`,
            description: frame.description || '',
            name: frame.name
          };
          
          console.log(`Extracted spacing token: ${tokenName} = ${Math.round(width)}px`);
        }
      }
    }
    
    // If no spacing tokens found, try to find common spacing values in the layout
    if (Object.keys(spacingTokens).length === 0) {
      console.log('No spacing tokens found using naming convention, looking for common spacing values...');
      
      // Collect spacing values from auto layout frames
      const spacingValues = new Map();
      
      const collectSpacingValues = (node) => {
        if (node.itemSpacing !== undefined && node.itemSpacing > 0) {
          const spacing = Math.round(node.itemSpacing);
          spacingValues.set(spacing, (spacingValues.get(spacing) || 0) + 1);
        }
        
        if (node.paddingLeft !== undefined && node.paddingLeft > 0) {
          const spacing = Math.round(node.paddingLeft);
          spacingValues.set(spacing, (spacingValues.get(spacing) || 0) + 1);
        }
        
        if (node.paddingRight !== undefined && node.paddingRight > 0) {
          const spacing = Math.round(node.paddingRight);
          spacingValues.set(spacing, (spacingValues.get(spacing) || 0) + 1);
        }
        
        if (node.paddingTop !== undefined && node.paddingTop > 0) {
          const spacing = Math.round(node.paddingTop);
          spacingValues.set(spacing, (spacingValues.get(spacing) || 0) + 1);
        }
        
        if (node.paddingBottom !== undefined && node.paddingBottom > 0) {
          const spacing = Math.round(node.paddingBottom);
          spacingValues.set(spacing, (spacingValues.get(spacing) || 0) + 1);
        }
        
        // Recursively check children
        if (node.children) {
          for (const child of node.children) {
            collectSpacingValues(child);
          }
        }
      };
      
      // Start collection from the document root
      collectSpacingValues(fileData.document);
      
      // Create tokens for common spacing values
      // Sort by frequency
      const sortedSpacingValues = [...spacingValues.entries()]
        .filter(([spacing, count]) => count >= 5) // Only include values that appear at least 5 times
        .sort((a, b) => a[0] - b[0]); // Sort by spacing value
      
      for (const [spacing, count] of sortedSpacingValues) {
        const tokenName = `space${spacing}`;
        spacingTokens[tokenName] = {
          value: `${spacing}px`,
          description: `Auto-extracted spacing value ${spacing}px (found ${count} times)`,
          name: tokenName
        };
        
        console.log(`Extracted common spacing value: ${tokenName} = ${spacing}px (count: ${count})`);
      }
    }
    
    console.log(`Extracted ${Object.keys(spacingTokens).length} spacing tokens`);
    return spacingTokens;
  }

  /**
   * Extract shadow tokens from styles
   * @param {string} fileKey - The Figma file key
   * @param {Object} fileData - The complete file data
   * @param {Object} stylesData - The styles data
   * @returns {Object} The extracted shadow tokens
   */
  async extractShadowTokens(fileKey, fileData, stylesData) {
    console.log('Extracting shadow tokens...');
    const shadowTokens = {};
    
    // Filter shadow styles (EFFECT type)
    const effectStyles = stylesData.meta.styles.filter(style => 
      style.style_type === 'EFFECT'
    );
    console.log('Found effect styles:', effectStyles.length);
    
    if (effectStyles.length === 0) {
      // Fallback to scanning the document for shadows
      return this.extractShadowsFromDocument(fileData.document);
    }
    
    // Get node IDs for all effect styles
    const styleNodeIds = effectStyles.map(style => style.node_id);
    
    // Get node data for all style nodes
    console.log('Fetching node data for effect styles...');
    const nodesData = await figmaApiService.getNodes(fileKey, styleNodeIds);
    
    // Process each effect style
    for (const style of effectStyles) {
      const nodeId = style.node_id;
      
      // Get the node data
      const nodeData = nodesData.nodes[nodeId];
      if (!nodeData || !nodeData.document) {
        console.log(`No node data found for style: ${style.name} (${nodeId})`);
        continue;
      }
      
      const node = nodeData.document;
      
      // Extract shadow effects from the node
      if (node.effects && node.effects.length > 0) {
        // Filter to only shadow effects
        const shadowEffects = node.effects.filter(
          effect => (effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW') && effect.visible !== false
        );
        
        if (shadowEffects.length > 0) {
          const tokenName = this.formatTokenName(style.name);
          shadowTokens[tokenName] = {
            type: shadowEffects[0].type === 'DROP_SHADOW' ? 'dropShadow' : 'innerShadow',
            values: shadowEffects.map(effect => {
              const { color, offset, radius, spread = 0 } = effect;
              const rgbaColor = `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, ${color.a})`;
              
              return {
                x: `${offset.x}px`,
                y: `${offset.y}px`,
                blur: `${radius}px`,
                spread: `${spread}px`,
                color: rgbaColor
              };
            }),
            value: this.formatShadowValue(shadowEffects),
            description: style.description || '',
            name: style.name
          };
          
          console.log(`Extracted shadow token: ${tokenName}`);
        }
      }
    }
    
    console.log(`Extracted ${Object.keys(shadowTokens).length} shadow tokens`);
    
    // If no shadow tokens found using styles, try alternative method
    if (Object.keys(shadowTokens).length === 0) {
      console.log('No shadow tokens found using styles, trying alternative method...');
      return this.extractShadowsFromDocument(fileData.document);
    }
    
    return shadowTokens;
  }

  /**
   * Extract shadows directly from the document structure
   * @param {Object} document - The document object
   * @returns {Object} The extracted shadow tokens
   */
  async extractShadowsFromDocument(document) {
    console.log('Using alternative shadow extraction method...');
    
    const shadowSet = new Map();
    const shadowTokens = {};
    
    // Function to traverse the document and collect shadow styles
    const traverseForShadows = (node) => {
      // Check for nodes with effects
      if (node.effects && node.effects.length > 0) {
        // Filter to only shadow effects
        const shadowEffects = node.effects.filter(
          effect => (effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW') && effect.visible !== false
        );
        
        if (shadowEffects.length > 0) {
          // Create a key for this shadow style
          const shadowValue = this.formatShadowValue(shadowEffects);
          
          // Only add if not already in the set
          if (!shadowSet.has(shadowValue)) {
            shadowSet.set(shadowValue, {
              type: shadowEffects[0].type === 'DROP_SHADOW' ? 'dropShadow' : 'innerShadow',
              effects: shadowEffects,
              nodeName: node.name
            });
          }
        }
      }
      
      // Recursively check children
      if (node.children) {
        for (const child of node.children) {
          traverseForShadows(child);
        }
      }
    };
    
    // Start traversal from the document root
    traverseForShadows(document);
    
    // Convert map to tokens
    let index = 1;
    for (const [shadowValue, shadowProps] of shadowSet.entries()) {
      const { type, effects, nodeName } = shadowProps;
      
      // Use node name if it looks like a token name, otherwise generate a name
      const tokenName = nodeName.includes('/') ? this.formatTokenName(nodeName) : `shadow${index}`;
      
      shadowTokens[tokenName] = {
        type,
        values: effects.map(effect => {
          const { color, offset, radius, spread = 0 } = effect;
          const rgbaColor = `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, ${color.a})`;
          
          return {
            x: `${offset.x}px`,
            y: `${offset.y}px`,
            blur: `${radius}px`,
            spread: `${spread}px`,
            color: rgbaColor
          };
        }),
        value: shadowValue,
        name: nodeName,
        description: `Auto-extracted shadow style ${index}`
      };
      
      index++;
    }
    
    console.log(`Alternative method found ${Object.keys(shadowTokens).length} shadow styles`);
    return shadowTokens;
  }

  /**
   * Extract border tokens from styles
   * @param {string} fileKey - The Figma file key
   * @param {Object} fileData - The complete file data
   * @param {Object} stylesData - The styles data
   * @returns {Object} The extracted border tokens
   */
  async extractBorderTokens(fileKey, fileData, stylesData) {
    console.log('Extracting border tokens...');
    const borderTokens = {};
    
    // Filter border styles (STROKE type)
    const strokeStyles = stylesData.meta.styles.filter(style => 
      style.style_type === 'STROKE' || style.style_type === 'GRID'
    );
    console.log('Found stroke styles:', strokeStyles.length);
    
    if (strokeStyles.length === 0) {
      // Fallback to scanning the document for borders
      return this.extractBordersFromDocument(fileData.document);
    }
    
    // Get node IDs for all stroke styles
    const styleNodeIds = strokeStyles.map(style => style.node_id);
    
    // Get node data for all style nodes
    console.log('Fetching node data for stroke styles...');
    const nodesData = await figmaApiService.getNodes(fileKey, styleNodeIds);
    
    // Process each stroke style
    for (const style of strokeStyles) {
      const nodeId = style.node_id;
      
      // Get the node data
      const nodeData = nodesData.nodes[nodeId];
      if (!nodeData || !nodeData.document) {
        console.log(`No node data found for style: ${style.name} (${nodeId})`);
        continue;
      }
      
      const node = nodeData.document;
      
      // Extract border properties from the node
      if (node.strokes && node.strokes.length > 0) {
        const { strokes, strokeWeight, strokeAlign, strokeCap, strokeJoin, strokeDashes } = node;
        
        const stroke = strokes[0]; // Use first stroke as reference
        
        if (stroke.type === 'SOLID' && stroke.color) {
          const { r, g, b, a = 1 } = stroke.color;
          const color = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
          
          const tokenName = this.formatTokenName(style.name);
          borderTokens[tokenName] = {
            width: `${strokeWeight}px`,
            style: strokeDashes && strokeDashes.length > 0 ? 'dashed' : 'solid',
            color,
            cap: strokeCap?.toLowerCase() || 'butt',
            join: strokeJoin?.toLowerCase() || 'miter',
            align: strokeAlign?.toLowerCase() || 'center',
            value: `${strokeWeight}px ${strokeDashes && strokeDashes.length > 0 ? 'dashed' : 'solid'} ${color}`,
            description: style.description || '',
            name: style.name
          };
          
          console.log(`Extracted border token: ${tokenName}`);
        }
      }
    }
    
    console.log(`Extracted ${Object.keys(borderTokens).length} border tokens`);
    
    // If no border tokens found using styles, try alternative method
    if (Object.keys(borderTokens).length === 0) {
      console.log('No border tokens found using styles, trying alternative method...');
      return this.extractBordersFromDocument(fileData.document);
    }
    
    return borderTokens;
  }

  /**
   * Extract borders directly from the document structure
   * @param {Object} document - The document object
   * @returns {Object} The extracted border tokens
   */
  async extractBordersFromDocument(document) {
    console.log('Using alternative border extraction method...');
    
    const borderSet = new Map();
    const borderTokens = {};
    
    // Function to traverse the document and collect border styles
    const traverseForBorders = (node) => {
      // Check for nodes with strokes
      if (node.strokes && node.strokes.length > 0 && node.strokeWeight > 0) {
        const { strokes, strokeWeight, strokeAlign, strokeCap, strokeJoin, strokeDashes } = node;
        
        // Only consider solid strokes
        const stroke = strokes.find(s => s.type === 'SOLID' && s.visible !== false);
        
        if (stroke && stroke.color) {
          const { r, g, b, a = 1 } = stroke.color;
          const color = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
          
          // Create a key for this border style
          const borderKey = `${strokeWeight}-${strokeDashes?.length > 0 ? 'dashed' : 'solid'}-${color}`;
          
          // Only add if not already in the set
          if (!borderSet.has(borderKey)) {
            borderSet.set(borderKey, {
              width: strokeWeight,
              style: strokeDashes?.length > 0 ? 'dashed' : 'solid',
              color,
              cap: strokeCap?.toLowerCase() || 'butt',
              join: strokeJoin?.toLowerCase() || 'miter',
              align: strokeAlign?.toLowerCase() || 'center',
              nodeName: node.name
            });
          }
        }
      }
      
      // Recursively check children
      if (node.children) {
        for (const child of node.children) {
          traverseForBorders(child);
        }
      }
    };
    
    // Start traversal from the document root
    traverseForBorders(document);
    
    // Convert map to tokens
    let index = 1;
    for (const [borderKey, borderProps] of borderSet.entries()) {
      const { width, style, color, cap, join, align, nodeName } = borderProps;
      
      // Use node name if it looks like a token name, otherwise generate a name
      const tokenName = nodeName.includes('/') ? this.formatTokenName(nodeName) : `border${index}`;
      
      borderTokens[tokenName] = {
        width: `${width}px`,
        style,
        color,
        cap,
        join,
        align,
        value: `${width}px ${style} ${color}`,
        name: nodeName,
        description: `Auto-extracted border style ${index}`
      };
      
      index++;
    }
    
    console.log(`Alternative method found ${Object.keys(borderTokens).length} border styles`);
    return borderTokens;
  }

  /**
   * Format line height value
   * @param {Object|number} lineHeight - The line height value from Figma
   * @returns {string} Formatted line height
   */
  formatLineHeight(lineHeight) {
    if (typeof lineHeight === 'object') {
      if (lineHeight.unit === 'PIXELS') {
        return `${lineHeight.value}px`;
      } else if (lineHeight.unit === 'PERCENT') {
        return `${lineHeight.value / 100}`;
      }
    }
    return lineHeight ? `${lineHeight}` : 'normal';
  }

  /**
   * Format letter spacing value
   * @param {Object|number} letterSpacing - The letter spacing value from Figma
   * @returns {string} Formatted letter spacing
   */
  formatLetterSpacing(letterSpacing) {
    if (typeof letterSpacing === 'object') {
      if (letterSpacing.unit === 'PIXELS') {
        return `${letterSpacing.value}px`;
      } else if (letterSpacing.unit === 'PERCENT') {
        return `${letterSpacing.value / 100}em`;
      }
    }
    return letterSpacing ? `${letterSpacing}px` : 'normal';
  }

  /**
   * Format text case
   * @param {string} textCase - The text case from Figma
   * @returns {string} Formatted text case
   */
  formatTextCase(textCase) {
    if (textCase === 'UPPER') {
      return 'uppercase';
    } else if (textCase === 'LOWER') {
      return 'lowercase';
    } else if (textCase === 'TITLE') {
      return 'capitalize';
    }
    return 'none';
  }

  /**
   * Format shadow values to CSS-like string
   * @param {Array} shadowEffects - Array of shadow effects
   * @returns {string} Formatted shadow value
   */
  formatShadowValue(shadowEffects) {
    return shadowEffects.map(effect => {
      const { color, offset, radius, spread = 0 } = effect;
      const rgbaColor = `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, ${color.a})`;
      
      return `${offset.x}px ${offset.y}px ${radius}px ${spread}px ${rgbaColor}`;
    }).join(', ');
  }

  /**
   * Format token name from Figma style name
   * @param {string} styleName - The style name from Figma
   * @returns {string} Formatted token name
   */
  formatTokenName(styleName) {
    // Remove any Figma path structure (e.g., "Colors/Primary/500" → "primary500")
    const nameParts = styleName.split('/');
    const baseName = nameParts[nameParts.length - 1].trim();
    
    // Convert to camelCase
    return baseName
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/[^\w-]/g, '') // Remove special characters
      .replace(/-+(\w)/g, (_, c) => c.toUpperCase()) // Convert to camelCase
      .replace(/^([A-Z])/, (_, c) => c.toLowerCase()); // Ensure first character is lowercase
  }

  /**
   * Find all nodes that match a custom pattern/condition
   * @param {Object} node - The node to search from
   * @param {Function} predicate - Function that returns true for matching nodes
   * @returns {Array} Matching nodes
   */
  findNodesByPattern(node, predicate) {
    const matches = [];
    
    const traverse = (node) => {
      // Check if this node matches
      if (predicate(node)) {
        matches.push(node);
      }
      
      // Recursively check children
      if (node.children) {
        for (const child of node.children) {
          traverse(child);
        }
      }
    };
    
    traverse(node);
    return matches;
  }
}

module.exports = new DesignTokenExtractor();