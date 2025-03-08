"use client";

export function SpacingTokenDisplay({ tokens }) {
  if (!tokens || Object.keys(tokens).length === 0) {
    return <p className="text-gray-500">No spacing tokens found.</p>;
  }
  
  return (
    <div className="space-y-4">
      {Object.entries(tokens).map(([name, token]) => {
        // Extract numeric value for visual representation
        const numericValue = parseInt(token.value);
        
        return (
          <div key={name} className="flex items-center space-x-4 border rounded-md p-4">
            <div className="flex items-center justify-center bg-blue-100 rounded-md">
              <div 
                className="bg-blue-500 rounded-sm" 
                style={{ 
                  width: `${Math.min(numericValue, 200)}px`, 
                  height: `${Math.min(numericValue, 60)}px` 
                }}
              />
            </div>
            <div>
              <p className="font-medium text-sm">{name}</p>
              <p className="text-xs text-gray-500">{token.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}