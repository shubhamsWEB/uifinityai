"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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