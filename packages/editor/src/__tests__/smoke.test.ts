import { describe, it, expect } from 'vitest';

describe('Lex4 Editor — smoke test', () => {
  it('should import constants without errors', async () => {
    const dims = await import('../constants/dimensions');
    expect(dims.A4_WIDTH_PX).toBe(794);
    expect(dims.A4_HEIGHT_PX).toBe(1123);
  });
});
