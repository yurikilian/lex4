import React from 'react';
import { Lex4Editor } from '@lex4/editor';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-200 p-8">
      <h1 className="text-2xl font-bold text-center mb-6">
        Lex4 Editor — Development Harness
      </h1>
      <Lex4Editor />
    </div>
  );
};
