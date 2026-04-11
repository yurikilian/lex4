import { test, expect } from '@playwright/test';
import { existsSync } from 'fs';
import { resolve } from 'path';

test.describe('Project Memory', () => {
  test('memory database file exists in repo', () => {
    const dbPath = resolve(__dirname, '../../packages/memory/lex4-memory.db');
    expect(existsSync(dbPath)).toBe(true);
  });

  test('memory database is not excluded by .gitignore', async () => {
    const { readFileSync } = await import('fs');
    const gitignorePath = resolve(__dirname, '../../.gitignore');
    const content = readFileSync(gitignorePath, 'utf-8');
    // Ensure there's no active gitignore rule for db files
    // (comments mentioning *.db are fine — we check for uncommented rules)
    const lines = content.split('\n').filter(l => !l.trim().startsWith('#') && l.trim().length > 0);
    const hasDbRule = lines.some(l => l.includes('*.db') || l.includes('lex4-memory.db'));
    expect(hasDbRule).toBe(false);
  });
});
