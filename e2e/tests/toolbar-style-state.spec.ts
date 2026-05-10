import { test, expect } from '@playwright/test';
import { setTextSelection } from './helpers';

const BODY_SELECTOR = '[data-testid^="page-body-"] [data-lexical-editor="true"]';

test.describe('Toolbar Style State', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="toolbar"]');
  });

  test('bold button pressed state follows the caret', async ({ page }) => {
    const editable = page.locator(BODY_SELECTOR).first();
    await editable.click();
    await page.keyboard.type('Bold plain');

    await setTextSelection(page, BODY_SELECTOR, 0, 4);
    await page.getByTestId('btn-bold').click();

    await setTextSelection(page, BODY_SELECTOR, 2, 2);
    await expect(page.getByTestId('btn-bold')).toHaveAttribute('aria-pressed', 'true');

    await setTextSelection(page, BODY_SELECTOR, 7, 7);
    await expect(page.getByTestId('btn-bold')).toHaveAttribute('aria-pressed', 'false');
  });

  test('list buttons pressed state follows active list type', async ({ page }) => {
    const editable = page.locator(BODY_SELECTOR).first();
    await editable.click();
    await page.keyboard.type('List state');

    await page.getByTestId('btn-list-number').click();
    await expect(page.getByTestId('btn-list-number')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('btn-list-bullet')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByTestId('btn-list-alpha')).toHaveAttribute('aria-pressed', 'false');

    await page.getByTestId('btn-list-bullet').click();
    await expect(page.getByTestId('btn-list-number')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByTestId('btn-list-bullet')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('btn-list-alpha')).toHaveAttribute('aria-pressed', 'false');

    await page.getByTestId('btn-list-alpha').click();
    await expect(page.getByTestId('btn-list-number')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByTestId('btn-list-bullet')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByTestId('btn-list-alpha')).toHaveAttribute('aria-pressed', 'true');
  });

  test('partial heading selection can be restyled as paragraph on the same line', async ({ page }) => {
    const editable = page.locator(BODY_SELECTOR).first();
    const text = 'THIS IS A HEADING! HERE I WANT P';
    const paragraphStart = text.indexOf('HERE I WANT P');

    await editable.click();
    await page.keyboard.type(text);
    await setTextSelection(page, BODY_SELECTOR, 0, text.length);
    await page.getByTestId('block-type-selector').click();
    await page.getByTestId('block-type-option-h1').click();

    await setTextSelection(page, BODY_SELECTOR, paragraphStart, text.length);
    await page.getByTestId('block-type-selector').click();
    await page.getByTestId('block-type-option-paragraph').click();

    const segments = await page.evaluate(() => {
      const editor = document.querySelector<HTMLElement>('[data-testid^="page-body-"] [data-lexical-editor="true"]');
      if (!editor) {
        return null;
      }

      const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
      const result: Array<{ text: string; fontSize: string; fontWeight: string }> = [];
      let node: Text | null;

      while ((node = walker.nextNode() as Text | null)) {
        const content = node.textContent ?? '';
        if (!content.trim()) {
          continue;
        }
        const parent = (node.parentElement ?? editor) as HTMLElement;
        const styles = getComputedStyle(parent);
        result.push({
          text: content,
          fontSize: styles.fontSize,
          fontWeight: styles.fontWeight,
        });
      }

      return result;
    });

    expect(segments).not.toBeNull();
    const headingSegment = segments?.find(segment => segment.text.includes('THIS IS A HEADING!'));
    const paragraphSegment = segments?.find(segment => segment.text.includes('HERE I WANT P'));
    expect(headingSegment).toBeDefined();
    expect(paragraphSegment).toBeDefined();
    expect(Number.parseFloat(headingSegment!.fontSize)).toBeGreaterThan(Number.parseFloat(paragraphSegment!.fontSize));
    expect(Number.parseInt(headingSegment!.fontWeight, 10)).toBeGreaterThan(Number.parseInt(paragraphSegment!.fontWeight, 10));
  });

  test('selected variable can be promoted to a heading', async ({ page }) => {
    const editable = page.locator(BODY_SELECTOR).first();
    await editable.click();

    await page.getByTestId('toggle-variable-panel').click();
    await page.getByTestId('variable-panel-customer.document').click();

    const chip = page.getByTestId('variable-chip-customer.document');
    await expect(chip).toBeVisible();
    await chip.click();

    await page.getByTestId('block-type-selector').click();
    await page.getByTestId('block-type-option-h1').click();

    const chipStyles = await page.evaluate(() => {
      const heading = document.querySelector('[data-testid^="page-body-"] h1');
      const chip = heading?.querySelector('[data-testid="variable-chip-customer.document"]') as HTMLElement | null;
      if (!chip) {
        return null;
      }

      const styles = getComputedStyle(chip);
      return {
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight,
      };
    });

    expect(chipStyles).not.toBeNull();
    expect(Number.parseFloat(chipStyles!.fontSize)).toBeGreaterThan(20);
    expect(Number.parseInt(chipStyles!.fontWeight, 10)).toBeGreaterThanOrEqual(700);

    await page.getByTestId('btn-export-ast').click();
    const ast = await page.evaluate(() => (window as any).__lex4_last_ast);

    const block = ast.pages[0].body[0];
    expect(block.type).toBe('heading');
    expect(block.level).toBe(1);
    expect(block.children[0]).toMatchObject({
      type: 'variable',
      key: 'customer.document',
    });
  });
});
