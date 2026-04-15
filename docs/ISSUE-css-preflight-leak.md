# Issue: `style.css` bundles full Tailwind v3 preflight — breaks host apps

## Problem

The distributed `dist/style.css` (1458 lines) includes the **entire Tailwind CSS v3.4.19 preflight and utility classes** (lines 1–1350) alongside the actual lex4 component styles (lines 1351–1458).

When a consumer app imports `@yurikilian/lex4/style.css`, the bundled Tailwind preflight resets global `html`, `body`, `*`, `::before`, `::after` rules. This **overrides the host app's own Tailwind styles**, causing:

- Sidebar/layout components to collapse or disappear
- Font families, line-heights, and border colors to change globally
- Incompatibility with Tailwind v4 apps (lex4 ships v3 preflight)

## Reproduction

```tsx
// In any Tailwind v4 app
import "@yurikilian/lex4/style.css"; // ← breaks the entire app's styles
```

## Root Cause

The Vite/Tailwind build for the library is not configured to exclude preflight and utility classes from the output CSS. The build emits a single `style.css` that mixes:

1. **Tailwind v3 preflight** (`*, ::before, ::after`, `html, :host`, `body`, etc.)
2. **Tailwind v3 utility classes** (`.absolute`, `.relative`, `.flex`, `.rounded-md`, etc.)
3. **Lex4 component styles** (`.lex4-editor`, `.lex4-page`, selection highlighting, etc.)

Only group 3 should be in the distributed CSS.

## Suggested Fix

### Option A: Disable preflight in the library build

In `tailwind.config.js` (or equivalent):

```js
module.exports = {
  corePlugins: {
    preflight: false,
  },
  // ...
};
```

This removes the global resets from the output. The host app is expected to have its own Tailwind preflight.

### Option B: Scope all styles under `.lex4-editor`

Use Tailwind's `important` selector or PostCSS plugin to scope all generated utilities under `.lex4-editor`, so they never leak globally.

### Option C: Ship two CSS files

- `style.css` — full (for standalone/demo usage)
- `style-components-only.css` — only the lex4-specific rules (for integration into existing Tailwind apps)

## Current Workaround (officera-web)

The consumer app copies only the `.lex4-*` rules into a local `lex4-editor.css` file and imports that instead:

```tsx
// Instead of: import "@yurikilian/lex4/style.css";
import "./lex4-editor.css";
```

This is fragile because the local copy won't update when lex4 is upgraded.

## Resolution

Fixed via **Option A** — preflight disabled in the library build:

1. Added `corePlugins: { preflight: false }` to `packages/editor/tailwind.config.ts`
2. Removed the external `@import url('https://rsms.me/inter/inter.css')` from `packages/editor/src/styles.css`

`@tailwind base;` is kept so that `--tw-*` CSS custom properties (needed by
utilities like ring, shadow, translate) are still emitted. With preflight
disabled, the base layer no longer outputs global element resets.

`dist/style.css` dropped from 1 458 → 859 lines. Consumer apps can now import
`@yurikilian/lex4/style.css` without their own styles being overridden.
