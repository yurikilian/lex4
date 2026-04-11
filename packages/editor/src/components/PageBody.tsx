import React, { useCallback, useMemo } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import type { EditorState, LexicalEditor, SerializedEditorState } from 'lexical';

import { createEditorConfig } from '../lexical/editor-setup';
import { TabIndentPlugin } from '../lexical/plugins/tab-indent-plugin';
import { PastePlugin } from '../lexical/plugins/paste-plugin';
import { ActiveEditorPlugin } from '../lexical/plugins/active-editor-plugin';
import { OverflowPlugin } from '../lexical/plugins/overflow-plugin';

interface PageBodyProps {
  pageId: string;
  bodyHeight: number;
  onBodyChange?: (state: SerializedEditorState) => void;
  onOverflow?: (overflowContent: SerializedEditorState) => void;
  onFocus?: () => void;
  onEditorFocus?: (editor: LexicalEditor) => void;
  readOnly?: boolean;
}

/**
 * PageBody — Lexical editor instance for one page's body content.
 *
 * Each page gets its own Lexical editor. The OverflowPlugin
 * handles splitting content when it exceeds bodyHeight.
 */
export const PageBody: React.FC<PageBodyProps> = ({
  pageId,
  onBodyChange,
  onOverflow,
  onFocus,
  onEditorFocus,
  readOnly = false,
}) => {
  const config = useMemo(
    () => ({
      ...createEditorConfig('body', pageId),
      editable: !readOnly,
    }),
    [pageId, readOnly],
  );

  const handleChange = useCallback(
    (editorState: EditorState) => {
      const serialized = editorState.toJSON();
      onBodyChange?.(serialized);
    },
    [onBodyChange],
  );

  const handleOverflow = useCallback(
    (overflowContent: SerializedEditorState) => {
      onOverflow?.(overflowContent);
    },
    [onOverflow],
  );

  const handleEditorFocus = useCallback(
    (editor: LexicalEditor) => {
      onEditorFocus?.(editor);
    },
    [onEditorFocus],
  );

  return (
    <div
      className="lex4-page-body flex-1 min-h-0 relative"
      style={{ overflow: 'hidden' }}
      data-testid={`page-body-${pageId}`}
      onFocus={onFocus}
    >
      <LexicalComposer initialConfig={config}>
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              className="outline-none h-full p-0"
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
        <PastePlugin />
        <ActiveEditorPlugin onFocus={handleEditorFocus} />
        <OverflowPlugin onOverflow={handleOverflow} />
        <OnChangePlugin onChange={handleChange} ignoreSelectionChange />
      </LexicalComposer>
    </div>
  );
};
