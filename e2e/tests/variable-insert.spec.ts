import { test, expect } from '@playwright/test';

test.describe('Variable Insert', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="toolbar"]');
  });

  test('variable panel toggle is visible in the toolbar', async ({ page }) => {
    await expect(page.getByTestId('toggle-variable-panel')).toBeVisible();
  });

  test('variable toggle opens the sidebar', async ({ page }) => {
    // Focus body first
    const body = page.locator('[data-testid^="page-body-"] [data-lexical-editor="true"]').first();
    await body.click();

    await page.getByTestId('toggle-variable-panel').click();
    await expect(page.getByTestId('variable-panel')).toBeVisible();
  });

  test('variable sidebar shows available variables', async ({ page }) => {
    const body = page.locator('[data-testid^="page-body-"] [data-lexical-editor="true"]').first();
    await body.click();

    await page.getByTestId('toggle-variable-panel').click();
    await expect(page.getByTestId('variable-panel-customer.name')).toBeVisible();
    await expect(page.getByTestId('variable-panel-proposal.date')).toBeVisible();
  });

  test('variable sidebar supports search', async ({ page }) => {
    const body = page.locator('[data-testid^="page-body-"] [data-lexical-editor="true"]').first();
    await body.click();

    await page.getByTestId('toggle-variable-panel').click();
    await page.getByTestId('variable-panel-search').fill('seller');

    await expect(page.getByTestId('variable-panel-seller.name')).toBeVisible();
    // customer.name should be filtered out
    await expect(page.getByTestId('variable-panel-customer.name')).not.toBeVisible();
  });

  test('clicking variable inserts it into editor', async ({ page }) => {
    const body = page.locator('[data-testid^="page-body-"] [data-lexical-editor="true"]').first();
    await body.click();
    await page.keyboard.type('Dear ');

    await page.getByTestId('toggle-variable-panel').click();
    await page.getByTestId('variable-panel-customer.name').click();

    const chip = page.locator('[data-testid="variable-chip-customer.name"]');
    await expect(chip).toBeVisible();
    await expect(chip).toHaveText('Customer Name');
  });

  test('inserted variable stays compact and aligned with surrounding text', async ({ page }) => {
    const body = page.locator('[data-testid^="page-body-"] [data-lexical-editor="true"]').first();
    await body.click();
    await page.keyboard.type('Contractor: ');

    await page.getByTestId('toggle-variable-panel').click();
    await page.getByTestId('variable-panel-customer.name').click();

    const metrics = await page.evaluate(() => {
      const chip = document.querySelector<HTMLElement>('[data-testid="variable-chip-customer.name"]');
      const container = chip?.closest('p, h1, h2, h3, h4, h5, h6') as HTMLElement | null;
      if (!chip || !container) {
        return null;
      }

      const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
      let textNode: Text | null = null;

      while ((textNode = walker.nextNode() as Text | null)) {
        if ((textNode.textContent ?? '').includes('Contractor:')) {
          break;
        }
      }

      if (!textNode) {
        return null;
      }

      const sample = 'Contractor:';
      const textContent = textNode.textContent ?? '';
      const sampleStart = textContent.indexOf(sample);
      if (sampleStart === -1) {
        return null;
      }

      const range = document.createRange();
      range.setStart(textNode, sampleStart);
      range.setEnd(textNode, sampleStart + sample.length);

      const textRect = range.getBoundingClientRect();
      const chipRect = chip.getBoundingClientRect();
      const chipStyle = getComputedStyle(chip);
      const textStyle = getComputedStyle(textNode.parentElement ?? container);

      return {
        chipFontSize: Number.parseFloat(chipStyle.fontSize || '0'),
        textFontSize: Number.parseFloat(textStyle.fontSize || '0'),
        chipLineHeight: Number.parseFloat(chipStyle.lineHeight || '0'),
        centerDelta: Math.abs(
          chipRect.top + chipRect.height / 2 - (textRect.top + textRect.height / 2),
        ),
        marginLeft: Number.parseFloat(chipStyle.marginLeft || '0'),
        marginRight: Number.parseFloat(chipStyle.marginRight || '0'),
        paddingTop: Number.parseFloat(chipStyle.paddingTop || '0'),
        paddingBottom: Number.parseFloat(chipStyle.paddingBottom || '0'),
        paddingLeft: Number.parseFloat(chipStyle.paddingLeft || '0'),
        paddingRight: Number.parseFloat(chipStyle.paddingRight || '0'),
      };
    });

    expect(metrics).not.toBeNull();
    expect(metrics!.chipFontSize).toBeLessThan(metrics!.textFontSize);
    expect(metrics!.chipFontSize).toBeGreaterThan(metrics!.textFontSize * 0.84);
    expect(Math.abs(metrics!.chipLineHeight - metrics!.chipFontSize)).toBeLessThan(0.2);
    expect(metrics!.centerDelta).toBeLessThan(2.5);
    expect(metrics!.marginLeft).toBeLessThanOrEqual(1.5);
    expect(metrics!.marginRight).toBeLessThanOrEqual(1.5);
    expect(metrics!.paddingTop).toBeLessThanOrEqual(1.5);
    expect(metrics!.paddingBottom).toBeLessThanOrEqual(1.5);
    expect(metrics!.paddingLeft).toBeLessThanOrEqual(4.5);
    expect(metrics!.paddingRight).toBeLessThanOrEqual(4.5);
  });

  test('shift+arrow range selections apply block styles to variables', async ({ page }) => {
    const body = page.locator('[data-testid^="page-body-"] [data-lexical-editor="true"]').first();
    await body.click();
    await page.keyboard.type('Hello ');

    await page.getByTestId('toggle-variable-panel').click();
    await page.getByTestId('variable-panel-customer.name').click();

    await page.keyboard.down('Shift');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.up('Shift');

    await page.getByTestId('block-type-selector').click();
    await page.getByTestId('block-type-option-h1').click();

    const headingStyle = await page.getByTestId('variable-chip-customer.name').evaluate((chip) => {
      const styles = getComputedStyle(chip);
      return {
        fontSize: Number.parseFloat(styles.fontSize || '0'),
        fontWeight: Number.parseInt(styles.fontWeight || '0', 10),
      };
    });

    expect(headingStyle.fontSize).toBeGreaterThan(20);
    expect(headingStyle.fontWeight).toBeGreaterThanOrEqual(700);

    await page.keyboard.down('Shift');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.up('Shift');

    await page.getByTestId('block-type-selector').click();
    await page.getByTestId('block-type-option-paragraph').click();

    const paragraphStyle = await page.getByTestId('variable-chip-customer.name').evaluate((chip) => {
      const styles = getComputedStyle(chip);
      return {
        fontSize: Number.parseFloat(styles.fontSize || '0'),
        fontWeight: Number.parseInt(styles.fontWeight || '0', 10),
      };
    });

    expect(paragraphStyle.fontSize).toBeLessThan(18);
    expect(paragraphStyle.fontWeight).toBeLessThan(700);
  });

  test('click-selected variable accepts font toolbar changes', async ({ page }) => {
    const body = page.locator('[data-testid^="page-body-"] [data-lexical-editor="true"]').first();
    await body.click();

    await page.getByTestId('toggle-variable-panel').click();
    await page.getByTestId('variable-panel-customer.name').click();

    const chip = page.getByTestId('variable-chip-customer.name');
    await chip.click();
    await expect(chip).toHaveClass(/lex4-variable-chip-selected/);

    const domSelectionState = await page.evaluate(() => {
      const selection = window.getSelection();
      return {
        rangeCount: selection?.rangeCount ?? 0,
        anchorNode: selection?.anchorNode?.nodeName ?? null,
        anchorOffset: selection?.anchorOffset ?? null,
      };
    });

    expect(domSelectionState.rangeCount).toBe(0);
    expect(domSelectionState.anchorNode).toBeNull();
    expect(domSelectionState.anchorOffset).toBe(0);

    await page.selectOption('[data-testid="font-selector"]', 'Georgia');
    await page.selectOption('[data-testid="font-size-selector"]', '24');

    const styledChip = await chip.evaluate((node) => {
      const styles = getComputedStyle(node);
      return {
        fontFamily: styles.fontFamily,
        fontSize: Number.parseFloat(styles.fontSize || '0'),
      };
    });

    expect(styledChip.fontFamily).toContain('Georgia');
    expect(styledChip.fontSize).toBeGreaterThan(30);
  });
});
