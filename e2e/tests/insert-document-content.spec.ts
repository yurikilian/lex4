import { test, expect } from '@playwright/test';

const reusableSectionDocument = {
  headerFooterEnabled: false,
  pageCounterMode: 'none',
  defaultHeaderState: null,
  defaultFooterState: null,
  defaultHeaderHeight: 0,
  defaultFooterHeight: 0,
  pages: [
    {
      id: 'page-1',
      headerState: null,
      footerState: null,
      headerHeight: 0,
      footerHeight: 0,
      bodySyncVersion: 0,
      headerSyncVersion: 0,
      footerSyncVersion: 0,
      bodyState: {
        root: {
          type: 'root',
          format: '',
          indent: 0,
          version: 1,
          direction: null,
          children: [
            {
              type: 'paragraph',
              format: '',
              indent: 0,
              version: 1,
              direction: null,
              children: [
                {
                  type: 'text',
                  text: 'Inserted reusable section',
                  format: 0,
                  style: '',
                  version: 1,
                  detail: 0,
                  mode: 'normal',
                },
              ],
            },
          ],
        },
      },
    },
  ],
};

test('inserts document content at the visible caret in an empty body', async ({ page }) => {
  await page.goto('/');

  const editorBody = page.locator('[data-testid^="page-body-"] [contenteditable="true"]').first();
  await expect(editorBody).toBeVisible();
  await editorBody.click({ position: { x: 120, y: 80 } });

  const inserted = await page.evaluate(async (documentToInsert) => {
    const editorRef = (window as unknown as {
      __lex4_editor?: { current?: { insertDocumentContent: (document: unknown) => boolean } | null };
    }).__lex4_editor;

    return editorRef?.current?.insertDocumentContent(documentToInsert) ?? false;
  }, reusableSectionDocument);

  expect(inserted).toBe(true);
  await expect(page.getByText('Inserted reusable section')).toBeVisible();
});
