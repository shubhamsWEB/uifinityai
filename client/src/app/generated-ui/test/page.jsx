'use client';
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

const UIGenerationDemo = () => {
  // State for form inputs
  const [prompt, setPrompt] = useState('');
  const [designSystemId, setDesignSystemId] = useState('');
  const [framework, setFramework] = useState('react');
  const [styleLibrary, setStyleLibrary] = useState('tailwind');
  const [feedback, setFeedback] = useState('');
  
  // State for UI generation process
  const [mockups, setMockups] = useState([]);
  const [selectedMockup, setSelectedMockup] = useState(null);
  const [isGeneratingMockup, setIsGeneratingMockup] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [error, setError] = useState(null);
  
  // Fetch existing mockups on component mount
  useEffect(() => {
    fetchMockups();
  }, []);
  
  // Fetch mockups from API
  const fetchMockups = async () => {
    try {
      const response = await fetch('/api/ai/generate', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMockups(data.data.generatedUIs);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Failed to fetch mockups');
      console.error(error);
    }
  };
  
  // Generate UI mockup (Phase 1)
  const generateMockup = async () => {
    if (!prompt || !designSystemId) {
      setError('Prompt and design system ID are required');
      return;
    }
    
    setIsGeneratingMockup(true);
    setError(null);
    
    try {
      const response = await fetch('/api/ai/generate/mockup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          prompt,
          designSystemId
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Add the new mockup to the list
        setMockups([data.data.generatedUI, ...mockups]);
        setSelectedMockup(data.data.generatedUI);
        setPrompt('');
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Failed to generate UI mockup');
      console.error(error);
    } finally {
      setIsGeneratingMockup(false);
    }
  };
  
  // Generate code from mockup (Phase 2)
  const generateCode = async () => {
    if (!selectedMockup) {
      setError('Please select a UI mockup first');
      return;
    }
    
    setIsGeneratingCode(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/ai/generate/${selectedMockup.id}/code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          framework,
          styleLibrary
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update the mockup with generated code
        const updatedMockups = mockups.map(mockup => 
          mockup.id === data.data.generatedUI.id ? data.data.generatedUI : mockup
        );
        
        setMockups(updatedMockups);
        setSelectedMockup(data.data.generatedUI);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Failed to generate code');
      console.error(error);
    } finally {
      setIsGeneratingCode(false);
    }
  };
  
  // Submit feedback and refine UI mockup
  const refineMockup = async () => {
    if (!selectedMockup || !feedback) {
      setError('Please select a UI mockup and provide feedback');
      return;
    }
    
    setIsGeneratingMockup(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/ai/generate/${selectedMockup.id}/refine-mockup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          feedback
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update the mockup with refined version
        const updatedMockups = mockups.map(mockup => 
          mockup.id === data.data.generatedUI.id ? data.data.generatedUI : mockup
        );
        
        setMockups(updatedMockups);
        setSelectedMockup(data.data.generatedUI);
        setFeedback('');
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Failed to refine UI mockup');
      console.error(error);
    } finally {
      setIsGeneratingMockup(false);
    }
  };
  
  // Submit feedback and refine code
  const refineCode = async () => {
    if (!selectedMockup || !feedback || selectedMockup.status !== 'completed') {
      setError('Please select a UI with generated code and provide feedback');
      return;
    }
    
    setIsGeneratingCode(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/ai/generate/${selectedMockup.id}/refine-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          feedback
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update the mockup with refined code
        const updatedMockups = mockups.map(mockup => 
          mockup.id === data.data.generatedUI.id ? data.data.generatedUI : mockup
        );
        
        setMockups(updatedMockups);
        setSelectedMockup(data.data.generatedUI);
        setFeedback('');
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Failed to refine code');
      console.error(error);
    } finally {
      setIsGeneratingCode(false);
    }
  };
  
  // Render mockup preview (placeholder - actual implementation would render the UI)
  const renderMockupPreview = () => {
    if (!selectedMockup) return <div className="p-4 text-center text-gray-500">Select a mockup to preview</div>;
    
    return (
      <div className="p-4 bg-gray-100 rounded-md">
        <h3 className="font-medium mb-2">UI Mockup Preview:</h3>
        <p className="text-sm mb-2">Prompt: {selectedMockup.prompt}</p>
        <p className="text-sm mb-2">Status: {selectedMockup.status}</p>
        
        {/* In a real implementation, you would render the actual UI mockup here */}
        <div className="p-4 border border-gray-300 rounded bg-white">
          {selectedMockup.styledLayout ? (
            <div className="text-sm">
              <p>Layout structure with {selectedMockup.styledLayout.structuredElements?.length || 0} elements</p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No layout data available</p>
          )}
        </div>
      </div>
    );
  };
  
  // Render code preview
  const renderCodePreview = () => {
    if (!selectedMockup || selectedMockup.status !== 'completed') {
      return <div className="p-4 text-center text-gray-500">No code generated yet</div>;
    }
    
    return (
      <div className="p-4 bg-gray-100 rounded-md">
        <h3 className="font-medium mb-2">Generated Code:</h3>
        <p className="text-sm mb-2">Framework: {selectedMockup.framework}</p>
        <p className="text-sm mb-2">Style Library: {selectedMockup.styleLibrary}</p>
        
        <div className="p-4 border border-gray-300 rounded bg-white">
          <pre className="text-xs overflow-auto max-h-96">
            {selectedMockup.code?.mainComponent || 'No code available'}
          </pre>
        </div>
      </div>
    );
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Two-Phase UI Generation</h1>
      
      {/* Error alert */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column - Generation Controls */}
        <div>
          <Tabs defaultValue="phase1">
            <TabsList className="mb-4">
              <TabsTrigger value="phase1">Phase 1: UI Mockup</TabsTrigger>
              <TabsTrigger value="phase2">Phase 2: Code</TabsTrigger>
              <TabsTrigger value="feedback">Feedback</TabsTrigger>
            </TabsList>
            
            {/* Phase 1 Tab */}
            <TabsContent value="phase1">
              <Card>
                <CardHeader>
                  <CardTitle>Generate UI Mockup</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Prompt</label>
                    <Textarea
                      placeholder="Describe the UI you want to generate..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Design System ID</label>
                    <Input
                      placeholder="Enter design system ID"
                      value={designSystemId}
                      onChange={(e) => setDesignSystemId(e.target.value)}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={generateMockup} 
                    disabled={isGeneratingMockup || !prompt || !designSystemId}
                  >
                    {isGeneratingMockup ? 'Generating...' : 'Generate UI Mockup'}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* Phase 2 Tab */}
            <TabsContent value="phase2">
              <Card>
                <CardHeader>
                  <CardTitle>Generate Code</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Framework</label>
                    <Select value={framework} onValueChange={setFramework}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select framework" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="react">React</SelectItem>
                        <SelectItem value="next">Next.js</SelectItem>
                        <SelectItem value="vue">Vue</SelectItem>
                        <SelectItem value="angular">Angular</SelectItem>
                        <SelectItem value="svelte">Svelte</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Style Library</label>
                    <Select value={styleLibrary} onValueChange={setStyleLibrary}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select style library" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tailwind">Tailwind CSS</SelectItem>
                        <SelectItem value="chakra">Chakra UI</SelectItem>
                        <SelectItem value="styled-components">Styled Components</SelectItem>
                        <SelectItem value="bootstrap">Bootstrap</SelectItem>
                        <SelectItem value="material-ui">Material UI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={generateCode} 
                    disabled={isGeneratingCode || !selectedMockup || selectedMockup?.status !== 'mockup'}
                  >
                    {isGeneratingCode ? 'Generating...' : 'Generate Code'}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* Feedback Tab */}
            <TabsContent value="feedback">
              <Card>
                <CardHeader>
                  <CardTitle>Provide Feedback</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Feedback</label>
                    <Textarea
                      placeholder="Enter your feedback to refine the UI or code..."
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="outline"
                    onClick={refineMockup} 
                    disabled={isGeneratingMockup || !selectedMockup || !feedback}
                  >
                    {isGeneratingMockup ? 'Refining...' : 'Refine UI Mockup'}
                  </Button>
                  <Button 
                    onClick={refineCode} 
                    disabled={isGeneratingCode || !selectedMockup || selectedMockup?.status !== 'completed' || !feedback}
                  >
                    {isGeneratingCode ? 'Refining...' : 'Refine Code'}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
          
          {/* Mockup List */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Generated UI Mockups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                {mockups.length === 0 ? (
                  <p className="text-sm text-gray-500">No mockups generated yet</p>
                ) : (
                  <ul className="space-y-2">
                    {mockups.map(mockup => (
                      <li 
                        key={mockup.id} 
                        className={`
                          p-3 rounded-md cursor-pointer hover:bg-gray-100
                          ${selectedMockup?.id === mockup.id ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}
                        `}
                        onClick={() => setSelectedMockup(mockup)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium text-sm">{mockup.prompt.slice(0, 60)}{mockup.prompt.length > 60 ? '...' : ''}</h4>
                            <p className="text-xs text-gray-500">
                              Created: {new Date(mockup.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <div className={`
                            text-xs px-2 py-1 rounded 
                            ${mockup.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}
                          `}>
                            {mockup.status}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column - Preview */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="mockup">
                <TabsList className="mb-4">
                  <TabsTrigger value="mockup">UI Mockup</TabsTrigger>
                  <TabsTrigger value="code">Generated Code</TabsTrigger>
                </TabsList>
                
                <TabsContent value="mockup">
                  {renderMockupPreview()}
                </TabsContent>
                
                <TabsContent value="code">
                  {renderCodePreview()}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UIGenerationDemo;