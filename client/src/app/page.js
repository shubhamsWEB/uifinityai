'use client'
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, 
  Layers, 
  Palette, 
  Code, 
  Cpu,
  FileCode
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function HomePage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      // Calculate percentage across the screen (0-100)
      const x = Math.round((e.clientX / window.innerWidth) * 100);
      const y = Math.round((e.clientY / window.innerHeight) * 100);
      setMousePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Dynamic gradient style based on mouse position
  const gradientStyle = {
    backgroundImage: `linear-gradient(${mousePosition.x}deg, #00c6fb, #005bea)`,
    transition: 'background-image 0.1s ease-out'
  };

  return (
    <div className="flex flex-col min-h-screen">
      <section 
        className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center"
        style={gradientStyle}
      >
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 text-white">
          Generate UI from <span style={{background: 'linear-gradient(90deg, #ff9a9e, #fad0c4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'}}>Figma</span> with AI
        </h1>
        <p className="text-xl text-white/90 max-w-2xl mb-8">
          Upload your Figma design system, describe what you want to build, and let AI generate pixel-perfect React components that match your design.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button size="lg" asChild className="bg-white text-blue-600 hover:bg-blue-50 font-semibold shadow-lg">
            <Link href="/design-systems">
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          {/* <Button size="lg" variant="outline" asChild className="border-white text-white hover:bg-white/10">
            <a href="https://github.com/your-repo" target="_blank" rel="noopener noreferrer">
              View on GitHub
            </a>
          </Button> */}
        </div>
      </section>

      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-6 rounded-lg">
              <Layers className="h-12 w-12 text-blue-500 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Upload Design System</h3>
              <p className="text-gray-600">
                Import your design system directly from Figma to ensure all your brand guidelines are followed.
              </p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <Cpu className="h-12 w-12 text-blue-500 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Describe Your UI</h3>
              <p className="text-gray-600">
                Use natural language to describe the UI you want to create, from simple components to complete pages.
              </p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <FileCode className="h-12 w-12 text-blue-500 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Get Production-Ready Code</h3>
              <p className="text-gray-600">
                Receive clean, well-structured React code that respects your design system. No cleanup required.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Benefits</h2>
          
          <div className="grid md:grid-cols-2 gap-12">
            <div className="flex gap-4">
              <Palette className="h-8 w-8 text-blue-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-semibold mb-2">Design Consistency</h3>
                <p className="text-gray-600">
                  Ensure all generated UI components adhere strictly to your design system, maintaining brand consistency across your application.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <Code className="h-8 w-8 text-blue-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-semibold mb-2">Developer Productivity</h3>
                <p className="text-gray-600">
                  Speed up the development process by generating high-quality React components in seconds instead of hours of manual coding.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <svg className="h-8 w-8 text-blue-500 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 100-16 8 8 0 000 16zm-1-5h2v2h-2v-2zm0-8h2v6h-2V7z"/>
              </svg>
              <div>
                <h3 className="text-xl font-semibold mb-2">Iterative Design</h3>
                <p className="text-gray-600">
                  Rapidly prototype and iterate on designs. Make changes in Figma, re-extract your design system, and regenerate UI without losing consistency.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <svg className="h-8 w-8 text-blue-500 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.376 12.416L8.777 19.482A.5.5 0 018 19.066V4.934a.5.5 0 01.777-.416l10.599 7.066a.5.5 0 010 .832z"/>
              </svg>
              <div>
                <h3 className="text-xl font-semibold mb-2">AI-powered Flexibility</h3>
                <p className="text-gray-600">
                  Describe what you need in plain language. The AI understands your intent and generates appropriate UI components that follow your design system.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-blue-600 text-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">Ready to transform your design workflow?</h2>
          <p className="text-xl mb-8 opacity-90">
            Start generating UI components from your design system today.
          </p>
          <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 font-semibold shadow-lg" asChild>
            <Link href="/design-system">
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}