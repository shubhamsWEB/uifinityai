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
  ArrowLeft
} from 'lucide-react';
import {
  getDesignSystems,
  getDesignSystemById,
  exportDesignSystem,
  deleteDesignSystem
} from '@/lib/api/figma';
import { useToast } from '@/lib/hooks/use-toast';
import { useAuth } from '@/providers/auth-provider';
import { ScrollArea } from '@/components/ui/scroll-area';

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

  // Add this CSS class somewhere in your component
  const truncateStyles = {
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    textOverflow: "ellipsis",
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-3xl font-bold text-foreground">Design Systems</h1>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={fetchDesignSystems}
                disabled={loading}
                size="sm"
                aria-label="Refresh design systems"
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
                aria-label="Create new design system"
                className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                <span>New Design System</span>
              </Button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar with design system list */}
          <aside className="lg:col-span-3">
            <div className="bg-card rounded-lg shadow-sm border p-4">
              <h2 className="text-lg font-medium mb-4">Your Design Systems</h2>
              
              {loading && designSystems.length === 0 ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : designSystems.length === 0 ? (
                <div className="text-center p-6 bg-muted/50 rounded-md">
                  <p className="text-muted-foreground">No design systems yet</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => setShowUploader(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create your first
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-[calc(100vh-280px)]">
                  <div className="space-y-3">
                    {designSystems.map(ds => (
                      <button
                        key={ds._id}
                        onClick={() => handleViewDesignSystem(ds._id)}
                        className={`w-full text-left p-2 rounded-md transition-colors ${
                          activeDesignSystem && activeDesignSystem._id === ds._id
                            ? 'bg-gradient-to-r from-blue-200 to-indigo-50 border'
                            : 'bg-card hover:bg-accent border border-border'
                        }`}
                        aria-current={activeDesignSystem && activeDesignSystem._id === ds._id ? 'page' : undefined}
                      >
                        <h3 
                          className="font-medium" 
                          style={truncateStyles} 
                          title={ds.name}
                        >
                          {ds.name}
                        </h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                            {Object.keys(ds.tokens?.colors || {}).length} colors
                          </span>
                          <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-xs">
                            {ds.components?.length || 0} components
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </aside>

          {/* Main content area */}
          <main className="lg:col-span-9">
            <div className="bg-card rounded-lg shadow-sm border p-6">
              {showUploader || designSystems.length === 0 ? (
                <div>
                  {showUploader && designSystems.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mb-4"
                      onClick={() => setShowUploader(false)}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to design systems
                    </Button>
                  )}
                  <DesignSystemUploader onUploadComplete={handleUploadComplete} />
                </div>
              ) : (
                <div className="space-y-6">
                  {activeDesignSystem ? (
                    <>
                      <div className="flex justify-between items-center gap-4">
                        <div>
                          <h2 
                            className="text-2xl font-semibold text-foreground"
                            style={truncateStyles}
                            title={activeDesignSystem.name}
                          >
                            {activeDesignSystem.name}
                          </h2>
                          {activeDesignSystem.description && (
                            <p 
                              className="text-muted-foreground mt-1"
                              style={truncateStyles}
                              title={activeDesignSystem.description}
                            >
                              {activeDesignSystem.description}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExportDesignSystem(activeDesignSystem._id)}
                          >
                            Export
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteDesignSystem(activeDesignSystem._id)}
                          >
                            Delete
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/design-systems/${activeDesignSystem._id}/generate-design`)}
                          >
                            Generate Design
                          </Button>
                          {/* <Button
                            variant="outline"
                            onClick={() => setShowUploader(true)}
                            size="sm"
                          >
                            Upload New
                          </Button> */}
                        </div>
                      </div>
                      
                      <DesignSystemViewer designSystem={activeDesignSystem} />
                    </>
                  ) : (
                    <div className="text-center p-10">
                      <p className="text-muted-foreground">Select a design system to view</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}