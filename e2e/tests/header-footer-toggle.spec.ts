import { test, expect } from '@playwright/test';

test.describe('Header/Footer Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="page-0"]');
  });

  test('toggle is visible in toolbar', async ({ page }) => {
    await expect(page.getByTestId('header-footer-toggle')).toBeVisible();
  });

  test('toggle defaults to off', async ({ page }) => {
    const switchEl = page.getByTestId('header-footer-switch');
    const checked = await switchEl.getAttribute('aria-checked');
    expect(checked).toBe('false');
  });

  test('clicking toggle switches it on', async ({ page }) => {
    const switchEl = page.getByTestId('header-footer-switch');
    await switchEl.click();
    const checked = await switchEl.getAttribute('aria-checked');
    expect(checked).toBe('true');
  });

  test('toggle on shows header/footer actions', async ({ page }) => {
    const switchEl = page.getByTestId('header-footer-switch');
    await switchEl.click();
    await expect(page.getByTestId('header-footer-actions')).toBeVisible();
  });

  test('toggle off hides header/footer actions', async ({ page }) => {
    const switchEl = page.getByTestId('header-footer-switch');
    // Toggle on
    await switchEl.click();
    await expect(page.getByTestId('header-footer-actions')).toBeVisible();
    // Toggle off
    await switchEl.click();
    await expect(page.getByTestId('header-footer-actions')).not.toBeVisible();
  });

  test('toggling on shows header and footer regions', async ({ page }) => {
    const switchEl = page.getByTestId('header-footer-switch');
    await switchEl.click();
    // Header and footer should now be visible
    const headers = page.locator('[data-testid^="page-header-"]');
    const footers = page.locator('[data-testid^="page-footer-"]');
    expect(await headers.count()).toBeGreaterThanOrEqual(1);
    expect(await footers.count()).toBeGreaterThanOrEqual(1);
  });

  test('toggling off hides header and footer regions', async ({ page }) => {
    const switchEl = page.getByTestId('header-footer-switch');
    // Toggle on then off
    await switchEl.click();
    await page.waitForTimeout(100);
    await switchEl.click();
    await page.waitForTimeout(100);
    const headers = page.locator('[data-testid^="page-header-"]');
    const footers = page.locator('[data-testid^="page-footer-"]');
    expect(await headers.count()).toBe(0);
    expect(await footers.count()).toBe(0);
  });
});
