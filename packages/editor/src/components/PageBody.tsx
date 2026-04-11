import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import type { EditorState, SerializedEditorState } from 'lexical';

import { createEditorConfig } from '../lexical/editor-setup';
import { TabIndentPlugin } from '../lexical/plugins/tab-indent-plugin';
import { PastePlugin } from '../lexical/plugins/paste-plugin';

interface PageBodyProps {
  pageId: string;
  bodyHeight: number;
  onBodyChange?: (state: SerializedEditorState) => void;
  onOverflow?: () => void;
  onFocus?: () => void;
  readOnly?: boolean;
}

/**
 * PageBody — Lexical editor instance for one page's body content.
 *
 * Each page gets its own Lexical editor. The pagination engine
 * coordinates content distribution across pages.
 */
export const PageBody: React.FC<PageBodyProps> = ({
  pageId,
  bodyHeight,
  onBodyChange,
  onOverflow,
  onFocus,
  readOnly = false,
}) => {
  const config = useMemo(
    () => ({
      ...createEditorConfig('body', pageId),
      editable: !readOnly,
    }),
    [pageId, readOnly],
  );

  const contentRef = useRef<HTMLDivElement>(null);

  const handleChange = useCallback(
    (editorState: EditorState) => {
      const serialized = editorState.toJSON();
      onBodyChange?.(serialized);
    },
    [onBodyChange],
  );

  // Overflow detection via ResizeObserver
  useEffect(() => {
    const el = contentRef.current;
    if (!el || !onOverflow) return;

    const observer = new ResizeObserver(() => {
      if (el.scrollHeight > bodyHeight) {
        onOverflow();
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [bodyHeight, onOverflow]);

  return (
    <div
      className="lex4-page-body relative"
      style={{ height: bodyHeight, overflow: 'hidden' }}
      data-testid={`page-body-${pageId}`}
      onFocus={onFocus}
    >
      <LexicalComposer initialConfig={config}>
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              ref={contentRef}
              className="outline-none min-h-full p-0"
              style={{ minHeight: bodyHeight }}
            />
          }
          placeholder={
            <div className="absolute top-0 left-0 text-gray-400 pointer-events-none select-none">
              Start typing...
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <ListPlugin />
        <TabIndentPlugin />
        <PastePlugin onPasteComplete={onOverflow} />
        <OnChangePlugin onChange={handleChange} ignoreSelectionChange />
      </LexicalComposer>
    </div>
  );
};
