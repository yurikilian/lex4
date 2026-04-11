# Lex4

> **Lex** Luthor × Meta **Lex**ical × **A4** rules

A Microsoft Word-like paginated document editor built as a reusable React library. Every page is a true discrete A4 page — no fake pages, no CSS hacks, no single-editor visual tricks.

## Quick Start

```bash
pnpm install
pnpm --filter @lex4/editor build
pnpm --filter demo dev
```

### Use in your React app

```tsx
import { Lex4Editor } from '@lex4/editor';
import '@lex4/editor/style.css';

function App() {
  return <Lex4Editor onDocumentChange={(doc) => console.log(doc)} />;
}
```

## Public API

### `<Lex4Editor />` Component

| Prop | Type | Description |
|------|------|-------------|
| `initialDocument` | `Lex4Document` | Pre-populate the editor |
| `onDocumentChange` | `(doc: Lex4Document) => void` | Fires on every document change |
| `headerFooterEnabled` | `boolean` | Initial header/footer state |
| `readOnly` | `boolean` | Disable editing |
| `className` | `string` | Additional CSS class |

### Types

```ts
interface Lex4Document {
  pages: PageState[];
  headerFooterEnabled: boolean;
}

interface PageState {
  id: string;
  bodyState: SerializedEditorState | null;
  headerState: SerializedEditorState | null;
  footerState: SerializedEditorState | null;
  headerHeight: number;
  footerHeight: number;
}
```

### Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `A4_WIDTH_PX` | 794 | A4 width at 96 DPI |
| `A4_HEIGHT_PX` | 1123 | A4 height at 96 DPI |
| `MAX_HEADER_HEIGHT_PX` | 225 | Max 20% of page height |
| `MAX_FOOTER_HEIGHT_PX` | 225 | Max 20% of page height |

## Architecture

### Multi-Editor Discrete Page Model

Each page body has its own Lexical editor instance coordinated by unified document state:

```
DocumentProvider (React Context)
├── Toolbar
└── DocumentView
    ├── PageView (A4: 794×1123px)
    │   ├── PageHeader (mini Lexical editor, ≤225px)
    │   ├── PageBody (full Lexical editor)
    │   └── PageFooter (mini Lexical editor, ≤225px)
    ├── PageView
    │   ├── ...
    └── ...
```

### Content Flow

1. **Overflow**: When content exceeds body height → split at block boundary → push to next page
2. **Underflow**: When content is deleted → pull blocks back from next page
3. **Cascade**: Overflow/underflow cascades forward through all subsequent pages
4. **Toggle**: Header/footer toggle recalculates all body heights → full document reflow

### Key Invariants

- Every page is exactly A4 (794 × 1123 px at 96 DPI)
- No dynamic page heights — every page is always full A4
- Header/footer never overlap body content
- Overflow always creates new full A4 pages, never partial pages
- At least one page always exists

## Failure Prevention

| # | Problem | Solution |
|---|---------|----------|
| 1 | Paste doesn't create pages | `engine/reflow.ts` + `paste-plugin.tsx` — mandatory repagination after paste |
| 2 | Paste distorts headers/footers | `engine/overflow.ts` — body-only reflow, header/footer are reserved zones |
| 3 | Non-A4 pages created | `constants/dimensions.ts` — all pages use fixed A4_HEIGHT_PX |
| 4 | Page 1 empty, page 2 full | `engine/paginate.ts` — fill each page to capacity before creating next |
| 5 | Toggle corrupts layout | `hooks/use-pagination.ts` — full reflow after toggle change |
| 6 | Dev context lost | `packages/memory/` — SQLite DB committed to repo |
| 7 | Not reusable | `src/index.ts` — clean public API, Vite library build mode |
| 8 | Tests only at end | 68 unit tests + 25 E2E tests built alongside features |

## Project Structure

```
lex4/
├── packages/
│   ├── editor/           # The reusable React library
│   │   ├── src/
│   │   │   ├── components/   # React components
│   │   │   ├── constants/    # A4 dimensions, layout math
│   │   │   ├── context/      # DocumentProvider + reducer
│   │   │   ├── engine/       # Pagination logic (pure functions)
│   │   │   ├── hooks/        # usePagination, useOverflowDetection
│   │   │   ├── lexical/      # Editor config, plugins, commands
│   │   │   ├── types/        # TypeScript interfaces
│   │   │   └── utils/        # Editor state manipulation
│   │   └── dist/             # Built library output
│   └── memory/           # SQLite project memory (dev tool)
├── demo/                 # Development harness app
├── e2e/                  # Playwright E2E tests
└── hooks/                # Git hooks
```

## Development

```bash
# Install dependencies
pnpm install

# Run unit tests
pnpm --filter @lex4/editor test

# Run E2E tests (needs Playwright browsers)
cd e2e && npx playwright install chromium
pnpm --filter e2e test

# Start demo app
pnpm --filter demo dev

# Build library
pnpm --filter @lex4/editor build

# Type check
pnpm --filter @lex4/editor lint
```

### Git Hooks

```bash
git config core.hooksPath hooks
```

The `commit-msg` hook strips the Co-authored-by Copilot trailer from commit messages.

### Project Memory

```bash
# List memory entries
pnpm --filter @lex4/memory cli list

# Add a memory entry
pnpm --filter @lex4/memory cli add --type=note --title="..." --content="..."

# Search entries
pnpm --filter @lex4/memory cli search "keyword"
```

The `lex4-memory.db` file is committed intentionally — it preserves development context across sessions.

## Stack

- **TypeScript** + **React** — type-safe UI
- **Vite** — library build (ESM + CJS) + dev server
- **Meta Lexical** — rich text editing engine
- **Tailwind CSS** — styling
- **Vitest** — unit tests (68 tests)
- **Playwright** — E2E tests (25 tests)
- **better-sqlite3** — project memory (dev-only)
- **pnpm** — package manager

## Known Limitations

1. **No mid-block splitting** — blocks move whole between pages
2. **Heuristic pagination** — initial block height estimation (24px/line), corrected by ResizeObserver
3. **No collaborative editing** — out of scope
4. **No table support** — out of scope
