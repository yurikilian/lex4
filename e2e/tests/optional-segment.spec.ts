import { test, expect } from '@playwright/test';

test.describe('Optional Segment', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="toolbar"]');
  });

  async function selectLastChars(page: import('@playwright/test').Page, count: number) {
    await page.keyboard.down('Shift');
    for (let i = 0; i < count; i += 1) {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.up('Shift');
    await page.waitForTimeout(150);
  }

  test('toolbar button appears only with a non-empty selection', async ({ page }) => {
    const body = page.locator('[data-testid^="page-body-"] [data-lexical-editor="true"]').first();
    await body.click();

    await expect(page.getByTestId('btn-optional-segment')).toHaveCount(0);

    await page.keyboard.type('Some optional text');
    await expect(page.getByTestId('btn-optional-segment')).toHaveCount(0);

    await selectLastChars(page, 4);
    await expect(page.getByTestId('btn-optional-segment')).toBeVisible();
  });

  test('wraps the selection in a segment and unwraps it again', async ({ page }) => {
    const body = page.locator('[data-testid^="page-body-"] [data-lexical-editor="true"]').first();
    await body.click();
    await page.keyboard.type('Address optional');

    await selectLastChars(page, 8);
    await page.getByTestId('btn-optional-segment').click();

    const segment = page.locator('[data-lex4-optional-segment]');
    await expect(segment).toHaveCount(1);
    await expect(segment).toHaveText('optional');

    // Caret is left inside the segment → button stays visible and active.
    const button = page.getByTestId('btn-optional-segment');
    await expect(button).toHaveAttribute('aria-pressed', 'true');

    await button.click();
    await expect(segment).toHaveCount(0);
    await expect(body).toContainText('Address optional');
  });

  test('a selected variable exposes the optional action and can be wrapped directly', async ({ page }) => {
    const body = page.locator('[data-testid^="page-body-"] [data-lexical-editor="true"]').first();
    await body.click();
    await page.keyboard.type('Hello ');

    await page.getByTestId('toggle-variable-panel').click();
    await page.getByTestId('variable-panel-customer.name').click();

    const chip = page.getByTestId('variable-chip-customer.name');
    await chip.click();

    const button = page.getByTestId('btn-optional-segment');
    await expect(button).toBeVisible();
    await expect(button).toHaveAttribute('aria-pressed', 'false');

    await button.click();
    await expect(page.locator('[data-lex4-optional-segment]')).toHaveCount(1);
    await expect(page.locator('[data-lex4-optional-segment]')).toContainText('Customer Name');
    await expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  test('arrow keys enter, highlight, and leave a variable at the optional-segment boundary', async ({ page }) => {
    const body = page.locator('[data-testid^="page-body-"] [data-lexical-editor="true"]').first();
    await body.click();
    await page.keyboard.type('Hello ');

    await page.getByTestId('toggle-variable-panel').click();
    await page.getByTestId('variable-panel-customer.name').click();

    const chip = page.getByTestId('variable-chip-customer.name');
    await chip.click();
    await page.getByTestId('btn-optional-segment').click();

    await chip.click();
    await expect(chip).toHaveClass(/lex4-variable-chip-selected/);
    expect(await page.evaluate(() => window.getSelection()?.rangeCount ?? -1)).toBe(0);

    await page.keyboard.press('ArrowRight');
    await expect(chip).not.toHaveClass(/lex4-variable-chip-selected/);
    await page.keyboard.type(' continues');

    await expect(body).toContainText('Hello Customer Name continues');
    await expect(page.locator('[data-lex4-optional-segment]')).toHaveText('Customer Name');

    for (let i = 0; i < ' continues'.length + 3; i += 1) {
      await page.keyboard.press('ArrowLeft');
      if (await chip.evaluate(node => node.classList.contains('lex4-variable-chip-selected'))) {
        break;
      }
    }
    await expect(chip).toHaveClass(/lex4-variable-chip-selected/);

    await page.keyboard.press('ArrowLeft');
    await expect(chip).not.toHaveClass(/lex4-variable-chip-selected/);
    await page.keyboard.type('before ');

    await expect(body).toContainText('Hello before Customer Name continues');
    await expect(page.locator('[data-lex4-optional-segment]')).toHaveText('Customer Name');
  });

  test('arrow keys treat a caret at the end of a paragraph as after a trailing optional variable', async ({ page }) => {
    const body = page.locator('[data-testid^="page-body-"] [data-lexical-editor="true"]').first();
    await body.click();
    await page.keyboard.type('Customer, ');
    await page.getByTestId('toggle-variable-panel').click();
    await page.getByTestId('variable-panel-customer.name').click();

    // Wrap ", " and the chip: the chip becomes the segment's last child.
    await selectLastChars(page, 3);
    await page.getByTestId('btn-optional-segment').click();

    const chip = page.getByTestId('variable-chip-customer.name');
    const segment = page.locator('[data-lex4-optional-segment]');
    await expect(segment).toHaveText(', Customer Name');
    expect(await segment.evaluate(node => node.lastElementChild?.hasAttribute('data-lexical-decorator'))).toBe(true);

    // Linux Chromium puts the caret here after End: after the optional segment
    // span, at the end of the paragraph, rather than inside the segment.
    const placeCaretAtParagraphEnd = () => segment.evaluate((node) => {
      const paragraph = node.parentElement!;
      window.getSelection()!.collapse(paragraph, paragraph.childNodes.length);
    });

    await body.click();
    await placeCaretAtParagraphEnd();
    await page.keyboard.press('ArrowLeft');
    await expect(chip).toHaveClass(/lex4-variable-chip-selected/);

    await body.click();
    await placeCaretAtParagraphEnd();
    await page.keyboard.press('ArrowRight');
    await expect(chip).not.toHaveClass(/lex4-variable-chip-selected/);
    await page.keyboard.type(' continued');

    await expect(body).toContainText('Customer, Customer Name continued');
    await expect(segment).not.toContainText('continued');
  });

  test('undo restores the wrapped segment', async ({ page }) => {
    const body = page.locator('[data-testid^="page-body-"] [data-lexical-editor="true"]').first();
    await body.click();
    await page.keyboard.type('Address optional');

    await selectLastChars(page, 8);
    await page.getByTestId('btn-optional-segment').click();
    await expect(page.locator('[data-lex4-optional-segment]')).toHaveCount(1);

    await page.getByTestId('btn-undo').click();
    await expect(page.locator('[data-lex4-optional-segment]')).toHaveCount(0);
    await expect(body).toContainText('Address optional');

    await page.getByTestId('btn-redo').click();
    await expect(page.locator('[data-lex4-optional-segment]')).toHaveCount(1);
  });

  test('exports segment with text and variable children in the AST', async ({ page }) => {
    const body = page.locator('[data-testid^="page-body-"] [data-lexical-editor="true"]').first();
    await body.click();
    await page.keyboard.type('City: ');

    await page.getByTestId('toggle-variable-panel').click();
    await page.getByTestId('variable-panel-company.address.city').click();
    await expect(page.locator('[data-testid="variable-chip-company.address.city"]')).toBeVisible();

    // Select ": " plus the chip (chip counts as one arrow step).
    await selectLastChars(page, 3);
    await page.getByTestId('btn-optional-segment').click();
    await expect(page.locator('[data-lex4-optional-segment]')).toHaveCount(1);

    await page.getByTestId('btn-export-ast').click();
    const ast = await page.evaluate(() => (window as unknown as { __lex4_last_ast: any }).__lex4_last_ast);

    const para = ast.pages[0].body[0];
    const segment = para.children.find((c: any) => c.type === 'optional-segment');
    expect(segment).toBeDefined();
    expect(segment.children.some((c: any) => c.type === 'variable' && c.key === 'company.address.city')).toBe(true);
    expect(segment.children.some((c: any) => c.type === 'text')).toBe(true);
  });

  test('long variable chip truncates with ellipsis and shows label tooltip', async ({ page }) => {
    const body = page.locator('[data-testid^="page-body-"] [data-lexical-editor="true"]').first();
    await body.click();

    await page.getByTestId('toggle-variable-panel').click();
    await page.getByTestId('variable-panel-customer.identificationType').click();

    const chip = page.locator('[data-testid="variable-chip-customer.identificationType"]');
    await expect(chip).toBeVisible();
    await expect(chip).toHaveAttribute('title', 'Cliente - Tipo de identificação');

    const styles = await chip.evaluate((node) => {
      const computed = getComputedStyle(node);
      return {
        overflow: computed.overflow,
        textOverflow: computed.textOverflow,
        maxWidth: computed.maxWidth,
      };
    });
    expect(styles.overflow).toBe('hidden');
    expect(styles.textOverflow).toBe('ellipsis');
    expect(styles.maxWidth).toBe('100%');
  });
});
