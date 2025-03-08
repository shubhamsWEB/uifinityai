"use client";

export function BorderTokenDisplay({ tokens }) {
  if (!tokens || Object.keys(tokens).length === 0) {
    return <p className="text-gray-500">No border tokens found.</p>;
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Object.entries(tokens).map(([name, token]) => (
        <div key={name} className="rounded-md border overflow-hidden">
          <div className="p-4 flex items-center justify-center">
            <div 
              className="h-16 w-16 rounded-md" 
              style={{ border: token.value }}
            />
          </div>
          <div className="p-3 bg-gray-50">
            <p className="font-medium text-sm">{name}</p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <p className="text-xs text-gray-500">Width: {token.width}</p>
              <p className="text-xs text-gray-500">Style: {token.style}</p>
              <p className="text-xs text-gray-500">Color: {token.color}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}