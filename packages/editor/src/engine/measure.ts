import type { BlockMeasurement } from '../types/page';

/**
 * Measures top-level block nodes in a Lexical editor's DOM.
 *
 * Reads the rendered height of each direct child element within
 * the contentEditable container. This is the foundation for the
 * pagination engine — we need accurate block heights to decide
 * which blocks fit on each page.
 */
export function measureBlockHeights(editorElement: HTMLElement): BlockMeasurement[] {
  const measurements: BlockMeasurement[] = [];
  const children = editorElement.children;

  for (let i = 0; i < children.length; i++) {
    const child = children[i] as HTMLElement;
    const key = child.getAttribute('data-lexical-node-key') ?? `block-${i}`;
    const type = child.tagName.toLowerCase();
    const rect = child.getBoundingClientRect();

    measurements.push({
      nodeKey: key,
      height: rect.height,
      type,
    });
  }

  return measurements;
}

/**
 * Computes total height of a list of measured blocks.
 */
export function totalBlockHeight(blocks: BlockMeasurement[]): number {
  return blocks.reduce((sum, b) => sum + b.height, 0);
}
