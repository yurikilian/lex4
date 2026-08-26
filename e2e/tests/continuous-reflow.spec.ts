import { test, expect, Page } from '@playwright/test';

async function pasteText(page: Page, text: string) {
  await page.evaluate(async (value) => {
    const editor = document.querySelector('[contenteditable="true"]');
    if (!editor) throw new Error('body editor not found');
    editor.focus();
    const data = new DataTransfer();
    data.setData('text/plain', value);
    editor.dispatchEvent(new ClipboardEvent('paste', {
      clipboardData: data,
      bubbles: true,
      cancelable: true,
    }));
  }, text);
}

async function waitForStableLayout(page: Page) {
  await expect.poll(
    async () => page.locator('[data-page-id]').count(),
    { timeout: 15_000, intervals: [100, 250, 500] },
  ).toBeGreaterThan(1);

  await expect.poll(
    async () => page.locator('[data-testid^="page-body-"]').evaluateAll(bodies =>
      bodies.every(body => body.scrollHeight <= body.clientHeight + 2),
    ),
    { timeout: 15_000, intervals: [100, 250, 500] },
  ).toBe(true);
}

test.describe('Continuous bidirectional pagination', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="page-0"]');
  });

  test('splits the overflowing paragraph instead of moving the whole block', async ({ page }) => {
    await page.locator('[data-testid^="page-body-"]').first().click();

    const longParagraph = Array.from({ length: 180 }, (_, index) =>
      `CONTINUATION_${String(index).padStart(3, '0')} keeps flowing across the page boundary.`,
    ).join(' ');
    await pasteText(page, `Lead paragraph stays first.\n\n${longParagraph}`);
    await waitForStableLayout(page);

    const bodies = page.locator('[data-testid^="page-body-"]');
    const firstPageText = await bodies.first().innerText();
    const secondPageText = await bodies.nth(1).innerText();
    const allText = await bodies.allInnerTexts();
    const combinedText = allText.join('\n');

    expect(firstPageText).toContain('Lead paragraph stays first.');
    expect(firstPageText).toContain('CONTINUATION_000');
    expect(secondPageText).toContain('CONTINUATION_');
    expect(secondPageText).not.toContain('Lead paragraph stays first.');
    let previousIndex = -1;
    for (let index = 0; index < 180; index++) {
      const marker = `CONTINUATION_${String(index).padStart(3, '0')}`;
      expect(combinedText.match(new RegExp(marker, 'g'))).toHaveLength(1);
      const markerIndex = combinedText.indexOf(marker);
      expect(markerIndex).toBeGreaterThan(previousIndex);
      previousIndex = markerIndex;
    }
  });

  test('flows the next page back after deleting content from the current page', async ({ page }) => {
    await page.locator('[data-testid^="page-body-"]').first().click();
    const paragraphs = Array.from({ length: 120 }, (_, index) =>
      `DELETE_FLOW_${String(index).padStart(3, '0')} paragraph content.`,
    ).join('\n\n');
    await pasteText(page, paragraphs);
    await waitForStableLayout(page);

    const bodies = page.locator('[data-testid^="page-body-"]');
    expect(await bodies.count()).toBeGreaterThan(1);
    const markerOnSecondPage = (await bodies.nth(1).innerText()).match(/DELETE_FLOW_\d{3}/)?.[0];
    expect(markerOnSecondPage).toBeTruthy();
    const firstEditor = bodies.first().locator('[contenteditable="true"]');
    await firstEditor.click();
    await firstEditor.evaluate(element => {
      const selection = window.getSelection();
      if (!selection) return;
      const range = document.createRange();
      range.selectNodeContents(element);
      selection.removeAllRanges();
      selection.addRange(range);
      (element as HTMLElement).focus();
    });
    await page.keyboard.press('Backspace');

    await expect.poll(
      async () => bodies.first().innerText(),
      { timeout: 15_000, intervals: [100, 250, 500] },
    ).toContain(markerOnSecondPage!);
    await expect.poll(
      async () => page.locator('[data-testid^="page-body-"]').evaluateAll(items =>
        items.every(body => body.scrollHeight <= body.clientHeight + 2),
      ),
      { timeout: 15_000, intervals: [100, 250, 500] },
    ).toBe(true);
  });
});
