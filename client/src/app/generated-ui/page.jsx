"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getGeneratedUIs, deleteGeneratedUI } from '@/lib/api/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Trash, Eye, Calendar } from 'lucide-react';
import { useToast } from '@/lib/hooks/use-toast';

export default function GeneratedUIListPage() {
  const [generatedUIs, setGeneratedUIs] = useState([]);
  console.log("🚀 ~ GeneratedUIListPage ~ generatedUIs:", generatedUIs);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  // Load all generated UIs on mount
  useEffect(() => {
    loadGeneratedUIs();
  }, []);

  // Load all generated UIs
  const loadGeneratedUIs = async () => {
    try {
      setLoading(true);
      const data = await getGeneratedUIs();
      console.log("🚀 ~ loadGeneratedUIs ~ data:", data);
      setGeneratedUIs(data?.data?.generatedUIs || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load generated UIs',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (id, e) => {
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this UI?')) {
      return;
    }
    
    try {
      await deleteGeneratedUI(id);
      
      // Remove from list
      setGeneratedUIs(prev => prev.filter(ui => ui.id !== id));
      
      toast({
        title: 'Success',
        description: 'UI deleted successfully',
        variant: 'success'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete UI',
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
      <h1 className="text-3xl font-bold mb-6">Generated UIs</h1>
      
      {generatedUIs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-10">
            <p className="text-lg text-muted-foreground mb-4">No UIs generated yet</p>
            <Button onClick={() => router.push('/design-systems')}>
              Go to Design Systems
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {generatedUIs.map((ui) => (
            <Card
              key={ui.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push(`/generated-ui/${ui.id}`)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <CardTitle className="text-lg">{ui.prompt.substring(0, 40)}...</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleDelete(ui.id, e)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
                <CardDescription className="flex items-center mt-1">
                  <Calendar className="h-3 w-3 mr-1" />
                  {new Date(ui.createdAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="bg-blue-100 text-blue-800 px-2 py-0.5 text-xs rounded-full">
                    {ui.framework}
                  </span>
                  <span className="bg-purple-100 text-purple-800 px-2 py-0.5 text-xs rounded-full">
                    {ui.styleLibrary}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View UI
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}