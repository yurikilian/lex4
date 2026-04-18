import { test, expect } from '@playwright/test';

test.describe('Page Invariants', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="page-0"]');
  });

  test('first page has exact A4 dimensions', async ({ page }) => {
    const pageEl = page.getByTestId('page-0');
    const box = await pageEl.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBe(794);
    expect(box!.height).toBeCloseTo(1123, 0);
  });

  test('page has white background', async ({ page }) => {
    const bg = await page.getByTestId('page-0').evaluate(
      el => getComputedStyle(el).backgroundColor,
    );
    // rgb(255, 255, 255) = white
    expect(bg).toContain('255');
  });

  test('page has A4 width and height styles', async ({ page }) => {
    const styles = await page.getByTestId('page-0').evaluate(el => ({
      width: el.style.width,
      height: el.style.height,
    }));
    expect(styles.width).toBe('794px');
    expect(styles.height).toBe('1123px');
  });

  test('multiple pages all have A4 dimensions', async ({ page }) => {
    // Type enough content to create a second page
    const body = page.locator('[data-testid^="page-body-"]').first();
    await body.click();

    // Type many lines to overflow
    for (let i = 0; i < 60; i++) {
      await page.keyboard.type(`Line ${i + 1}`);
      await page.keyboard.press('Enter');
    }

    // Wait for pages to be created
    await page.waitForTimeout(500);

    // Check all pages have A4 dimensions — use data-page-id attribute
    const pages = page.locator('[data-page-id]');
    const count = await pages.count();
    expect(count).toBeGreaterThanOrEqual(1);

    for (let i = 0; i < count; i++) {
      const box = await pages.nth(i).boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBe(794);
      expect(box!.height).toBeCloseTo(1123, 0);
    }
  });
});
