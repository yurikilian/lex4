import { test, expect } from '@playwright/test';

test.describe('Toolbar & Formatting', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="toolbar"]');
  });

  test('toolbar renders all format buttons', async ({ page }) => {
    await expect(page.getByTestId('btn-bold')).toBeVisible();
    await expect(page.getByTestId('btn-italic')).toBeVisible();
    await expect(page.getByTestId('btn-underline')).toBeVisible();
    await expect(page.getByTestId('btn-strike')).toBeVisible();
  });

  test('toolbar renders alignment buttons', async ({ page }) => {
    await expect(page.getByTestId('btn-align-left')).toBeVisible();
    await expect(page.getByTestId('btn-align-center')).toBeVisible();
    await expect(page.getByTestId('btn-align-right')).toBeVisible();
    await expect(page.getByTestId('btn-align-justify')).toBeVisible();
  });

  test('toolbar renders font selector with options', async ({ page }) => {
    const selector = page.getByTestId('font-selector');
    await expect(selector).toBeVisible();
    const options = selector.locator('option');
    expect(await options.count()).toBeGreaterThanOrEqual(5);
  });

  test('toolbar renders list controls', async ({ page }) => {
    await expect(page.getByTestId('btn-list-number')).toBeVisible();
    await expect(page.getByTestId('btn-list-bullet')).toBeVisible();
    await expect(page.getByTestId('btn-indent')).toBeVisible();
    await expect(page.getByTestId('btn-outdent')).toBeVisible();
  });

  test('format group is present', async ({ page }) => {
    await expect(page.getByTestId('format-group')).toBeVisible();
  });

  test('alignment group is present', async ({ page }) => {
    await expect(page.getByTestId('align-group')).toBeVisible();
  });

  test('list group is present', async ({ page }) => {
    await expect(page.getByTestId('list-group')).toBeVisible();
  });

  test('typing in the editor works', async ({ page }) => {
    const body = page.locator('[data-testid^="page-body-"]').first();
    await body.click();
    await page.keyboard.type('Hello, Lex4!');
    await expect(body).toContainText('Hello, Lex4!');
  });
});
