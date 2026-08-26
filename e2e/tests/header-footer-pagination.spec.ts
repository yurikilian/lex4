import { expect, test, type Page } from '@playwright/test';

const OVERFLOW_TOLERANCE_PX = 2;

async function pastePlainText(page: Page, selector: string, text: string) {
  await page.locator(selector).first().click();
  await page.evaluate(({ targetSelector, value }) => {
    const editor = document.querySelector<HTMLElement>(targetSelector);
    if (!editor) {
      throw new Error(`Editable region not found: ${targetSelector}`);
    }

    editor.focus();
    const dataTransfer = new DataTransfer();
    dataTransfer.setData('text/plain', value);
    editor.dispatchEvent(new ClipboardEvent('paste', {
      clipboardData: dataTransfer,
      bubbles: true,
      cancelable: true,
    }));
  }, { targetSelector: selector, value: text });
}

async function waitForPaginationStable(page: Page, minimumPages = 1) {
  let previousSignature = '';
  let stableSamples = 0;

  await expect.poll(async () => {
    const snapshot = await page.evaluate(() => {
      const bodies = Array.from(document.querySelectorAll<HTMLElement>('.lex4-page-body'));
      const editorRef = (window as unknown as {
        __lex4_editor?: { current?: { getDocumentJson: () => string } | null };
      }).__lex4_editor;

      return {
        pageCount: bodies.length,
        bodies: bodies.map(body => {
          const editable = body.querySelector<HTMLElement>('[contenteditable="true"]');
          return {
            clientHeight: body.clientHeight,
            scrollHeight: editable?.scrollHeight ?? 0,
            textLength: editable?.textContent?.length ?? 0,
          };
        }),
        documentJson: editorRef?.current?.getDocumentJson() ?? '',
      };
    });

    if (snapshot.pageCount < minimumPages) {
      previousSignature = '';
      stableSamples = 0;
      return stableSamples;
    }

    const signature = JSON.stringify(snapshot);
    if (signature === previousSignature) {
      stableSamples += 1;
    } else {
      previousSignature = signature;
      stableSamples = 0;
    }
    return stableSamples;
  }, {
    message: `pagination did not stabilize with at least ${minimumPages} page(s)`,
    timeout: 30_000,
    intervals: [100, 150, 200, 250],
  }).toBeGreaterThanOrEqual(4);
}

async function expectEveryBodyToFit(page: Page) {
  const metrics = await page.locator('.lex4-page-body').evaluateAll(bodies =>
    bodies.map(body => {
      const editable = body.querySelector<HTMLElement>('[contenteditable="true"]');
      return {
        clientHeight: (body as HTMLElement).clientHeight,
        scrollHeight: editable?.scrollHeight ?? 0,
      };
    }),
  );

  for (const metric of metrics) {
    expect(metric.scrollHeight).toBeLessThanOrEqual(metric.clientHeight + OVERFLOW_TOLERANCE_PX);
  }
}

function expectMarkersExactlyOnceAndInOrder(text: string, prefix: string, count: number) {
  const markers = text.match(new RegExp(`${prefix}\\d{4}`, 'g')) ?? [];
  const expected = Array.from({ length: count }, (_, index) =>
    `${prefix}${String(index + 1).padStart(4, '0')}`,
  );
  expect(markers).toEqual(expected);
}

async function expectContentConserved(page: Page, prefix: string, count: number) {
  const content = await page.evaluate(() => {
    const bodyText = Array.from(
      document.querySelectorAll<HTMLElement>('.lex4-page-body [contenteditable="true"]'),
    ).map(editor => editor.textContent ?? '').join(' ');
    const editorRef = (window as unknown as {
      __lex4_editor?: {
        current?: {
          getDocumentAst: () => unknown;
          getDocumentJson: () => string;
        } | null;
      };
    }).__lex4_editor;
    const handle = editorRef?.current;
    if (!handle) {
      throw new Error('Lex4 editor handle is not available');
    }

    return {
      ast: JSON.stringify(handle.getDocumentAst()),
      bodyText,
      json: handle.getDocumentJson(),
    };
  });

  expectMarkersExactlyOnceAndInOrder(content.bodyText, prefix, count);
  expectMarkersExactlyOnceAndInOrder(content.ast, prefix, count);
  expectMarkersExactlyOnceAndInOrder(content.json, prefix, count);
}

async function createLargeBody(page: Page, rows = 60) {
  const paragraphs = Array.from({ length: rows }, (_, index) =>
    `Row ${index + 1}: Sed gravida sit amet enim vel fermentum. Aenean ut ante a mi pulvinar placerat in eu odio. Phasellus ac posuere neque. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae.`,
  );

  await pastePlainText(
    page,
    '[data-testid^="page-body-"] [contenteditable="true"]',
    paragraphs.join('\n'),
  );
  await waitForPaginationStable(page, 2);
}

async function typeLargeRegion(page: Page, region: 'header' | 'footer') {
  const editor = page.locator(`[data-testid^="page-${region}-"] [contenteditable="true"]`).first();
  await editor.click();

  for (let index = 0; index < 8; index++) {
    await page.keyboard.insertText(`${region.toUpperCase()} line ${index + 1}`);
    if (index < 7) {
      await page.keyboard.press('Enter');
    }
  }

  await expect(editor).toContainText(`${region.toUpperCase()} line 8`);
}

test.describe('Header/Footer Pagination', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="page-0"]');
    await page.getByTestId('header-footer-switch').click();
  });

  test('editing a header alone does not implicitly propagate it to later overflow pages', async ({ page }) => {
    await typeLargeRegion(page, 'header');
    await createLargeBody(page);
    await waitForPaginationStable(page, 2);

    const pageCountAfter = await page.locator('[data-page-id]').count();
    expect(pageCountAfter).toBeGreaterThan(1);

    const lastHeader = page.locator('[data-testid^="page-header-"] [contenteditable="true"]').last();
    await expect(lastHeader).not.toContainText('HEADER line 1');
  });

  test('copied large header propagates to pages created later by overflow', async ({ page }) => {
    await createLargeBody(page);
    const pageCountBefore = await page.locator('[data-page-id]').count();

    await typeLargeRegion(page, 'header');
    await page.locator('[data-testid^="page-body-"]').first().click();
    await page.getByTestId('header-footer-menu-trigger').click();
    await page.getByTestId('copy-header-all').click();
    await waitForPaginationStable(page, pageCountBefore + 1);

    const pageCountAfter = await page.locator('[data-page-id]').count();
    expect(pageCountAfter).toBeGreaterThan(pageCountBefore);

    const lastHeader = page.locator('[data-testid^="page-header-"] [contenteditable="true"]').last();
    await expect(lastHeader).toContainText('HEADER line 1');
  });

  test('copied large footer propagates to pages created later by overflow', async ({ page }) => {
    await createLargeBody(page);
    const pageCountBefore = await page.locator('[data-page-id]').count();

    await typeLargeRegion(page, 'footer');
    await page.locator('[data-testid^="page-body-"]').first().click();
    await page.getByTestId('header-footer-menu-trigger').click();
    await page.getByTestId('copy-footer-all').click();
    await waitForPaginationStable(page, pageCountBefore + 1);

    const pageCountAfter = await page.locator('[data-page-id]').count();
    expect(pageCountAfter).toBeGreaterThan(pageCountBefore);

    const lastFooter = page.locator('[data-testid^="page-footer-"] [contenteditable="true"]').last();
    await expect(lastFooter).toContainText('FOOTER line 1');
  });

  test('clearing all headers compacts the document back down', async ({ page }) => {
    await createLargeBody(page);
    await typeLargeRegion(page, 'header');
    await page.locator('[data-testid^="page-body-"]').first().click();
    await page.getByTestId('header-footer-menu-trigger').click();
    await page.getByTestId('copy-header-all').click();
    await waitForPaginationStable(page, 2);

    const expandedPageCount = await page.locator('[data-page-id]').count();

    await page.getByTestId('header-footer-menu-trigger').click();
    await page.getByTestId('clear-all-headers').click();
    await waitForPaginationStable(page);

    const compactedPageCount = await page.locator('[data-page-id]').count();
    expect(compactedPageCount).toBeLessThan(expandedPageCount);
  });

  test('conserves 90 identified paragraphs through large header and footer reflow cycles', async ({ page }) => {
    const paragraphCount = 90;
    const paragraphs = Array.from({ length: paragraphCount }, (_, index) => {
      const marker = `P${String(index + 1).padStart(4, '0')}`;
      return `${marker} Pagination conservation paragraph with enough content to exercise page reflow and ordering.`;
    });

    await pastePlainText(
      page,
      '[data-testid^="page-body-"] [contenteditable="true"]',
      paragraphs.join('\n'),
    );
    await waitForPaginationStable(page, 2);

    await typeLargeRegion(page, 'header');
    await page.locator('[data-testid^="page-body-"]').first().click();
    await page.getByTestId('header-footer-menu-trigger').click();
    await page.getByTestId('copy-header-all').click();

    await typeLargeRegion(page, 'footer');
    await page.locator('[data-testid^="page-body-"]').first().click();
    await page.getByTestId('header-footer-menu-trigger').click();
    await page.getByTestId('copy-footer-all').click();
    await waitForPaginationStable(page, 2);

    await expectContentConserved(page, 'P', paragraphCount);
    await expectEveryBodyToFit(page);

    for (let cycle = 0; cycle < 3; cycle++) {
      await page.getByTestId('header-footer-switch').click();
      await waitForPaginationStable(page);
      await expectContentConserved(page, 'P', paragraphCount);
      await expectEveryBodyToFit(page);

      await page.getByTestId('header-footer-switch').click();
      await waitForPaginationStable(page, 2);
      await expectContentConserved(page, 'P', paragraphCount);
      await expectEveryBodyToFit(page);
    }
  });

  test('conserves 500 markers through successive internal paragraph splits', async ({ page }) => {
    const markerCount = 500;
    const longParagraph = Array.from({ length: markerCount }, (_, index) => {
      const marker = `M${String(index + 1).padStart(4, '0')}`;
      return `${marker} successive internal split content for pagination conservation`;
    }).join(' ');

    await pastePlainText(
      page,
      '[data-testid^="page-body-"] [contenteditable="true"]',
      longParagraph,
    );
    await waitForPaginationStable(page, 2);

    await expectContentConserved(page, 'M', markerCount);
    await expectEveryBodyToFit(page);
  });
});
