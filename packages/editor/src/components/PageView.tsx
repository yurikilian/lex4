import React, { useCallback } from 'react';
import { A4_WIDTH_PX, A4_HEIGHT_PX, PAGE_MARGIN_PX } from '../constants/dimensions';
import { computeBodyHeight } from '../constants/page-layout';
import { useDocument } from '../context/document-context';
import { PageBody } from './PageBody';
import { PageHeader } from './PageHeader';
import { PageFooter } from './PageFooter';
import type { SerializedEditorState } from 'lexical';

interface PageViewProps {
  pageId: string;
  pageIndex: number;
  onOverflow?: () => void;
  onUnderflow?: () => void;
}

/**
 * PageView — A single A4 page with header, body, and footer regions.
 *
 * Dimensions are always exactly A4 (794 × 1123 px).
 * Header and footer are only rendered when the global toggle is on.
 */
export const PageView: React.FC<PageViewProps> = React.memo(({ pageId, pageIndex, onOverflow, onUnderflow }) => {
  const { document, dispatch, setActivePageId } = useDocument();
  const page = document.pages.find(p => p.id === pageId);
  const showHeaderFooter = document.headerFooterEnabled;

  if (!page) return null;

  const headerHeight = showHeaderFooter ? page.headerHeight : 0;
  const footerHeight = showHeaderFooter ? page.footerHeight : 0;
  const bodyHeight = computeBodyHeight(headerHeight, footerHeight);

  const handleBodyChange = useCallback(
    (bodyState: SerializedEditorState) => {
      dispatch({ type: 'UPDATE_PAGE_BODY', pageId, bodyState });
      // After content change, check if we can pull content from next page
      onUnderflow?.();
    },
    [dispatch, pageId, onUnderflow],
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

  const handleOverflow = useCallback(() => {
    onOverflow?.();
  }, [onOverflow]);

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
          pageId={pageId}
          onHeaderChange={handleHeaderChange}
          onHeightChange={handleHeaderHeight}
        />
      )}

      <PageBody
        pageId={pageId}
        bodyHeight={bodyHeight}
        onBodyChange={handleBodyChange}
        onOverflow={handleOverflow}
        onFocus={handleFocus}
      />

      {showHeaderFooter && (
        <PageFooter
          pageId={pageId}
          onFooterChange={handleFooterChange}
          onHeightChange={handleFooterHeight}
        />
      )}
    </div>
  );
});

PageView.displayName = 'PageView';
