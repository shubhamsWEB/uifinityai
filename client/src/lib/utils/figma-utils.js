/**
 * Extract Figma file key from a Figma URL
 * @param {string} url - Figma file URL
 * @returns {string|null} The extracted file key or null if invalid
 */
export function extractFigmaFileKey(url) {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      
      // Find the file key part in the URL
      for (let i = 0; i < pathParts.length; i++) {
        // Figma file keys typically look like this: abc123DEF456xyz
        if (/^[a-zA-Z0-9]{8,}$/.test(pathParts[i])) {
          return pathParts[i];
        }
      }
      
      return null;
    } catch (err) {
      return null;
    }
  }
  
  /**
   * Check if a Figma personal access token is valid
   * @param {string} token - The token to validate
   * @returns {boolean} Is the token in the correct format
   */
  export function validateFigmaToken(token) {
    // Figma personal access tokens start with "figd_"
    return /^figd_[a-zA-Z0-9_-]{1,}$/i.test(token);
  }
  
  /**
   * Convert Figma color to CSS color
   * @param {Object} figmaColor - Figma RGBA color object
   * @returns {string} CSS color string
   */
  export function figmaColorToCss(figmaColor) {
    if (!figmaColor) return '';
    
    const { r, g, b, a = 1 } = figmaColor;
    
    // Handle RGB
    const rgb = {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
    
    if (a === 1) {
      return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    }
    
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`;
  }
  
  /**
   * Convert Figma linear gradient to CSS
   * @param {Object} figmaGradient - Figma gradient object
   * @returns {string} CSS gradient
   */
  export function figmaGradientToCss(figmaGradient) {
    if (!figmaGradient || figmaGradient.type !== 'GRADIENT_LINEAR') {
      return '';
    }
    
    const { gradientStops, gradientHandlePositions } = figmaGradient;
    
    // Calculate angle from handle positions
    const [start, end] = gradientHandlePositions;
    const angle = Math.atan2(end.y - start.y, end.x - start.x) * (180 / Math.PI);
    
    // Generate gradient stops
    const stops = gradientStops.map(stop => {
      const color = figmaColorToCss(stop.color);
      return `${color} ${Math.round(stop.position * 100)}%`;
    }).join(', ');
    
    return `linear-gradient(${angle}deg, ${stops})`;
  }