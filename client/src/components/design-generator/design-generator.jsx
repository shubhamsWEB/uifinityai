// client/src/components/design-generator/design-generator.jsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Loader2,
  Wand2,
  Eye,
  Download,
  Copy,
  Check,
  RefreshCw,
  MessageSquare
} from 'lucide-react';

import { useToast } from '@/lib/hooks/use-toast';
import { generateDesign, getAllGeneratedDesigns, regenerateDesign } from '@/lib/api/designs';

export function DesignGenerator({ designSystemId }) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDesign, setGeneratedDesign] = useState(null);
  const [activeTab, setActiveTab] = useState('prompt');
  const [generationHistory, setGenerationHistory] = useState([]);
  const router = useRouter();
  const { toast } = useToast();

  // Load generation history on mount
  useEffect(() => {
    if (designSystemId) {
      loadGenerationHistory();
    }
  }, [designSystemId]);

  // Load generation history
  const loadGenerationHistory = async () => {
    try {
      const data = await getAllGeneratedDesigns();
      if (data && data.generatedDesigns) {
        // Filter by current design system if needed
        const filteredHistory = designSystemId 
          ? data.generatedDesigns.filter(design => design.designSystemId === designSystemId)
          : data.generatedDesigns;
        
        setGenerationHistory(filteredHistory);
      }
    } catch (error) {
      console.error('Error loading generation history:', error);
      setGenerationHistory([]);
    }
  };

  // Handle prompt submission
  const handleGenerateDesign = async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a prompt',
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);
    setActiveTab('generating');

    try {
      const data = await generateDesign({
        prompt,
        designSystemId
      });

      if (data && data.generatedDesign) {
        setGeneratedDesign(data.generatedDesign);
        setActiveTab('preview');
        
        // Reload generation history
        loadGenerationHistory();
        
        toast({
          title: 'Success',
          description: 'Design generated successfully',
          variant: 'success'
        });
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate design',
        variant: 'destructive'
      });
      setActiveTab('prompt');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle design regeneration
  const handleRegenerateDesign = async () => {
    if (!generatedDesign) return;
    
    setIsGenerating(true);

    try {
      const data = await regenerateDesign(generatedDesign.id, {
        prompt
      });

      if (data && data.generatedDesign) {
        setGeneratedDesign(data.generatedDesign);
        
        toast({
          title: 'Success',
          description: 'Design regenerated successfully',
          variant: 'success'
        });
        
        // Reload generation history
        loadGenerationHistory();
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Regeneration error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to regenerate design',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // View design details
  const handleViewDesign = (id) => {
    router.push(`/generated-designs/${id}`);
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="prompt" disabled={isGenerating}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Prompt
          </TabsTrigger>
          <TabsTrigger value="generating" disabled={!isGenerating}>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Generating
          </TabsTrigger>
          <TabsTrigger value="preview" disabled={!generatedDesign || isGenerating}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prompt" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Design Generator</CardTitle>
              <CardDescription>
                Describe the UI you want to generate from your design system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Textarea
                  placeholder="Describe the UI you want to create..."
                  className="min-h-32"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Be specific about layout, components, purpose, and content.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleGenerateDesign}
                disabled={isGenerating || !prompt.trim()}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate Design
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {generationHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Generation History</CardTitle>
                <CardDescription>
                  Your previous design generations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                  {generationHistory.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 border rounded-md hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => handleViewDesign(item.id)}
                    >
                      <p className="font-medium">{item.prompt.substring(0, 60)}...</p>
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                        {item.previewUrl && <span>Preview available</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="generating" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Generating Your Design</CardTitle>
              <CardDescription>
                Creating a design based on your prompt using your design system
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <div className="text-center space-y-2">
                <p className="font-medium">AI is working on your design</p>
                <p className="text-sm text-muted-foreground max-w-md">
                  We're analyzing your prompt, matching components from your design system, 
                  generating the layout, and creating a visual design that adheres to your brand guidelines.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4 mt-4">
          {generatedDesign ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Design Preview</CardTitle>
                </div>
                <CardDescription>
                  Preview of your generated design
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 border-t">
                <div className="flex justify-center bg-gray-50 p-4">
                  {generatedDesign.design.svg ? (
                    <div 
                      className="border shadow-sm bg-white" 
                      dangerouslySetInnerHTML={{ __html: generatedDesign.design.svg }}
                    />
                  ) : (
                    <div className="h-[400px] flex items-center justify-center text-gray-400">
                      No preview available
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab('prompt')}
                >
                  Edit Prompt
                </Button>
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    onClick={handleRegenerateDesign}
                    disabled={isGenerating}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerate
                  </Button>
                  <Button 
                    onClick={() => router.push(`/generated-designs/${generatedDesign.id}`)}
                  >
                    Open in Editor
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Preview Available</CardTitle>
                <CardDescription>
                  Generate a design first to see a preview
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center h-40">
                <Button onClick={() => setActiveTab('prompt')}>
                  Go to Prompt
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}