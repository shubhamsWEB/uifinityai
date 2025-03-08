"use client";

export function TypographyTokenDisplay({ tokens }) {
  if (!tokens || Object.keys(tokens).length === 0) {
    return <p className="text-gray-500">No typography tokens found.</p>;
  }
  
  return (
    <div className="space-y-6">
      {Object.entries(tokens).map(([name, token]) => (
        <div key={name} className="rounded-md border overflow-hidden">
          <div className="p-4 border-b">
            <p 
              style={{ 
                fontFamily: token.fontFamily,
                fontSize: token.fontSize,
                fontWeight: token.fontWeight,
                lineHeight: token.lineHeight,
                letterSpacing: token.letterSpacing,
                textTransform: token.textCase
              }}
            >
              The quick brown fox jumps over the lazy dog
            </p>
          </div>
          <div className="p-3 bg-gray-50">
            <p className="font-medium text-sm">{name}</p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <p className="text-xs text-gray-500">Font: {token.fontFamily}</p>
              <p className="text-xs text-gray-500">Size: {token.fontSize}</p>
              <p className="text-xs text-gray-500">Weight: {token.fontWeight}</p>
              <p className="text-xs text-gray-500">Line Height: {token.lineHeight}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}