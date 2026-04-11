import { test, expect } from '@playwright/test';

test.describe('Lex4 Editor — smoke', () => {
  test('should render the editor', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('lex4-editor')).toBeVisible();
  });
});
