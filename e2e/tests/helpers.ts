import type { Page } from '@playwright/test';

/**
 * Wait until at least `minPages` are rendered in the editor.
 * Polls every 200ms, times out after `timeoutMs` (default 10s).
 */
export async function waitForPageCount(
  page: Page,
  minPages: number,
  timeoutMs = 10_000,
): Promise<number> {
  const count = await page.locator('[data-page-id]').count();
  if (count >= minPages) return count;

  await page.waitForFunction(
    ({ min }) => {
      const pages = document.querySelectorAll('[data-page-id]');
      return pages.length >= min;
    },
    { min: minPages },
    { timeout: timeoutMs, polling: 200 },
  );
  return page.locator('[data-page-id]').count();
}

/**
 * Paste plain text into the currently focused contenteditable.
 * Assumes the target element is already focused via a prior .click().
 * Waits 100ms for Lexical to process the event.
 */
export async function pasteText(page: Page, text: string): Promise<void> {
  await page.evaluate(async (t) => {
    const editor = document.activeElement?.closest('[contenteditable="true"]')
      ?? document.querySelector('[contenteditable="true"]');
    if (!editor) throw new Error('No contenteditable element found');
    editor.focus();
    const dt = new DataTransfer();
    dt.setData('text/plain', t);
    const pasteEvent = new ClipboardEvent('paste', {
      clipboardData: dt,
      bubbles: true,
      cancelable: true,
    });
    editor.dispatchEvent(pasteEvent);
  }, text);
  await page.waitForTimeout(100);
}

/**
 * Wait for pagination/overflow to settle after a content change.
 * Waits until no new pages appear for `stableMs` consecutive milliseconds.
 */
export async function waitForPaginationStable(
  page: Page,
  stableMs = 500,
  timeoutMs = 10_000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let lastCount = await page.locator('[data-page-id]').count();
  let lastChangeAt = Date.now();

  while (Date.now() < deadline) {
    await page.waitForTimeout(200);
    const current = await page.locator('[data-page-id]').count();
    if (current !== lastCount) {
      lastCount = current;
      lastChangeAt = Date.now();
    } else if (Date.now() - lastChangeAt >= stableMs) {
      return;
    }
  }
}
