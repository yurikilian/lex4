import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const theme of ['light', 'dark'] as const) {
  test(`editor chrome has no detectable WCAG A/AA violations in ${theme} mode`, async ({ page }) => {
    await page.addInitScript((initialTheme) => {
      window.localStorage.setItem('lex4-demo-theme', initialTheme);
    }, theme);
    await page.goto('/');
    await page.waitForSelector('[data-testid="lex4-editor"]');
    await page.waitForTimeout(400);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(
      results.violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        nodes: violation.nodes.map((node) => ({
          target: node.target,
          details: [...node.any, ...node.all, ...node.none].map((check) => check.data),
        })),
      })),
    ).toEqual([]);
  });
}
