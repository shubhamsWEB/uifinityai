"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { 
  getGeneratedUI, 
  provideFeedback, 
  regenerateUI, 
  refineUI, 
  deleteGeneratedUI 
} from '@/lib/api/ui';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Loader2,
  Copy,
  Download,
  RefreshCw,
  Edit,
  Trash,
  MessageSquare,
  ChevronLeft,
  Star,
  Check
} from 'lucide-react';
import { CodeViewer } from '@/components/ui-generator/code-viewer';
import { PreviewFrame } from '@/components/ui-generator/preview-frame';
import { useToast } from '@/lib/hooks/use-toast';

export default function GeneratedUIPage({ params }) {
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;
  const [generatedUI, setGeneratedUI] = useState(null);
  const [loading, setLoading] = useState(true);
  const [framework, setFramework] = useState('react');
  const [styleLibrary, setStyleLibrary] = useState('tailwind');
  const [activeTab, setActiveTab] = useState('preview');
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(0);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [refineFeedback, setRefineFeedback] = useState('');
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Load the generated UI on mount
  useEffect(() => {
    if (id) {
      loadGeneratedUI();
    }
  }, [id]);

  // Load the generated UI
  const loadGeneratedUI = async () => {
    try {
      setLoading(true);
      const data = await getGeneratedUI(id);
      setGeneratedUI(data.generatedUI);
      
      // Set framework and style library
      if (data.generatedUI.framework) setFramework(data.generatedUI.framework);
      if (data.generatedUI.styleLibrary) setStyleLibrary(data.generatedUI.styleLibrary);
      
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load generated UI',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle feedback submission
  const handleSubmitFeedback = async () => {
    if (!feedback || !rating) {
      toast({
        title: 'Error',
        description: 'Please provide both feedback and rating',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setIsSubmittingFeedback(true);
      await provideFeedback(id, { feedback, rating });
      
      toast({
        title: 'Success',
        description: 'Feedback submitted successfully',
        variant: 'success'
      });
      
      // Reset form
      setFeedback('');
      setRating(0);
      
      // Close dialog by clicking the background
      document.body.click();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit feedback',
        variant: 'destructive'
      });
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // Handle regeneration
  const handleRegenerate = async () => {
    try {
      setIsRegenerating(true);
      const data = await regenerateUI(id, { framework, styleLibrary });
      setGeneratedUI(data.generatedUI);
      
      toast({
        title: 'Success',
        description: 'UI regenerated successfully',
        variant: 'success'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to regenerate UI',
        variant: 'destructive'
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  // Handle refinement
  const handleRefine = async () => {
    if (!refineFeedback) {
      toast({
        title: 'Error',
        description: 'Please provide feedback for refinement',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setIsRefining(true);
      const data = await refineUI(id, { feedback: refineFeedback });
      setGeneratedUI(data.generatedUI);
      
      toast({
        title: 'Success',
        description: 'UI refined successfully',
        variant: 'success'
      });
      
      // Reset form
      setRefineFeedback('');
      
      // Close dialog by clicking the background
      document.body.click();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to refine UI',
        variant: 'destructive'
      });
    } finally {
      setIsRefining(false);
    }
  };

  // Handle deletion
  const handleDelete = async () => {
    try {
      await deleteGeneratedUI(id);
      
      toast({
        title: 'Success',
        description: 'UI deleted successfully',
        variant: 'success'
      });
      
      // Navigate back to design systems
      router.push('/design-systems');
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete UI',
        variant: 'destructive'
      });
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

  // Star rating component
  const StarRating = ({ value, onChange }) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`text-2xl ${
              star <= value ? 'text-yellow-400' : 'text-gray-300'
            }`}
          >
            <Star className="h-6 w-6" fill={star <= value ? "currentColor" : "none"} />
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <Button 
          variant="ghost" 
          className="flex items-center" 
          onClick={() => router.push('/design-systems')}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Design Systems
        </Button>
        
        <div className="flex space-x-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <MessageSquare className="h-4 w-4 mr-2" />
                Feedback
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Provide Feedback</DialogTitle>
                <DialogDescription>
                  Rate your experience and tell us what you think
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="rating">Rating</Label>
                  <StarRating value={rating} onChange={setRating} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="feedback">Feedback</Label>
                  <Textarea
                    id="feedback"
                    placeholder="Tell us what you liked or didn't like..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="min-h-32"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => document.body.click()}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitFeedback}
                  disabled={isSubmittingFeedback}
                >
                  {isSubmittingFeedback ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Feedback'
                )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Generated UI</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this UI? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => document.body.click()}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDelete}
                >
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Generated UI</CardTitle>
          <CardDescription>
            {generatedUI?.prompt}
          </CardDescription>
          <div className="mt-2 flex flex-wrap gap-2">
            <div className="bg-blue-100 text-blue-800 px-2 py-0.5 text-xs rounded-full">
              {generatedUI?.framework}
            </div>
            <div className="bg-purple-100 text-purple-800 px-2 py-0.5 text-xs rounded-full">
              {generatedUI?.styleLibrary}
            </div>
            <div className="bg-gray-100 text-gray-800 px-2 py-0.5 text-xs rounded-full">
              Created: {new Date(generatedUI?.createdAt).toLocaleDateString()}
            </div>
          </div>
        </CardHeader>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
              <Button 
                onClick={handleRegenerate} 
                disabled={isRegenerating}
                className="w-full"
              >
                {isRegenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerate
                  </>
                )}
              </Button>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Edit className="h-4 w-4 mr-2" />
                    Refine
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Refine UI</DialogTitle>
                    <DialogDescription>
                      Provide specific feedback to refine the generated code
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="refineFeedback">Refinement Instructions</Label>
                      <Textarea
                        id="refineFeedback"
                        placeholder="Describe what changes you want..."
                        value={refineFeedback}
                        onChange={(e) => setRefineFeedback(e.target.value)}
                        className="min-h-32"
                      />
                      <p className="text-xs text-muted-foreground">
                        Examples: "Add a search bar at the top", "Make the buttons blue", 
                        "Change the layout to a grid"
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => document.body.click()}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleRefine}
                      disabled={isRefining}
                    >
                      {isRefining ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Refining...
                        </>
                      ) : (
                        'Refine UI'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full"
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
                    Copy Code
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleDownloadCode}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="code">Code</TabsTrigger>
            </TabsList>
            
            <TabsContent value="preview" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Component Preview</CardTitle>
                </CardHeader>
                <CardContent className="p-0 border-t">
                  <div className="h-[600px] relative bg-gray-50">
                    <PreviewFrame 
                      code={generatedUI?.code} 
                      framework={framework} 
                      styleLibrary={styleLibrary} 
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="code" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle>Component Code</CardTitle>
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
                </CardHeader>
                <CardContent className="p-0 border-t">
                  <CodeViewer 
                    code={generatedUI?.code?.mainComponent} 
                    language="jsx"
                  />
                </CardContent>
              </Card>
              
              {Object.keys(generatedUI?.code?.subComponents || {}).length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Sub Components</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(generatedUI?.code?.subComponents || {}).map(([name, code]) => (
                      <div key={name}>
                        <h3 className="text-sm font-medium mb-2">{name}</h3>
                        <CodeViewer code={code} language="jsx" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
              
              {generatedUI?.code?.styleDefinitions?.css && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>CSS Styles</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 border-t">
                    <CodeViewer 
                      code={generatedUI?.code?.styleDefinitions?.css} 
                      language="css"
                    />
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}