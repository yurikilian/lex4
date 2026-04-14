import React, { useCallback, useEffect, useMemo } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import type { EditorState, SerializedEditorState } from 'lexical';

import { createEditorConfig } from '../lexical/editor-setup';
import { TabIndentPlugin } from '../lexical/plugins/tab-indent-plugin';
import { ParagraphIndentPlugin } from '../lexical/plugins/paragraph-indent-plugin';
import { PastePlugin } from '../lexical/plugins/paste-plugin';
import { ActiveEditorPlugin } from '../lexical/plugins/active-editor-plugin';
import { OverflowPlugin } from '../lexical/plugins/overflow-plugin';
import { HistoryCapturePlugin } from '../lexical/plugins/history-capture-plugin';
import { PageBoundaryPlugin } from '../lexical/plugins/page-boundary-plugin';
import { useDocument } from '../context/document-context';
import { useExtensions } from '../extensions/extension-context';
import { useTranslations } from '../i18n';
import { debug, shortId } from '../utils/debug';

interface PageBodyProps {
  pageId: string;
  initialBodyState?: SerializedEditorState | null;
  onBodyChange?: (state: SerializedEditorState) => void;
  onOverflow?: (overflowContent: SerializedEditorState, cause: 'paste' | 'content') => void;
  onFocus?: () => void;
  onBackspaceAtStart?: () => void;
  onDeleteAtEnd?: () => void;
  onMoveToPreviousPage?: () => void;
  onMoveToNextPage?: () => void;
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
 * Extension-contributed body plugins are rendered inside the LexicalComposer.
 */
export const PageBody: React.FC<PageBodyProps> = ({
  pageId,
  initialBodyState,
  onBodyChange,
  onOverflow,
  onFocus,
  onBackspaceAtStart,
  onDeleteAtEnd,
  onMoveToPreviousPage,
  onMoveToNextPage,
  readOnly = false,
}) => {
  const { nodes, bodyPlugins, themeOverrides } = useExtensions();
  const t = useTranslations();

  const config = useMemo(
    () => {
      const baseConfig = {
        ...createEditorConfig('body', pageId, nodes, themeOverrides),
        editable: !readOnly,
      };

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
    [pageId, readOnly, nodes, themeOverrides],
  );

  const handleChange = useCallback(
    (editorState: EditorState) => {
      const serialized = editorState.toJSON();
      onBodyChange?.(serialized);
    },
    [onBodyChange],
  );

  const handleOverflow = useCallback(
    (overflowContent: SerializedEditorState, cause: 'paste' | 'content') => {
      debug('page', `PageBody ${shortId(pageId)}: overflow callback fired with ${overflowContent.root?.children?.length ?? 0} children`);
      onOverflow?.(overflowContent, cause);
    },
    [onOverflow, pageId],
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
              {t.body.placeholder}
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <ListPlugin />
        <ParagraphIndentPlugin />
        <TabIndentPlugin />
        <PastePlugin />
        <EditorRegistryPlugin pageId={pageId} />
        <ActiveEditorPlugin pageId={pageId} region="body" />
        {!readOnly && <HistoryCapturePlugin pageId={pageId} region="body" />}
        {!readOnly && onBackspaceAtStart && onDeleteAtEnd && onMoveToPreviousPage && onMoveToNextPage && (
          <PageBoundaryPlugin
            onBackspaceAtStart={onBackspaceAtStart}
            onDeleteAtEnd={onDeleteAtEnd}
            onMoveToPreviousPage={onMoveToPreviousPage}
            onMoveToNextPage={onMoveToNextPage}
          />
        )}
        <OverflowPlugin onOverflow={handleOverflow} />
        {bodyPlugins.map((Plugin, idx) => (
          <Plugin key={idx} />
        ))}
        <OnChangePlugin onChange={handleChange} ignoreSelectionChange />
      </LexicalComposer>
    </div>
  );
};
