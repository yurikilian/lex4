import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, unlinkSync } from 'fs';
import { resolve } from 'path';
import { MemoryStore } from '../memory-store.js';

const TEST_DB = resolve(__dirname, '../../test-memory.db');

describe('MemoryStore', () => {
  let store: MemoryStore;

  beforeEach(() => {
    if (existsSync(TEST_DB)) unlinkSync(TEST_DB);
    store = new MemoryStore(TEST_DB);
  });

  afterEach(() => {
    store.close();
    if (existsSync(TEST_DB)) unlinkSync(TEST_DB);
  });

  describe('schema initialization', () => {
    it('creates the database and table on construction', () => {
      expect(existsSync(TEST_DB)).toBe(true);
    });

    it('is idempotent — opening twice does not error', () => {
      store.close();
      const store2 = new MemoryStore(TEST_DB);
      store2.close();
      store = new MemoryStore(TEST_DB);
    });
  });

  describe('addEntry', () => {
    it('returns a valid ID', () => {
      const id = store.addEntry({
        entry_type: 'plan',
        title: 'Test Plan',
        content: 'Plan content here',
        tags: 'test,plan',
        status: 'active',
        related_files: null,
        component: null,
      });
      expect(id).toBeGreaterThan(0);
    });

    it('persists the entry data', () => {
      const id = store.addEntry({
        entry_type: 'step',
        title: 'Step 1',
        content: 'Do the thing',
        tags: null,
        status: 'active',
        related_files: 'src/index.ts',
        component: 'editor',
      });
      const entry = store.getEntryById(id);
      expect(entry).toBeDefined();
      expect(entry!.title).toBe('Step 1');
      expect(entry!.entry_type).toBe('step');
      expect(entry!.component).toBe('editor');
      expect(entry!.related_files).toBe('src/index.ts');
    });
  });

  describe('getEntries', () => {
    beforeEach(() => {
      store.addEntry({ entry_type: 'plan', title: 'Plan A', content: 'a', tags: null, status: 'active', related_files: null, component: null });
      store.addEntry({ entry_type: 'bug', title: 'Bug B', content: 'b', tags: 'critical', status: 'active', related_files: null, component: null });
      store.addEntry({ entry_type: 'plan', title: 'Plan C', content: 'c', tags: null, status: 'completed', related_files: null, component: null });
    });

    it('returns all entries when no filter', () => {
      const entries = store.getEntries();
      expect(entries).toHaveLength(3);
    });

    it('filters by entry_type', () => {
      const plans = store.getEntries({ entry_type: 'plan' });
      expect(plans).toHaveLength(2);
      expect(plans.every(e => e.entry_type === 'plan')).toBe(true);
    });

    it('filters by status', () => {
      const completed = store.getEntries({ status: 'completed' });
      expect(completed).toHaveLength(1);
      expect(completed[0].title).toBe('Plan C');
    });

    it('respects limit', () => {
      const entries = store.getEntries({ limit: 1 });
      expect(entries).toHaveLength(1);
    });
  });

  describe('updateEntry', () => {
    it('modifies only targeted fields', () => {
      const id = store.addEntry({
        entry_type: 'note',
        title: 'Original',
        content: 'Original content',
        tags: null,
        status: 'active',
        related_files: null,
        component: null,
      });

      const updated = store.updateEntry(id, { title: 'Updated', status: 'completed' });
      expect(updated).toBe(true);

      const entry = store.getEntryById(id);
      expect(entry!.title).toBe('Updated');
      expect(entry!.status).toBe('completed');
      expect(entry!.content).toBe('Original content');
    });

    it('returns false for non-existent entry', () => {
      const result = store.updateEntry(9999, { title: 'nope' });
      expect(result).toBe(false);
    });
  });

  describe('searchEntries', () => {
    beforeEach(() => {
      store.addEntry({ entry_type: 'decision', title: 'Use Lexical', content: 'We chose Lexical for editing', tags: null, status: 'active', related_files: null, component: null });
      store.addEntry({ entry_type: 'note', title: 'A4 dimensions', content: 'Pages are 794x1123 px', tags: null, status: 'active', related_files: null, component: null });
    });

    it('finds entries by title match', () => {
      const results = store.searchEntries('Lexical');
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Use Lexical');
    });

    it('finds entries by content match', () => {
      const results = store.searchEntries('794x1123');
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('A4 dimensions');
    });

    it('returns empty for no matches', () => {
      const results = store.searchEntries('nonexistent-xyz');
      expect(results).toHaveLength(0);
    });
  });
});
