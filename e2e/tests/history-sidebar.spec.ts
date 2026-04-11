import { expect, test, type Page } from '@playwright/test';

async function pasteInto(selector: string, page: Page, text: string) {
  await page.evaluate(({ selector: targetSelector, value }) => {
    const editor = document.querySelector(targetSelector);
    if (!editor) {
      return;
    }

    (editor as HTMLElement).focus();
    const dataTransfer = new DataTransfer();
    dataTransfer.setData('text/plain', value);
    editor.dispatchEvent(new ClipboardEvent('paste', {
      clipboardData: dataTransfer,
      bubbles: true,
      cancelable: true,
    }));
  }, { selector, value: text });
}

async function pasteLargeDocument(page: Page) {
  const paragraphs = Array.from({ length: 60 }, (_, index) =>
    `Row ${index + 1}: Sed gravida sit amet enim vel fermentum. Aenean ut ante a mi pulvinar placerat in eu odio. Phasellus ac posuere neque. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae.`,
  );

  await pasteInto('[data-testid^="page-body-"] [contenteditable="true"]', page, paragraphs.join('\n'));
}

async function dispatchHistoryShortcut(
  page: Page,
  shortcut: { key: string; metaKey?: boolean; ctrlKey?: boolean; shiftKey?: boolean },
) {
  await page.evaluate(({ key, metaKey, ctrlKey, shiftKey }) => {
    window.dispatchEvent(new KeyboardEvent('keydown', {
      key,
      metaKey,
      ctrlKey,
      shiftKey,
      bubbles: true,
      cancelable: true,
    }));
  }, shortcut);
}

test.describe('History Sidebar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="page-0"]');
  });

  test('renders labeled history entries for body and header changes', async ({ page }) => {
    await expect(page.getByTestId('editor-sidebar')).toBeVisible();
    await expect(page.getByText('Word-style session history (last 100 actions)')).toBeVisible();

    await pasteInto('[data-testid^="page-body-"] [contenteditable="true"]', page, 'Sidebar body paste');
    await page.waitForTimeout(200);

    await page.getByTestId('header-footer-switch').click();
    const header = page.locator('[data-testid^="page-header-"] [contenteditable="true"]').first();
    await header.click();
    await page.keyboard.type('H');
    await page.waitForTimeout(200);

    await expect(page.getByTestId('history-entry-list')).toContainText('Pasted content - Page 1');
    await expect(page.getByTestId('history-entry-list')).toContainText('Typed text - Header Page 1');
  });

  test('toolbar undo and redo buttons replay document history', async ({ page }) => {
    const body = page.locator('[data-testid^="page-body-"]').first();

    await pasteInto('[data-testid^="page-body-"] [contenteditable="true"]', page, 'Undo button change');
    await page.waitForTimeout(200);

    await expect(page.getByTestId('btn-undo')).toBeEnabled();
    await page.getByTestId('btn-undo').click();
    await page.waitForTimeout(200);
    await expect(body).not.toContainText('Undo button change');

    await expect(page.getByTestId('btn-redo')).toBeEnabled();
    await page.getByTestId('btn-redo').click();
    await page.waitForTimeout(200);
    await expect(body).toContainText('Undo button change');
  });

  test('undo restores the caret to the previous position inside the editor', async ({ page }) => {
    const bodyEditor = page.locator('[data-testid^="page-body-"] [contenteditable="true"]').first();

    await pasteInto('[data-testid^="page-body-"] [contenteditable="true"]', page, 'AB');
    await page.waitForTimeout(100);
    await page.getByTestId('clear-history').click();
    await page.waitForTimeout(100);
    await bodyEditor.click();
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(100);
    await page.keyboard.type('X');
    await expect(bodyEditor).toContainText('AXB');

    await page.getByTestId('btn-undo').click();
    await page.waitForTimeout(200);
    await expect(bodyEditor).toContainText('AB');

    await page.keyboard.type('Y');
    await page.waitForTimeout(200);
    await expect(bodyEditor).toContainText('AYB');
  });

  test('clicking a history entry restores that snapshot', async ({ page }) => {
    const body = page.locator('[data-testid^="page-body-"]').first();

    await pasteInto('[data-testid^="page-body-"] [contenteditable="true"]', page, 'First snapshot');
    await page.waitForTimeout(200);
    await pasteInto('[data-testid^="page-body-"] [contenteditable="true"]', page, 'Second snapshot');
    await page.waitForTimeout(200);

    await expect(body).toContainText('Second snapshot');
    await page.getByTestId('history-entry-0').click();
    await page.waitForTimeout(200);

    await expect(body).toContainText('First snapshot');
    await expect(body).not.toContainText('Second snapshot');
  });

  test('window-aware undo works without refocusing the document by default', async ({ page }) => {
    const body = page.locator('[data-testid^="page-body-"]').first();

    await pasteInto('[data-testid^="page-body-"] [contenteditable="true"]', page, 'Window shortcut undo');
    await page.waitForTimeout(200);
    await page.locator('header').click();
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+Z' : 'Control+Z');
    await page.waitForTimeout(200);

    await expect(body).not.toContainText('Window shortcut undo');
  });

  test('cmd+z and cmd+shift+z work from the editor without needing a refocus', async ({ page }) => {
    const body = page.locator('[data-testid^="page-body-"]').first();
    const bodyEditor = page.locator('[data-testid^="page-body-"] [contenteditable="true"]').first();
    const undoShortcut = process.platform === 'darwin' ? 'Meta+Z' : 'Control+Z';
    const redoShortcut = process.platform === 'darwin' ? 'Meta+Shift+Z' : 'Control+Shift+Z';

    await pasteInto('[data-testid^="page-body-"] [contenteditable="true"]', page, 'Focused shortcut history');
    await page.waitForTimeout(200);

    await bodyEditor.click();
    await page.keyboard.press(undoShortcut);
    await page.waitForTimeout(200);
    await expect(body).not.toContainText('Focused shortcut history');

    await page.keyboard.press(redoShortcut);
    await page.waitForTimeout(200);
    await expect(body).toContainText('Focused shortcut history');
  });

  test('all undo and redo shortcut variants trigger the correct history action', async ({ page }) => {
    const body = page.locator('[data-testid^="page-body-"]').first();

    await pasteInto('[data-testid^="page-body-"] [contenteditable="true"]', page, 'Shortcut history content');
    await page.waitForTimeout(200);
    await page.locator('header').click();

    await dispatchHistoryShortcut(page, { key: 'z', metaKey: true });
    await page.waitForTimeout(100);
    await expect(body).not.toContainText('Shortcut history content');

    await dispatchHistoryShortcut(page, { key: 'z', metaKey: true, shiftKey: true });
    await page.waitForTimeout(100);
    await expect(body).toContainText('Shortcut history content');

    await dispatchHistoryShortcut(page, { key: 'z', ctrlKey: true });
    await page.waitForTimeout(100);
    await expect(body).not.toContainText('Shortcut history content');

    await dispatchHistoryShortcut(page, { key: 'z', ctrlKey: true, shiftKey: true });
    await page.waitForTimeout(100);
    await expect(body).toContainText('Shortcut history content');

    await dispatchHistoryShortcut(page, { key: 'z', metaKey: true });
    await page.waitForTimeout(100);
    await expect(body).not.toContainText('Shortcut history content');

    await dispatchHistoryShortcut(page, { key: 'y', metaKey: true });
    await page.waitForTimeout(100);
    await expect(body).toContainText('Shortcut history content');

    await dispatchHistoryShortcut(page, { key: 'z', ctrlKey: true });
    await page.waitForTimeout(100);
    await expect(body).not.toContainText('Shortcut history content');

    await dispatchHistoryShortcut(page, { key: 'y', ctrlKey: true });
    await page.waitForTimeout(100);
    await expect(body).toContainText('Shortcut history content');
  });

  test('window-aware undo can be disabled by prop', async ({ page }) => {
    await page.goto('/?captureHistoryShortcutsOnWindow=false');
    await page.waitForSelector('[data-testid="page-0"]');

    const body = page.locator('[data-testid^="page-body-"]').first();

    await pasteInto('[data-testid^="page-body-"] [contenteditable="true"]', page, 'Local shortcut undo');
    await page.waitForTimeout(200);
    await page.locator('header').click();
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+Z' : 'Control+Z');
    await page.waitForTimeout(200);

    await expect(body).toContainText('Local shortcut undo');

    await body.click();
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+Z' : 'Control+Z');
    await page.waitForTimeout(200);
    await expect(body).not.toContainText('Local shortcut undo');
  });

  test('large paste growth does not flood history with passive page overflow edits', async ({ page }) => {
    await pasteLargeDocument(page);
    await page.waitForTimeout(1000);

    const historyEntries = page.locator('[data-testid^="history-entry-"][data-history-current]');
    await expect(historyEntries).toHaveCount(1);
    await expect(page.getByTestId('history-entry-list')).toContainText('Pasted content - Page 1');
  });
});
