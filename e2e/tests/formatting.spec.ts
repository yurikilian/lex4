import { test, expect } from '@playwright/test';

test.describe('Toolbar & Formatting', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="toolbar"]');
  });

  test('toolbar renders all format buttons', async ({ page }) => {
    await expect(page.getByTestId('btn-bold')).toBeVisible();
    await expect(page.getByTestId('btn-italic')).toBeVisible();
    await expect(page.getByTestId('btn-underline')).toBeVisible();
    await expect(page.getByTestId('btn-strike')).toBeVisible();
  });

  test('toolbar renders alignment buttons', async ({ page }) => {
    await expect(page.getByTestId('btn-align-left')).toBeVisible();
    await expect(page.getByTestId('btn-align-center')).toBeVisible();
    await expect(page.getByTestId('btn-align-right')).toBeVisible();
    await expect(page.getByTestId('btn-align-justify')).toBeVisible();
  });

  test('toolbar renders font selector with options', async ({ page }) => {
    const selector = page.getByTestId('font-selector');
    await expect(selector).toBeVisible();
    const options = selector.locator('option');
    expect(await options.count()).toBeGreaterThanOrEqual(5);
  });

  test('toolbar renders list controls', async ({ page }) => {
    await expect(page.getByTestId('btn-list-number')).toBeVisible();
    await expect(page.getByTestId('btn-list-bullet')).toBeVisible();
    await expect(page.getByTestId('btn-indent')).toBeVisible();
    await expect(page.getByTestId('btn-outdent')).toBeVisible();
  });

  test('format group is present', async ({ page }) => {
    await expect(page.getByTestId('format-group')).toBeVisible();
  });

  test('alignment group is present', async ({ page }) => {
    await expect(page.getByTestId('align-group')).toBeVisible();
  });

  test('list group is present', async ({ page }) => {
    await expect(page.getByTestId('list-group')).toBeVisible();
  });

  test('typing in the editor works', async ({ page }) => {
    const editable = page.locator('[data-testid^="page-body-"] [contenteditable="true"]').first();
    await editable.click();
    await page.keyboard.type('Hello, Lex4!');
    await expect(editable).toContainText('Hello, Lex4!');
  });

  test('indent button applies a first-line paragraph indent', async ({ page }) => {
    const editable = page.locator('[data-testid^="page-body-"] [contenteditable="true"]').first();
    await editable.click();
    await page.keyboard.type(
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(8),
    );

    await page.getByTestId('btn-indent').click();

    const paragraphStyles = await editable.evaluate(el => {
      const paragraph = el.querySelector('p');
      if (!paragraph) {
        return null;
      }

      const styles = getComputedStyle(paragraph);
      return {
        textIndent: Number.parseFloat(styles.textIndent || '0'),
        paddingInlineStart: Number.parseFloat(styles.paddingInlineStart || '0'),
        paddingLeft: Number.parseFloat(styles.paddingLeft || '0'),
      };
    });

    expect(paragraphStyles).not.toBeNull();
    expect(paragraphStyles?.textIndent).toBe(40);
    expect(paragraphStyles?.paddingInlineStart).toBe(0);
    expect(paragraphStyles?.paddingLeft).toBe(0);
  });
});
