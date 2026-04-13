import { test, type Page } from '@playwright/test';
import { resolve } from 'path';

const SCREENSHOT_DIR = resolve(__dirname, '../../docs/screenshots');

async function createAdditionalPages(page: Page) {
  const body = page.locator('[data-testid^="page-body-"] [contenteditable="true"]').first();
  await body.click();

  const paragraphs = Array.from({ length: 60 }, (_, index) =>
    `Row ${index + 1}: Sed gravida sit amet enim vel fermentum. Aenean ut ante a mi pulvinar placerat in eu odio. Phasellus ac posuere neque. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae.`,
  );

  await page.evaluate(async (text) => {
    const editor = document.querySelector('[data-testid^="page-body-"] [contenteditable="true"]');
    if (!editor) return;
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

test.describe('README Screenshots', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('capture empty editor', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="lex4-editor"]');
    await page.waitForTimeout(500);
    await page.screenshot({
      path: resolve(SCREENSHOT_DIR, 'editor-empty.png'),
      fullPage: false,
    });
  });

  test('capture editor with content', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="lex4-editor"]');

    const editable = page.locator('[data-testid^="page-body-"] [contenteditable="true"]').first();
    await editable.click();

    // Type a title
    await page.keyboard.type('Project Proposal');
    await page.keyboard.press('Enter');

    // Select the title and make it bold + larger
    await page.keyboard.down('Shift');
    await page.keyboard.press('Home');
    await page.keyboard.up('Shift');
    await page.keyboard.down('Meta');
    await page.keyboard.press('b');
    await page.keyboard.up('Meta');

    // Move to end and type body
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');
    await page.keyboard.type(
      'This document outlines the key deliverables and timeline for the upcoming quarter. ' +
      'Our team has been working on several initiatives that align with the company\'s strategic goals.',
    );
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await page.keyboard.type('Key Objectives');
    await page.keyboard.press('Enter');

    // Select "Key Objectives" and bold it
    await page.keyboard.down('Shift');
    await page.keyboard.press('Home');
    await page.keyboard.up('Shift');
    await page.keyboard.down('Meta');
    await page.keyboard.press('b');
    await page.keyboard.up('Meta');
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');

    // Create a bulleted list
    await page.getByTestId('btn-list-bullet').click();
    await page.keyboard.type('Improve developer experience with reusable component library');
    await page.keyboard.press('Enter');
    await page.keyboard.type('Achieve 95% test coverage across all modules');
    await page.keyboard.press('Enter');
    await page.keyboard.type('Launch documentation site with interactive examples');
    await page.keyboard.press('Enter');
    await page.keyboard.type('Reduce bundle size by 30% through tree-shaking optimizations');

    await page.waitForTimeout(500);
    await page.screenshot({
      path: resolve(SCREENSHOT_DIR, 'editor-with-content.png'),
      fullPage: false,
    });
  });

  test('capture editor with headers and footers', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="lex4-editor"]');

    // Enable header/footer
    await page.getByTestId('header-footer-switch').click();
    await page.waitForTimeout(300);

    // Type in header
    const header = page.locator('[data-testid^="page-header-"] [contenteditable="true"]').first();
    await header.click();
    await page.keyboard.type('Lex4 Corp. — Confidential');

    // Type in footer
    const footer = page.locator('[data-testid^="page-footer-"] [contenteditable="true"]').first();
    await footer.click();
    await page.keyboard.type('Draft v1.0 — Internal Use Only');

    // Type body content
    const body = page.locator('[data-testid^="page-body-"] [contenteditable="true"]').first();
    await body.click();
    await page.keyboard.type('Meeting Notes — Q2 Planning');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await page.keyboard.type(
      'The committee reviewed the proposed budget allocations and approved the technology modernization roadmap. ' +
      'All departments are expected to submit their quarterly reports by the end of next week.',
    );

    await page.waitForTimeout(500);
    await page.screenshot({
      path: resolve(SCREENSHOT_DIR, 'editor-header-footer.png'),
      fullPage: false,
    });
  });

  test('capture multi-page document', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="lex4-editor"]');

    await createAdditionalPages(page);

    // Scroll to show page break area
    const docView = page.getByTestId('document-view');
    await docView.evaluate(el => { el.scrollTop = 800; });
    await page.waitForTimeout(300);

    await page.screenshot({
      path: resolve(SCREENSHOT_DIR, 'editor-multi-page.png'),
      fullPage: false,
    });
  });

  test('capture toolbar close-up', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="toolbar"]');

    // Type some text and select it for active toolbar state
    const editable = page.locator('[data-testid^="page-body-"] [contenteditable="true"]').first();
    await editable.click();
    await page.keyboard.type('Sample formatted text');
    await page.keyboard.down('Meta');
    await page.keyboard.press('a');
    await page.keyboard.up('Meta');
    await page.keyboard.down('Meta');
    await page.keyboard.press('b');
    await page.keyboard.up('Meta');
    await page.waitForTimeout(300);

    const toolbar = page.getByTestId('toolbar');
    await toolbar.screenshot({
      path: resolve(SCREENSHOT_DIR, 'toolbar.png'),
    });
  });
});
