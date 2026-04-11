import React, { useCallback } from 'react';
import { A4_WIDTH_PX, A4_HEIGHT_PX, PAGE_MARGIN_PX } from '../constants/dimensions';
import { useDocument } from '../context/document-context';
import { PageBody } from './PageBody';
import { PageHeader } from './PageHeader';
import { PageFooter } from './PageFooter';
import type { LexicalEditor, SerializedEditorState } from 'lexical';

interface PageViewProps {
  pageId: string;
  pageIndex: number;
  onOverflow?: (overflowContent: SerializedEditorState) => void;
}

/**
 * PageView — A single A4 page with header, body, and footer regions.
 *
 * Dimensions are always exactly A4 (794 × 1123 px).
 * Header and footer are only rendered when the global toggle is on.
 * Uses CSS flexbox: header/footer are flex-shrink-0, body is flex-1.
 */
export const PageView: React.FC<PageViewProps> = React.memo(({ pageId, pageIndex, onOverflow }) => {
  const { document, dispatch, setActivePageId, setActiveEditor } = useDocument();
  const page = document.pages.find(p => p.id === pageId);
  const showHeaderFooter = document.headerFooterEnabled;
  const pageCounterMode = document.pageCounterMode;
  const pageCounterLabel = `Page ${pageIndex + 1} of ${document.pages.length}`;

  if (!page) return null;

  const handleBodyChange = useCallback(
    (bodyState: SerializedEditorState) => {
      dispatch({ type: 'UPDATE_PAGE_BODY', pageId, bodyState });
    },
    [dispatch, pageId],
  );

  const handleHeaderChange = useCallback(
    (headerState: SerializedEditorState) => {
      dispatch({ type: 'UPDATE_PAGE_HEADER', pageId, headerState });
    },
    [dispatch, pageId],
  );

  const handleFooterChange = useCallback(
    (footerState: SerializedEditorState) => {
      dispatch({ type: 'UPDATE_PAGE_FOOTER', pageId, footerState });
    },
    [dispatch, pageId],
  );

  const handleHeaderHeight = useCallback(
    (height: number) => {
      dispatch({ type: 'SET_HEADER_HEIGHT', pageId, height });
    },
    [dispatch, pageId],
  );

  const handleFooterHeight = useCallback(
    (height: number) => {
      dispatch({ type: 'SET_FOOTER_HEIGHT', pageId, height });
    },
    [dispatch, pageId],
  );

  const handleFocus = useCallback(() => {
    setActivePageId(pageId);
  }, [setActivePageId, pageId]);

  const handleEditorFocus = useCallback(
    (editor: LexicalEditor) => {
      setActivePageId(pageId);
      setActiveEditor(editor);
    },
    [setActivePageId, setActiveEditor, pageId],
  );

  const handleOverflow = useCallback(
    (overflowContent: SerializedEditorState) => {
      onOverflow?.(overflowContent);
    },
    [onOverflow],
  );

  return (
    <div
      className="lex4-page bg-white shadow-lg flex flex-col"
      style={{
        width: A4_WIDTH_PX,
        height: A4_HEIGHT_PX,
        padding: PAGE_MARGIN_PX,
      }}
      data-testid={`page-${pageIndex}`}
      data-page-id={pageId}
    >
      {showHeaderFooter && (
        <PageHeader
          key={`header-${page.headerSyncVersion}`}
          pageId={pageId}
          initialHeaderState={page.headerState}
          pageCounterLabel={pageCounterMode === 'header' || pageCounterMode === 'both' ? pageCounterLabel : undefined}
          onHeaderChange={handleHeaderChange}
          onHeightChange={handleHeaderHeight}
        />
      )}

      <PageBody
        key={`body-${page.bodySyncVersion}`}
        pageId={pageId}
        initialBodyState={page.bodyState}
        onBodyChange={handleBodyChange}
        onOverflow={handleOverflow}
        onFocus={handleFocus}
        onEditorFocus={handleEditorFocus}
      />

      {showHeaderFooter && (
        <PageFooter
          key={`footer-${page.footerSyncVersion}`}
          pageId={pageId}
          initialFooterState={page.footerState}
          pageCounterLabel={pageCounterMode === 'footer' || pageCounterMode === 'both' ? pageCounterLabel : undefined}
          onFooterChange={handleFooterChange}
          onHeightChange={handleFooterHeight}
        />
      )}
    </div>
  );
});

PageView.displayName = 'PageView';
