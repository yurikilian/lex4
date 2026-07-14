import { test, expect } from '@playwright/test';

test.describe('Optional Segment', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="toolbar"]');
  });

  async function selectLastChars(page: import('@playwright/test').Page, count: number) {
    await page.keyboard.down('Shift');
    for (let i = 0; i < count; i += 1) {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.up('Shift');
    await page.waitForTimeout(150);
  }

  test('toolbar button appears only with a non-empty selection', async ({ page }) => {
    const body = page.locator('[data-testid^="page-body-"] [data-lexical-editor="true"]').first();
    await body.click();

    await expect(page.getByTestId('btn-optional-segment')).toHaveCount(0);

    await page.keyboard.type('Some optional text');
    await expect(page.getByTestId('btn-optional-segment')).toHaveCount(0);

    await selectLastChars(page, 4);
    await expect(page.getByTestId('btn-optional-segment')).toBeVisible();
  });

  test('wraps the selection in a segment and unwraps it again', async ({ page }) => {
    const body = page.locator('[data-testid^="page-body-"] [data-lexical-editor="true"]').first();
    await body.click();
    await page.keyboard.type('Address optional');

    await selectLastChars(page, 8);
    await page.getByTestId('btn-optional-segment').click();

    const segment = page.locator('[data-lex4-optional-segment]');
    await expect(segment).toHaveCount(1);
    await expect(segment).toHaveText('optional');

    // Caret is left inside the segment → button stays visible and active.
    const button = page.getByTestId('btn-optional-segment');
    await expect(button).toHaveAttribute('aria-pressed', 'true');

    await button.click();
    await expect(segment).toHaveCount(0);
    await expect(body).toContainText('Address optional');
  });

  test('undo restores the wrapped segment', async ({ page }) => {
    const body = page.locator('[data-testid^="page-body-"] [data-lexical-editor="true"]').first();
    await body.click();
    await page.keyboard.type('Address optional');

    await selectLastChars(page, 8);
    await page.getByTestId('btn-optional-segment').click();
    await expect(page.locator('[data-lex4-optional-segment]')).toHaveCount(1);

    await page.getByTestId('btn-undo').click();
    await expect(page.locator('[data-lex4-optional-segment]')).toHaveCount(0);
    await expect(body).toContainText('Address optional');

    await page.getByTestId('btn-redo').click();
    await expect(page.locator('[data-lex4-optional-segment]')).toHaveCount(1);
  });

  test('exports segment with text and variable children in the AST', async ({ page }) => {
    const body = page.locator('[data-testid^="page-body-"] [data-lexical-editor="true"]').first();
    await body.click();
    await page.keyboard.type('City: ');

    await page.getByTestId('toggle-variable-panel').click();
    await page.getByTestId('variable-panel-company.address.city').click();
    await expect(page.locator('[data-testid="variable-chip-company.address.city"]')).toBeVisible();

    // Select ": " plus the chip (chip counts as one arrow step).
    await selectLastChars(page, 3);
    await page.getByTestId('btn-optional-segment').click();
    await expect(page.locator('[data-lex4-optional-segment]')).toHaveCount(1);

    await page.getByTestId('btn-export-ast').click();
    const ast = await page.evaluate(() => (window as unknown as { __lex4_last_ast: any }).__lex4_last_ast);

    const para = ast.pages[0].body[0];
    const segment = para.children.find((c: any) => c.type === 'optional-segment');
    expect(segment).toBeDefined();
    expect(segment.children.some((c: any) => c.type === 'variable' && c.key === 'company.address.city')).toBe(true);
    expect(segment.children.some((c: any) => c.type === 'text')).toBe(true);
  });

  test('long variable chip truncates with ellipsis and shows label tooltip', async ({ page }) => {
    const body = page.locator('[data-testid^="page-body-"] [data-lexical-editor="true"]').first();
    await body.click();

    await page.getByTestId('toggle-variable-panel').click();
    await page.getByTestId('variable-panel-customer.identificationType').click();

    const chip = page.locator('[data-testid="variable-chip-customer.identificationType"]');
    await expect(chip).toBeVisible();
    await expect(chip).toHaveAttribute('title', 'Cliente - Tipo de identificação');

    const styles = await chip.evaluate((node) => {
      const computed = getComputedStyle(node);
      return {
        overflow: computed.overflow,
        textOverflow: computed.textOverflow,
        maxWidth: computed.maxWidth,
      };
    });
    expect(styles.overflow).toBe('hidden');
    expect(styles.textOverflow).toBe('ellipsis');
    expect(styles.maxWidth).toBe('100%');
  });
});
