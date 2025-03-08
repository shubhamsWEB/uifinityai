"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  getDesignSystems, 
  getDesignSystemById, 
  exportDesignSystem,
  deleteDesignSystem,
  uploadFigmaDesignSystem,
  importDesignSystem
} from '@/lib/api/figma';
import { useToast } from '@/lib/hooks/use-toast';

export function useDesignSystem() {
  const [designSystems, setDesignSystems] = useState([]);
  const [activeDesignSystem, setActiveDesignSystem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast } = useToast();
  
  // Fetch all design systems
  const fetchDesignSystems = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDesignSystems();
      setDesignSystems(data.designSystems || []);
      
      // Set first design system as active if available and none is active
      if (data.designSystems?.length > 0 && !activeDesignSystem) {
        setActiveDesignSystem(data.designSystems[0]);
      }
      
      return data.designSystems;
    } catch (err) {
      setError(err.message || 'Failed to fetch design systems');
      toast({
        title: "Error",
        description: err.message || 'Failed to fetch design systems',
        variant: "destructive"
      });
      return [];
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch a specific design system by ID
  const fetchDesignSystem = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDesignSystemById(id);
      setActiveDesignSystem(data.designSystem);
      return data.designSystem;
    } catch (err) {
      setError(err.message || 'Failed to fetch design system');
      toast({
        title: "Error",
        description: err.message || 'Failed to fetch design system',
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  // Upload Figma design system
  const uploadDesignSystem = async (fileKey, token, progressCallback) => {
    try {
      setLoading(true);
      setError(null);
      const designSystem = await uploadFigmaDesignSystem(fileKey, token, progressCallback);
      
      // Add to list and set as active
      setDesignSystems(prev => [designSystem, ...prev]);
      setActiveDesignSystem(designSystem);
      
      toast({
        title: "Success",
        description: "Design system successfully extracted from Figma",
        variant: "success"
      });
      
      return designSystem;
    } catch (err) {
      setError(err.message || 'Failed to upload design system');
      toast({
        title: "Upload failed",
        description: err.message || 'Failed to upload design system',
        variant: "destructive"
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Import design system from JSON
  const importFromJson = async (jsonData) => {
    try {
      setLoading(true);
      setError(null);
      const designSystem = await importDesignSystem(jsonData);
      
      // Add to list and set as active
      setDesignSystems(prev => [designSystem, ...prev]);
      setActiveDesignSystem(designSystem);
      
      toast({
        title: "Success",
        description: "Design system successfully imported",
        variant: "success"
      });
      
      return designSystem;
    } catch (err) {
      setError(err.message || 'Failed to import design system');
      toast({
        title: "Import failed",
        description: err.message || 'Failed to import design system',
        variant: "destructive"
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Export design system to JSON
  const exportToJson = async (id) => {
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
      
      return data.designSystem;
    } catch (err) {
      toast({
        title: "Export failed",
        description: err.message || 'Failed to export design system',
        variant: "destructive"
      });
      throw err;
    }
  };
  
  // Delete design system
  const removeDesignSystem = async (id) => {
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
        }
      }
      
      toast({
        title: "Design system deleted",
        description: "The design system has been deleted successfully",
        variant: "success"
      });
      
      return true;
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err.message || 'Failed to delete design system',
        variant: "destructive"
      });
      throw err;
    }
  };
  
  // Initialize by fetching design systems
  useEffect(() => {
    fetchDesignSystems();
  }, []);
  
  return {
    designSystems,
    activeDesignSystem,
    loading,
    error,
    fetchDesignSystems,
    fetchDesignSystem,
    uploadDesignSystem,
    importFromJson,
    exportToJson,
    removeDesignSystem,
    setActiveDesignSystem
  };
}