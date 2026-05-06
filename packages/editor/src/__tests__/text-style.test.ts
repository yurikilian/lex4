import { describe, expect, it } from 'vitest';
import {
  extractInlineBlockTypeFromStyle,
  mergeInlineBlockTypeStyle,
} from '../utils/text-style';

describe('text-style', () => {
  it('extracts an inline block type from style text', () => {
    expect(extractInlineBlockTypeFromStyle('--lex4-block-type: h2; font-size: 18pt')).toBe('h2');
  });

  it('replaces the existing inline block preset without dropping unrelated styles', () => {
    const nextStyle = mergeInlineBlockTypeStyle(
      'color: rgb(1, 2, 3); --lex4-block-type: h1; font-size: 22.5pt; font-weight: 700',
      'paragraph',
    );

    expect(nextStyle).toContain('color: rgb(1, 2, 3)');
    expect(nextStyle).toContain('--lex4-block-type: paragraph');
    expect(nextStyle).toContain('font-size: 12pt');
    expect(nextStyle).toContain('font-weight: 400');
    expect(nextStyle).not.toContain('--lex4-block-type: h1');
  });

  it('does not duplicate inline block declarations when the same preset is applied twice', () => {
    const nextStyle = mergeInlineBlockTypeStyle(
      mergeInlineBlockTypeStyle('color: red', 'h1'),
      'h1',
    );

    expect(nextStyle.match(/--lex4-block-type:/g)).toHaveLength(1);
    expect(nextStyle.match(/font-size:/g)).toHaveLength(1);
    expect(nextStyle.match(/font-weight:/g)).toHaveLength(1);
  });
});
