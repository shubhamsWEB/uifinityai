"use client";

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PaletteIcon, TypeIcon, BoxIcon, CloudLightningIcon, SquareIcon, ComponentIcon } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ColorTokenDisplay, 
  TypographyTokenDisplay, 
  SpacingTokenDisplay,
  ShadowTokenDisplay,
  BorderTokenDisplay,
  ComponentDisplay
} from '@/components/design-system/token-display';

export function DesignSystemViewer({ designSystem }) {
  const [activeTab, setActiveTab] = useState('colors');
  
  if (!designSystem) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Design System</CardTitle>
          <CardDescription>
            No design system loaded. Upload a design system to view its tokens and components.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  const { tokens, components, componentSets } = designSystem;
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{designSystem.name}</CardTitle>
        <CardDescription>
          {designSystem.description || 'Design system tokens and components'}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="colors" className="flex items-center">
              <PaletteIcon className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Colors</span>
            </TabsTrigger>
            <TabsTrigger value="typography" className="flex items-center">
              <TypeIcon className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Typography</span>
            </TabsTrigger>
            <TabsTrigger value="spacing" className="flex items-center">
              <BoxIcon className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Spacing</span>
            </TabsTrigger>
            <TabsTrigger value="shadows" className="flex items-center">
              <CloudLightningIcon className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Shadows</span>
            </TabsTrigger>
            <TabsTrigger value="borders" className="flex items-center">
              <SquareIcon className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Borders</span>
            </TabsTrigger>
            <TabsTrigger value="components" className="flex items-center">
              <ComponentIcon className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Components</span>
            </TabsTrigger>
          </TabsList>
          
          <ScrollArea className="h-[500px] pr-4">
            <TabsContent value="colors">
              <ColorTokenDisplay tokens={tokens.colors} />
            </TabsContent>
            
            <TabsContent value="typography">
              <TypographyTokenDisplay tokens={tokens.typography} />
            </TabsContent>
            
            <TabsContent value="spacing">
              <SpacingTokenDisplay tokens={tokens.spacing} />
            </TabsContent>
            
            <TabsContent value="shadows">
              <ShadowTokenDisplay tokens={tokens.shadows} />
            </TabsContent>
            
            <TabsContent value="borders">
              <BorderTokenDisplay tokens={tokens.borders} />
            </TabsContent>
            
            <TabsContent value="components">
              <ComponentDisplay 
                components={components} 
                componentSets={componentSets} 
                previews={designSystem.componentPreviews}
              />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
}