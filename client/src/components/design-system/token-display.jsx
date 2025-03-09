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
    <div className="space-y-6">
      {/* Component Sets */}
      {componentSets && Object.entries(componentSets).map(([id, componentSet]) => (
        <Card key={id} className="overflow-hidden">
          <CardHeader className="bg-gray-50">
            <CardTitle className="text-base">{componentSet.name}</CardTitle>
            <p className="text-sm text-gray-500">
              {componentSet.type || 'Component Set'} • {componentSet.components?.length || 0} variants
            </p>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {componentSet.components?.map(componentId => {
                const component = components.find(c => c.id === componentId);
                if (!component) return null;
                
                return (
                  <div key={componentId} className="border rounded-md p-3">
                    {previews && previews[component.id] ? (
                      <div className="mb-2 bg-gray-100 rounded-md p-2 flex items-center justify-center">
                        <img 
                          src={previews[component.id]} 
                          alt={component.name} 
                          className="max-w-full max-h-24 object-contain" 
                        />
                      </div>
                    ) : (
                      <div className="mb-2 bg-gray-100 rounded-md p-2 h-24 flex items-center justify-center text-gray-400">
                        No Preview
                      </div>
                    )}
                    <p className="text-sm font-medium">{component.name}</p>
                    {component.variantProperties && (
                      <div className="mt-1 space-y-1">
                        {Object.entries(component.variantProperties).map(([key, value]) => (
                          <p key={key} className="text-xs text-gray-500">
                            {key}: <span className="font-medium">{value}</span>
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
      
      {/* Individual Components */}
      {components && components.length > 0 && (
        <Card>
          <CardHeader className="bg-gray-50">
            <CardTitle className="text-base">Individual Components</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {components.filter(component => !component.componentSetId).map(component => (
                <div key={component.id} className="border rounded-md p-3">
                  {previews && previews[component.id] ? (
                    <div className="mb-2 bg-gray-100 rounded-md p-2 flex items-center justify-center">
                      <img 
                        src={previews[component.id]} 
                        alt={component.name} 
                        className="max-w-full max-h-24 object-contain" 
                      />
                    </div>
                  ) : (
                    <div className="mb-2 bg-gray-100 rounded-md p-2 h-24 flex items-center justify-center text-gray-400">
                      No Preview
                    </div>
                  )}
                  <p className="text-sm font-medium">{component.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{component.type}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}