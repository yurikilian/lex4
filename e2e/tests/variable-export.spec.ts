import { test, expect } from '@playwright/test';

test.describe('Variable Export', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="toolbar"]');
  });

  test('inserted variable appears in exported AST', async ({ page }) => {
    const body = page.locator('[data-testid^="page-body-"] [data-lexical-editor="true"]').first();
    await body.click();
    await page.keyboard.type('Hello ');

    // Insert variable
    await page.getByTestId('variable-picker-button').click();
    await page.getByTestId('variable-option-customer.name').click();

    // Wait for the variable chip to appear
    await expect(page.locator('[data-testid="variable-chip-customer.name"]')).toBeVisible();

    // Export AST
    await page.getByTestId('btn-export-ast').click();
    const ast = await page.evaluate(() => (window as any).__lex4_last_ast);

    const para = ast.pages[0].body[0];
    expect(para.type).toBe('paragraph');

    const variableNode = para.children.find((c: any) => c.type === 'variable');
    expect(variableNode).toBeDefined();
    expect(variableNode.key).toBe('customer.name');
  });

  test('variable metadata is included in AST', async ({ page }) => {
    // Insert variable
    const body = page.locator('[data-testid^="page-body-"] [data-lexical-editor="true"]').first();
    await body.click();

    await page.getByTestId('variable-picker-button').click();
    await page.getByTestId('variable-option-customer.name').click();

    await page.getByTestId('btn-export-ast').click();
    const ast = await page.evaluate(() => (window as any).__lex4_last_ast);

    expect(ast.metadata.variables['customer.name']).toBeDefined();
    expect(ast.metadata.variables['customer.name'].label).toBe('Customer Name');
    expect(ast.metadata.variables['customer.name'].valueType).toBe('string');
  });

  test('multiple variables of the same type export correctly', async ({ page }) => {
    const body = page.locator('[data-testid^="page-body-"] [data-lexical-editor="true"]').first();
    await body.click();

    // Insert same variable twice
    await page.getByTestId('variable-picker-button').click();
    await page.getByTestId('variable-option-customer.name').click();

    await page.keyboard.type(' and ');

    await page.getByTestId('variable-picker-button').click();
    await page.getByTestId('variable-option-customer.name').click();

    // Export AST
    await page.getByTestId('btn-export-ast').click();
    const ast = await page.evaluate(() => (window as any).__lex4_last_ast);

    const para = ast.pages[0].body[0];
    const variables = para.children.filter((c: any) => c.type === 'variable');
    expect(variables.length).toBe(2);
    expect(variables[0].key).toBe('customer.name');
    expect(variables[1].key).toBe('customer.name');
  });
});
