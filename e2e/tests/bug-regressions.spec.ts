import { test, expect } from '@playwright/test';

test.describe('Bug Fix Regressions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="page-0"]');
  });

  // ───── Bug 1: Header must not overlap body content ─────

  test('header and body do not overlap when header/footer enabled', async ({ page }) => {
    // Enable header/footer
    const switchEl = page.getByTestId('header-footer-switch');
    await switchEl.click();
    await page.waitForSelector('[data-testid^="page-header-"]');

    const header = page.locator('[data-testid^="page-header-"]').first();
    const body = page.locator('[data-testid^="page-body-"]').first();

    const headerBox = await header.boundingBox();
    const bodyBox = await body.boundingBox();
    expect(headerBox).not.toBeNull();
    expect(bodyBox).not.toBeNull();

    // Header bottom must be at or above body top (no overlap)
    expect(headerBox!.y + headerBox!.height).toBeLessThanOrEqual(bodyBox!.y + 1);
  });

  test('footer and body do not overlap when header/footer enabled', async ({ page }) => {
    const switchEl = page.getByTestId('header-footer-switch');
    await switchEl.click();
    await page.waitForSelector('[data-testid^="page-footer-"]');

    const body = page.locator('[data-testid^="page-body-"]').first();
    const footer = page.locator('[data-testid^="page-footer-"]').first();

    const bodyBox = await body.boundingBox();
    const footerBox = await footer.boundingBox();
    expect(bodyBox).not.toBeNull();
    expect(footerBox).not.toBeNull();

    // Body bottom must be at or above footer top (no overlap)
    expect(bodyBox!.y + bodyBox!.height).toBeLessThanOrEqual(footerBox!.y + 1);
  });

  test('header + body + footer fit within page boundaries', async ({ page }) => {
    const switchEl = page.getByTestId('header-footer-switch');
    await switchEl.click();
    await page.waitForSelector('[data-testid^="page-header-"]');

    const pageEl = page.getByTestId('page-0');
    const header = page.locator('[data-testid^="page-header-"]').first();
    const body = page.locator('[data-testid^="page-body-"]').first();
    const footer = page.locator('[data-testid^="page-footer-"]').first();

    const pageBox = await pageEl.boundingBox();
    const headerBox = await header.boundingBox();
    const bodyBox = await body.boundingBox();
    const footerBox = await footer.boundingBox();

    expect(pageBox).not.toBeNull();
    expect(headerBox).not.toBeNull();
    expect(bodyBox).not.toBeNull();
    expect(footerBox).not.toBeNull();

    // All regions must be within the page
    const pageBottom = pageBox!.y + pageBox!.height;
    const footerBottom = footerBox!.y + footerBox!.height;
    expect(footerBottom).toBeLessThanOrEqual(pageBottom + 1);
  });

  // ───── Bug 2: Pasting large content must create page breaks ─────

  test('pasting large text creates additional pages', async ({ page }) => {
    const body = page.locator('[data-testid^="page-body-"]').first();
    await body.click();

    // Generate enough paragraphs to overflow a single A4 page
    const paragraphs = Array.from({ length: 40 }, (_, i) =>
      `Paragraph ${i + 1}: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec nec ligula sollicitudin, congue dolor eget, sagittis orci.`
    );
    const largeText = paragraphs.join('\n\n');

    // Paste via clipboard API
    await page.evaluate(async (text) => {
      const editor = document.querySelector('[contenteditable="true"]');
      if (editor) {
        editor.focus();
        const dt = new DataTransfer();
        dt.setData('text/plain', text);
        const pasteEvent = new ClipboardEvent('paste', {
          clipboardData: dt,
          bubbles: true,
          cancelable: true,
        });
        editor.dispatchEvent(pasteEvent);
      }
    }, largeText);

    // Wait for overflow/pagination to settle
    await page.waitForTimeout(2000);

    const pages = page.locator('[data-page-id]');
    const count = await pages.count();
    expect(count).toBeGreaterThan(1);

    // All pages must still be A4
    for (let i = 0; i < count; i++) {
      const box = await pages.nth(i).boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBe(794);
      expect(box!.height).toBe(1123);
    }
  });

  test('content does not visually overflow page boundaries', async ({ page }) => {
    const body = page.locator('[data-testid^="page-body-"]').first();
    await body.click();

    // Type enough lines to fill a page
    for (let i = 0; i < 50; i++) {
      await page.keyboard.type(`Line ${i + 1}: Some content for this line.`);
      await page.keyboard.press('Enter');
    }

    // Wait for overflow processing to settle
    await page.waitForTimeout(3000);

    // Overflow should have created additional pages rather than letting content spill
    const pages = page.locator('[data-page-id]');
    const count = await pages.count();
    expect(count).toBeGreaterThan(1);

    // Every page must remain exactly A4
    for (let i = 0; i < count; i++) {
      const box = await pages.nth(i).boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBe(1123);
    }
  });

  // ───── Bug 3: Toolbar buttons must actually format text ─────

  test('bold button applies bold formatting', async ({ page }) => {
    const body = page.locator('[data-testid^="page-body-"]').first();
    await body.click();
    await page.keyboard.type('hello');

    // Select all text
    await page.keyboard.press('Meta+a');
    // Click bold
    await page.getByTestId('btn-bold').click();

    // Check that the text is bold (wrapped in <strong> or has font-weight)
    const isBold = await body.evaluate(el => {
      const textEl = el.querySelector('strong, b');
      if (textEl) return true;
      // Also check computed style
      const span = el.querySelector('span');
      if (span) {
        const weight = getComputedStyle(span).fontWeight;
        return weight === 'bold' || parseInt(weight) >= 700;
      }
      return false;
    });
    expect(isBold).toBe(true);
  });

  test('italic button applies italic formatting', async ({ page }) => {
    const body = page.locator('[data-testid^="page-body-"]').first();
    await body.click();
    await page.keyboard.type('hello');

    await page.keyboard.press('Meta+a');
    await page.getByTestId('btn-italic').click();

    const isItalic = await body.evaluate(el => {
      const textEl = el.querySelector('em, i');
      if (textEl) return true;
      const span = el.querySelector('span');
      if (span) {
        return getComputedStyle(span).fontStyle === 'italic';
      }
      return false;
    });
    expect(isItalic).toBe(true);
  });

  test('underline button applies underline formatting', async ({ page }) => {
    const body = page.locator('[data-testid^="page-body-"]').first();
    await body.click();
    await page.keyboard.type('hello');

    await page.keyboard.press('Meta+a');
    await page.getByTestId('btn-underline').click();

    const isUnderlined = await body.evaluate(el => {
      const textEl = el.querySelector('u, span');
      if (textEl) {
        const dec = getComputedStyle(textEl).textDecorationLine || getComputedStyle(textEl).textDecoration;
        return dec.includes('underline');
      }
      return false;
    });
    expect(isUnderlined).toBe(true);
  });

  test('align center button changes text alignment', async ({ page }) => {
    const body = page.locator('[data-testid^="page-body-"]').first();
    await body.click();
    await page.keyboard.type('hello');

    // Click in the text to place cursor
    await page.getByTestId('btn-align-center').click();

    const isCentered = await body.evaluate(el => {
      const p = el.querySelector('p');
      if (!p) return false;
      const align = getComputedStyle(p).textAlign;
      return align === 'center';
    });
    expect(isCentered).toBe(true);
  });

  test('numbered list button creates an ordered list', async ({ page }) => {
    const body = page.locator('[data-testid^="page-body-"]').first();
    await body.click();
    await page.keyboard.type('item one');

    await page.getByTestId('btn-list-number').click();

    const hasOl = await body.evaluate(el => {
      return el.querySelector('ol') !== null;
    });
    expect(hasOl).toBe(true);
  });

  test('bullet list button creates an unordered list', async ({ page }) => {
    const body = page.locator('[data-testid^="page-body-"]').first();
    await body.click();
    await page.keyboard.type('item one');

    await page.getByTestId('btn-list-bullet').click();

    const hasUl = await body.evaluate(el => {
      return el.querySelector('ul') !== null;
    });
    expect(hasUl).toBe(true);
  });

  test('toolbar buttons do nothing when no editor is focused', async ({ page }) => {
    // Click bold without focusing any editor — should not throw
    await page.getByTestId('btn-bold').click();
    await page.getByTestId('btn-italic').click();
    await page.getByTestId('btn-align-center').click();
    await page.getByTestId('btn-list-number').click();

    // Page should still be stable
    await expect(page.getByTestId('page-0')).toBeVisible();
  });
});
