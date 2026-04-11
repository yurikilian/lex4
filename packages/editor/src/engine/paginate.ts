import type { BlockMeasurement, PageAssignment } from '../types/page';

/**
 * Assigns an ordered list of measured blocks to pages.
 *
 * Fills each page up to `bodyHeightPx`, then starts a new page.
 * Blocks are never split — a block that doesn't fit moves entirely
 * to the next page (mid-block splitting is a future enhancement).
 *
 * Always returns at least one page, even if blocks is empty.
 */
export function assignBlocksToPages(
  blocks: BlockMeasurement[],
  bodyHeightPx: number,
): PageAssignment[] {
  if (blocks.length === 0) {
    return [{ pageIndex: 0, blockKeys: [], totalHeight: 0 }];
  }

  const pages: PageAssignment[] = [];
  let currentPage: PageAssignment = { pageIndex: 0, blockKeys: [], totalHeight: 0 };

  for (const block of blocks) {
    const fitsOnCurrentPage =
      currentPage.totalHeight + block.height <= bodyHeightPx ||
      currentPage.blockKeys.length === 0; // first block always goes on current page

    if (fitsOnCurrentPage) {
      currentPage.blockKeys.push(block.nodeKey);
      currentPage.totalHeight += block.height;
    } else {
      pages.push(currentPage);
      currentPage = {
        pageIndex: pages.length,
        blockKeys: [block.nodeKey],
        totalHeight: block.height,
      };
    }
  }

  pages.push(currentPage);
  return pages;
}
