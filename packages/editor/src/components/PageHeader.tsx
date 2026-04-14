import React, { useCallback, useMemo, useRef } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import type { EditorState, SerializedEditorState } from 'lexical';

import { createEditorConfig } from '../lexical/editor-setup';
import { MAX_HEADER_HEIGHT_PX } from '../constants/dimensions';
import { ActiveEditorPlugin } from '../lexical/plugins/active-editor-plugin';
import { HeightLimitPlugin } from '../lexical/plugins/height-limit-plugin';
import { HistoryCapturePlugin } from '../lexical/plugins/history-capture-plugin';
import { useExtensions } from '../extensions/extension-context';
import { useTranslations } from '../i18n';
import { debug, shortId } from '../utils/debug';

interface PageHeaderProps {
  pageId: string;
  initialHeaderState?: SerializedEditorState | null;
  pageCounterLabel?: string;
  onHeaderChange?: (state: SerializedEditorState, height: number) => void;
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
  pageCounterLabel,
  onHeaderChange,
}) => {
  const hasPageCounter = !!pageCounterLabel;
  const { nodes, themeOverrides } = useExtensions();
  const t = useTranslations();
  const config = useMemo(
    () => {
      const baseConfig = createEditorConfig('header', pageId, nodes, themeOverrides);
      if (initialHeaderState) {
        return { ...baseConfig, editorState: JSON.stringify(initialHeaderState) };
      }
      return baseConfig;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- syncVersion forces remount via key, only used at init
    [pageId, nodes, themeOverrides],
  );

  const contentRef = useRef<HTMLDivElement>(null);

  const handleChange = useCallback(
    (editorState: EditorState) => {
      requestAnimationFrame(() => {
        const el = contentRef.current;
        if (el) {
          if (el.scrollHeight > MAX_HEADER_HEIGHT_PX) {
            debug(
              'header',
              `page ${shortId(pageId)}: skipped external sync at ${el.scrollHeight}px > max ${MAX_HEADER_HEIGHT_PX}px`,
            );
            return;
          }
          const height = Math.min(el.scrollHeight, MAX_HEADER_HEIGHT_PX);
          debug('header', `page ${shortId(pageId)}: height=${height}px (scrollH=${el.scrollHeight})`);
          onHeaderChange?.(editorState.toJSON(), height);
        }
      });
    },
    [onHeaderChange, pageId],
  );

  return (
    <div
      className="lex4-page-header bg-blue-50/60 border-t-2 border-t-blue-200 border-b border-dashed border-blue-100 relative flex-shrink-0"
      style={{ maxHeight: MAX_HEADER_HEIGHT_PX, overflow: 'clip' }}
      data-testid={`page-header-${pageId}`}
    >
      <LexicalComposer initialConfig={config}>
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              ref={contentRef}
              className={`outline-none p-2 text-gray-600 min-h-[24px] ${hasPageCounter ? 'pr-24' : ''}`}
            />
          }
          placeholder={
            <div className={`absolute top-0 left-0 text-gray-400 pointer-events-none select-none p-2 ${hasPageCounter ? 'pr-24' : ''}`}>
              {t.header.placeholder}</div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <ActiveEditorPlugin pageId={pageId} region="header" />
        <HistoryCapturePlugin pageId={pageId} region="header" />
        <HeightLimitPlugin maxHeight={MAX_HEADER_HEIGHT_PX} channel="header" />
        <OnChangePlugin onChange={handleChange} ignoreSelectionChange />
      </LexicalComposer>
      {pageCounterLabel && (
        <div
          className="pointer-events-none absolute right-2 top-2 select-none text-xs text-gray-500"
          data-testid={`page-counter-header-${pageId}`}
        >
          {pageCounterLabel}
        </div>
      )}
    </div>
  );
};
