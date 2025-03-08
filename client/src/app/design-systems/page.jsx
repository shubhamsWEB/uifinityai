"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DesignSystemUploader } from '@/components/design-system/design-system-uploader';
import { DesignSystemViewer } from '@/components/design-system/design-system-viewer';
import { DesignSystemCard } from '@/components/design-system/design-system-card';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  Plus,
  RefreshCw,
  FileUp
} from 'lucide-react';
import {
  getDesignSystems,
  getDesignSystemById,
  exportDesignSystem,
  deleteDesignSystem
} from '@/lib/api/figma';
import { useToast } from '@/lib/hooks/use-toast';
import { useAuth } from '@/providers/auth-provider';

export default function DesignSystemPage() {
  const [designSystems, setDesignSystems] = useState([]);
  const [activeDesignSystem, setActiveDesignSystem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUploader, setShowUploader] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, loading: authLoading } = useAuth();

  // Check authentication on mount
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Load all design systems on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchDesignSystems();
    }
  }, [isAuthenticated]);

  // Fetch all design systems
  const fetchDesignSystems = async () => {
    try {
      setLoading(true);
      const data = await getDesignSystems();
      setDesignSystems(data.designSystems || []);

      // Set first design system as active if available
      if (data.designSystems && data.designSystems.length > 0 && !activeDesignSystem) {
        setActiveDesignSystem(data.designSystems[0]);
      }
    } catch (error) {
      toast({
        title: "Error fetching design systems",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle view design system
  const handleViewDesignSystem = async (id) => {
    try {
      setLoading(true);
      const data = await getDesignSystemById(id);
      setActiveDesignSystem(data.designSystem);
      setShowUploader(false);
    } catch (error) {
      toast({
        title: "Error fetching design system",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle export design system
  const handleExportDesignSystem = async (id) => {
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
  const handleDeleteDesignSystem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this design system?')) {
      return;
    }

    try {
      await deleteDesignSystem(id);

      // Remove from list
      setDesignSystems(prev => prev.filter(ds => ds._id !== id));

      // If active design system was deleted, set another one as active
      if (activeDesignSystem && activeDesignSystem._id === id) {
        const remaining = designSystems.filter(ds => ds._id !== id);
        if (remaining.length > 0) {
          setActiveDesignSystem(remaining[0]);
        } else {
          setActiveDesignSystem(null);
          setShowUploader(true);
        }
      }

      toast({
        title: "Design system deleted",
        description: "The design system has been deleted successfully",
        variant: "success"
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Handle upload complete
  const handleUploadComplete = (designSystem) => {
    setDesignSystems(prev => [designSystem, ...prev]);
    setActiveDesignSystem(designSystem);
    setShowUploader(false);
  };

  // If still checking authentication or not authenticated, show loading
  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f5f5] to-[#e0e0e0]">
      <div className="container mx-auto py-12 px-4 max-w-3xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Design Systems</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={fetchDesignSystems}
              disabled={loading}
              size="sm"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-2 hidden sm:inline">Refresh</span>
            </Button>
            <Button
              onClick={() => setShowUploader(true)}
              disabled={loading}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span>New Design System</span>
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          {showUploader || designSystems.length === 0 ? (
            <DesignSystemUploader onUploadComplete={handleUploadComplete} />
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">
                  {activeDesignSystem?.name || "Select a Design System"}
                </h2>
                <Button
                  variant="outline"
                  onClick={() => setShowUploader(true)}
                  size="sm"
                >
                  Upload New
                </Button>
              </div>
              
              {activeDesignSystem ? (
                <DesignSystemViewer designSystem={activeDesignSystem} />
              ) : (
                <div className="text-center p-10">
                  <p className="text-gray-500">Select a design system to view</p>
                </div>
              )}
              
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4 text-gray-700">Your Design Systems</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {loading ? (
                    <div className="flex items-center justify-center h-40 col-span-full">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                  ) : (
                    designSystems.map(ds => (
                      <DesignSystemCard
                        key={ds._id}
                        designSystem={ds}
                        isActive={activeDesignSystem && activeDesignSystem._id === ds._id}
                        onView={() => handleViewDesignSystem(ds._id)}
                        onExport={() => handleExportDesignSystem(ds._id)}
                        onDelete={() => handleDeleteDesignSystem(ds._id)}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}