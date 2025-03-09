"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { UIGenerator } from '@/components/ui-generator/ui-generator';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

export default function GenerateUIPage() {
  const { id } = useParams();
  const router = useRouter();

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center mb-8">
        <Button variant="ghost" onClick={() => router.push(`/design-systems/${id}`)}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Design System
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold">Generate UI Components</h1>
        <p className="text-muted-foreground mt-2">
          Describe what you want to build and we'll generate production-ready code using your design system.
        </p>
      </div>

      <UIGenerator designSystemId={id} />
    </div>
  );
}