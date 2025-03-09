"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Loader2,
  Wand2,
  Code,
  Eye,
  Download,
  Copy,
  Check,
  RefreshCw,
  MessageSquare
} from 'lucide-react';

import { useToast } from '@/lib/hooks/use-toast';
import { generateUI, getGeneratedUIs } from '@/lib/api/ui';
import { CodeViewer } from './code-viewer';
import { PreviewFrame } from './preview-frame';

export function UIGenerator({ designSystemId }) {
  const [prompt, setPrompt] = useState('');
  const [framework, setFramework] = useState('react');
  const [styleLibrary, setStyleLibrary] = useState('tailwind');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedUI, setGeneratedUI] = useState(null);
  const [activeTab, setActiveTab] = useState('prompt');
  const [copied, setCopied] = useState(false);
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
      const data = await getGeneratedUIs();
      // Check if data.generatedUIs exists before filtering
      if (data && data.generatedUIs) {
        // Filter by current design system
        const filteredHistory = data.generatedUIs.filter(
          ui => ui.designSystemId === designSystemId
        );
        setGenerationHistory(filteredHistory);
      } else {
        // Handle case where data.generatedUIs is undefined
        setGenerationHistory([]);
      }
    } catch (error) {
      console.error('Error loading generation history:', error);
      setGenerationHistory([]);
    }
  };

  // Handle prompt submission
  const handleGenerateUI = async () => {
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
      const data = await generateUI({
        prompt,
        designSystemId,
        framework,
        styleLibrary
      });

      if (data && data.generatedUI) {
        setGeneratedUI(data.generatedUI);
        setActiveTab('preview');
        
        // Reload generation history
        loadGenerationHistory();
        
        toast({
          title: 'Success',
          description: 'UI generated successfully',
          variant: 'success'
        });
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate UI',
        variant: 'destructive'
      });
      setActiveTab('prompt');
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy code to clipboard
  const handleCopyCode = () => {
    if (generatedUI?.code?.mainComponent) {
      navigator.clipboard.writeText(generatedUI.code.mainComponent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast({
        title: 'Copied',
        description: 'Component code copied to clipboard',
      });
    }
  };

  // Download code as file
  const handleDownloadCode = () => {
    if (generatedUI?.code?.mainComponent) {
      const filename = `${generatedUI.id || 'component'}.jsx`;
      const blob = new Blob([generatedUI.code.mainComponent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Downloaded',
        description: `Component saved as ${filename}`,
      });
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="prompt" disabled={isGenerating}>
            <Wand2 className="h-4 w-4 mr-2" />
            Prompt
          </TabsTrigger>
          <TabsTrigger value="generating" disabled={!isGenerating}>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Generating
          </TabsTrigger>
          <TabsTrigger value="preview" disabled={!generatedUI || isGenerating}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="code" disabled={!generatedUI || isGenerating}>
            <Code className="h-4 w-4 mr-2" />
            Code
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prompt" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Generate UI</CardTitle>
              <CardDescription>
                Describe the UI you want to generate from your design system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prompt">Prompt</Label>
                <Textarea
                  id="prompt"
                  placeholder="Describe the UI you want to create..."
                  className="min-h-32"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Be specific about layout, components, and functionality.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="framework">Framework</Label>
                  <Select value={framework} onValueChange={setFramework}>
                    <SelectTrigger id="framework">
                      <SelectValue placeholder="Select framework" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="react">React</SelectItem>
                      <SelectItem value="next">Next.js</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="styleLibrary">Style Library</Label>
                  <Select value={styleLibrary} onValueChange={setStyleLibrary}>
                    <SelectTrigger id="styleLibrary">
                      <SelectValue placeholder="Select style library" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tailwind">Tailwind CSS</SelectItem>
                      <SelectItem value="chakra">Chakra UI</SelectItem>
                      <SelectItem value="styled-components">Styled Components</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleGenerateUI}
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
                    Generate UI
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
                  Your previous UI generations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                  {generationHistory.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 border rounded-md hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => router.push(`/generated-ui/${item.id}`)}
                    >
                      <p className="font-medium">{item.prompt.substring(0, 60)}...</p>
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                        <span>{item.framework} / {item.styleLibrary}</span>
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
              <CardTitle>Generating Your UI</CardTitle>
              <CardDescription>
                Converting your prompt into code using your design system
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <div className="text-center space-y-2">
                <p className="font-medium">AI is working on your UI</p>
                <p className="text-sm text-muted-foreground max-w-md">
                  We're analyzing your prompt, matching components from your design system, 
                  generating the layout, and creating production-ready code.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4 mt-4">
          {generatedUI ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>UI Preview</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setActiveTab('code')}>
                      <Code className="h-4 w-4 mr-2" />
                      View Code
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  See how your generated UI looks
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 border-t">
                <div className="h-[500px] relative bg-gray-50">
                  <PreviewFrame code={generatedUI.code} framework={framework} styleLibrary={styleLibrary} />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab('prompt')}
                >
                  Edit Prompt
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => router.push(`/generated-ui/${generatedUI.id}`)}
                >
                  Open in Editor
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Preview Available</CardTitle>
                <CardDescription>
                  Generate a UI first to see a preview
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

        <TabsContent value="code" className="space-y-4 mt-4">
          {generatedUI ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Generated Code</CardTitle>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleCopyCode}
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleDownloadCode}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  {framework} component with {styleLibrary}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 border-t">
                <CodeViewer 
                  code={generatedUI.code.mainComponent} 
                  language="jsx" 
                />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab('preview')}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Preview
                </Button>
                <Button>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Provide Feedback
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Code Available</CardTitle>
                <CardDescription>
                  Generate a UI first to see the code
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