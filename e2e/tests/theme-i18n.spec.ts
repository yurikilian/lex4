import { test, expect } from '@playwright/test';

test.describe('Theme — Visual Design', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="lex4-editor"]');
  });

  test('document area has light background', async ({ page }) => {
    const container = page.locator('[data-testid="lex4-editor"] > div:nth-child(3)');
    const bgImage = await container.evaluate(el => getComputedStyle(el).backgroundImage);
    // Canvas uses a radial gradient for depth
    expect(bgImage).toContain('gradient');
  });

  test('page has prominent shadow on dark background', async ({ page }) => {
    const pageEl = page.getByTestId('page-0');
    const shadow = await pageEl.evaluate(el => getComputedStyle(el).boxShadow);
    // shadow-xl should not be "none"
    expect(shadow).not.toBe('none');
    // shadow-xl is significantly larger than shadow-sm
    expect(shadow.length).toBeGreaterThan(20);
  });

  test('page has white background', async ({ page }) => {
    const pageEl = page.getByTestId('page-0');
    const bg = await pageEl.evaluate(el => getComputedStyle(el).backgroundColor);
    expect(bg).toBe('rgb(255, 255, 255)');
  });

  test('header has blue tint when enabled', async ({ page }) => {
    // Enable header/footer
    await page.getByTestId('header-footer-toggle').click();
    const headerPage = page.locator('[data-testid^="page-header-"]').first();
    await expect(headerPage).toBeVisible();

    const borderTopWidth = await headerPage.evaluate(el => getComputedStyle(el).borderTopWidth);
    expect(borderTopWidth).toBe('0px');
    const borderBottomWidth = await headerPage.evaluate(el => getComputedStyle(el).borderBottomWidth);
    expect(borderBottomWidth).toBe('1px');
  });

  test('footer has blue tint when enabled', async ({ page }) => {
    await page.getByTestId('header-footer-toggle').click();
    const footerPage = page.locator('[data-testid^="page-footer-"]').first();
    await expect(footerPage).toBeVisible();

    const borderBottomWidth = await footerPage.evaluate(el => getComputedStyle(el).borderBottomWidth);
    expect(borderBottomWidth).toBe('0px');
    const borderTopWidth = await footerPage.evaluate(el => getComputedStyle(el).borderTopWidth);
    expect(borderTopWidth).toBe('1px');
  });

  test('variable chip in editor has outlined style', async ({ page }) => {
    const body = page.locator('[data-testid^="page-body-"] [data-lexical-editor="true"]').first();
    await body.click();

    // Use the variable picker (toolbar dropdown) to insert a variable
    await page.getByTestId('variable-picker-button').click();
    await page.getByTestId('variable-option-customer.name').click();

    // Variable chip should appear with outlined style
    const chip = page.locator('[data-testid="variable-chip-customer.name"]');
    await expect(chip).toBeVisible();

    const bg = await chip.evaluate(el => getComputedStyle(el).backgroundColor);
    // Category-colored chip background (not transparent)
    expect(bg).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('variable panel shows labels instead of template keys', async ({ page }) => {
    const body = page.locator('[data-testid^="page-body-"] [data-lexical-editor="true"]').first();
    await body.click();

    await page.getByTestId('toggle-variable-panel').click();
    const panel = page.getByTestId('variable-panel');
    await expect(panel).toBeVisible();

    // Variable panel chips show labels (not {{key}})
    const firstChip = panel.locator('[data-testid^="variable-panel-"]').first();
    const text = await firstChip.textContent();
    expect(text).not.toContain('{{');
    expect(text).not.toContain('}}');
  });

  test('variable panel shows group labels per category', async ({ page }) => {
    const body = page.locator('[data-testid^="page-body-"] [data-lexical-editor="true"]').first();
    await body.click();

    await page.getByTestId('toggle-variable-panel').click();
    const panel = page.getByTestId('variable-panel');
    await expect(panel).toBeVisible();

    // Group labels should be visible as separate elements
    const groupLabel = panel.locator('.lex4-variable-group-label').first();
    await expect(groupLabel).toBeVisible();
    const text = await groupLabel.textContent();
    expect(text).toBeTruthy();
    expect(text?.toLowerCase()).toContain('customer');
  });
});

test.describe('i18n — Default Translations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="lex4-editor"]');
  });

  test('toolbar undo button has correct title', async ({ page }) => {
    const btn = page.getByTestId('btn-undo');
    await expect(btn).toHaveAttribute('title', 'Undo');
  });

  test('toolbar redo button has correct title', async ({ page }) => {
    const btn = page.getByTestId('btn-redo');
    await expect(btn).toHaveAttribute('title', 'Redo');
  });

  test('toolbar bold button has correct title', async ({ page }) => {
    const btn = page.getByTestId('btn-bold');
    await expect(btn).toHaveAttribute('title', 'Bold (Ctrl+B)');
  });

  test('toolbar italic button has correct title', async ({ page }) => {
    const btn = page.getByTestId('btn-italic');
    await expect(btn).toHaveAttribute('title', 'Italic (Ctrl+I)');
  });

  test('header placeholder shows translated text', async ({ page }) => {
    await page.getByTestId('header-footer-toggle').click();
    const headerPlaceholder = page.locator('[data-testid^="page-header-"] .lex4-page-hf-placeholder');
    await expect(headerPlaceholder.first()).toHaveText('Header');
  });

  test('footer placeholder shows translated text', async ({ page }) => {
    await page.getByTestId('header-footer-toggle').click();
    const footerPlaceholder = page.locator('[data-testid^="page-footer-"] .lex4-page-hf-placeholder');
    await expect(footerPlaceholder.first()).toHaveText('Footer');
  });

  test('history sidebar title shows translated text', async ({ page }) => {
    // History sidebar is hidden by default — open it
    await page.getByTestId('toggle-history-sidebar').click();
    const sidebar = page.getByTestId('history-sidebar');
    await expect(sidebar).toBeVisible();
    await expect(sidebar.locator('h2')).toHaveText('History');
  });

  test('history sidebar empty state shows translated text', async ({ page }) => {
    // History sidebar is hidden by default — open it
    await page.getByTestId('toggle-history-sidebar').click();
    const empty = page.getByTestId('history-empty');
    await expect(empty).toHaveText('No history yet.');
  });

  test('variable panel title shows translated text when open', async ({ page }) => {
    const body = page.locator('[data-testid^="page-body-"] [data-lexical-editor="true"]').first();
    await body.click();

    await page.getByTestId('toggle-variable-panel').click();
    const panel = page.getByTestId('variable-panel');
    await expect(panel).toBeVisible();
    await expect(panel.locator('h2')).toHaveText('Variables');
  });

  test('variable panel search placeholder shows translated text', async ({ page }) => {
    const body = page.locator('[data-testid^="page-body-"] [data-lexical-editor="true"]').first();
    await body.click();

    await page.getByTestId('toggle-variable-panel').click();
    const searchInput = page.getByTestId('variable-panel-search');
    await expect(searchInput).toHaveAttribute('placeholder', 'Search variables...');
  });

  test('history action labels use i18n strings', async ({ page }) => {
    // History sidebar is hidden by default — open it
    await page.getByTestId('toggle-history-sidebar').click();

    // Click into the body, type, select all, and apply bold
    const body = page.locator('[data-testid^="page-body-"] [data-lexical-editor="true"]').first();
    await body.click();
    await body.pressSequentially('Hello', { delay: 30 });

    // Select all text then apply bold
    await page.keyboard.press('Meta+a');
    await page.waitForTimeout(100);
    await page.getByTestId('btn-bold').click();
    await page.waitForTimeout(200);

    // The history should show "Bold applied"
    const historyEntries = page.getByTestId('history-entry-list');
    await expect(historyEntries).toBeVisible();
    await expect(historyEntries).toContainText('Bold applied');
  });
});
