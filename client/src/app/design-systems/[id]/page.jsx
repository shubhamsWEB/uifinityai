"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DesignSystemViewer } from '@/components/design-system/design-system-viewer';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  Loader2, 
  Download, 
  Trash
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  getDesignSystemById, 
  exportDesignSystem,
  deleteDesignSystem 
} from '@/lib/api/figma';
import { useToast } from '@/lib/hooks/use-toast';

export default function DesignSystemDetailsPage() {
  const [designSystem, setDesignSystem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { id } = params;
  
  // Load design system on mount
  useEffect(() => {
    if (id) {
      fetchDesignSystem(id);
    }
  }, [id]);
  
  // Fetch design system by ID
  const fetchDesignSystem = async (designSystemId) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDesignSystemById(designSystemId);
      setDesignSystem(data.designSystem);
    } catch (error) {
      setError(error.message || 'Failed to fetch design system');
      toast({
        title: "Error",
        description: error.message || 'Failed to fetch design system',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle export design system
  const handleExport = async () => {
    try {
      const data = await exportDesignSystem(id);
      
      // Create a download link
      const jsonString = JSON.stringify(data.designSystem, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${data.designSystem.name.replace(/\s+/g, '-').toLowerCase()}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export successful",
        description: "Design system JSON has been downloaded",
        variant: "success"
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  // Handle delete design system
  const handleDelete = async () => {
    try {
      await deleteDesignSystem(id);
      
      toast({
        title: "Design system deleted",
        description: "The design system has been deleted successfully",
        variant: "success"
      });
      
      // Navigate back to design systems list
      router.push('/design-system');
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => router.push('/design-system')}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Design Systems
          </Button>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleExport}
            disabled={loading || !designSystem}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="destructive" 
                disabled={loading || !designSystem}
              >
                <Trash className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Are you sure you want to delete this design system?</DialogTitle>
              </DialogHeader>
              <p className="py-4">
                This action cannot be undone. This will permanently delete the design system
                and all its components.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => document.body.click()}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  Delete
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <p className="font-medium">Error loading design system</p>
          <p className="text-sm">{error}</p>
        </div>
      ) : (
        <DesignSystemViewer designSystem={designSystem} />
      )}
    </div>
  );
}