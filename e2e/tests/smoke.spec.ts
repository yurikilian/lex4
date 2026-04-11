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
  });

  test('should render at least one page', async ({ page }) => {
    await expect(page.getByTestId('page-0')).toBeVisible();
  });

  test('should render document view', async ({ page }) => {
    await expect(page.getByTestId('document-view')).toBeVisible();
  });
});
