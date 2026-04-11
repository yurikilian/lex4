import { describe, it, expect } from 'vitest';
import { assignBlocksToPages } from '../engine/paginate';
import { detectOverflow, detectUnderflow } from '../engine/overflow';
import { reflowDocument } from '../engine/reflow';
import { totalBlockHeight } from '../engine/measure';
import type { BlockMeasurement } from '../types/page';

function block(key: string, height: number): BlockMeasurement {
  return { nodeKey: key, height, type: 'p' };
}

describe('assignBlocksToPages', () => {
  const PAGE_HEIGHT = 1000;

  it('puts all blocks on one page when they fit', () => {
    const blocks = [block('a', 200), block('b', 300), block('c', 400)];
    const pages = assignBlocksToPages(blocks, PAGE_HEIGHT);
    expect(pages).toHaveLength(1);
    expect(pages[0].blockKeys).toEqual(['a', 'b', 'c']);
  });

  it('creates multiple pages when blocks exceed page height', () => {
    const blocks = [block('a', 600), block('b', 600)];
    const pages = assignBlocksToPages(blocks, PAGE_HEIGHT);
    expect(pages).toHaveLength(2);
    expect(pages[0].blockKeys).toEqual(['a']);
    expect(pages[1].blockKeys).toEqual(['b']);
  });

  it('returns one empty page for empty input', () => {
    const pages = assignBlocksToPages([], PAGE_HEIGHT);
    expect(pages).toHaveLength(1);
    expect(pages[0].blockKeys).toEqual([]);
    expect(pages[0].totalHeight).toBe(0);
  });

  it('never creates a page with total height exceeding body height (except single-block overflow)', () => {
    const blocks = [
      block('a', 300),
      block('b', 300),
      block('c', 300),
      block('d', 300),
    ];
    const pages = assignBlocksToPages(blocks, 900);
    for (const page of pages) {
      // Each page's total height should not exceed the limit
      // except when a single block is larger (first block rule)
      if (page.blockKeys.length > 1) {
        expect(page.totalHeight).toBeLessThanOrEqual(900);
      }
    }
  });

  it('handles a single block larger than page height', () => {
    const blocks = [block('big', 2000)];
    const pages = assignBlocksToPages(blocks, PAGE_HEIGHT);
    expect(pages).toHaveLength(1);
    expect(pages[0].blockKeys).toEqual(['big']);
  });

  it('distributes many small blocks across pages', () => {
    const blocks = Array.from({ length: 10 }, (_, i) => block(`b${i}`, 150));
    const pages = assignBlocksToPages(blocks, 400);
    expect(pages.length).toBeGreaterThan(1);
    const totalBlocks = pages.flatMap(p => p.blockKeys);
    expect(totalBlocks).toHaveLength(10);
  });
});

describe('detectOverflow', () => {
  it('reports no overflow when blocks fit', () => {
    const blocks = [block('a', 200), block('b', 300)];
    const result = detectOverflow(blocks, 600);
    expect(result.hasOverflow).toBe(false);
    expect(result.fittingBlocks).toEqual(blocks);
    expect(result.overflowingBlocks).toEqual([]);
  });

  it('reports overflow when blocks exceed max height', () => {
    const blocks = [block('a', 600), block('b', 600)];
    const result = detectOverflow(blocks, 1000);
    expect(result.hasOverflow).toBe(true);
    expect(result.fittingBlocks).toHaveLength(1);
    expect(result.overflowingBlocks).toHaveLength(1);
  });

  it('keeps first block even if it alone exceeds height', () => {
    const blocks = [block('big', 2000)];
    const result = detectOverflow(blocks, 1000);
    expect(result.hasOverflow).toBe(false);
    expect(result.fittingBlocks).toHaveLength(1);
  });

  it('reports remaining height correctly', () => {
    const blocks = [block('a', 300)];
    const result = detectOverflow(blocks, 1000);
    expect(result.remainingHeight).toBe(700);
  });
});

describe('detectUnderflow', () => {
  it('pulls blocks that fit in remaining height', () => {
    const nextBlocks = [block('x', 100), block('y', 100)];
    const result = detectUnderflow(250, nextBlocks);
    expect(result.hasUnderflow).toBe(true);
    expect(result.pullableBlocks).toHaveLength(2);
    expect(result.remainingNextPageBlocks).toHaveLength(0);
  });

  it('stops pulling when a block does not fit', () => {
    const nextBlocks = [block('x', 100), block('y', 300)];
    const result = detectUnderflow(250, nextBlocks);
    expect(result.pullableBlocks).toHaveLength(1);
    expect(result.remainingNextPageBlocks).toHaveLength(1);
  });

  it('reports no underflow when nothing fits', () => {
    const nextBlocks = [block('x', 500)];
    const result = detectUnderflow(100, nextBlocks);
    expect(result.hasUnderflow).toBe(false);
    expect(result.pullableBlocks).toHaveLength(0);
  });
});

describe('reflowDocument', () => {
  const BODY_HEIGHT = 1000;

  it('keeps blocks on one page when they fit', () => {
    const pages = [{ pageId: 'p0', blocks: [block('a', 400), block('b', 500)] }];
    const result = reflowDocument(pages, BODY_HEIGHT);
    expect(result.pages).toHaveLength(1);
    expect(result.pages[0].blocks).toHaveLength(2);
  });

  it('distributes overflowing content to new pages', () => {
    const pages = [
      { pageId: 'p0', blocks: [block('a', 600), block('b', 600)] },
    ];
    const result = reflowDocument(pages, BODY_HEIGHT);
    expect(result.pages.length).toBeGreaterThanOrEqual(2);
    expect(result.pagesChanged).toBe(true);
  });

  it('consolidates pages after content deletion', () => {
    const pages = [
      { pageId: 'p0', blocks: [block('a', 200)] },
      { pageId: 'p1', blocks: [block('b', 200)] },
    ];
    const result = reflowDocument(pages, BODY_HEIGHT);
    expect(result.pages).toHaveLength(1);
    expect(result.pages[0].blocks).toHaveLength(2);
  });

  it('returns at least 1 page for empty content', () => {
    const pages = [{ pageId: 'p0', blocks: [] }];
    const result = reflowDocument(pages, BODY_HEIGHT);
    expect(result.pages).toHaveLength(1);
  });

  it('never produces a half-page (all pages use same height constraint)', () => {
    const manyBlocks = Array.from({ length: 20 }, (_, i) => block(`b${i}`, 200));
    const pages = [{ pageId: 'p0', blocks: manyBlocks }];
    const result = reflowDocument(pages, BODY_HEIGHT);
    // Each page (except last) should be reasonably full
    for (let i = 0; i < result.pages.length - 1; i++) {
      const height = totalBlockHeight(result.pages[i].blocks);
      expect(height).toBeGreaterThan(0);
      expect(height).toBeLessThanOrEqual(BODY_HEIGHT);
    }
  });

  it('preserves total block count across reflow', () => {
    const pages = [
      { pageId: 'p0', blocks: [block('a', 400), block('b', 400), block('c', 400)] },
    ];
    const result = reflowDocument(pages, 700);
    const totalBlocks = result.pages.flatMap(p => p.blocks);
    expect(totalBlocks).toHaveLength(3);
  });
});
