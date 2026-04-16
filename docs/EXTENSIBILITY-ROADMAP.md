# Lex4 Extensibility & Theming Roadmap

This document proposes improvements to make Lex4 easier to customize visually and more extensible for host applications.

---

## Current State

Every UI component (Toolbar, HistorySidebar, EditorSidebar, HeaderFooterActions, VariablePanel, VariablePicker) uses **hardcoded inline Tailwind classes**. There are:

- **Zero CSS custom properties** (`--lex4-*`)
- **No theming layer** — colors are baked into class strings (`bg-blue-50`, `text-gray-600`, `rgb(191 219 254)`)
- **Minimal style props** — only `Lex4Editor.className` exists
- **Fixed dimensions** — sidebar width locked at `w-[320px]`

The extension system allows contributing toolbar items, side panels, and Lexical theme overrides — but **cannot customize the built-in UI appearance**.

This forces consumers to either:
1. Use `@source` to generate lex4's Tailwind classes (which inherits the host's `@theme` overrides and can cause unintended size/color changes)
2. Import `@yurikilian/lex4/style.css` directly (which brings Tailwind v3 utilities that may conflict with the host's Tailwind v4)
3. Write brittle CSS overrides using internal selectors and `!important`

---

## Proposal 1: CSS Custom Properties for Theming

Replace hardcoded colors/dimensions with CSS custom properties. Consumers override them from the outside without touching internals.

### Design Tokens

```css
.lex4-editor {
  /* Brand / accent */
  --lex4-color-primary: #3b82f6;         /* blue-500 */
  --lex4-color-primary-light: #eff6ff;   /* blue-50 */
  --lex4-color-primary-text: #1d4ed8;    /* blue-700 */

  /* Surfaces */
  --lex4-color-bg: #ffffff;
  --lex4-color-bg-muted: #f9fafb;        /* gray-50 */
  --lex4-color-bg-canvas: #e5e7eb;       /* gray-200 — document area background */

  /* Borders */
  --lex4-color-border: #e5e7eb;          /* gray-200 */
  --lex4-color-border-light: #f3f4f6;    /* gray-100 */

  /* Text */
  --lex4-color-text: #111827;            /* gray-900 */
  --lex4-color-text-secondary: #6b7280;  /* gray-500 */
  --lex4-color-text-muted: #9ca3af;      /* gray-400 */
  --lex4-color-text-disabled: #d1d5db;   /* gray-300 */

  /* Hover / interaction */
  --lex4-color-hover: #f3f4f6;           /* gray-100 */
  --lex4-color-hover-text: #111827;      /* gray-900 */

  /* Selection (global Ctrl+A) */
  --lex4-color-selection-bg: rgb(191 219 254);
  --lex4-color-selection-text: rgb(30 64 175);

  /* Dimensions */
  --lex4-sidebar-width: 320px;
  --lex4-toolbar-height: auto;

  /* Document font */
  --lex4-font-family: 'Calibri', 'Carlito', sans-serif;

  /* Toolbar icon button */
  --lex4-toolbar-btn-size: 1.75rem;      /* h-7 w-7 */
  --lex4-toolbar-btn-radius: 0.25rem;    /* rounded */

  /* Dropdown menu */
  --lex4-menu-width: 14rem;              /* w-56 */
  --lex4-menu-radius: 0.5rem;            /* rounded-lg */
  --lex4-menu-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}
```

### Migration Pattern

**Before** (hardcoded):
```tsx
className="flex h-7 w-7 items-center justify-center rounded text-gray-600 hover:bg-gray-100"
```

**After** (CSS-variable-aware):
```tsx
className="lex4-toolbar-btn"
```
```css
.lex4-toolbar-btn {
  display: flex;
  height: var(--lex4-toolbar-btn-size);
  width: var(--lex4-toolbar-btn-size);
  align-items: center;
  justify-content: center;
  border-radius: var(--lex4-toolbar-btn-radius);
  color: var(--lex4-color-text-secondary);
  transition: color 150ms, background-color 150ms;
}
.lex4-toolbar-btn:hover {
  background-color: var(--lex4-color-hover);
  color: var(--lex4-color-hover-text);
}
.lex4-toolbar-btn[aria-pressed="true"],
.lex4-toolbar-btn.active {
  background-color: var(--lex4-color-primary-light);
  color: var(--lex4-color-primary-text);
}
.lex4-toolbar-btn:disabled {
  cursor: not-allowed;
  color: var(--lex4-color-text-disabled);
}
```

### Consumer Usage

```css
/* Override in host app — no !important, no internal selectors */
.lex4-editor {
  --lex4-color-primary: #10b981;           /* emerald instead of blue */
  --lex4-color-primary-light: #ecfdf5;
  --lex4-color-primary-text: #047857;
  --lex4-color-bg-canvas: #f8fafc;         /* lighter canvas */
  --lex4-sidebar-width: 280px;             /* narrower sidebar */
  --lex4-font-family: 'Times New Roman', serif;
}
```

---

## Proposal 2: Named CSS Classes for All UI Regions

Replace anonymous Tailwind-only divs with stable, named CSS classes that consumers can target.

### Class Naming Convention

| Region | Class | Current |
|--------|-------|---------|
| Root | `.lex4-editor` | ✅ Already exists |
| Toolbar container | `.lex4-toolbar` | ✅ Already exists |
| Toolbar button | `.lex4-toolbar-btn` | ❌ Uses inline Tailwind |
| Toolbar select | `.lex4-toolbar-select` | ❌ Uses inline Tailwind |
| Toolbar separator | `.lex4-toolbar-separator` | ❌ Uses inline Tailwind |
| Header/footer row | `.lex4-hf-row` | ❌ Uses inline Tailwind |
| Settings dropdown | `.lex4-settings-menu` | ❌ `data-testid` only |
| Settings menu item | `.lex4-settings-item` | ❌ Uses inline Tailwind |
| Settings section label | `.lex4-settings-label` | ❌ Uses inline Tailwind |
| Sidebar container | `.lex4-sidebar` | ❌ Uses inline Tailwind |
| Sidebar header | `.lex4-sidebar-header` | ❌ Uses inline Tailwind |
| History entry | `.lex4-history-entry` | ❌ Uses inline Tailwind |
| History entry (active) | `.lex4-history-entry.active` | ❌ Conditional Tailwind |
| Variable badge | `.lex4-variable-badge` | ❌ Uses inline Tailwind |
| Document canvas | `.lex4-canvas` | ❌ Uses inline Tailwind |
| Page | `.lex4-page` | ✅ Already exists |

These classes become the **public styling API** — they can be documented as stable selectors that consumers can override.

---

## Proposal 3: `onSave` Should Include the Document

The current `onSave` callback returns `{ ast, json }` but not the `Lex4Document`. Every consumer has to track it separately:

```tsx
// Current workaround consumers must write
const documentRef = useRef<Lex4Document>(initialDocument);
const handleDocumentChange = useCallback((doc) => { documentRef.current = doc; }, []);
const handleSave = useCallback((payload) => {
  submit({ content: documentRef.current, ast: payload.ast });
}, []);
```

### Proposed Change

```tsx
onSave?: (payload: {
  document: Lex4Document;  // ← Add this
  ast: DocumentAst;
  json: string;
}) => void;
```

This eliminates the `documentRef` + `onDocumentChange` boilerplate for the common "save everything" use case.

---

## Proposal 4: Stable Extensions Reference

The editor **reinitializes from scratch** when the `extensions` array reference changes. Every parent re-render that creates a new array wipes the editor content. Consumers must always `useMemo`:

```tsx
// Required workaround — forgetting this causes silent data loss
const extensions = useMemo(() => [astExtension(), variablesExtension(vars)], []);
```

### Options

**Option A — Internal memoization by extension name:**

```tsx
// Inside Lex4Editor: only re-resolve if the set of extension names changed
const resolvedRef = useRef<ResolvedExtensions>();
const prevNamesRef = useRef<string[]>([]);

const currentNames = extensions.map(e => e.name);
if (!arraysEqual(currentNames, prevNamesRef.current)) {
  resolvedRef.current = resolveExtensions(extensions);
  prevNamesRef.current = currentNames;
}
```

**Option B — Export a `useExtensions` hook:**

```tsx
import { useEditorExtensions } from '@yurikilian/lex4';

const extensions = useEditorExtensions([
  astExtension(),
  variablesExtension(ALL_VARS),
], [ALL_VARS]); // deps array, like useMemo
```

**Option C — Accept extension factories instead of instances:**

```tsx
<Lex4Editor extensionFactories={[astExtension, () => variablesExtension(vars)]} />
```

**Recommendation**: Option A is the safest — it's a non-breaking internal optimization that prevents the footgun without changing the API.

---

## Proposal 5: Typed Imperative Handle

The current handle is fully untyped:

```tsx
export interface Lex4EditorHandle {
  [key: string]: (...args: any[]) => any;  // No autocomplete, no safety
}
```

### Proposed Change — Module Augmentation

```tsx
// Core handle (always available)
export interface Lex4EditorHandle {}

// astExtension augments the handle type
declare module '@yurikilian/lex4' {
  interface Lex4EditorHandle {
    getDocumentAst: () => DocumentAst;
    getDocumentJson: () => string;
    buildSavePayload: (options?: PayloadOptions) => SaveDocumentRequest;
  }
}

// variablesExtension augments it further
declare module '@yurikilian/lex4' {
  interface Lex4EditorHandle {
    insertVariable: (key: string) => void;
    refreshVariables: () => void;
  }
}
```

This gives consumers full autocomplete and type safety on `editorRef.current.getDocumentAst()` without casting.

---

## Proposal 6: Tailwind v3 → v4 or CSS-Only Build

The library currently bundles Tailwind **v3.4** output. Host apps using Tailwind v4 face two bad choices:

1. **Import `style.css`** — brings v3 utility classes that may conflict with v4 values (different `text-xs`, `shadow-lg`, etc.)
2. **Use `@source`** — generates utilities with the host's `@theme` overrides, which may distort lex4's intended sizing (e.g., host `--text-xs: 0.625rem` vs lex4's expected `0.75rem`)

### Recommendation

Migrate the compiled output from Tailwind utility classes to **plain CSS with custom properties** (Proposal 1). This:

- Eliminates version conflicts entirely
- Reduces the CSS bundle (no Tailwind preflight/utilities)
- Makes `style.css` safe to import alongside any CSS framework
- Lets consumers use `@source` for just the host Tailwind classes used in extensions

The Tailwind utilities can still be used **during development** via a dev-only Tailwind setup, but the production build should compile down to namespaced CSS classes (`.lex4-toolbar-btn`, `.lex4-sidebar`, etc.) that reference CSS custom properties.

---

## Proposal 7: Extension UI Styling

Currently, extensions can contribute `themeOverrides` — but these only affect **Lexical document content** (heading classes, list classes, etc.), not the editor's UI shell.

### Proposed Addition to `Lex4Extension`

```tsx
export interface Lex4Extension {
  // ... existing fields ...

  /**
   * CSS custom property overrides applied when this extension is active.
   * Scoped to the editor root via inline style.
   */
  cssVariables?: Record<string, string>;

  /**
   * Additional CSS class(es) applied to the editor root when this extension is active.
   */
  rootClassName?: string;
}
```

This lets extensions contribute visual identity (e.g., a "dark mode extension" or a "compact toolbar extension") without touching the host's CSS.

---

## Implementation Priority

| # | Proposal | Impact | Effort | Breaking? |
|---|----------|--------|--------|-----------|
| 1 | CSS Custom Properties | High | Medium | No — additive, defaults match current look |
| 2 | Named CSS Classes | High | Low | No — adds classes alongside existing Tailwind |
| 3 | `onSave` includes document | Medium | Low | No — adds field to existing payload |
| 4 | Stable extensions reference | High | Low | No — internal optimization |
| 5 | Typed imperative handle | Medium | Low | No — module augmentation is additive |
| 6 | CSS-only build output | High | High | Yes — style.css structure changes |
| 7 | Extension UI styling | Low | Low | No — optional new fields |

### Suggested Phases

**Phase 1 (non-breaking, immediate value):**
- Proposal 4 — Stable extensions (prevents data loss)
- Proposal 3 — `onSave` includes document
- Proposal 2 — Named CSS classes (additive, no removal of Tailwind)

**Phase 2 (theming foundation):**
- Proposal 1 — CSS custom properties (use alongside Tailwind initially)
- Proposal 5 — Typed handle

**Phase 3 (clean architecture):**
- Proposal 6 — CSS-only build (breaking, major version)
- Proposal 7 — Extension UI styling
