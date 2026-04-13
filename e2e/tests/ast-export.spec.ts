import { test, expect } from '@playwright/test';

test.describe('AST Export', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="toolbar"]');
  });

  test('export AST from empty document', async ({ page }) => {
    await page.getByTestId('btn-export-ast').click();
    const ast = await page.evaluate(() => (window as any).__lex4_last_ast);

    expect(ast).toBeDefined();
    expect(ast.version).toBe('1.0.0');
    expect(ast.page.format).toBe('A4');
    expect(ast.page.widthMm).toBe(210);
    expect(ast.page.heightMm).toBe(297);
    expect(ast.pages).toHaveLength(1);
    expect(ast.headerFooter.enabled).toBe(false);
  });

  test('export AST with typed text', async ({ page }) => {
    const body = page.locator('[data-testid^="page-body-"] [data-lexical-editor="true"]').first();
    await body.click();
    await page.keyboard.type('Hello Playwright');

    await page.getByTestId('btn-export-ast').click();
    const ast = await page.evaluate(() => (window as any).__lex4_last_ast);

    const body0 = ast.pages[0].body;
    expect(body0.length).toBeGreaterThanOrEqual(1);

    const para = body0[0];
    expect(para.type).toBe('paragraph');
    expect(para.children.length).toBeGreaterThanOrEqual(1);

    const textContent = para.children
      .filter((c: any) => c.type === 'text')
      .map((c: any) => c.text)
      .join('');
    expect(textContent).toContain('Hello Playwright');
  });

  test('export AST with bold formatting', async ({ page }) => {
    const body = page.locator('[data-testid^="page-body-"] [data-lexical-editor="true"]').first();
    await body.click();
    await page.keyboard.type('Normal ');

    // Toggle bold and type
    await page.getByTestId('btn-bold').click();
    await page.keyboard.type('bold text');

    await page.getByTestId('btn-export-ast').click();
    const ast = await page.evaluate(() => (window as any).__lex4_last_ast);

    const para = ast.pages[0].body[0];
    expect(para.type).toBe('paragraph');

    const boldRun = para.children.find((c: any) => c.marks?.bold === true);
    expect(boldRun).toBeDefined();
    expect(boldRun.text).toContain('bold text');
  });

  test('export AST with alignment', async ({ page }) => {
    const body = page.locator('[data-testid^="page-body-"] [data-lexical-editor="true"]').first();
    await body.click();
    await page.keyboard.type('Centered text');

    await page.getByTestId('btn-align-center').click();

    await page.getByTestId('btn-export-ast').click();
    const ast = await page.evaluate(() => (window as any).__lex4_last_ast);

    const para = ast.pages[0].body[0];
    expect(para.alignment).toBe('center');
  });

  test('export AST with ordered list', async ({ page }) => {
    const body = page.locator('[data-testid^="page-body-"] [data-lexical-editor="true"]').first();
    await body.click();
    await page.keyboard.type('Item 1');

    await page.getByTestId('btn-list-number').click();

    await page.getByTestId('btn-export-ast').click();
    const ast = await page.evaluate(() => (window as any).__lex4_last_ast);

    const list = ast.pages[0].body.find((b: any) => b.type === 'list');
    expect(list).toBeDefined();
    expect(list.listType).toBe('ordered');
    expect(list.items.length).toBeGreaterThanOrEqual(1);
  });

  test('export AST includes variable metadata', async ({ page }) => {
    await page.getByTestId('btn-export-ast').click();
    const ast = await page.evaluate(() => (window as any).__lex4_last_ast);

    expect(ast.metadata).toBeDefined();
    expect(ast.metadata.variables).toBeDefined();
    expect(ast.metadata.variables['customer.name']).toBeDefined();
    expect(ast.metadata.variables['customer.name'].label).toBe('Customer Name');
  });

  test('export AST with header/footer enabled', async ({ page }) => {
    await page.getByTestId('header-footer-switch').click();
    await page.waitForTimeout(300);

    await page.getByTestId('btn-export-ast').click();
    const ast = await page.evaluate(() => (window as any).__lex4_last_ast);

    expect(ast.headerFooter.enabled).toBe(true);
  });
});
