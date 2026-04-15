import type { BlockMeasurement } from '../types/page';

/** Result of overflow detection on a single page */
export interface OverflowResult {
  hasOverflow: boolean;
  fittingBlocks: BlockMeasurement[];
  overflowingBlocks: BlockMeasurement[];
  remainingHeight: number;
  /** True when the first (or only) block alone exceeds maxBodyHeight */
  singleBlockOverflow: boolean;
}

/**
 * Detects which blocks fit within a page's body height and
 * which overflow.
 *
 * Returns the split point: fitting blocks stay, overflowing
 * blocks must be moved to the next page.
 */
export function detectOverflow(
  blocks: BlockMeasurement[],
  maxBodyHeight: number,
): OverflowResult {
  let usedHeight = 0;
  let splitIndex = blocks.length;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (usedHeight + block.height > maxBodyHeight && i > 0) {
      splitIndex = i;
      break;
    }
    usedHeight += block.height;
  }

  const fitting = blocks.slice(0, splitIndex);
  const overflowing = blocks.slice(splitIndex);

  const singleBlockOverflow =
    blocks.length > 0 && blocks[0].height > maxBodyHeight;

  return {
    hasOverflow: overflowing.length > 0,
    fittingBlocks: fitting,
    overflowingBlocks: overflowing,
    remainingHeight: maxBodyHeight - usedHeight,
    singleBlockOverflow,
  };
}

/** Result of underflow detection */
export interface UnderflowResult {
  hasUnderflow: boolean;
  pullableBlocks: BlockMeasurement[];
  remainingNextPageBlocks: BlockMeasurement[];
}

/**
 * Detects if blocks from the next page can be pulled back to
 * fill remaining space on the current page.
 */
export function detectUnderflow(
  remainingHeight: number,
  nextPageBlocks: BlockMeasurement[],
): UnderflowResult {
  const pullable: BlockMeasurement[] = [];
  let available = remainingHeight;

  for (const block of nextPageBlocks) {
    if (block.height <= available) {
      pullable.push(block);
      available -= block.height;
    } else {
      break;
    }
  }

  return {
    hasUnderflow: pullable.length > 0,
    pullableBlocks: pullable,
    remainingNextPageBlocks: nextPageBlocks.slice(pullable.length),
  };
}
