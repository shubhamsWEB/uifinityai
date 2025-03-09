"use client";

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export function PreviewFrame({ code, framework, styleLibrary }) {
  const [loading, setLoading] = useState(true);
  const [htmlContent, setHtmlContent] = useState('');
  
  useEffect(() => {
    if (!code) return;
    
    // Generate HTML content based on the code
    const content = generatePreviewHtml(code, framework, styleLibrary);
    setHtmlContent(content);
    
    // Simulate loading delay
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [code, framework, styleLibrary]);
  
  // Handle iframe load event
  const handleIframeLoad = () => {
    setLoading(false);
  };
  
  return (
    <div className="w-full h-full relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500 mb-2" />
            <p className="text-sm text-gray-500">Loading preview...</p>
          </div>
        </div>
      )}
      
      <iframe
        srcDoc={htmlContent}
        className="w-full h-full border-0"
        title="Component Preview"
        onLoad={handleIframeLoad}
        sandbox="allow-scripts"
      />
    </div>
  );
}

/**
 * Generate HTML content for the preview iframe
 */
function generatePreviewHtml(code, framework, styleLibrary) {
  // Get the required CSS for the style library
  const libraryCss = getStyleLibraryCss(styleLibrary);
  
  // Extract the component name from the code
  const componentNameMatch = code.mainComponent?.match(/function\s+(\w+)|const\s+(\w+)\s*=/);
  const componentName = componentNameMatch 
    ? (componentNameMatch[1] || componentNameMatch[2])
    : 'GeneratedComponent';
  
  // Create HTML with the code embedded
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Component Preview</title>
  ${libraryCss}
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    #root {
      padding: 1rem;
    }
    ${code.styleDefinitions?.css || ''}
  </style>
</head>
<body>
  <div id="root"></div>
  
  <script type="text/babel">
    // Main component
    ${code.mainComponent || ''}
    
    // Sub components
    ${Object.values(code.subComponents || {}).join('\n\n')}
    
    // Render the component
    ReactDOM.createRoot(document.getElementById('root')).render(
      <${componentName} />
    );
  </script>
</body>
</html>
  `;
}

/**
 * Get CSS for the selected style library
 */
function getStyleLibraryCss(styleLibrary) {
  switch (styleLibrary) {
    case 'tailwind':
      return '<script src="https://cdn.tailwindcss.com"></script>';
    case 'chakra':
      return `
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@chakra-ui/css@1/dist/chakra.min.css"
        />
      `;
    case 'styled-components':
      return ''; // Styled components are included in the React code
    default:
      return '';
  }
}