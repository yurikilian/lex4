import React, { useEffect, useRef } from 'react';
import { useDocument } from '../context/document-context';
import { usePagination } from '../hooks/use-pagination';
import { PageView } from './PageView';

/**
 * DocumentView — Scrollable container rendering all pages vertically.
 *
 * Provides the Word-like visual with pages centered on a gray background
 * with gaps between pages. Orchestrates pagination via usePagination hook.
 */
export const DocumentView: React.FC = () => {
  const { document, dispatch } = useDocument();
  const { handlePageOverflow, handlePageUnderflow, reflowAll } = usePagination(document, dispatch);
  const prevToggleRef = useRef(document.headerFooterEnabled);

  // Reflow when header/footer toggle changes
  useEffect(() => {
    if (prevToggleRef.current !== document.headerFooterEnabled) {
      prevToggleRef.current = document.headerFooterEnabled;
      reflowAll();
    }
  }, [document.headerFooterEnabled, reflowAll]);

  return (
    <div
      className="lex4-document-view flex flex-col items-center gap-8 py-8 min-h-full"
      data-testid="document-view"
    >
      {document.pages.map((page, index) => (
        <PageView
          key={page.id}
          pageId={page.id}
          pageIndex={index}
          onOverflow={() => handlePageOverflow(index)}
          onUnderflow={() => handlePageUnderflow(index)}
        />
      ))}
    </div>
  );
};
