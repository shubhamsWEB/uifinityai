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
      // Get file data with styles
      const fileData = await figmaApiService.getFile(fileKey);
      const stylesData = await figmaApiService.getFileStyles(fileKey);
      
     // Extract different token types
     const colorTokens = await this.extractColorTokens(fileData, stylesData);
     const typographyTokens = await this.extractTypographyTokens(fileData, stylesData);
     const spacingTokens = await this.extractSpacingTokens(fileData);
     const shadowTokens = await this.extractShadowTokens(fileData, stylesData);
     const borderTokens = await this.extractBorderTokens(fileData, stylesData);
     
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
     throw error;
   }
 }

 /**
  * Extract color tokens from styles
  * @param {Object} fileData - The complete file data
  * @param {Object} stylesData - The styles data
  * @returns {Object} The extracted color tokens
  */
 async extractColorTokens(fileData, stylesData) {
   const colorTokens = {};
   const colorStyles = stylesData.meta.styles.filter(style => style.style_type === 'FILL');
   
   // Get all nodes containing style references
   const styleIds = colorStyles.map(style => style.node_id);
   const nodesData = await this.getNodesWithStyles(fileData.document, styleIds);
   
   // Process each color style
   for (const style of colorStyles) {
     const node = nodesData[style.node_id];
     if (node && node.fills && node.fills.length > 0) {
       const fill = node.fills[0]; // Assuming the first fill is the main one
       
       if (fill.type === 'SOLID') {
         const { r, g, b, a } = fill.color;
         
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
       }
     }
   }
   
   return colorTokens;
 }

 /**
  * Extract typography tokens from styles
  * @param {Object} fileData - The complete file data
  * @param {Object} stylesData - The styles data
  * @returns {Object} The extracted typography tokens
  */
 async extractTypographyTokens(fileData, stylesData) {
   const typographyTokens = {};
   const textStyles = stylesData.meta.styles.filter(style => style.style_type === 'TEXT');
   
   // Get all nodes containing style references
   const styleIds = textStyles.map(style => style.node_id);
   const nodesData = await this.getNodesWithStyles(fileData.document, styleIds);
   
   // Process each text style
   for (const style of textStyles) {
     const node = nodesData[style.node_id];
     if (node && node.style) {
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
     }
   }
   
   return typographyTokens;
 }

 /**
  * Extract spacing tokens from the document
  * @param {Object} fileData - The complete file data
  * @returns {Object} The extracted spacing tokens
  */
 async extractSpacingTokens(fileData) {
   const spacingTokens = {};
   
   // Look for frames that follow spacing naming convention (like "Spacing/4" or "Space-sm")
   const spacingFrames = this.findNodesByNamePattern(fileData.document, /^(spacing|space)/i);
   
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
       }
     }
   }
   
   return spacingTokens;
 }

 /**
  * Extract shadow tokens from styles
  * @param {Object} fileData - The complete file data
  * @param {Object} stylesData - The styles data
  * @returns {Object} The extracted shadow tokens
  */
 async extractShadowTokens(fileData, stylesData) {
   const shadowTokens = {};
   const effectStyles = stylesData.meta.styles.filter(style => style.style_type === 'EFFECT');
   
   // Get all nodes containing style references
   const styleIds = effectStyles.map(style => style.node_id);
   const nodesData = await this.getNodesWithStyles(fileData.document, styleIds);
   
   // Process each effect style
   for (const style of effectStyles) {
     const node = nodesData[style.node_id];
     if (node && node.effects && node.effects.length > 0) {
       // Filter to only shadow effects
       const shadowEffects = node.effects.filter(
         effect => effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW'
       );
       
       if (shadowEffects.length > 0) {
         const tokenName = this.formatTokenName(style.name);
         shadowTokens[tokenName] = {
           type: shadowEffects[0].type === 'DROP_SHADOW' ? 'dropShadow' : 'innerShadow',
           values: shadowEffects.map(effect => {
             const { color, offset, radius, spread } = effect;
             const rgbaColor = `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, ${color.a})`;
             
             return {
               x: `${offset.x}px`,
               y: `${offset.y}px`,
               blur: `${radius}px`,
               spread: `${spread || 0}px`,
               color: rgbaColor
             };
           }),
           value: this.formatShadowValue(shadowEffects),
           description: style.description || '',
           name: style.name
         };
       }
     }
   }
   
   return shadowTokens;
 }

 /**
  * Extract border tokens from styles
  * @param {Object} fileData - The complete file data
  * @param {Object} stylesData - The styles data
  * @returns {Object} The extracted border tokens
  */
 async extractBorderTokens(fileData, stylesData) {
   const borderTokens = {};
   const strokeStyles = stylesData.meta.styles.filter(style => 
     style.style_type === 'STROKE' || style.style_type === 'GRID'
   );
   
   // Get all nodes containing style references
   const styleIds = strokeStyles.map(style => style.node_id);
   const nodesData = await this.getNodesWithStyles(fileData.document, styleIds);
   
   // Process each stroke style
   for (const style of strokeStyles) {
     const node = nodesData[style.node_id];
     if (node) {
       const { strokes, strokeWeight, strokeAlign, strokeCap, strokeJoin, strokeDashes } = node;
       
       if (strokes && strokes.length > 0) {
         const tokenName = this.formatTokenName(style.name);
         
         const stroke = strokes[0]; // Use first stroke as reference
         let color = '';
         
         if (stroke.type === 'SOLID') {
           const { r, g, b, a } = stroke.color;
           color = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
         }
         
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
       }
     }
   }
   
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
   return `${lineHeight}`;
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
   return `${letterSpacing}px`;
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
     const { color, offset, radius, spread } = effect;
     const rgbaColor = `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, ${color.a})`;
     
     return `${offset.x}px ${offset.y}px ${radius}px ${spread || 0}px ${rgbaColor}`;
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
  * Find all nodes that match a name pattern
  * @param {Object} node - The node to search from
  * @param {RegExp} pattern - The pattern to match against
  * @returns {Array} Matching nodes
  */
 findNodesByNamePattern(node, pattern) {
   const matches = [];
   
   const traverse = (node) => {
     if (node.name && pattern.test(node.name)) {
       matches.push(node);
     }
     
     if (node.children) {
       for (const child of node.children) {
         traverse(child);
       }
     }
   };
   
   traverse(node);
   return matches;
 }

 /**
  * Get nodes with specific style references
  * @param {Object} document - The document to search in
  * @param {Array} styleIds - Array of style IDs to look for
  * @returns {Object} Map of style ID to node
  */
 async getNodesWithStyles(document, styleIds) {
   const nodeMap = {};
   
   const traverse = (node) => {
     const styleReferences = [];
     
     // Check for style references in this node
     if (node.styles) {
       for (const [styleType, styleId] of Object.entries(node.styles)) {
         if (styleIds.includes(styleId)) {
           styleReferences.push(styleId);
           nodeMap[styleId] = node;
         }
       }
     }
     
     // Traverse children
     if (node.children) {
       for (const child of node.children) {
         traverse(child);
       }
     }
     
     return styleReferences;
   };
   
   traverse(document);
   return nodeMap;
 }
}

module.exports = new DesignTokenExtractor();