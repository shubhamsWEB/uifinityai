"use client";

import { useRef, useEffect } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-css';
import 'prismjs/themes/prism-tomorrow.css';

export function CodeViewer({ code, language = 'jsx' }) {
  const codeRef = useRef(null);
  
  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [code]);
  
  return (
    <div className="relative overflow-hidden bg-[#2d2d2d] text-white">
      <div className="overflow-x-auto p-4">
        <pre className="language-{language} text-sm">
          <code ref={codeRef} className={`language-${language}`}>
            {code}
          </code>
        </pre>
      </div>
    </div>
  );
}