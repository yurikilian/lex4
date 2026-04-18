import { describe, it, expect } from 'vitest';
import {
  A4_WIDTH_PX,
  A4_HEIGHT_PX,
  MAX_HEADER_HEIGHT_PX,
  MAX_FOOTER_HEIGHT_PX,
  PAGE_MARGIN_TOP_PX,
  PAGE_MARGIN_BOTTOM_PX,
  PAGE_MARGIN_LEFT_PX,
  PAGE_MARGIN_RIGHT_PX,
  MAX_HEADER_RATIO,
  MAX_FOOTER_RATIO,
} from '../constants/dimensions';
import { computeBodyHeight, computeContentAreaHeight } from '../constants/page-layout';

describe('A4 dimensions', () => {
  it('produces correct pixel width', () => {
    expect(A4_WIDTH_PX).toBe(794);
  });

  it('produces correct pixel height', () => {
    expect(A4_HEIGHT_PX).toBe(1123);
  });

  it('sets standard A4 margins (30mm = 113px all sides)', () => {
    expect(PAGE_MARGIN_TOP_PX).toBe(113);
    expect(PAGE_MARGIN_BOTTOM_PX).toBe(113);
    expect(PAGE_MARGIN_LEFT_PX).toBe(113);
    expect(PAGE_MARGIN_RIGHT_PX).toBe(113);
  });

  it('sets max header height to 20% of page height', () => {
    expect(MAX_HEADER_HEIGHT_PX).toBe(Math.round(A4_HEIGHT_PX * MAX_HEADER_RATIO));
    expect(MAX_HEADER_HEIGHT_PX).toBe(225);
  });

  it('sets max footer height to 20% of page height', () => {
    expect(MAX_FOOTER_HEIGHT_PX).toBe(Math.round(A4_HEIGHT_PX * MAX_FOOTER_RATIO));
    expect(MAX_FOOTER_HEIGHT_PX).toBe(225);
  });
});

describe('computeBodyHeight', () => {
  it('returns full body area when header and footer are zero', () => {
    const body = computeBodyHeight(0, 0);
    expect(body).toBe(A4_HEIGHT_PX - PAGE_MARGIN_TOP_PX - PAGE_MARGIN_BOTTOM_PX);
  });

  it('subtracts header and footer heights', () => {
    const body = computeBodyHeight(100, 80);
    expect(body).toBe(A4_HEIGHT_PX - 100 - 80 - PAGE_MARGIN_TOP_PX - PAGE_MARGIN_BOTTOM_PX);
  });

  it('subtracts max header + footer correctly', () => {
    const body = computeBodyHeight(MAX_HEADER_HEIGHT_PX, MAX_FOOTER_HEIGHT_PX);
    expect(body).toBe(A4_HEIGHT_PX - MAX_HEADER_HEIGHT_PX - MAX_FOOTER_HEIGHT_PX - PAGE_MARGIN_TOP_PX - PAGE_MARGIN_BOTTOM_PX);
    expect(body).toBeGreaterThan(0);
  });
});

describe('computeContentAreaHeight', () => {
  it('ignores header/footer values when toggle is off', () => {
    const area = computeContentAreaHeight(false, 100, 80);
    expect(area).toBe(computeBodyHeight(0, 0));
  });

  it('uses header/footer values when toggle is on', () => {
    const area = computeContentAreaHeight(true, 100, 80);
    expect(area).toBe(computeBodyHeight(100, 80));
  });
});
