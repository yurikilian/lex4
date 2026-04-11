import React from 'react';
import { useDocument } from '../context/document-context';
import { PageView } from './PageView';

/**
 * DocumentView — Scrollable container rendering all pages vertically.
 *
 * Provides the Word-like visual with pages centered on a gray background
 * with gaps between pages.
 */
export const DocumentView: React.FC = () => {
  const { document } = useDocument();

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
        />
      ))}
    </div>
  );
};
