#!/usr/bin/env node

/**
 * Lex4 Project Memory CLI
 *
 * Usage:
 *   pnpm --filter @lex4/memory memory list [--type=plan] [--limit=20]
 *   pnpm --filter @lex4/memory memory add --type=step --title="..." --content="..."
 *   pnpm --filter @lex4/memory memory search "keyword"
 *   pnpm --filter @lex4/memory memory show <id>
 */

import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { MemoryStore } from './memory-store.js';
import type { EntryType, EntryStatus } from './schema.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = resolve(__dirname, '..', 'lex4-memory.db');

function parseArgs(args: string[]): { command: string; flags: Record<string, string>; positional: string[] } {
  const command = args[0] ?? 'list';
  const flags: Record<string, string> = {};
  const positional: string[] = [];

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const [key, ...valueParts] = arg.slice(2).split('=');
      flags[key] = valueParts.join('=') || 'true';
    } else {
      positional.push(arg);
    }
  }

  return { command, flags, positional };
}

function main() {
  const { command, flags, positional } = parseArgs(process.argv.slice(2));
  const store = new MemoryStore(DB_PATH);

  try {
    switch (command) {
      case 'list': {
        const entries = store.getEntries({
          entry_type: flags.type as EntryType | undefined,
          status: flags.status as EntryStatus | undefined,
          limit: flags.limit ? parseInt(flags.limit, 10) : 20,
        });
        if (entries.length === 0) {
          console.log('No entries found.');
        } else {
          for (const e of entries) {
            console.log(`[${e.id}] ${e.entry_type.toUpperCase()} — ${e.title} (${e.created_at})`);
          }
        }
        break;
      }

      case 'add': {
        if (!flags.type || !flags.title || !flags.content) {
          console.error('Usage: memory add --type=<type> --title="..." --content="..."');
          process.exit(1);
        }
        const id = store.addEntry({
          entry_type: flags.type as EntryType,
          title: flags.title,
          content: flags.content,
          tags: flags.tags ?? null,
          status: (flags.status as EntryStatus) ?? 'active',
          related_files: flags.files ?? null,
          component: flags.component ?? null,
        });
        console.log(`Entry created with ID: ${id}`);
        break;
      }

      case 'search': {
        const query = positional[0];
        if (!query) {
          console.error('Usage: memory search "keyword"');
          process.exit(1);
        }
        const results = store.searchEntries(query);
        if (results.length === 0) {
          console.log('No matching entries.');
        } else {
          for (const e of results) {
            console.log(`[${e.id}] ${e.entry_type.toUpperCase()} — ${e.title}`);
            console.log(`  ${e.content.slice(0, 120)}...`);
            console.log();
          }
        }
        break;
      }

      case 'show': {
        const id = parseInt(positional[0], 10);
        if (isNaN(id)) {
          console.error('Usage: memory show <id>');
          process.exit(1);
        }
        const entry = store.getEntryById(id);
        if (!entry) {
          console.error(`Entry ${id} not found.`);
          process.exit(1);
        }
        console.log(JSON.stringify(entry, null, 2));
        break;
      }

      default:
        console.error(`Unknown command: ${command}`);
        console.error('Available commands: list, add, search, show');
        process.exit(1);
    }
  } finally {
    store.close();
  }
}

main();
