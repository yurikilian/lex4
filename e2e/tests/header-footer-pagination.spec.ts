import { expect, test, type Page } from '@playwright/test';

async function createLargeBody(page: Page, rows = 90) {
  const body = page.locator('[data-testid^="page-body-"]').first();
  await body.click();

  const paragraphs = Array.from({ length: rows }, (_, index) =>
    `Row ${index + 1}: Sed gravida sit amet enim vel fermentum. Aenean ut ante a mi pulvinar placerat in eu odio. Phasellus ac posuere neque. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae.`,
  );

  await page.evaluate(async (text) => {
    const editor = document.querySelector('[data-testid^="page-body-"] [contenteditable="true"]');
    if (!editor) {
      return;
    }

    editor.focus();
    const dataTransfer = new DataTransfer();
    dataTransfer.setData('text/plain', text);
    editor.dispatchEvent(new ClipboardEvent('paste', {
      clipboardData: dataTransfer,
      bubbles: true,
      cancelable: true,
    }));
  }, paragraphs.join('\n'));

  await page.waitForTimeout(5000);
}

async function typeLargeRegion(page: Page, region: 'header' | 'footer') {
  const editor = page.locator(`[data-testid^="page-${region}-"] [contenteditable="true"]`).first();
  await editor.click();

  for (let index = 0; index < 6; index++) {
    await page.keyboard.type(`${region.toUpperCase()} line ${index + 1}`);
    if (index < 5) {
      await page.keyboard.press('Enter');
    }
  }

  await page.waitForTimeout(500);
}

test.describe('Header/Footer Pagination', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="page-0"]');
    await page.getByTestId('header-footer-switch').click();
  });

  test('editing a header alone does not implicitly propagate it to later overflow pages', async ({ page }) => {
    await typeLargeRegion(page, 'header');
    await createLargeBody(page);
    await page.waitForTimeout(5000);

    const pageCountAfter = await page.locator('[data-page-id]').count();
    expect(pageCountAfter).toBeGreaterThan(1);

    const lastHeader = page.locator('[data-testid^="page-header-"] [contenteditable="true"]').last();
    await expect(lastHeader).not.toContainText('HEADER line 1');
  });

  test('copied large header propagates to pages created later by overflow', async ({ page }) => {
    await createLargeBody(page);
    const pageCountBefore = await page.locator('[data-page-id]').count();

    await typeLargeRegion(page, 'header');
    await page.locator('[data-testid^="page-body-"]').first().click();
    await page.getByTestId('header-footer-menu-trigger').click();
    await page.getByTestId('copy-header-all').click();
    await page.waitForTimeout(5000);

    const pageCountAfter = await page.locator('[data-page-id]').count();
    expect(pageCountAfter).toBeGreaterThan(pageCountBefore);

    const lastHeader = page.locator('[data-testid^="page-header-"] [contenteditable="true"]').last();
    await expect(lastHeader).toContainText('HEADER line 1');
  });

  test('copied large footer propagates to pages created later by overflow', async ({ page }) => {
    await createLargeBody(page);
    const pageCountBefore = await page.locator('[data-page-id]').count();

    await typeLargeRegion(page, 'footer');
    await page.locator('[data-testid^="page-body-"]').first().click();
    await page.getByTestId('header-footer-menu-trigger').click();
    await page.getByTestId('copy-footer-all').click();
    await page.waitForTimeout(5000);

    const pageCountAfter = await page.locator('[data-page-id]').count();
    expect(pageCountAfter).toBeGreaterThan(pageCountBefore);

    const lastFooter = page.locator('[data-testid^="page-footer-"] [contenteditable="true"]').last();
    await expect(lastFooter).toContainText('FOOTER line 1');
  });

  test('clearing all headers compacts the document back down', async ({ page }) => {
    await createLargeBody(page);
    await typeLargeRegion(page, 'header');
    await page.locator('[data-testid^="page-body-"]').first().click();
    await page.getByTestId('header-footer-menu-trigger').click();
    await page.getByTestId('copy-header-all').click();
    await page.waitForTimeout(5000);

    const expandedPageCount = await page.locator('[data-page-id]').count();

    await page.getByTestId('header-footer-menu-trigger').click();
    await page.getByTestId('clear-all-headers').click();
    await page.waitForTimeout(5000);

    const compactedPageCount = await page.locator('[data-page-id]').count();
    expect(compactedPageCount).toBeLessThan(expandedPageCount);
  });
});
