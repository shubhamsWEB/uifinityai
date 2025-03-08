"use client";

import { Card } from '@/components/ui/card';

export function ColorTokenDisplay({ tokens }) {
  if (!tokens || Object.keys(tokens).length === 0) {
    return <p className="text-gray-500">No color tokens found.</p>;
  }
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Object.entries(tokens).map(([name, token]) => (
        <div key={name} className="rounded-md overflow-hidden border">
          <div 
            className="h-20 w-full" 
            style={{ backgroundColor: token.value }}
          />
          <div className="p-3">
            <p className="font-medium text-sm">{name}</p>
            <p className="text-xs text-gray-500">{token.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}