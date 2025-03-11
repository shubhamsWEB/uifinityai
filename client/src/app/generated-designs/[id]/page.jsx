"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Loader2,
  RefreshCw,
  MessageSquare,
  ChevronLeft,
  Star,
  Download,
  Trash,
  Code
} from 'lucide-react';

import { useToast } from '@/lib/hooks/use-toast';
import { 
  getGeneratedDesign, 
  provideFeedback, 
  regenerateDesign, 
  deleteGeneratedDesign, 
  getDesignPreviewUrl 
} from '@/lib/api/designs';

export default function GeneratedDesignPage() {
  const [design, setDesign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(0);
  const [regeneratePrompt, setRegeneratePrompt] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { id } = params;
  
  // Load design on mount
  useEffect(() => {
    if (id) {
      fetchDesign(id);
    }
  }, [id]);
  
  // Fetch design by ID
  const fetchDesign = async (designId) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getGeneratedDesign(designId);
      setDesign(data.generatedDesign);
      // Initialize regenerate prompt with original prompt
      setRegeneratePrompt(data.generatedDesign.prompt);
    } catch (error) {
      setError(error.message || 'Failed to fetch design');
      toast({
        title: "Error",
        description: error.message || 'Failed to fetch design',
        variant: "destructive"
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
      const data = await regenerateDesign(id, { prompt: regeneratePrompt });
      setDesign(data.generatedDesign);
      
      toast({
        title: 'Success',
        description: 'Design regenerated successfully',
        variant: 'success'
      });
      
      // Close dialog by clicking the background
      document.body.click();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to regenerate design',
        variant: 'destructive'
      });
    } finally {
      setIsRegenerating(false);
    }
  };
  
  // Handle deletion
  const handleDelete = async () => {
    try {
      await deleteGeneratedDesign(id);
      
      toast({
        title: 'Success',
        description: 'Design deleted successfully',
        variant: 'success'
      });
      
      // Navigate back to design systems
      router.push('/design-systems');
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete design',
        variant: 'destructive'
      });
    }
  };
  
  // Handle download SVG
  const handleDownloadSVG = () => {
    if (design?.design?.svg) {
      const blob = new Blob([design.design.svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `design-${id}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
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
                <DialogTitle>Delete Generated Design</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this design? This action cannot be undone.
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
          <CardTitle>Generated Design</CardTitle>
          <CardDescription>
            {design?.prompt}
          </CardDescription>
          <div className="mt-2 flex flex-wrap gap-2">
            <div className="bg-gray-100 text-gray-800 px-2 py-0.5 text-xs rounded-full">
              Created: {new Date(design?.createdAt).toLocaleDateString()}
            </div>
          </div>
        </CardHeader>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerate
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Regenerate Design</DialogTitle>
                    <DialogDescription>
                      Modify your prompt or keep it the same to generate a new version
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="regenerate-prompt">Prompt</Label>
                      <Textarea
                        id="regenerate-prompt"
                        value={regeneratePrompt}
                        onChange={(e) => setRegeneratePrompt(e.target.value)}
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
                      onClick={handleRegenerate}
                      disabled={isRegenerating || !regeneratePrompt.trim()}
                    >
                      {isRegenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Regenerating...
                        </>
                      ) : (
                        'Regenerate Design'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleDownloadSVG}
                disabled={!design?.design?.svg}
              >
                <Download className="h-4 w-4 mr-2" />
                Download SVG
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                disabled={true}
              >
                <Code className="h-4 w-4 mr-2" />
                Generate Code
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Design Preview</CardTitle>
            </CardHeader>
            <CardContent className="p-0 border-t">
              <div className="flex justify-center items-center bg-gray-50 p-8">
                {design?.design?.svg ? (
                  <div 
                    className="border shadow-sm bg-white" 
                    dangerouslySetInnerHTML={{ __html: design.design.svg }}
                  />
                ) : (
                  <div className="h-[400px] w-full flex items-center justify-center text-gray-400">
                    No preview available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {design?.requirements && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Design Specifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium">Layout</h3>
                    <p className="text-sm text-gray-600">{design.requirements.layout?.structure}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium">Color Scheme</h3>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {design.requirements.colorScheme?.map((color, index) => (
                        <div key={index} className="flex items-center">
                          <div className="w-4 h-4 rounded-full mr-1" style={{ backgroundColor: color }}></div>
                          <span className="text-xs">{color}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium">Components</h3>
                    <ul className="list-disc pl-5 text-sm text-gray-600 mt-1">
                      {design.requirements.components?.map((component, index) => (
                        <li key={index}>
                          {component.type}: {component.purpose}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium">Content Requirements</h3>
                    <p className="text-sm text-gray-600">{design.requirements.contentRequirements}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}