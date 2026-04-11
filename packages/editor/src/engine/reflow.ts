import type { BlockMeasurement } from '../types/page';
import { detectOverflow, detectUnderflow } from './overflow';

/** A page's content as an ordered list of block measurements */
export interface PageContent {
  pageId: string;
  blocks: BlockMeasurement[];
}

/** Result of a full document reflow */
export interface ReflowResult {
  pages: PageContent[];
  pagesChanged: boolean;
}

/**
 * Reflows all document content across pages.
 *
 * Takes the combined blocks from all pages and redistributes them
 * to fit within the body height constraint. Creates new pages for
 * overflow, removes empty trailing pages.
 *
 * Always returns at least one page.
 */
export function reflowDocument(
  pages: PageContent[],
  bodyHeightPx: number,
): ReflowResult {
  const allBlocks = pages.flatMap(p => p.blocks);

  if (allBlocks.length === 0) {
    return {
      pages: [{ pageId: pages[0]?.pageId ?? 'page-0', blocks: [] }],
      pagesChanged: pages.length !== 1,
    };
  }

  const newPages: PageContent[] = [];
  let remaining = [...allBlocks];
  let pageIndex = 0;

  while (remaining.length > 0) {
    const { fittingBlocks, overflowingBlocks } = detectOverflow(remaining, bodyHeightPx);
    const pageId = pages[pageIndex]?.pageId ?? `page-${pageIndex}`;

    newPages.push({ pageId, blocks: fittingBlocks });
    remaining = overflowingBlocks;
    pageIndex++;
  }

  // Check if underflow allows consolidation
  for (let i = 0; i < newPages.length - 1; i++) {
    const currentHeight = newPages[i].blocks.reduce((s, b) => s + b.height, 0);
    const remainingHeight = bodyHeightPx - currentHeight;

    if (remainingHeight > 0 && newPages[i + 1]) {
      const { pullableBlocks, remainingNextPageBlocks } = detectUnderflow(
        remainingHeight,
        newPages[i + 1].blocks,
      );

      if (pullableBlocks.length > 0) {
        newPages[i] = {
          ...newPages[i],
          blocks: [...newPages[i].blocks, ...pullableBlocks],
        };
        newPages[i + 1] = {
          ...newPages[i + 1],
          blocks: remainingNextPageBlocks,
        };
      }
    }
  }

  // Remove empty trailing pages (keep at least one)
  while (newPages.length > 1 && newPages[newPages.length - 1].blocks.length === 0) {
    newPages.pop();
  }

  const pagesChanged =
    newPages.length !== pages.length ||
    newPages.some((np, i) => {
      const op = pages[i];
      if (!op) return true;
      return np.blocks.length !== op.blocks.length;
    });

  return { pages: newPages, pagesChanged };
}
