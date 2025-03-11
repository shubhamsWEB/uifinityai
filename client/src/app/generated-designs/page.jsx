"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAllGeneratedDesigns, deleteGeneratedDesign, getDesignPreviewUrl } from '@/lib/api/designs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Trash, Eye, Calendar } from 'lucide-react';
import { useToast } from '@/lib/hooks/use-toast';

export default function GeneratedDesignsListPage() {
  const [generatedDesigns, setGeneratedDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  // Load all generated designs on mount
  useEffect(() => {
    loadGeneratedDesigns();
  }, []);

  // Load all generated designs
  const loadGeneratedDesigns = async () => {
    try {
      setLoading(true);
      const data = await getAllGeneratedDesigns();
      setGeneratedDesigns(data?.data?.generatedDesigns || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load generated designs',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (id, e) => {
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this design?')) {
      return;
    }
    
    try {
      await deleteGeneratedDesign(id);
      
      // Remove from list
      setGeneratedDesigns(prev => prev.filter(design => design.id !== id));
      
      toast({
        title: 'Success',
        description: 'Design deleted successfully',
        variant: 'success'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete design',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Generated Designs</h1>
      
      {generatedDesigns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-10">
            <p className="text-lg text-muted-foreground mb-4">No designs generated yet</p>
            <Button onClick={() => router.push('/design-systems')}>
              Go to Design Systems
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {generatedDesigns.map((design) => (
            <Card
              key={design.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push(`/generated-designs/${design.id}`)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <CardTitle className="text-lg">{design.prompt.substring(0, 40)}...</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleDelete(design.id, e)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
                <CardDescription className="flex items-center mt-1">
                  <Calendar className="h-3 w-3 mr-1" />
                  {new Date(design.createdAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {design.previewUrl ? (
                  <div className="h-32 bg-gray-50 flex items-center justify-center mb-4 rounded border">
                    <img 
                      src={design.previewUrl} 
                      alt={design.prompt} 
                      className="max-h-full max-w-full object-contain" 
                    />
                  </div>
                ) : (
                  <div className="h-32 bg-gray-50 flex items-center justify-center mb-4 rounded border text-gray-400">
                    No preview available
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Design
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}