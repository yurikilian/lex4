import { test, expect, Page } from '@playwright/test';

/** Paste text into the first page body's editor via clipboard API */
async function pasteText(page: Page, text: string) {
  await page.evaluate(async (t) => {
    const editor = document.querySelector('[contenteditable="true"]');
    if (editor) {
      editor.focus();
      const dt = new DataTransfer();
      dt.setData('text/plain', t);
      editor.dispatchEvent(
        new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }),
      );
    }
  }, text);
}

/** Wait for overflow/pagination to settle after a content change */
async function waitForPagination(page: Page) {
  await page.waitForTimeout(3000);
}

test.describe('Mid-Block Splitting', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="page-0"]');
  });

  test('single long paragraph splits across pages', async ({ page }) => {
    const body = page.locator('[data-testid^="page-body-"]').first();
    await body.click();

    // Create a single very long paragraph (no newlines = single block)
    const longText = Array.from({ length: 200 }, (_, i) =>
      `Sentence ${i + 1} of a very long paragraph that should cause overflow. `
    ).join('');

    await pasteText(page, longText);
    await waitForPagination(page);

    // Should have created at least 2 pages
    const pages = page.locator('[data-page-id]');
    const count = await pages.count();
    expect(count).toBeGreaterThanOrEqual(2);

    // All pages must be A4 size
    for (let i = 0; i < count; i++) {
      const box = await pages.nth(i).boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBe(794);
      expect(box!.height).toBe(1123);
    }
  });

  test('no content visually overflows page body after long paragraph paste', async ({ page }) => {
    const body = page.locator('[data-testid^="page-body-"]').first();
    await body.click();

    const longText = Array.from({ length: 200 }, (_, i) =>
      `Word${i} `
    ).join('');

    await pasteText(page, longText);
    await waitForPagination(page);

    // Each page body's scrollHeight should not exceed its clientHeight (no overflow)
    const bodies = page.locator('[data-testid^="page-body-"]');
    const bodyCount = await bodies.count();
    expect(bodyCount).toBeGreaterThan(0);

    for (let i = 0; i < bodyCount; i++) {
      const overflow = await bodies.nth(i).evaluate((el) => {
        return el.scrollHeight > el.clientHeight + 2; // 2px tolerance
      });
      expect(overflow).toBe(false);
    }
  });

  test('text content is preserved after mid-block split', async ({ page }) => {
    const body = page.locator('[data-testid^="page-body-"]').first();
    await body.click();

    // Use unique marker words we can count
    const sentences = Array.from({ length: 80 }, (_, i) => `MARKER${i}`);
    const longText = sentences.join(' ');

    await pasteText(page, longText);
    await waitForPagination(page);

    // Collect all text across all page bodies
    const bodies = page.locator('[data-testid^="page-body-"]');
    const bodyCount = await bodies.count();
    let allText = '';
    for (let i = 0; i < bodyCount; i++) {
      const text = await bodies.nth(i).innerText();
      allText += text + ' ';
    }

    // All markers should be present
    for (let i = 0; i < 80; i++) {
      expect(allText).toContain(`MARKER${i}`);
    }
  });

  test('long list splits across pages', async ({ page }) => {
    const body = page.locator('[data-testid^="page-body-"]').first();
    await body.click();

    // Type many list items
    for (let i = 0; i < 80; i++) {
      if (i === 0) {
        // Start a list by typing "- " which triggers Lexical list auto-format
        await page.keyboard.type('- ');
      }
      await page.keyboard.type(`List item ${i + 1}`);
      await page.keyboard.press('Enter');
    }

    await waitForPagination(page);

    // Should have created multiple pages
    const pages = page.locator('[data-page-id]');
    const count = await pages.count();
    expect(count).toBeGreaterThan(1);

    // No body should visually overflow
    const bodies = page.locator('[data-testid^="page-body-"]');
    for (let i = 0; i < await bodies.count(); i++) {
      const overflow = await bodies.nth(i).evaluate((el) => {
        return el.scrollHeight > el.clientHeight + 2;
      });
      expect(overflow).toBe(false);
    }
  });

  test('first block oversized with subsequent blocks splits correctly', async ({ page }) => {
    const body = page.locator('[data-testid^="page-body-"]').first();
    await body.click();

    // Create a huge first paragraph + subsequent short paragraphs
    // Using \n\n to create separate blocks
    const hugeParagraph = Array.from({ length: 200 }, (_, i) =>
      `FirstBlockWord${i} lorem ipsum dolor sit amet consectetur. `
    ).join('');
    const fullText = hugeParagraph + '\n\nShort paragraph A\n\nShort paragraph B';

    await pasteText(page, fullText);
    await waitForPagination(page);

    // Should have multiple pages
    const pages = page.locator('[data-page-id]');
    const count = await pages.count();
    expect(count).toBeGreaterThanOrEqual(2);

    // All content should be present across pages
    const bodies = page.locator('[data-testid^="page-body-"]');
    let allText = '';
    for (let i = 0; i < await bodies.count(); i++) {
      allText += await bodies.nth(i).innerText() + ' ';
    }
    expect(allText).toContain('FirstBlockWord0');
    expect(allText).toContain('FirstBlockWord149');
    expect(allText).toContain('Short paragraph A');
    expect(allText).toContain('Short paragraph B');
  });
});
