import React, { useCallback, useMemo, useRef } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import type { EditorState, SerializedEditorState } from 'lexical';

import { createEditorConfig } from '../lexical/editor-setup';
import { MAX_HEADER_HEIGHT_PX } from '../constants/dimensions';
import { HeightLimitPlugin } from '../lexical/plugins/height-limit-plugin';
import { debug, shortId } from '../utils/debug';

interface PageHeaderProps {
  pageId: string;
  initialHeaderState?: SerializedEditorState | null;
  onHeaderChange?: (state: SerializedEditorState) => void;
  onHeightChange?: (height: number) => void;
}

/**
 * PageHeader — Mini Lexical editor for a page's header region.
 *
 * Constrained to MAX_HEADER_HEIGHT_PX. Uses overflow: clip to prevent
 * the browser from scrolling the container to follow the cursor.
 * Remounts via key={syncVersion} when content is copied/cleared externally.
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  pageId,
  initialHeaderState,
  onHeaderChange,
  onHeightChange,
}) => {
  const config = useMemo(
    () => {
      const baseConfig = createEditorConfig('header', pageId);
      if (initialHeaderState) {
        return { ...baseConfig, editorState: JSON.stringify(initialHeaderState) };
      }
      return baseConfig;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- syncVersion forces remount via key, only used at init
    [pageId],
  );

  const contentRef = useRef<HTMLDivElement>(null);

  const handleChange = useCallback(
    (editorState: EditorState) => {
      onHeaderChange?.(editorState.toJSON());

      // Report current height
      requestAnimationFrame(() => {
        const el = contentRef.current;
        if (el) {
          const height = Math.min(el.scrollHeight, MAX_HEADER_HEIGHT_PX);
          debug('header', `page ${shortId(pageId)}: height=${height}px (scrollH=${el.scrollHeight})`);
          onHeightChange?.(height);
        }
      });
    },
    [onHeaderChange, onHeightChange, pageId],
  );

  return (
    <div
      className="lex4-page-header border-b border-dashed border-gray-300 relative flex-shrink-0"
      style={{ maxHeight: MAX_HEADER_HEIGHT_PX, overflow: 'clip' }}
      data-testid={`page-header-${pageId}`}
    >
      <LexicalComposer initialConfig={config}>
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              ref={contentRef}
              className="outline-none p-2 text-sm text-gray-600 min-h-[24px]"
            />
          }
          placeholder={
            <div className="absolute top-0 left-0 text-gray-400 pointer-events-none select-none p-2 text-sm">
              Header
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <HeightLimitPlugin maxHeight={MAX_HEADER_HEIGHT_PX} channel="header" />
        <OnChangePlugin onChange={handleChange} ignoreSelectionChange />
      </LexicalComposer>
    </div>
  );
};
