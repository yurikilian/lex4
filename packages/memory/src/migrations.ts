import type Database from 'better-sqlite3';
import { CREATE_TABLE_SQL, CREATE_INDEX_SQL } from './schema.js';

/**
 * Runs all schema migrations idempotently.
 *
 * Safe to call multiple times — uses IF NOT EXISTS guards.
 */
export function runMigrations(db: Database.Database): void {
  db.exec(CREATE_TABLE_SQL);
  db.exec(CREATE_INDEX_SQL);
}
