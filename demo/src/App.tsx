import React, { useCallback } from 'react';
import { Lex4Editor } from '@lex4/editor';
import type { Lex4Document } from '@lex4/editor';

export const App: React.FC = () => {
  const handleChange = useCallback((doc: Lex4Document) => {
    console.log(`Document changed: ${doc.pages.length} page(s)`);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-300">
      <header className="bg-gray-800 text-white px-4 py-2 flex items-center gap-2">
        <span className="font-bold text-lg">Lex4</span>
        <span className="text-gray-400 text-sm">— Document Editor</span>
      </header>
      <main className="flex-1 overflow-hidden">
        <Lex4Editor onDocumentChange={handleChange} />
      </main>
    </div>
  );
};
