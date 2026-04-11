import React from 'react';
import type { Lex4EditorProps } from '../types/editor-props';
import { DocumentProvider } from '../context/document-provider';
import { Toolbar } from './Toolbar';
import { DocumentView } from './DocumentView';
import '../styles.css';

/**
 * Lex4Editor — The main public component.
 *
 * A Microsoft Word-like paginated document editor built on Meta Lexical.
 * Each page is a true discrete A4 page with its own Lexical editor instance.
 */
export const Lex4Editor: React.FC<Lex4EditorProps> = ({
  initialDocument,
  onDocumentChange,
  className,
}) => {
  return (
    <DocumentProvider
      initialDocument={initialDocument}
      onDocumentChange={onDocumentChange}
    >
      <div
        className={`lex4-editor flex flex-col h-full ${className ?? ''}`}
        data-testid="lex4-editor"
      >
        <Toolbar />
        <div className="flex-1 overflow-auto bg-gray-200">
          <DocumentView />
        </div>
      </div>
    </DocumentProvider>
  );
};
