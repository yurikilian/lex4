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

async function typeLargeRegion(page: Page, region: 'header' | 'footer') {
  const editor = page.locator(`[data-testid^="page-${region}-"] [contenteditable="true"]`).first();
  await editor.click();

  for (let index = 0; index < 3; index++) {
    await page.keyboard.type(`${region.toUpperCase()} line ${index + 1}`);
    if (index < 2) {
      await page.keyboard.press('Enter');
    }
  }

  await page.waitForTimeout(300);
}

function modifierKey(): 'Meta' | 'Control' {
  return process.platform === 'darwin' ? 'Meta' : 'Control';
}

async function readGlobalSelection(page: Page) {
  return page.locator('[data-testid="global-selection-buffer"]').evaluate((element) => {
    const buffer = element as HTMLTextAreaElement;
    return {
      value: buffer.value,
      selectedText: buffer.value.slice(buffer.selectionStart ?? 0, buffer.selectionEnd ?? 0),
    };
  });
}

test.describe('Global Document Commands', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="page-0"]');
  });

  test('undo and redo operate across page boundaries', async ({ page }) => {
    await createAdditionalPages(page);

    const firstBody = page.locator('[data-testid^="page-body-"]').first();
    const secondBody = page.locator('[data-testid^="page-body-"]').nth(1);

    await firstBody.click();
    await page.keyboard.type('FIRST PAGE CHANGE');
    await secondBody.click();

    await page.keyboard.press(`${modifierKey()}+Z`);
    await expect(firstBody).not.toContainText('FIRST PAGE CHANGE');

    if (modifierKey() === 'Meta') {
      await page.keyboard.press('Meta+Shift+Z');
    } else {
      await page.keyboard.press('Control+Y');
    }

    await expect(firstBody).toContainText('FIRST PAGE CHANGE');
  });

  test('cmd/ctrl+a selects all body content but excludes headers and footers', async ({ page }) => {
    await createAdditionalPages(page);
    await page.getByTestId('header-footer-switch').click();
    await typeLargeRegion(page, 'header');
    await typeLargeRegion(page, 'footer');

    const firstBody = page.locator('[data-testid^="page-body-"]').first();
    await firstBody.click();
    await page.keyboard.press(`${modifierKey()}+A`);
    await page.waitForTimeout(100);

    const { selectedText } = await readGlobalSelection(page);
    expect(selectedText).toContain('Row 1');
    expect(selectedText).toContain('Row 60');
    expect(selectedText).not.toContain('HEADER line 1');
    expect(selectedText).not.toContain('FOOTER line 1');

    const selectionStyle = await page.locator('[data-testid="lex4-editor"]').evaluate((element) => {
      const editorRoot = element as HTMLElement;
      const bodyNode = editorRoot.querySelector(
        '[data-testid^="page-body-"] [contenteditable="true"]',
      ) as HTMLElement | null;
      const headerNode = editorRoot.querySelector(
        '[data-testid^="page-header-"] [contenteditable="true"]',
      ) as HTMLElement | null;
      const footerNode = editorRoot.querySelector(
        '[data-testid^="page-footer-"] [contenteditable="true"]',
      ) as HTMLElement | null;

      return {
        active: editorRoot.dataset.globalSelectionActive,
        bodyBackgroundColor: bodyNode ? getComputedStyle(bodyNode).backgroundColor : null,
        bodyColor: bodyNode ? getComputedStyle(bodyNode).color : null,
        headerBackgroundColor: headerNode ? getComputedStyle(headerNode).backgroundColor : null,
        footerBackgroundColor: footerNode ? getComputedStyle(footerNode).backgroundColor : null,
      };
    });

    expect(selectionStyle.active).toBe('true');
    expect(selectionStyle.bodyBackgroundColor).toBe('rgb(191, 219, 254)');
    expect(selectionStyle.bodyColor).toBe('rgb(30, 64, 175)');
    expect(selectionStyle.headerBackgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(selectionStyle.footerBackgroundColor).toBe('rgba(0, 0, 0, 0)');
  });

  test('toolbar formatting after cmd/ctrl+a applies across all body pages only', async ({ page }) => {
    await createAdditionalPages(page);
    await page.getByTestId('header-footer-switch').click();
    await typeLargeRegion(page, 'header');

    const firstBody = page.locator('[data-testid^="page-body-"]').first();
    const secondBody = page.locator('[data-testid^="page-body-"]').nth(1);
    const header = page.locator('[data-testid^="page-header-"] [contenteditable="true"]').first();

    await firstBody.click();
    await page.keyboard.press(`${modifierKey()}+A`);
    await page.waitForTimeout(100);
    await page.getByTestId('btn-bold').click();
    await page.waitForTimeout(500);

    const firstBodyBold = await firstBody.locator('[contenteditable="true"]').evaluate((element) => {
      return !!element.querySelector('strong, b, span[style*="font-weight"]');
    });
    const secondBodyBold = await secondBody.locator('[contenteditable="true"]').evaluate((element) => {
      return !!element.querySelector('strong, b, span[style*="font-weight"]');
    });
    const headerBold = await header.evaluate((element) => {
      return !!element.querySelector('strong, b, span[style*="font-weight"]');
    });

    expect(firstBodyBold).toBe(true);
    expect(secondBodyBold).toBe(true);
    expect(headerBold).toBe(false);
    await expect(firstBody).toContainText('Row 1');
    await expect(secondBody).toContainText('Row ');
    await expect(header).toContainText('HEADER line 1');
  });

  test('Backspace/Delete after cmd/ctrl+a clears the whole document', async ({ page }) => {
    await createAdditionalPages(page);

    const firstBody = page.locator('[data-testid^="page-body-"]').first();
    await firstBody.click();
    await page.keyboard.press(`${modifierKey()}+A`);
    await page.waitForTimeout(100);
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(500);

    await expect(page.locator('[data-page-id]')).toHaveCount(1);
    await expect(firstBody).not.toContainText('Row 1');
  });

  test('cmd/ctrl+a keeps selecting only the document body after toolbar commands on a single page', async ({ page }) => {
    const bodyEditor = page.locator('[data-testid^="page-body-"] [contenteditable="true"]').first();

    await bodyEditor.click();
    await page.keyboard.type('Single page body');
    await page.waitForTimeout(200);

    await page.keyboard.press(`${modifierKey()}+A`);
    await page.waitForTimeout(100);
    let selection = await readGlobalSelection(page);
    expect(selection.selectedText).toContain('Single page body');
    await expect(page.getByTestId('lex4-editor')).toHaveAttribute('data-global-selection-active', 'true');

    await page.getByTestId('btn-bold').click();
    await page.waitForTimeout(200);

    await page.keyboard.press(`${modifierKey()}+A`);
    await page.waitForTimeout(100);
    selection = await readGlobalSelection(page);
    expect(selection.selectedText).toContain('Single page body');
    expect(selection.selectedText).not.toContain('Bold');
    await expect(page.getByTestId('lex4-editor')).toHaveAttribute('data-global-selection-active', 'true');
  });
});
