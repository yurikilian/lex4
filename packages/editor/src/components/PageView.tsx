import React, { useCallback } from 'react';
import { A4_WIDTH_PX, A4_HEIGHT_PX, PAGE_MARGIN_TOP_PX, PAGE_MARGIN_BOTTOM_PX, PAGE_MARGIN_LEFT_PX, PAGE_MARGIN_RIGHT_PX } from '../constants/dimensions';
import { useDocument } from '../context/document-context';
import { useTranslations, interpolate } from '../i18n';
import { PageBody } from './PageBody';
import { PageHeader } from './PageHeader';
import { PageFooter } from './PageFooter';
import type { SerializedEditorState } from 'lexical';

interface PageViewProps {
  pageId: string;
  pageIndex: number;
  onOverflow?: (overflowContent: SerializedEditorState, cause: 'paste' | 'content') => void;
  onBackspaceAtStart?: (pageIndex: number, pageId: string) => void;
  onDeleteAtEnd?: (pageIndex: number, pageId: string) => void;
  onMoveToPreviousPage?: (pageIndex: number) => void;
  onMoveToNextPage?: (pageIndex: number) => void;
}

/**
 * PageView — A single A4 page with header, body, and footer regions.
 *
 * Dimensions are always exactly A4 (794 × 1123 px).
 * Header and footer are only rendered when the global toggle is on.
 * Uses CSS flexbox: header/footer are flex-shrink-0, body is flex-1.
 */
export const PageView: React.FC<PageViewProps> = React.memo(({
  pageId,
  pageIndex,
  onOverflow,
  onBackspaceAtStart,
  onDeleteAtEnd,
  onMoveToPreviousPage,
  onMoveToNextPage,
}) => {
  const { document, dispatch, setActivePageId } = useDocument();
  const t = useTranslations();
  const page = document.pages.find(p => p.id === pageId);
  const showHeaderFooter = document.headerFooterEnabled;
  const pageCounterMode = document.pageCounterMode;
  const pageCounterLabel = interpolate(t.pageCounter.format, {
    current: pageIndex + 1,
    total: document.pages.length,
  });

  if (!page) return null;

  const handleBodyChange = useCallback(
    (bodyState: SerializedEditorState) => {
      dispatch({ type: 'UPDATE_PAGE_BODY', pageId, bodyState });
    },
    [dispatch, pageId],
  );

  const handleHeaderChange = useCallback(
    (headerState: SerializedEditorState, height: number) => {
      dispatch({ type: 'UPDATE_PAGE_HEADER_CONTENT', pageId, headerState, height });
    },
    [dispatch, pageId],
  );

  const handleFooterChange = useCallback(
    (footerState: SerializedEditorState, height: number) => {
      dispatch({ type: 'UPDATE_PAGE_FOOTER_CONTENT', pageId, footerState, height });
    },
    [dispatch, pageId],
  );

  const handleFocus = useCallback(() => {
    setActivePageId(pageId);
  }, [setActivePageId, pageId]);

  const handleOverflow = useCallback(
    (overflowContent: SerializedEditorState, cause: 'paste' | 'content') => {
      onOverflow?.(overflowContent, cause);
    },
    [onOverflow],
  );

  return (
    <div
      className="lex4-page"
      style={{
        width: A4_WIDTH_PX,
        height: A4_HEIGHT_PX,
        paddingTop: PAGE_MARGIN_TOP_PX,
        paddingBottom: PAGE_MARGIN_BOTTOM_PX,
        paddingLeft: PAGE_MARGIN_LEFT_PX,
        paddingRight: PAGE_MARGIN_RIGHT_PX,
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
        />
      )}

      <PageBody
        key={`body-${page.bodySyncVersion}`}
        pageId={pageId}
        initialBodyState={page.bodyState}
        onBodyChange={handleBodyChange}
        onOverflow={handleOverflow}
        onFocus={handleFocus}
        onBackspaceAtStart={() => onBackspaceAtStart?.(pageIndex, pageId)}
        onDeleteAtEnd={() => onDeleteAtEnd?.(pageIndex, pageId)}
        onMoveToPreviousPage={() => onMoveToPreviousPage?.(pageIndex)}
        onMoveToNextPage={() => onMoveToNextPage?.(pageIndex)}
      />

      {showHeaderFooter && (
        <PageFooter
          key={`footer-${page.footerSyncVersion}`}
          pageId={pageId}
          initialFooterState={page.footerState}
          pageCounterLabel={pageCounterMode === 'footer' || pageCounterMode === 'both' ? pageCounterLabel : undefined}
          onFooterChange={handleFooterChange}
        />
      )}
    </div>
  );
});

PageView.displayName = 'PageView';
