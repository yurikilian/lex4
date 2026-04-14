import {
  A4_HEIGHT_PX,
  PAGE_MARGIN_Y_PX,
} from './dimensions';

/**
 * Computes the available body height for a page, accounting for
 * header/footer heights and page margins.
 */
export function computeBodyHeight(
  headerHeight: number,
  footerHeight: number,
): number {
  const verticalMargins = PAGE_MARGIN_Y_PX * 2;
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
