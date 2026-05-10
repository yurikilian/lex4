import { test, expect } from '@playwright/test';

test.describe('Lex4 Editor — smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="lex4-editor"]');
  });

  test('should render the editor container', async ({ page }) => {
    await expect(page.getByTestId('lex4-editor')).toBeVisible();
  });

  test('should render the toolbar', async ({ page }) => {
    await expect(page.getByTestId('toolbar')).toBeVisible();
    await expect(page.getByTestId('btn-toggle-alpha-sample')).toBeVisible();
  });

  test('should render at least one page', async ({ page }) => {
    await expect(page.getByTestId('page-0')).toBeVisible();
  });

  test('should render document view', async ({ page }) => {
    await expect(page.getByTestId('document-view')).toBeVisible();
  });

  test('should load the alpha list sample preset', async ({ page }) => {
    await page.goto('/?sample=alpha-list');
    await page.waitForSelector('[data-testid="lex4-editor"]');

    const body = page.locator('[data-testid^="page-body-"]').first();
    await expect(body).toContainText('Alphabetic outline sample');
    await expect(body.locator('ol[data-lex4-list-variant="alpha"]')).toBeVisible();

    await page.getByTestId('btn-export-ast').click();
    const ast = await page.evaluate(() => (window as any).__lex4_last_ast);
    const alphaList = ast.pages[0].body.find((block: any) => block.type === 'list');

    expect(alphaList?.listType).toBe('ordered-alpha');
  });
});
