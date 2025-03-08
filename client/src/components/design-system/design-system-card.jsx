"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Download, Trash } from 'lucide-react';
import { formatDate } from '@/lib/utils/format-utils';

export function DesignSystemCard({ 
  designSystem, 
  onView, 
  onExport, 
  onDelete,
  isActive = false
}) {
  const { name, description, createdAt, tokens = {}, components = [] } = designSystem;
  
  const colorCount = tokens.colors ? Object.keys(tokens.colors).length : 0;
  const componentCount = components.length || 0;
  
  return (
    <Card className={`overflow-hidden ${isActive ? 'border-blue-500 border-2' : ''}`}>
      <CardHeader className="pb-3">
        <CardTitle>{name}</CardTitle>
        <CardDescription>
          {description || 'No description provided'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
            {colorCount} colors
          </span>
          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
            {componentCount} components
          </span>
          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">
            Created {formatDate(createdAt)}
          </span>
        </div>

        {/* Color Preview */}
        {colorCount > 0 && (
          <div className="flex gap-1 mb-4">
            {Object.values(tokens.colors)
              .slice(0, 8)
              .map((color, index) => (
                <div
                  key={index}
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            {colorCount > 8 && (
              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600">
                +{colorCount - 8}
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-4 flex justify-between">
        <Button variant="outline" size="sm" onClick={onView}>
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="text-red-500 hover:text-red-700" onClick={onDelete}>
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}