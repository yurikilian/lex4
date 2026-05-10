# Copilot Instructions for Lex4

## Build, test, and lint commands

- Install deps: `pnpm install`
- Start demo app: `pnpm dev`
- Lint workspace: `pnpm lint`
- Build publishable editor library: `pnpm build`
- Build demo app explicitly: `pnpm --filter demo build`
- Run editor unit tests: `pnpm test`
- Run E2E suite: `pnpm test:e2e`
- Install Playwright browser first time: `pnpm --filter e2e exec playwright install chromium`

### Run single tests

- Single editor Vitest file: `pnpm --filter @yurikilian/lex4 exec vitest run src/__tests__/pagination-engine.test.ts`
- Single editor test by name: `pnpm --filter @yurikilian/lex4 exec vitest run src/__tests__/pagination-engine.test.ts -t "<test name>"`
- Single memory-package Vitest file: `pnpm --filter @lex4/memory exec vitest run src/__tests__/memory-store.test.ts`
- Single Playwright spec: `pnpm --filter e2e exec playwright test tests/smoke.spec.ts`
- Single Playwright test by name: `pnpm --filter e2e exec playwright test tests/smoke.spec.ts -g "should render the toolbar"`

## High-level architecture

- Monorepo shape:
  - `packages/editor` = publishable React + Lexical library (`@yurikilian/lex4`)
  - `demo` = Vite app consuming workspace package through public API
  - `e2e` = Playwright suite that boots demo via `webServer`
  - `packages/memory` = committed SQLite-backed project memory + CLI
- `packages/editor/src/components/Lex4Editor.tsx` is top-level composition root. It wires `DocumentProvider`, i18n provider, extension providers, toolbar, history sidebar, and document view.
- Document model is not one continuous editor. `Lex4Document` contains array of discrete `PageState` objects. Each page owns independent Lexical body/header/footer serialized states plus sync-version counters used to force remounts after external reflow/undo/copy operations.
- Pagination logic split across:
  - `src/engine/*` for pure page/block redistribution helpers
  - `src/hooks/use-pagination.ts` and overflow detection hooks for editor-driven reflow
  - `src/constants/*` for fixed A4 geometry and body-height math
- Extension system is core architecture, not addon afterthought. `src/extensions/*` resolves extension contributions for Lexical nodes, body plugins, toolbar items, side panels, providers, root CSS variables/classes, and imperative handle methods. Built-in AST export and variable chips both use this path.
- AST export lives in `src/ast/*`. It converts internal Lexical page state into versioned, Lexical-independent payloads for backend DOCX/PDF workflows.
- Demo and E2E are coupled intentionally: Playwright runs against demo app, so UI/test changes usually require reading both `demo/src/*` and `e2e/tests/*`.

## Key conventions

- Preserve true multi-editor pagination model. Do not collapse pages into one long Lexical editor with visual page breaks. Core invariants: fixed A4 pages, at least one page always exists, header/footer never overlap body, overflow produces whole pages, oversized blocks may split mid-block.
- Prefer extension slots over hard-wiring new product features into core components. If feature adds nodes, toolbar UI, side panels, context, or imperative APIs, first look at `Lex4Extension`.
- Keep document mutations in reducer/context layer (`src/context/*`). Reflow, copy-to-all, clear, and similar external edits must keep sync versions correct so page editors remount with fresh serialized state.
- Public package surface goes through `packages/editor/src/index.ts`. Demo imports `@yurikilian/lex4` directly, so exported API changes must be wired through index barrel rather than consumed from deep internal paths.
- Library styling is scoped under `.lex4-editor` in `packages/editor/src/styles.css`. Demo uses Tailwind/shadcn, but shared editor code uses stable `.lex4-*` selectors and CSS custom properties so consumers can theme without relying on demo utilities.
- User-facing strings are centralized in `packages/editor/src/i18n/defaults.ts` and `pt-BR.ts`. New UI copy should flow through translation types/providers, not ad-hoc inline strings.
- Root `pnpm test` only runs editor-package Vitest suite. Memory package tests must be run with `pnpm --filter @lex4/memory ...`.
- Project memory is intentional repository artifact, not cache. `packages/memory/lex4-memory.db` stays committed, `.gitignore` explicitly avoids excluding DB files, and CLI entrypoint is `pnpm --filter @lex4/memory memory ...`.
