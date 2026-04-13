import { test, expect } from '@playwright/test';

test.describe('Font Size', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="toolbar"]');
  });

  test('font size selector is visible', async ({ page }) => {
    await expect(page.getByTestId('font-size-selector')).toBeVisible();
  });

  test('font size selector has expected options', async ({ page }) => {
    const selector = page.getByTestId('font-size-selector');
    const options = selector.locator('option');
    const values = await options.allTextContents();

    expect(values).toContain('8');
    expect(values).toContain('12');
    expect(values).toContain('24');
    expect(values).toContain('72');
  });

  test('changing font size exports in AST', async ({ page }) => {
    const body = page.locator('[data-testid^="page-body-"] [data-lexical-editor="true"]').first();
    await body.click();
    await page.keyboard.type('Big text');

    // Select all text
    await page.keyboard.press('Meta+a');
    await page.waitForTimeout(100);

    // Change font size
    await page.getByTestId('font-size-selector').selectOption('24');
    await page.waitForTimeout(200);

    // Export
    await page.getByTestId('btn-export-ast').click();
    const ast = await page.evaluate(() => (window as any).__lex4_last_ast);

    const para = ast.pages[0].body[0];
    expect(para.type).toBe('paragraph');

    const textRun = para.children.find((c: any) => c.type === 'text');
    expect(textRun).toBeDefined();
    expect(textRun.marks?.fontSize).toBe(24);
  });

  test('changing font family exports in AST', async ({ page }) => {
    const body = page.locator('[data-testid^="page-body-"] [data-lexical-editor="true"]').first();
    await body.click();
    await page.keyboard.type('Styled text');

    await page.keyboard.press('Meta+a');
    await page.waitForTimeout(100);

    await page.getByTestId('font-selector').selectOption('Georgia');
    await page.waitForTimeout(200);

    await page.getByTestId('btn-export-ast').click();
    const ast = await page.evaluate(() => (window as any).__lex4_last_ast);

    const para = ast.pages[0].body[0];
    const textRun = para.children.find((c: any) => c.type === 'text');
    expect(textRun).toBeDefined();
    expect(textRun.marks?.fontFamily).toBe('Georgia');
  });
});
