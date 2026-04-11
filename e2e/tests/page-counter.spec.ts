import { expect, test, type Page } from '@playwright/test';

async function createAdditionalPages(page: Page) {
  const body = page.locator('[data-testid^="page-body-"]').first();
  await body.click();

  const paragraphs = Array.from({ length: 60 }, (_, index) =>
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

test.describe('Page Counter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="page-0"]');
  });

  test('page counter selector appears with header/footer controls', async ({ page }) => {
    await page.getByTestId('header-footer-switch').click();

    const selector = page.getByTestId('page-counter-mode');
    await expect(selector).toBeVisible();
    await expect(selector).toHaveValue('none');
  });

  test('page counter can render in the header across all pages', async ({ page }) => {
    await page.getByTestId('header-footer-switch').click();
    await createAdditionalPages(page);

    await page.getByTestId('page-counter-mode').selectOption('header');

    const pageCount = await page.locator('[data-page-id]').count();
    expect(pageCount).toBeGreaterThanOrEqual(2);

    const headerCounters = page.locator('[data-testid^="page-counter-header-"]');
    await expect(headerCounters).toHaveCount(pageCount);
    await expect(headerCounters.first()).toHaveText(`Page 1 of ${pageCount}`);
    await expect(headerCounters.last()).toHaveText(`Page ${pageCount} of ${pageCount}`);

    await expect(page.locator('[data-testid^="page-counter-footer-"]')).toHaveCount(0);
  });

  test('page counter can render in both header and footer across all pages', async ({ page }) => {
    await page.getByTestId('header-footer-switch').click();
    await createAdditionalPages(page);

    await page.getByTestId('page-counter-mode').selectOption('both');

    const pageCount = await page.locator('[data-page-id]').count();
    expect(pageCount).toBeGreaterThanOrEqual(2);

    const headerCounters = page.locator('[data-testid^="page-counter-header-"]');
    const footerCounters = page.locator('[data-testid^="page-counter-footer-"]');

    await expect(headerCounters).toHaveCount(pageCount);
    await expect(footerCounters).toHaveCount(pageCount);
    await expect(headerCounters.first()).toHaveText(`Page 1 of ${pageCount}`);
    await expect(footerCounters.last()).toHaveText(`Page ${pageCount} of ${pageCount}`);
  });

  test('page counter can render in the footer and be disabled again', async ({ page }) => {
    await page.getByTestId('header-footer-switch').click();
    await page.getByTestId('page-counter-mode').selectOption('footer');

    const footerCounters = page.locator('[data-testid^="page-counter-footer-"]');
    await expect(footerCounters).toHaveCount(1);
    await expect(footerCounters.first()).toHaveText('Page 1 of 1');
    await expect(page.locator('[data-testid^="page-counter-header-"]')).toHaveCount(0);

    await page.getByTestId('page-counter-mode').selectOption('none');
    await expect(page.locator('[data-testid^="page-counter-footer-"]')).toHaveCount(0);
  });
});
