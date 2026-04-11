import React from 'react';
import type { Lex4EditorProps } from '../types/editor-props';

/**
 * Lex4Editor — The main public component.
 *
 * A Microsoft Word-like paginated document editor built on Meta Lexical.
 * Each page is a true discrete A4 page with its own Lexical editor instance.
 */
export const Lex4Editor: React.FC<Lex4EditorProps> = ({
  className,
}) => {
  return (
    <div
      className={`lex4-editor ${className ?? ''}`}
      data-testid="lex4-editor"
    >
      <p>Lex4 Editor — scaffold placeholder</p>
    </div>
  );
};
