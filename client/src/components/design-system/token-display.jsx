"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Display color tokens
export function ColorTokenDisplay({ tokens }) {
  if (!tokens || Object.keys(tokens).length === 0) {
    return <p className="text-gray-500">No color tokens found.</p>;
  }
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Object.entries(tokens).map(([name, token]) => (
        <div key={name} className="rounded-md overflow-hidden border">
          <div 
            className="h-20 w-full" 
            style={{ backgroundColor: token.value }}
          />
          <div className="p-3">
            <p className="font-medium text-sm">{name}</p>
            <p className="text-xs text-gray-500">{token.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// Display typography tokens
export function TypographyTokenDisplay({ tokens }) {
  if (!tokens || Object.keys(tokens).length === 0) {
    return <p className="text-gray-500">No typography tokens found.</p>;
  }
  
  return (
    <div className="space-y-6">
      {Object.entries(tokens).map(([name, token]) => (
        <div key={name} className="rounded-md border overflow-hidden">
          <div className="p-4 border-b">
            <p 
              style={{ 
                fontFamily: token.fontFamily,
                fontSize: token.fontSize,
                fontWeight: token.fontWeight,
                lineHeight: token.lineHeight,
                letterSpacing: token.letterSpacing,
                textTransform: token.textCase
              }}
            >
              The quick brown fox jumps over the lazy dog
            </p>
          </div>
          <div className="p-3 bg-gray-50">
            <p className="font-medium text-sm">{name}</p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <p className="text-xs text-gray-500">Font: {token.fontFamily}</p>
              <p className="text-xs text-gray-500">Size: {token.fontSize}</p>
              <p className="text-xs text-gray-500">Weight: {token.fontWeight}</p>
              <p className="text-xs text-gray-500">Line Height: {token.lineHeight}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Display spacing tokens
export function SpacingTokenDisplay({ tokens }) {
  if (!tokens || Object.keys(tokens).length === 0) {
    return <p className="text-gray-500">No spacing tokens found.</p>;
  }
  
  return (
    <div className="space-y-4">
      {Object.entries(tokens).map(([name, token]) => {
        // Extract numeric value for visual representation
        const numericValue = parseInt(token.value);
        
        return (
          <div key={name} className="flex items-center space-x-4 border rounded-md p-4">
            <div className="flex items-center justify-center bg-blue-100 rounded-md">
              <div 
                className="bg-blue-500 rounded-sm" 
                style={{ 
                  width: `${Math.min(numericValue, 200)}px`, 
                  height: `${Math.min(numericValue, 60)}px` 
                }}
              />
            </div>
            <div>
              <p className="font-medium text-sm">{name}</p>
              <p className="text-xs text-gray-500">{token.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Display shadow tokens
export function ShadowTokenDisplay({ tokens }) {
  if (!tokens || Object.keys(tokens).length === 0) {
    return <p className="text-gray-500">No shadow tokens found.</p>;
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Object.entries(tokens).map(([name, token]) => (
        <div key={name} className="rounded-md p-4 bg-white">
          <div 
            className="h-24 w-full bg-white rounded-md mb-3" 
            style={{ boxShadow: token.value }}
          />
          <p className="font-medium text-sm">{name}</p>
          <p className="text-xs text-gray-500 mt-1 whitespace-normal break-words">
            {token.value}
          </p>
        </div>
      ))}
    </div>
  );
}

// Display border tokens
export function BorderTokenDisplay({ tokens }) {
  if (!tokens || Object.keys(tokens).length === 0) {
    return <p className="text-gray-500">No border tokens found.</p>;
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Object.entries(tokens).map(([name, token]) => (
        <div key={name} className="rounded-md border overflow-hidden">
          <div className="p-4 flex items-center justify-center">
            <div 
              className="h-16 w-16 rounded-md" 
              style={{ border: token.value }}
            />
          </div>
          <div className="p-3 bg-gray-50">
            <p className="font-medium text-sm">{name}</p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <p className="text-xs text-gray-500">Width: {token.width}</p>
              <p className="text-xs text-gray-500">Style: {token.style}</p>
              <p className="text-xs text-gray-500">Color: {token.color}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Display components
export function ComponentDisplay({ components, componentSets, previews }) {
  if ((!components || components.length === 0) && 
      (!componentSets || Object.keys(componentSets).length === 0)) {
    return <p className="text-gray-500">No components found.</p>;
  }
  
  return (
    <div className="space-y-8">
      {/* Component Sets */}
      {componentSets && Object.entries(componentSets).length > 0 && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Component Sets</h3>
          <div className="grid grid-cols-1 gap-6">
            {Object.entries(componentSets).map(([id, componentSet]) => (
              <Card key={id} className="overflow-hidden border-l-4 border-l-blue-500">
                <CardHeader className="bg-gray-50 pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base">{componentSet.name}</CardTitle>
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                      {componentSet.components?.length || 0} variants
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {componentSet.description || `A collection of ${componentSet.name} variants`}
                  </p>
                </CardHeader>
                <CardContent className="p-4">
                  {/* Preview gallery for the component set */}
                  {componentSet.components?.some(componentId => previews && previews[componentId]) && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-md">
                      <p className="text-xs font-medium text-gray-700 mb-2">Preview Gallery</p>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {componentSet.components
                          .filter(componentId => previews && previews[componentId])
                          .map(componentId => {
                            const component = components.find(c => c.id === componentId);
                            return (
                              <div key={`gallery-${componentId}`} className="flex-shrink-0 border rounded bg-white p-2">
                                <img 
                                  src={previews[componentId]} 
                                  alt={component?.name || 'Component variant'} 
                                  className="h-16 w-auto object-contain"
                                  loading="lazy"
                                />
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {componentSet.components?.map(componentId => {
                      const component = components.find(c => c.id === componentId);
                      if (!component) return null;
                      
                      return (
                        <div key={componentId} className="border rounded-md overflow-hidden hover:shadow-md transition-shadow">
                          {previews && previews[component.id] ? (
                            <div className="bg-gray-50 border-b p-3 flex items-center justify-center">
                              <img 
                                src={previews[component.id]} 
                                alt={component.name} 
                                className="max-w-full max-h-32 object-contain"
                                loading="lazy"
                              />
                            </div>
                          ) : (
                            <div className="bg-gray-50 border-b p-3 h-32 flex items-center justify-center text-gray-400">
                              <div className="text-center">
                                <svg className="w-8 h-8 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p className="mt-1">No Preview</p>
                              </div>
                            </div>
                          )}
                          <div className="p-3">
                            <p className="text-sm font-medium truncate">{component.name}</p>
                            {component.variantProperties && Object.keys(component.variantProperties).length > 0 ? (
                              <div className="mt-2 space-y-1">
                                {Object.entries(component.variantProperties).map(([key, value]) => (
                                  <div key={key} className="flex items-center">
                                    <span className="text-xs text-gray-500 min-w-20">{key}:</span>
                                    <span className="text-xs font-medium ml-1 px-1.5 py-0.5 bg-gray-100 rounded">{value}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-500 mt-1 italic">No variant properties</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      {/* Individual Components */}
      {components && components.filter(component => !component.componentSetId).length > 0 && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Individual Components</h3>
          <Card>
            <CardHeader className="bg-gray-50 pb-3">
              <CardTitle className="text-base">Standalone Components</CardTitle>
              <p className="text-sm text-gray-500">
                Components that are not part of any component set
              </p>
            </CardHeader>
            <CardContent className="p-4">
              {/* Preview gallery for standalone components */}
              {components.filter(component => !component.componentSetId && previews && previews[component.id]).length > 0 && (
                <div className="mb-4 p-3 bg-gray-50 rounded-md">
                  <p className="text-xs font-medium text-gray-700 mb-2">Component Gallery</p>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {components
                      .filter(component => !component.componentSetId && previews && previews[component.id])
                      .map(component => (
                        <div key={`gallery-${component.id}`} className="flex-shrink-0 border rounded bg-white p-2">
                          <img 
                            src={previews[component.id]} 
                            alt={component.name} 
                            className="h-16 w-auto object-contain"
                            loading="lazy"
                          />
                          <p className="text-xs text-center mt-1 text-gray-600 truncate max-w-24">{component.name}</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {components.filter(component => !component.componentSetId).map(component => (
                  <div key={component.id} className="border rounded-md overflow-hidden hover:shadow-md transition-shadow">
                    {previews && previews[component.id] ? (
                      <div className="bg-gray-50 border-b p-3 flex items-center justify-center">
                        <img 
                          src={previews[component.id]} 
                          alt={component.name} 
                          className="max-w-full max-h-32 object-contain"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="bg-gray-50 border-b p-3 h-32 flex items-center justify-center text-gray-400">
                        <div className="text-center">
                          <svg className="w-8 h-8 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="mt-1">No Preview</p>
                        </div>
                      </div>
                    )}
                    <div className="p-3">
                      <p className="text-sm font-medium truncate">{component.name}</p>
                      <div className="flex items-center mt-1">
                        <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded">
                          {component.type || 'Component'}
                        </span>
                        {component.description && (
                          <p className="text-xs text-gray-500 ml-2 truncate">{component.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}