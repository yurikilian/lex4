/**
 * A4 page dimensions and layout constants.
 *
 * All values derived from the A4 standard (210mm × 297mm)
 * converted to CSS pixels at 96 DPI.
 */

export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;

/** CSS pixels per millimeter at 96 DPI */
export const PX_PER_MM = 96 / 25.4;

/** A4 width in CSS pixels (≈794px) */
export const A4_WIDTH_PX = Math.round(A4_WIDTH_MM * PX_PER_MM);

/** A4 height in CSS pixels (≈1123px) */
export const A4_HEIGHT_PX = Math.round(A4_HEIGHT_MM * PX_PER_MM);

/** Standard A4 margin: 30mm on all sides (European standard) in CSS pixels */
export const PAGE_MARGIN_TOP_PX = Math.round(30 * PX_PER_MM);
export const PAGE_MARGIN_BOTTOM_PX = Math.round(30 * PX_PER_MM);
export const PAGE_MARGIN_LEFT_PX = Math.round(30 * PX_PER_MM);
export const PAGE_MARGIN_RIGHT_PX = Math.round(30 * PX_PER_MM);

/** Maximum header height as a ratio of page height */
export const MAX_HEADER_RATIO = 0.2;

/** Maximum footer height as a ratio of page height */
export const MAX_FOOTER_RATIO = 0.2;

/** Maximum header height in CSS pixels */
export const MAX_HEADER_HEIGHT_PX = Math.round(A4_HEIGHT_PX * MAX_HEADER_RATIO);

/** Maximum footer height in CSS pixels */
export const MAX_FOOTER_HEIGHT_PX = Math.round(A4_HEIGHT_PX * MAX_FOOTER_RATIO);
