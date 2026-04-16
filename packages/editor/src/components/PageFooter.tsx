import React, { useCallback, useMemo, useRef } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import type { EditorState, SerializedEditorState } from 'lexical';

import { createEditorConfig } from '../lexical/editor-setup';
import { MAX_FOOTER_HEIGHT_PX } from '../constants/dimensions';
import { ActiveEditorPlugin } from '../lexical/plugins/active-editor-plugin';
import { HeightLimitPlugin } from '../lexical/plugins/height-limit-plugin';
import { HistoryCapturePlugin } from '../lexical/plugins/history-capture-plugin';
import { useExtensions } from '../extensions/extension-context';
import { useTranslations } from '../i18n';
import { debug, shortId } from '../utils/debug';

interface PageFooterProps {
  pageId: string;
  initialFooterState?: SerializedEditorState | null;
  pageCounterLabel?: string;
  onFooterChange?: (state: SerializedEditorState, height: number) => void;
}

/**
 * PageFooter — Mini Lexical editor for a page's footer region.
 *
 * Constrained to MAX_FOOTER_HEIGHT_PX. Uses overflow: clip to prevent
 * the browser from scrolling the container to follow the cursor.
 * Remounts via key={syncVersion} when content is copied/cleared externally.
 */
export const PageFooter: React.FC<PageFooterProps> = ({
  pageId,
  initialFooterState,
  pageCounterLabel,
  onFooterChange,
}) => {
  const hasPageCounter = !!pageCounterLabel;
  const { nodes, themeOverrides } = useExtensions();
  const t = useTranslations();
  const config = useMemo(
    () => {
      const baseConfig = createEditorConfig('footer', pageId, nodes, themeOverrides);
      if (initialFooterState) {
        return { ...baseConfig, editorState: JSON.stringify(initialFooterState) };
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
          if (el.scrollHeight > MAX_FOOTER_HEIGHT_PX) {
            debug(
              'footer',
              `page ${shortId(pageId)}: skipped external sync at ${el.scrollHeight}px > max ${MAX_FOOTER_HEIGHT_PX}px`,
            );
            return;
          }
          const height = Math.min(el.scrollHeight, MAX_FOOTER_HEIGHT_PX);
          debug('footer', `page ${shortId(pageId)}: height=${height}px (scrollH=${el.scrollHeight})`);
          onFooterChange?.(editorState.toJSON(), height);
        }
      });
    },
    [onFooterChange, pageId],
  );

  return (
    <div
      className="lex4-page-footer"
      style={{ maxHeight: MAX_FOOTER_HEIGHT_PX, overflow: 'clip' }}
      data-testid={`page-footer-${pageId}`}
    >
      <LexicalComposer initialConfig={config}>
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              ref={contentRef}
              className={`lex4-page-hf-editable${hasPageCounter ? ' lex4-page-hf-narrow' : ''}`}
            />
          }
          placeholder={
            <div className={`lex4-page-hf-placeholder${hasPageCounter ? ' lex4-page-hf-narrow' : ''}`}>
              {t.footer.placeholder}</div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <ActiveEditorPlugin pageId={pageId} region="footer" />
        <HistoryCapturePlugin pageId={pageId} region="footer" />
        <HeightLimitPlugin maxHeight={MAX_FOOTER_HEIGHT_PX} channel="footer" />
        <OnChangePlugin onChange={handleChange} ignoreSelectionChange />
      </LexicalComposer>
      {pageCounterLabel && (
        <div
          className="lex4-page-counter"
          data-testid={`page-counter-footer-${pageId}`}
        >
          {pageCounterLabel}
        </div>
      )}
    </div>
  );
};