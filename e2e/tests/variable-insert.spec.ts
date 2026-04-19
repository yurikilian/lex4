import { test, expect } from '@playwright/test';

test.describe('Variable Insert', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="toolbar"]');
  });

  test('variable panel toggle is visible in the toolbar', async ({ page }) => {
    await expect(page.getByTestId('toggle-variable-panel')).toBeVisible();
  });

  test('variable toggle opens the sidebar', async ({ page }) => {
    // Focus body first
    const body = page.locator('[data-testid^="page-body-"] [data-lexical-editor="true"]').first();
    await body.click();

    await page.getByTestId('toggle-variable-panel').click();
    await expect(page.getByTestId('variable-panel')).toBeVisible();
  });

  test('variable sidebar shows available variables', async ({ page }) => {
    const body = page.locator('[data-testid^="page-body-"] [data-lexical-editor="true"]').first();
    await body.click();

    await page.getByTestId('toggle-variable-panel').click();
    await expect(page.getByTestId('variable-panel-customer.name')).toBeVisible();
    await expect(page.getByTestId('variable-panel-proposal.date')).toBeVisible();
  });

  test('variable sidebar supports search', async ({ page }) => {
    const body = page.locator('[data-testid^="page-body-"] [data-lexical-editor="true"]').first();
    await body.click();

    await page.getByTestId('toggle-variable-panel').click();
    await page.getByTestId('variable-panel-search').fill('seller');

    await expect(page.getByTestId('variable-panel-seller.name')).toBeVisible();
    // customer.name should be filtered out
    await expect(page.getByTestId('variable-panel-customer.name')).not.toBeVisible();
  });

  test('clicking variable inserts it into editor', async ({ page }) => {
    const body = page.locator('[data-testid^="page-body-"] [data-lexical-editor="true"]').first();
    await body.click();
    await page.keyboard.type('Dear ');

    await page.getByTestId('toggle-variable-panel').click();
    await page.getByTestId('variable-panel-customer.name').click();

    const chip = page.locator('[data-testid="variable-chip-customer.name"]');
    await expect(chip).toBeVisible();
    await expect(chip).toHaveText('Customer Name');
  });
});
