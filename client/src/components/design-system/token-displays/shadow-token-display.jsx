"use client";

export function ShadowTokenDisplay({ tokens }) {
  if (!tokens || Object.keys(tokens).length === 0) {
    return <p className="text-gray-500">No shadow tokens found.</p>;
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Object.entries(tokens).map(([name, token]) => (
        <div key={name} className="rounded-md p-4 bg-white">
          <div 
            className="h-24 w-full bg-white rounded-md mb-3" 
            style={{ boxShadow: token.value }}
          />
          <p className="font-medium text-sm">{name}</p>
          <p className="text-xs text-gray-500 mt-1 whitespace-normal break-words">
            {token.value}
          </p>
        </div>
      ))}
    </div>
  );
}