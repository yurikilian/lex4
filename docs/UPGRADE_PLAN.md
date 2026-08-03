# Dependency Upgrade Plan

Objective: upgrade **all** dependencies of the `lex4` pnpm monorepo to current
versions while keeping lint, build, unit tests and E2E tests green, delivered
through a single continuous pull request.

Toolchain used for this effort: Node `v25.9.0`, pnpm `11.20.0`.

---

## 1. Baseline (before any change)

Run on the unchanged `main` tree, branch `chore/dependency-upgrade`.

| Check                              | Result | Notes |
| ---------------------------------- | ------ | ----- |
| `pnpm install`                     | ❌ FAIL | pnpm 11 aborts with `ERR_PNPM_IGNORED_BUILDS`. `pnpm-workspace.yaml` contained an unfilled `allowBuilds:` template (`set this to true or false`) next to the legacy `onlyBuiltDependencies` list. |
| `pnpm lint` (`tsc --noEmit`)       | ✅ PASS | Only `packages/editor` defines a `lint` script. |
| `pnpm build` (editor lib)          | ✅ PASS | Emits `dist/lex4-editor.js`, `dist/lex4-editor.cjs`, `dist/index.d.ts`, `dist/style.css`. |
| `pnpm test` (editor, vitest)       | ❌ FAIL | 32 failed / 209 passed of 241 in 29 files. |
| `pnpm --filter demo build`         | ✅ PASS | |
| `pnpm --filter @lex4/memory test`  | ✅ PASS | 13/13. |
| `pnpm test:e2e` (playwright)       | ✅ PASS | **144 passed** across 21 spec files. |

### Baseline blockers fixed in Wave 0

Both are environment/toolchain blockers, not behaviour changes. Without them no
gate can be executed at all on the current toolchain.

1. **`pnpm-workspace.yaml`** — replaced the unfilled `allowBuilds` template and
   the legacy `onlyBuiltDependencies` list with an explicit
   `allowBuilds: { better-sqlite3: true, esbuild: true, msw: true }`.
2. **`packages/editor/src/__tests__/setup.ts`** — Node >= 24 ships a built-in
   Web Storage global. Because it is an own property of `globalThis`, the jsdom
   vitest environment does not override it, and the built-in implementation is
   inert unless Node is started with `--localstorage-file`. Every test touching
   `src/utils/debug.ts` therefore failed with
   `TypeError: localStorage.getItem is not a function`. Verified environmental:
   `NODE_OPTIONS=--no-experimental-webstorage vitest run` made the same tests
   pass unchanged. Fixed with a small in-memory `Storage` fallback installed in
   the vitest setup file, applied only when the global storage is unusable.

After these two fixes the baseline is fully green: **241/241 unit**, **13/13
memory**, **144/144 E2E**.

---

## 2. Version table (current → target)

### Root (`lex4-workspace`, private)

| Item | Current | Target | Wave |
| --- | --- | --- | --- |
| `engines.node` | `>=18` | `>=22` | 5 |
| `engines.pnpm` | `>=9` | `>=11` | 5 |

### `packages/editor` — `@yurikilian/lex4` (published library)

| Dependency | Kind | Current | Target | Wave |
| --- | --- | --- | --- | --- |
| `react` / `react-dom` | peer | `^18.0.0 \|\| ^19.0.0` | unchanged (must keep 18 support) | — |
| `lexical` | dep | `^0.22.0` | `^0.49.0` | 3 |
| `@lexical/clipboard` | dep | `^0.22.0` | `^0.49.0` | 3 |
| `@lexical/history` | dep | `^0.22.0` | `^0.49.0` | 3 |
| `@lexical/html` | dep | `^0.22.0` | `^0.49.0` | 3 |
| `@lexical/list` | dep | `^0.22.0` | `^0.49.0` | 3 |
| `@lexical/react` | dep | `^0.22.0` | `^0.49.0` | 3 |
| `@lexical/rich-text` | dep | `^0.22.0` | `^0.49.0` | 3 |
| `@lexical/selection` | dep | `^0.22.0` | `^0.49.0` | 3 |
| `@lexical/utils` | dep | `^0.22.0` | `^0.49.0` | 3 |
| `lucide-react` | dep | `^1.8.0` | `^1.28.0` | 1 |
| `zustand` | dep | `^5.0.13` | `^5.0.14` | 1 |
| `@testing-library/jest-dom` | dev | `^6.0.0` | `^7.0.0` | 4 |
| `@testing-library/react` | dev | `^16.0.0` | `^16.3.2` | 1 |
| `@types/react` | dev | `^18.3.0` | `^19.2.0` | 2 |
| `@types/react-dom` | dev | `^18.3.0` | `^19.2.0` | 2 |
| `@vitejs/plugin-react` | dev | `^4.3.0` | `^5.2.0` (Wave 2) → `^6.0.0` (Wave 4, needs vite 8) | 2/4 |
| `autoprefixer` | dev | `^10.4.0` | `^10.5.0` | 1 |
| `jsdom` | dev | `^25.0.0` | `^30.0.0` | 4 |
| `postcss` | dev | `^8.4.0` | `^8.5.0` | 1 |
| `react` / `react-dom` | dev | `^18.3.0` | `^19.2.0` | 2 |
| `tailwindcss` | dev | `^3.4.0` | see decision below | 4 |
| `typescript` | dev | `^5.5.0` | TS 7 or latest 5.9 (see Wave 5) | 5 |
| `vite` | dev | `^5.4.0` | `^8.0.0` | 4 |
| `vite-plugin-dts` | dev | `^4.0.0` | `^5.0.0` | 4 |
| `vitest` | dev | `^2.0.0` | `^4.0.0` | 4 |

### `packages/memory` — `@lex4/memory`

| Dependency | Kind | Current | Target | Wave |
| --- | --- | --- | --- | --- |
| `better-sqlite3` | dep | `^11.0.0` | `^13.0.0` | 4 |
| `@types/better-sqlite3` | dev | `^7.6.0` | `^9.6.0` | 4 |
| `tsx` | dev | `^4.0.0` | `^4.23.0` | 1 |
| `typescript` | dev | `^5.5.0` | TS 7 or latest 5.9 | 5 |
| `vitest` | dev | `^2.0.0` | `^4.0.0` | 4 |

### `demo` (private)

| Dependency | Kind | Current | Target | Wave |
| --- | --- | --- | --- | --- |
| `@fontsource-variable/geist` | dep | `^5.2.8` | `^5.3.0` | 1 |
| `lexical` + 8 `@lexical/*` | dep | `^0.22.0` | `^0.49.0` (identical to editor) | 3 |
| `@radix-ui/react-separator` | dep | `^1.1.8` | `^1.1.15` | 1 |
| `@radix-ui/react-slot` | dep | `^1.2.4` | `^1.3.0` | 1 |
| `@radix-ui/react-tooltip` | dep | `^1.2.8` | `^1.2.16` | 1 |
| `@yurikilian/lex4` | dep | `workspace:*` | unchanged | — |
| `class-variance-authority` | dep | `^0.7.1` | `^0.7.1` (already latest) | 1 |
| `clsx` | dep | `^2.1.1` | `^2.1.1` (already latest) | 1 |
| `lucide-react` | dep | `^1.8.0` | `^1.28.0` | 1 |
| `react` / `react-dom` | dep | `^18.3.0` | `^19.2.0` | 2 |
| `shadcn` | dep | `^4.3.0` | `^4.16.0` | 1 |
| `tailwind-merge` | dep | `^3.5.0` | `^3.6.0` | 1 |
| `tw-animate-css` | dep | `^1.4.0` | `^1.4.0` (already latest) | 1 |
| `@tailwindcss/vite` | dev | `^4.2.2` | `^4.3.0` | 1 |
| `tailwindcss` | dev | `^4.2.2` | `^4.3.0` | 1 |
| `@types/react` / `@types/react-dom` | dev | `^18.3.0` | `^19.2.0` | 2 |
| `@vitejs/plugin-react` | dev | `^4.3.0` | `^5.2.0` (Wave 2) → `^6.0.0` (Wave 4) | 2/4 |
| `typescript` | dev | `^5.5.0` | TS 7 or latest 5.9 | 5 |
| `vite` | dev | `^5.4.0` | `^8.0.0` | 4 |

### `e2e` (private)

| Dependency | Kind | Current | Target | Wave |
| --- | --- | --- | --- | --- |
| `@playwright/test` | dev | `^1.45.0` | `^1.62.0` | 1 |

### CI (`.github/workflows`)

| Item | Current | Target | Wave |
| --- | --- | --- | --- |
| `pnpm/action-setup` | v9 | v11 | 5 |
| `actions/setup-node` `node-version` | 20 | 22 | 5 |
| other pinned actions | various | refreshed | 5 |

---

## 3. Wave breakdown

- **Wave 0 — Baseline & plan.** Install pnpm 11, branch, run gate on unchanged
  code, record results, unblock the gate, write this document.
- **Wave 1 — Minor/patch upgrades + lockfile refresh.** Everything that is not a
  major bump. Create the draft PR.
- **Wave 2 — React 18 → 19.** `react`, `react-dom`, `@types/react`,
  `@types/react-dom`, `@vitejs/plugin-react` 6. Editor peer range must keep
  accepting React 18.
- **Wave 3 — Lexical 0.22 → 0.49.** All nine packages, identical version in
  editor and demo, API migrations in `packages/editor/src` and `demo/src`.
- **Wave 4 — Build/test toolchain majors.** vite 8, vitest 4, jsdom 30,
  `@testing-library/jest-dom` 7, `vite-plugin-dts` 5, better-sqlite3 13, plus the
  editor tailwindcss decision.
- **Wave 5 — TypeScript + CI + final integration.** TypeScript 7 (or 5.9
  fallback), CI workflow refresh, clean-install verification, final report.

---

## 4. Risk notes

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Published library contract (`exports`, `main`, `module`, `types`, `files`, dist file names) | High — breaks consumers | Never change `package.json` metadata; verify `dist/` contents explicitly after the Wave 4 build. |
| Peer range narrowing to React 19 | High — drops React 18 consumers | Peer stays `^18.0.0 \|\| ^19.0.0`; React 19 is only a dev/demo dependency. |
| React 19 typing changes (`JSX` namespace, ref-as-prop, `ReactNode`) | Medium | Modernise only the code required to compile; no `any` escape hatches. |
| Lexical 0.22 → 0.49 (27 minor releases of a pre-1.0 library) | High | Study changelogs for the APIs actually used; rely on the 241 unit tests and 144 E2E assertions as the regression net. |
| Lexical version skew between editor and demo | High — duplicate `lexical` instances break the editor at runtime | Pin the same range in both packages and assert a single resolved version in `pnpm-lock.yaml`. |
| Vite 5 → 8 config option removals | Medium | Migrate `vite.config.ts` / `vitest.config.ts`; re-verify the library build output shape. |
| Vitest 2 → 4 API changes | Medium | Full unit suite is the check. |
| better-sqlite3 11 → 13 native rebuild | Medium | `allowBuilds` already permits the build; memory tests exercise real SQLite. |
| TypeScript 7 (native port) maturity | Medium | Fall back to latest stable 5.9 and document the exact blocker if the toolchain is incompatible. |
| Editor `tailwindcss` v3 → v4 | Low | `postcss.config.js` only loads autoprefixer, so tailwind is very likely unused in the editor build — verify, then migrate or remove. |
| Node 25 local vs Node 22 CI | Low | Baseline blocker #2 above; CI node version aligned in Wave 5. |

---

## 4b. Wave decisions & deviations

### Wave 2 — React 18 → 19

Landed: `react` / `react-dom` `19.2.8`, `@types/react` `19.2.18`,
`@types/react-dom` `19.2.4` in `packages/editor` (dev) and `demo`.
`packages/editor` `peerDependencies` left at `^18.0.0 || ^19.0.0`.

**Deviation — `@vitejs/plugin-react` pinned to `^5.2.0` instead of `^6.0.0`.**
`@vitejs/plugin-react@6` dropped support for Vite < 8; with the current
Vite 5 it fails at config load time:

```
failed to load config from packages/editor/vite.config.ts
Error [ERR_PACKAGE_PATH_NOT_EXPORTED]: Package subpath './internal' is not
defined by "exports" in .../vite/package.json imported from
.../@vitejs/plugin-react/dist/index.js
```

`@vitejs/plugin-react@5.2.0` declares `vite: ^4.2.0 || ^5 || ^6 || ^7 || ^8`,
so it is compatible with both the current Vite 5 and the Wave 4 target Vite 8.
Wave 2 therefore lands the 4 → 5 major, and the 5 → 6 major moves to Wave 4
where Vite 8 arrives. No peer-dependency warnings remain
(`pnpm peers check` → clean).

**Code migration required (1 file).** React 19 types removed the implicit
global `JSX` namespace. `packages/editor/src/variables/variable-node.tsx`
references `JSX.Element` three times (the `DecoratorNode<JSX.Element>` type
argument, `decorate()` and the decorator component return type); it now imports
`type JSX` from `react`. No other migration was needed: there are no
`defaultProps`/`propTypes` on function components, no argument-less `useRef()`
calls, and the two `forwardRef` usages in the editor plus two in the demo remain
valid in React 19 (deprecated, not removed) so they were left untouched to keep
the wave minimal and revertible.

No tests were modified.

## 5. Rollback strategy

- All work lives on `chore/dependency-upgrade`; `main` is never touched and the
  PR is never merged by this effort.
- Every wave is exactly one commit with a conventional-commit message, so any
  wave can be reverted independently with `git revert <sha>` or the branch can be
  reset to the previous wave's SHA.
- `pnpm-lock.yaml` is regenerated per wave and committed with that wave, so a
  revert restores a coherent dependency graph.
- Fastest full rollback: `git checkout main` (nothing was published, the library
  version stays at `1.11.0`).

---

## 6. Status

| Wave | Status | Commit | Gate |
| --- | --- | --- | --- |
| 0 — Baseline & plan | ✅ done | see PR | lint ✅ / build ✅ / unit 241 ✅ / demo ✅ / memory 13 ✅ / e2e 144 ✅ |
| 1 — Minor & patch | ✅ done | `a6f6339` | lint ✅ / build ✅ / unit 241 ✅ / memory 13 ✅ / demo ✅ / e2e 144 ✅ |
| 2 — React 19 | ✅ done | `d6f5e26` | lint ✅ / build ✅ / unit 241/241 ✅ / memory 13/13 ✅ / demo ✅ / e2e 144/144 ✅ |
| 3 — Lexical 0.49 | ⏳ pending | | |
| 4 — Toolchain majors | ⏳ pending | | |
| 5 — TypeScript & CI | ⏳ pending | | |
