import BetterSqlite3 from 'better-sqlite3';
import type Database from 'better-sqlite3';
import { runMigrations } from './migrations.js';
import type {
  MemoryEntry,
  NewMemoryEntry,
  MemoryEntryUpdate,
  EntryType,
  EntryStatus,
} from './schema.js';

/** Filter options for querying memory entries */
export interface EntryFilter {
  entry_type?: EntryType;
  status?: EntryStatus;
  tags?: string;
  component?: string;
  limit?: number;
}

/**
 * MemoryStore — read/write access to the project memory database.
 *
 * Each instance wraps a single SQLite database connection.
 */
export class MemoryStore {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new BetterSqlite3(dbPath);
    this.db.pragma('journal_mode = WAL');
    runMigrations(this.db);
  }

  /** Insert a new memory entry. Returns the new entry's ID. */
  addEntry(entry: NewMemoryEntry): number {
    const stmt = this.db.prepare(`
      INSERT INTO memory_entries (entry_type, title, content, tags, status, related_files, component)
      VALUES (@entry_type, @title, @content, @tags, @status, @related_files, @component)
    `);
    const result = stmt.run(entry);
    return Number(result.lastInsertRowid);
  }

  /** Get a single entry by ID. Returns undefined if not found. */
  getEntryById(id: number): MemoryEntry | undefined {
    const stmt = this.db.prepare('SELECT * FROM memory_entries WHERE id = ?');
    return stmt.get(id) as MemoryEntry | undefined;
  }

  /** Query entries with optional filters. */
  getEntries(filter?: EntryFilter): MemoryEntry[] {
    const conditions: string[] = [];
    const params: Record<string, unknown> = {};

    if (filter?.entry_type) {
      conditions.push('entry_type = @entry_type');
      params.entry_type = filter.entry_type;
    }
    if (filter?.status) {
      conditions.push('status = @status');
      params.status = filter.status;
    }
    if (filter?.component) {
      conditions.push('component = @component');
      params.component = filter.component;
    }
    if (filter?.tags) {
      conditions.push('tags LIKE @tags');
      params.tags = `%${filter.tags}%`;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = filter?.limit ? `LIMIT ${filter.limit}` : '';
    const sql = `SELECT * FROM memory_entries ${where} ORDER BY created_at DESC ${limit}`;

    return this.db.prepare(sql).all(params) as MemoryEntry[];
  }

  /** Update fields on an existing entry. */
  updateEntry(id: number, updates: MemoryEntryUpdate): boolean {
    const fields: string[] = ["updated_at = datetime('now')"];
    const params: Record<string, unknown> = { id };

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        fields.push(`${key} = @${key}`);
        params[key] = value;
      }
    }

    const sql = `UPDATE memory_entries SET ${fields.join(', ')} WHERE id = @id`;
    const result = this.db.prepare(sql).run(params);
    return result.changes > 0;
  }

  /** Full-text search across title and content. */
  searchEntries(query: string, limit = 20): MemoryEntry[] {
    const sql = `
      SELECT * FROM memory_entries
      WHERE title LIKE @q OR content LIKE @q
      ORDER BY created_at DESC
      LIMIT @limit
    `;
    return this.db.prepare(sql).all({ q: `%${query}%`, limit }) as MemoryEntry[];
  }

  /** Close the database connection. */
  close(): void {
    this.db.close();
  }
}
