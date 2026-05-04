import { describe, it, expect } from 'vitest';
import { DEFAULT_TRANSLATIONS } from '../i18n/defaults';
import { interpolate } from '../i18n/context';

describe('i18n — DEFAULT_TRANSLATIONS', () => {
  it('has all top-level sections', () => {
    expect(DEFAULT_TRANSLATIONS).toHaveProperty('toolbar');
    expect(DEFAULT_TRANSLATIONS).toHaveProperty('history');
    expect(DEFAULT_TRANSLATIONS).toHaveProperty('variables');
    expect(DEFAULT_TRANSLATIONS).toHaveProperty('header');
    expect(DEFAULT_TRANSLATIONS).toHaveProperty('footer');
    expect(DEFAULT_TRANSLATIONS).toHaveProperty('sidebar');
  });

  it('toolbar has all expected keys', () => {
    const t = DEFAULT_TRANSLATIONS.toolbar;
    expect(t.undo).toBe('Undo');
    expect(t.redo).toBe('Redo');
    expect(t.bold).toBe('Bold (Ctrl+B)');
    expect(t.italic).toBe('Italic (Ctrl+I)');
    expect(t.underline).toBe('Underline (Ctrl+U)');
    expect(t.strikethrough).toBe('Strikethrough');
    expect(t.alignLeft).toBe('Align Left');
    expect(t.alignCenter).toBe('Align Center');
    expect(t.alignRight).toBe('Align Right');
    expect(t.justify).toBe('Justify');
    expect(t.numberedList).toBe('Numbered List');
    expect(t.bulletList).toBe('Bullet List');
    expect(t.indent).toBe('Indent');
    expect(t.outdent).toBe('Outdent');
    expect(t.history).toBe('History');
    expect(t.blockType).toBe('Block type');
    expect(t.paragraph).toBe('Paragraph');
    expect(t.heading1).toBe('Heading 1');
    expect(t.heading2).toBe('Heading 2');
    expect(t.heading3).toBe('Heading 3');
    expect(t.heading4).toBe('Heading 4');
    expect(t.heading5).toBe('Heading 5');
    expect(t.heading6).toBe('Heading 6');
    expect(t.openHistory).toBe('Open History');
    expect(t.closeHistory).toBe('Close History');
  });

  it('history has all expected keys', () => {
    const h = DEFAULT_TRANSLATIONS.history;
    expect(h.title).toBe('History');
    expect(h.subtitle).toContain('last 100 actions');
    expect(h.empty).toBe('No history yet.');
    expect(h.clearHistory).toBe('Clear History');
  });

  it('history actions has all expected keys', () => {
    const a = DEFAULT_TRANSLATIONS.history.actions;
    expect(a.enabledHeadersFooters).toBe('Enabled headers and footers');
    expect(a.disabledHeadersFooters).toBe('Disabled headers and footers');
    expect(a.copiedHeaderToAll).toBe('Copied header to all pages');
    expect(a.copiedFooterToAll).toBe('Copied footer to all pages');
    expect(a.clearedHeader).toBe('Cleared header');
    expect(a.clearedFooter).toBe('Cleared footer');
    expect(a.clearedAllHeaders).toBe('Cleared all headers');
    expect(a.clearedAllFooters).toBe('Cleared all footers');
    expect(a.boldApplied).toBe('Bold applied');
    expect(a.italicApplied).toBe('Italic applied');
    expect(a.underlineApplied).toBe('Underline applied');
    expect(a.strikethroughApplied).toBe('Strikethrough applied');
    expect(a.alignedLeft).toBe('Aligned left');
    expect(a.alignedCenter).toBe('Aligned center');
    expect(a.alignedRight).toBe('Aligned right');
    expect(a.justifiedText).toBe('Justified text');
    expect(a.insertedNumberedList).toBe('Inserted numbered list');
    expect(a.insertedBulletList).toBe('Inserted bullet list');
    expect(a.indentedContent).toBe('Indented content');
    expect(a.outdentedContent).toBe('Outdented content');
    expect(a.fontChanged).toContain('{{value}}');
    expect(a.fontSizeChanged).toContain('{{value}}');
    expect(a.blockTypeChanged).toContain('{{value}}');
    expect(a.pageCounterSet).toContain('{{value}}');
    expect(a.insertedDocumentContent).toBe('Inserted document content');
  });

  it('variables has all expected keys', () => {
    const v = DEFAULT_TRANSLATIONS.variables;
    expect(v.title).toBe('Variables');
    expect(v.available).toContain('{{count}}');
    expect(v.refreshVariables).toBe('Refresh variables');
    expect(v.searchPlaceholder).toBe('Search variables...');
    expect(v.noVariablesFound).toBe('No variables found');
    expect(v.insertVariable).toContain('{{key}}');
    expect(v.openPanel).toBe('Open Variables');
    expect(v.closePanel).toBe('Close Variables');
  });

  it('header and footer have placeholder strings', () => {
    expect(DEFAULT_TRANSLATIONS.header.placeholder).toBe('Header');
    expect(DEFAULT_TRANSLATIONS.footer.placeholder).toBe('Footer');
  });

  it('header footer menu has all expected keys', () => {
    const h = DEFAULT_TRANSLATIONS.headerFooter;
    expect(h.label).toBe('Headers & Footers');
    expect(h.settingsLabel).toBe('Header and footer settings');
    expect(h.pageCounter).toBe('Page counter');
    expect(h.pageCounterModes.none).toBe('None');
    expect(h.pageCounterModes.header).toBe('Header');
    expect(h.pageCounterModes.footer).toBe('Footer');
    expect(h.pageCounterModes.both).toBe('Both');
    expect(h.headerSection).toBe('Header');
    expect(h.footerSection).toBe('Footer');
    expect(h.copyToAllPages).toBe('Copy to all pages');
    expect(h.clearThisPage).toBe('Clear this page');
    expect(h.clearAll).toBe('Clear all');
  });

  it('sidebar has close string', () => {
    expect(DEFAULT_TRANSLATIONS.sidebar.close).toBe('Close sidebar');
  });

  it('no empty string values in defaults', () => {
    function assertNoEmpty(obj: Record<string, unknown>, path = ''): void {
      for (const [key, value] of Object.entries(obj)) {
        const fullPath = path ? `${path}.${key}` : key;
        if (typeof value === 'string') {
          expect(value, `Empty string at ${fullPath}`).not.toBe('');
        } else if (typeof value === 'object' && value !== null) {
          assertNoEmpty(value as Record<string, unknown>, fullPath);
        }
      }
    }
    assertNoEmpty(DEFAULT_TRANSLATIONS as unknown as Record<string, unknown>);
  });
});

describe('interpolate', () => {
  it('replaces a single placeholder', () => {
    expect(interpolate('Hello {{name}}', { name: 'World' })).toBe('Hello World');
  });

  it('replaces multiple placeholders', () => {
    expect(interpolate('{{a}} and {{b}}', { a: 'X', b: 'Y' })).toBe('X and Y');
  });

  it('replaces numeric placeholders', () => {
    expect(interpolate('Count: {{count}}', { count: 42 })).toBe('Count: 42');
  });

  it('leaves unknown placeholders intact', () => {
    expect(interpolate('Hello {{unknown}}', {})).toBe('Hello {{unknown}}');
  });

  it('returns the string unchanged if no placeholders', () => {
    expect(interpolate('No placeholders here', { foo: 'bar' })).toBe('No placeholders here');
  });

  it('handles empty params', () => {
    expect(interpolate('{{x}}', {})).toBe('{{x}}');
  });

  it('handles template string from defaults', () => {
    expect(
      interpolate(DEFAULT_TRANSLATIONS.history.actions.fontChanged, { value: 'Inter' }),
    ).toBe('Font changed to Inter');
  });

  it('handles font size template', () => {
    expect(
      interpolate(DEFAULT_TRANSLATIONS.history.actions.fontSizeChanged, { value: '14' }),
    ).toBe('Font size changed to 14pt');
  });

  it('handles page counter template', () => {
    expect(
      interpolate(DEFAULT_TRANSLATIONS.history.actions.pageCounterSet, { value: 'header' }),
    ).toBe('Page counter set to header');
  });

  it('handles variable insert template', () => {
    expect(
      interpolate(DEFAULT_TRANSLATIONS.variables.insertVariable, { key: 'customer.name' }),
    ).toBe('Insert variable customer.name');
  });

  it('handles available count template', () => {
    expect(
      interpolate(DEFAULT_TRANSLATIONS.variables.available, { count: '5' }),
    ).toBe('5 available');
  });
});
