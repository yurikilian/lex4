import { test, expect } from '@playwright/test';

test.describe('Variable Insert', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="toolbar"]');
  });

  test('variable picker button is visible', async ({ page }) => {
    await expect(page.getByTestId('variable-picker-button')).toBeVisible();
  });

  test('variable picker opens dropdown', async ({ page }) => {
    // Focus body first
    const body = page.locator('[data-testid^="page-body-"] [data-lexical-editor="true"]').first();
    await body.click();

    await page.getByTestId('variable-picker-button').click();
    await expect(page.getByTestId('variable-picker-dropdown')).toBeVisible();
  });

  test('variable picker shows available variables', async ({ page }) => {
    const body = page.locator('[data-testid^="page-body-"] [data-lexical-editor="true"]').first();
    await body.click();

    await page.getByTestId('variable-picker-button').click();
    await expect(page.getByTestId('variable-option-customer.name')).toBeVisible();
    await expect(page.getByTestId('variable-option-proposal.date')).toBeVisible();
  });

  test('variable picker supports search', async ({ page }) => {
    const body = page.locator('[data-testid^="page-body-"] [data-lexical-editor="true"]').first();
    await body.click();

    await page.getByTestId('variable-picker-button').click();
    await page.getByTestId('variable-picker-search').fill('seller');

    await expect(page.getByTestId('variable-option-seller.name')).toBeVisible();
    // customer.name should be filtered out
    await expect(page.getByTestId('variable-option-customer.name')).not.toBeVisible();
  });

  test('clicking variable inserts it into editor', async ({ page }) => {
    const body = page.locator('[data-testid^="page-body-"] [data-lexical-editor="true"]').first();
    await body.click();
    await page.keyboard.type('Dear ');

    await page.getByTestId('variable-picker-button').click();
    await page.getByTestId('variable-option-customer.name').click();

    // The dropdown should close
    await expect(page.getByTestId('variable-picker-dropdown')).not.toBeVisible();

    // The variable chip should appear in the editor
    const chip = page.locator('[data-testid="variable-chip-customer.name"]');
    await expect(chip).toBeVisible();
    await expect(chip).toHaveText('Customer Name');
  });
});
