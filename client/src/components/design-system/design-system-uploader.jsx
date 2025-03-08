"use client";

import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, FileUp, Link2, Loader2, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { uploadFigmaDesignSystem, importDesignSystem } from '@/lib/api/figma';
import { useToast } from '@/lib/hooks/use-toast';

export function DesignSystemUploader({ onUploadComplete }) {
  const [activeTab, setActiveTab] = useState('figma');
  const [figmaFileUrl, setFigmaFileUrl] = useState('');
  const [figmaToken, setFigmaToken] = useState('');
  const [jsonFile, setJsonFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { toast } = useToast();
  
  // Extract Figma file key from URL
  const extractFigmaFileKey = (url) => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      
      // Find the file key part in the URL
      for (let i = 0; i < pathParts.length; i++) {
        // Figma file keys typically look like this: abc123DEF456xyz
        if (/^[a-zA-Z0-9]{8,}$/.test(pathParts[i])) {
          return pathParts[i];
        }
      }
      
      throw new Error('Could not find a valid Figma file key in the URL');
    } catch (err) {
      setError(err.message || 'Invalid Figma URL format');
      return null;
    }
  };
  
  // Handle file upload from JSON
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/json') {
        setError('Please upload a JSON file');
        return;
      }
      
      setJsonFile(file);
      setError('');
    }
  };
  
  // Handle Figma file upload
  const handleFigmaUpload = async () => {
    setError('');
    setSuccess('');
    
    if (!figmaFileUrl.trim()) {
      setError('Please enter a Figma file URL');
      return;
    }
    
    if (!figmaToken.trim()) {
      setError('Please enter your Figma access token');
      return;
    }
    
    const fileKey = extractFigmaFileKey(figmaFileUrl);
    if (!fileKey) return; // Error is set in extractFigmaFileKey
    
    setIsUploading(true);
    setUploadProgress(10);
    
    try {
      // Extract and save design system
      setUploadProgress(30);
      
      const designSystem = await uploadFigmaDesignSystem(fileKey, figmaToken, (progress) => {
        setUploadProgress(30 + progress * 0.7);
      });
      
      setUploadProgress(100);
      
      setSuccess('Design system successfully extracted and saved!');
      toast({
        title: "Success!",
        description: "Design system successfully extracted from Figma",
        variant: "success"
      });
      
      if (onUploadComplete) {
        onUploadComplete(designSystem);
      }
    } catch (err) {
      setError(err.message || 'An error occurred during upload');
      toast({
        title: "Upload failed",
        description: err.message || 'An error occurred during upload',
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  // Handle JSON file upload
  const handleJsonUpload = async () => {
    setError('');
    setSuccess('');
    
    if (!jsonFile) {
      setError('Please select a JSON file');
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(20);
    
    try {
      // Read the file
      const reader = new FileReader();
      
      // Create a Promise to handle the FileReader
      const fileData = await new Promise((resolve, reject) => {
        reader.onload = (event) => resolve(event.target.result);
        reader.onerror = (error) => reject(error);
        reader.readAsText(jsonFile);
      });
      
      setUploadProgress(50);
      
      // Parse JSON
      let designSystemData;
      try {
        designSystemData = JSON.parse(fileData);
      } catch (err) {
        throw new Error('Invalid JSON format');
      }
      
      // Import the design system
      const designSystem = await importDesignSystem(designSystemData);
      
      setUploadProgress(100);
      
      setSuccess('Design system successfully imported!');
      toast({
        title: "Success!",
        description: "Design system successfully imported",
        variant: "success"
      });
      
      if (onUploadComplete) {
        onUploadComplete(designSystem);
      }
    } catch (err) {
      setError(err.message || 'An error occurred during import');
      toast({
        title: "Import failed",
        description: err.message || 'An error occurred during import',
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  // Render progress indicator
  const renderProgress = () => {
    return (
      <div className="w-full mt-4">
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
            style={{ width: `${uploadProgress}%` }} 
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">
          {uploadProgress < 100 ? 'Processing...' : 'Complete!'}
        </p>
      </div>
    );
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upload Design System</CardTitle>
        <CardDescription>
          Import your design system from Figma or upload a JSON file
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="figma" className="flex items-center">
              <Link2 className="mr-2 h-4 w-4" />
              Figma
            </TabsTrigger>
            <TabsTrigger value="json" className="flex items-center">
              <FileUp className="mr-2 h-4 w-4" />
              JSON File
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="figma" className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="figma-url">Figma File URL</Label>
              <Input
                id="figma-url"
                placeholder="https://www.figma.com/file/..."
                value={figmaFileUrl}
                onChange={(e) => setFigmaFileUrl(e.target.value)}
                disabled={isUploading}
              />
              <p className="text-xs text-gray-500">
                Copy the URL of your Figma file from the browser address bar
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="figma-token">Personal Access Token</Label>
              <Input
                id="figma-token"
                type="password"
                placeholder="figd_..."
                value={figmaToken}
                onChange={(e) => setFigmaToken(e.target.value)}
                disabled={isUploading}
              />
              <p className="text-xs text-gray-500">
                Create a personal access token in Figma (Account Settings &gt; Personal Access Tokens)
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="json" className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="json-file">Upload JSON File</Label>
              <Input
                id="json-file"
                type="file"
                accept="application/json"
                onChange={handleFileChange}
                disabled={isUploading}
              />
              <p className="text-xs text-gray-500">
                Upload a previously exported design system JSON file
              </p>
            </div>
          </TabsContent>
        </Tabs>
        
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mt-4 bg-green-50 text-green-800 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
        
        {isUploading && renderProgress()}
      </CardContent>
      
      <CardFooter className="flex justify-end">
        <Button
          onClick={activeTab === 'figma' ? handleFigmaUpload : handleJsonUpload}
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Upload Design System'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}