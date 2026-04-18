import {
  A4_HEIGHT_PX,
  PAGE_MARGIN_TOP_PX,
  PAGE_MARGIN_BOTTOM_PX,
} from './dimensions';

export function computeBodyHeight(
  headerHeight: number,
  footerHeight: number,
): number {
  const verticalMargins = PAGE_MARGIN_TOP_PX + PAGE_MARGIN_BOTTOM_PX;
  return A4_HEIGHT_PX - headerHeight - footerHeight - verticalMargins;
}

/**
 * Computes the content area height based on whether
 * headers/footers are enabled.
 */
export function computeContentAreaHeight(
  headerFooterEnabled: boolean,
  headerHeight: number,
  footerHeight: number,
): number {
  if (!headerFooterEnabled) {
    return computeBodyHeight(0, 0);
  }
  return computeBodyHeight(headerHeight, footerHeight);
}
