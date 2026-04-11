import React, { useCallback, useEffect, useMemo } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import type { EditorState, LexicalEditor, SerializedEditorState } from 'lexical';

import { createEditorConfig } from '../lexical/editor-setup';
import { TabIndentPlugin } from '../lexical/plugins/tab-indent-plugin';
import { PastePlugin } from '../lexical/plugins/paste-plugin';
import { ActiveEditorPlugin } from '../lexical/plugins/active-editor-plugin';
import { OverflowPlugin } from '../lexical/plugins/overflow-plugin';
import { useDocument } from '../context/document-context';
import { debug, shortId } from '../utils/debug';

interface PageBodyProps {
  pageId: string;
  initialBodyState?: SerializedEditorState | null;
  onBodyChange?: (state: SerializedEditorState) => void;
  onOverflow?: (overflowContent: SerializedEditorState) => void;
  onFocus?: () => void;
  onEditorFocus?: (editor: LexicalEditor) => void;
  readOnly?: boolean;
}

/**
 * EditorRegistryPlugin — Registers the editor in the document-level
 * editor registry so other pages can directly push content into it.
 */
const EditorRegistryPlugin: React.FC<{ pageId: string }> = ({ pageId }) => {
  const [editor] = useLexicalComposerContext();
  const { editorRegistry } = useDocument();

  useEffect(() => {
    editorRegistry.register(pageId, editor);
    debug('registry', `registered editor for page ${shortId(pageId)}`);
    return () => {
      editorRegistry.unregister(pageId);
      debug('registry', `unregistered editor for page ${shortId(pageId)}`);
    };
  }, [editor, pageId, editorRegistry]);

  return null;
};

/**
 * PageBody — Lexical editor instance for one page's body content.
 *
 * Each page gets its own Lexical editor. The OverflowPlugin
 * handles splitting content when it exceeds the available height.
 *
 * When created with initialBodyState (e.g. from overflow), the
 * LexicalComposer is initialized with that content.
 */
export const PageBody: React.FC<PageBodyProps> = ({
  pageId,
  initialBodyState,
  onBodyChange,
  onOverflow,
  onFocus,
  onEditorFocus,
  readOnly = false,
}) => {
  const config = useMemo(
    () => {
      const baseConfig = {
        ...createEditorConfig('body', pageId),
        editable: !readOnly,
      };

      // Set initial editor state for new pages with overflow content
      if (initialBodyState) {
        debug('page', `PageBody ${shortId(pageId)}: initializing with ${initialBodyState.root?.children?.length ?? 0} children`);
        return {
          ...baseConfig,
          editorState: JSON.stringify(initialBodyState),
        };
      }

      debug('page', `PageBody ${shortId(pageId)}: initializing empty`);
      return baseConfig;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally only use initialBodyState at mount time
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
      debug('page', `PageBody ${shortId(pageId)}: overflow callback fired with ${overflowContent.root?.children?.length ?? 0} children`);
      onOverflow?.(overflowContent);
    },
    [onOverflow, pageId],
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
              style={{ overflow: 'visible' }}
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
        <EditorRegistryPlugin pageId={pageId} />
        <ActiveEditorPlugin onFocus={handleEditorFocus} />
        <OverflowPlugin onOverflow={handleOverflow} />
        <OnChangePlugin onChange={handleChange} ignoreSelectionChange />
      </LexicalComposer>
    </div>
  );
};
