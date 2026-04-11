You are a **senior frontend editor architect** specialized in **React, Meta Lexical, pagination engines, document layout, Microsoft Word-like UX, reusable component architecture, robust testing, Git hygiene, clean-code maintainability, and project traceability**.

Your task is to **design and implement a Microsoft Word-like editor clone as a reusable library/component** using **TypeScript + React + Vite + Meta Lexical**, with **strict real page layout behavior**, **static A4 pages only**, **predictable pagination**, **optional editable headers and footers**, **zero overlap between regions**, and **persistent project memory stored in a raw SQLite binary file committed into the repository** for future development continuity.

Do **not** produce a fake “infinite canvas” editor.
Do **not** simulate pages visually while keeping content in one long flow.
Do **not** allow dynamic page height.
This editor must behave like a real paginated document editor.

---

## Core mission

Build a paginated document editor library/component where:

- Every page is **always A4**
- Page size is **static and immutable**
- When content grows, **new A4 pages are created automatically**
- Headers and footers are **globally toggleable**
- If headers/footers are disabled, the document behaves like a normal free text paginated editor with full usable body area
- If headers/footers are enabled, they become editable regions and reduce the usable body area accordingly
- Header/footer can be copied to all pages
- Header/footer can be cleared per page or globally
- Header/footer must **never overlap** the main body content
- Body content must always reflow correctly across pages
- Large pasted content must paginate correctly
- Lists, formatting, and styles must behave coherently
- UX must feel stable, polished, and predictable
- Comprehensive **unit tests** and **Playwright tests** must cover all critical flows and prevent regressions
- The deliverable must be a **reusable React component/library**, easy to plug into other React projects
- The project must keep a **persistent development memory** in a **raw SQLite binary database file** committed into the repository for future developers
- The codebase must be **beautiful, readable, cleanly modular, and easy for a human developer to maintain without AI**

---

## Required stack

Use exactly:

- **TypeScript**
- **React**
- **Vite**
- **Meta Lexical**

Do not switch away from this stack.

---

## Library / component packaging requirement

This is mandatory.

### Reusable component goal

The result must be implemented as a **React library/component**, not as a one-off app tightly coupled to a single project shell.

### Component expectations

- The editor must be easy to plug into other React projects
- The editor should expose a clean public API
- The editor should be structured so consumers can import and render it as a component
- Avoid hard-coding application-specific assumptions
- Keep external dependencies minimal and justified
- Separate public API from internal pagination and layout internals
- Support controlled and/or well-documented initialization patterns where appropriate
- Include clear props/interfaces for configuration
- Keep styling and theming reasonably isolated
- The component should be portable across React projects with minimal adaptation

### Packaging expectations

- Organize the project like a reusable library
- Expose a main entry point
- Export public types
- Keep internal modules private unless intentionally public
- Include a minimal demo/example app only as a development harness, not as the core architecture
- Use Vite in a way compatible with library-oriented development

---

## Required editor technology

Use **Meta Lexical**, not ProseMirror.

### Hard requirements

- The editor foundation must be **React + Lexical**
- Use Lexical editor state, commands, nodes, and plugins as the core editing model
- Do not switch to ProseMirror, Slate, Draft.js, Quill, TipTap, or contenteditable-only custom editing
- Do not propose a hybrid where Lexical is only used superficially while another engine controls the real editor state
- The solution must be genuinely built around Lexical

### Architectural expectation with Lexical

Use Lexical for:

- body editing
- formatting commands
- selection handling
- list behavior
- keyboard behavior
- paste handling integration
- editor state serialization/deserialization

If needed, build a **custom pagination layer on top of Lexical**, but the editing engine itself must remain Lexical.

---

## Project memory requirement

This is mandatory.

### Persistent memory

The project must include a **raw SQLite binary database file** used as an internal memory/logbook for ongoing development.

### What must be stored

Persist at least:

- every major plan
- every implementation step
- every prompt used to drive the agent or development workflow
- decisions and rationale
- architecture changes
- migration notes
- major bug findings
- bug fix summaries
- test additions
- known limitations
- future tasks / follow-up backlog items

### Storage expectations

- Use **SQLite**
- The SQLite database must be the **raw binary `.sqlite` / `.db` file**
- The raw SQLite binary file must be part of the repository
- The raw SQLite binary file must **not be gitignored**
- It must be intentionally committed so future developers can inspect prior context
- Do not replace this with JSON, markdown logs, or some abstract memory service
- The schema must be clear and extensible
- Include a small access layer or utility module for writing and reading memory entries
- Include timestamps for entries
- Include entry types or categories
- Include optional metadata fields such as tags, component area, status, and related files

### Suggested schema

At minimum, include a table structure similar to:

- `id`
- `created_at`
- `updated_at`
- `entry_type`
  examples: `prompt`, `plan`, `step`, `decision`, `bug`, `fix`, `test`, `note`, `backlog`
- `title`
- `content`
- `tags`
- `status`
- `related_files`

You may normalize further if useful, but keep it simple and maintainable.

### Required behavior

- Every substantial development milestone must create a memory entry
- Every prompt or instruction used to generate implementation work must be saved
- Every major change in pagination logic, header/footer behavior, toggle logic, Lexical integration, packaging, or tests must be recorded
- The project should include utilities or scripts to inspect this memory easily
- Include at least one documented example of how memory entries are written during development
- Include brief documentation describing why this database exists and how it supports future development
- The deliverable should clearly state where the binary SQLite file lives in the repo

### Important rule

Do not treat this SQLite file as disposable local cache.
It is a **project artifact** and part of the long-term development history.
The user specifically wants the **raw SQLite binary file stored in the repository as-is** for future developers.

---

## Git hygiene requirement

This is mandatory.

### Commit message hook

Apply this hook in the repository exactly as provided:

```sh
#!/bin/sh
# Remove Co-authored-by Copilot trailers from commit messages
sed -i '' '/^Co-authored-by: Copilot/d' "$1"
```

### Requirements

- Configure the repository so this hook is included and documented
- Ensure the hook is placed in the correct Git hooks workflow for commit message cleanup
- Treat this as part of the project setup
- Document where the hook lives and how contributors should enable or install it
- Do not omit this step
- Keep the script content exactly as provided unless a platform-specific compatibility note is necessary
- If cross-platform support is added, preserve the original behavior and keep the provided script as the primary reference

---

## Code quality and maintainability requirement

This is mandatory.

The developer maintaining this project is a **clean code evangelist**.
They **hate god files**, bloated modules, hidden coupling, and unreadable abstractions.
They value **beautiful code**, **clear names**, **small focused modules**, and a structure that remains maintainable even if AI assistance disappears in the future.

### Mandatory coding style expectations

- Favor **small, focused files** over large multi-responsibility files
- Avoid god files, god classes, giant hooks, giant utility modules, and giant components
- Split logic by responsibility and domain boundary
- Use clear and intention-revealing names
- Prefer simple, explicit code over clever but obscure abstractions
- Keep public APIs small and understandable
- Keep internal architecture discoverable and easy to navigate
- Each module should have a clear reason to exist
- Minimize temporal coupling and hidden side effects
- Avoid deeply nested code and overcomplicated control flow
- Prefer composition over monolithic designs
- Keep React components readable and focused
- Keep pagination, Lexical integration, rendering, testing helpers, and SQLite memory logic in separate modules
- Keep files easy for a human developer to understand quickly without relying on AI

### Maintainability expectations

- Assume that one day **AI may not be available**
- The codebase must still be easy for a human developer to read, debug, extend, and refactor
- Architecture and module structure must support long-term maintenance
- Include concise documentation where it reduces future maintenance cost
- Avoid magic behavior and hidden conventions
- Prefer explicit contracts, typed interfaces, and predictable module boundaries
- Add comments only where they truly clarify non-obvious decisions
- Do not use comments to excuse messy code; make the code itself readable

### Structural expectations

- Keep files short when reasonably possible
- Separate:
  - public exports
  - editor component composition
  - pagination engine
  - page measurement utilities
  - Lexical plugins
  - commands
  - toolbar actions
  - header/footer state handling
  - SQLite memory access
  - test helpers

- If a file starts becoming a “god file”, refactor it immediately into smaller modules
- Do not centralize unrelated logic into one mega-module for convenience

### Review rule

Before finalizing, review the code structure and refactor any file or module that is becoming too large, too coupled, or too hard to understand.

---

## Absolute layout rules

These are **non-negotiable invariants**.

### Page model

- Page format is **A4 only**
- A4 size must be treated as fixed:
  - **210 mm × 297 mm**

- equivalent CSS pixel size may be computed consistently for screen rendering, but the logical page size is always A4
- No custom page sizes
- No auto-resizing page height
- No half-pages
- No cropped pages
- No visually broken last pages
- Every rendered page must have exactly the same outer height and width

### Page generation

- If content does not fit in the current page, create another **full A4 page**
- New pages must preserve the same A4 dimensions
- Overflow must never create a truncated partial page
- Pasting huge text must create as many A4 pages as needed

---

## Global header and footer toggle

This is mandatory.

### Toggle behavior

- There must be a **single global toggle switch** to enable or disable headers and footers for the entire document
- This toggle is **global**, not per-page
- When the toggle is **off**:
  - headers and footers are not shown
  - headers and footers are not editable
  - no header/footer layout space is reserved
  - the body uses the full available page content area

- When the toggle is **on**:
  - headers and footers are enabled for the whole document
  - headers and footers become editable regions
  - header/footer reserved layout space must be enforced
  - body content must reflow based on the reduced body area

- Toggling on/off must trigger a full and correct repagination
- Toggling must never corrupt content
- Toggling must never create overlap
- Toggling must never create non-A4 pages
- Toggling must not lose existing header/footer content unless the user explicitly clears it

### UX for toggle

- Use a small, clear switch in the UI
- Label it clearly, for example:
  - `Headers & Footers`

- The control must feel global and document-wide
- The UX should make it obvious that enabling it affects all pages

---

## Header and footer behavior

### Editing model

- Header and footer are separate editable regions from the main content
- They are only active when the global toggle is enabled
- They may exist independently per page, but the document must also support replication actions

### Required capabilities

When headers/footers are enabled, user must be able to:

- edit header on current page
- edit footer on current page
- copy header to all pages
- copy footer to all pages
- clear current page header
- clear current page footer
- clear all headers
- clear all footers
- optionally clear both globally

### Height rules

- Header max height: **20% of page height**
- Footer max height: **20% of page height**
- For A4 height 297 mm:
  - max header height = **59.4 mm**
  - max footer height = **59.4 mm**

- If header or footer grows, body content area must shrink accordingly
- If reduced body area cannot fit content, content must flow to next page(s)
- Header/footer editing must be consistent across all affected pages after replication

### Overlap prohibition

This is critical:

- Header must **never overlap** body content
- Footer must **never overlap** body content
- Body content must **never pass through** header or footer
- Text must **never render under** the footer
- Text must **never escape outside page bounds**
- Pasting content must not break header/footer geometry

This must be enforced by the pagination/layout engine, not by visual hacks.

---

## Editor behavior requirements

### Body editing

- Main document body is editable with **Lexical**
- Body content must be laid out page by page
- When typing, deleting, pasting, undoing, formatting, or toggling headers/footers, pagination must be recalculated deterministically
- Cursor behavior must remain stable during repagination
- Selection must remain visually coherent during repagination

### Pasting

Pasting large content is a key failure area and must be handled correctly.

Required behavior:

- Pasting a large amount of text must create new pages as needed
- Pasting must preserve paragraphs
- Pasting must not collapse many paragraphs into one page incorrectly
- Pasting must not push almost all content to the next page while leaving the first page nearly empty
- Pasting must not distort header/footer
- Pasting must not create non-A4 pages
- Pasting must not create a broken last page with partial height
- Pasting must trigger a full pagination recalculation after insertion

### Paragraph flow

- Paragraphs should flow naturally across pages
- Avoid pathological behavior where:
  - page 1 keeps only one paragraph
  - remaining content is pushed unnecessarily to page 2

- Splitting logic must be intelligent:
  - keep blocks together when reasonable
  - but do not excessively underfill previous pages

- Balance correctness and good page fill
- Use deterministic block measurement and splitting rules

---

## Formatting features

Implement these editor features cleanly.

### Text formatting

- bold
- italic
- underline
- strikethrough
- text alignment:
  - left
  - center
  - right
  - justify

### Fonts

Support a curated set suitable for contracts and formal documents:

- serif
- sans-serif
- monospace
- optionally specific contract-friendly fonts such as:
  - Times New Roman
  - Arial
  - Calibri
  - Georgia
  - Courier New

### Lists

Support:

- numbered lists
- lettered lists
- hyphen/bullet lists

Requirements:

- up to **4 nesting levels**
- indentation controlled by **Tab**
- one tab step must behave like **4 spaces**
- Shift+Tab must outdent
- list numbering/lettering must remain correct after edits and repagination
- selection highlight must visibly include the list line area, not just the text glyphs
- selected list items should show a clear background selection appearance

---

## UX requirements

The result must feel like a real document editor, not a demo.

### UX goals

- stable caret
- stable selection
- no flickering during pagination
- no sudden jumping when typing
- intuitive region editing for header/footer
- clear boundaries between:
  - header
  - body
  - footer

- clear page edges
- professional A4 page appearance
- document can grow to many pages without layout corruption

### Required controls

Provide UI controls for:

- global headers/footers toggle
- edit header
- edit footer
- copy header to all pages
- copy footer to all pages
- clear current header
- clear current footer
- clear all headers
- clear all footers
- alignment controls
- formatting controls
- font family selector
- list controls
- indent/outdent controls

---

## Testing requirements

Testing is mandatory and must be layered.

### Unit tests

- Add **unit tests for every change made by the steps of the implementation plan**
- Every meaningful implementation step in the plan must include corresponding unit test coverage
- Do not leave unit testing only for the end
- Treat unit tests as part of each development milestone
- Unit tests must cover:
  - pagination helpers
  - measurement utilities
  - header/footer layout calculations
  - toggle logic
  - list indentation logic
  - formatting command behavior where practical
  - serialization/deserialization logic
  - SQLite memory utilities
  - public component API behavior where practical

### End-to-end tests

Create a **complete Playwright end-to-end test suite** to cover critical editor behavior and prevent regressions.

### Required Playwright coverage

At minimum, include tests for:

#### Page invariants

- every rendered page has fixed A4 dimensions
- no page renders with partial or dynamic height
- page count increases correctly when content grows

#### Paste behavior

- pasting large plain text creates additional pages
- pasting many paragraphs preserves paragraphs
- pasting large content does not leave page 1 almost empty without reason
- pasting content never creates overlap with header/footer
- pasting content when header/footer toggle is off works correctly
- pasting content when header/footer toggle is on works correctly

#### Header/footer toggle

- toggle off hides header/footer regions and frees body area
- toggle on shows header/footer regions on all pages
- enabling toggle repaginates correctly
- disabling toggle repaginates correctly
- toggling does not lose existing stored header/footer content
- toggling never causes overlap
- toggling never creates invalid page sizes

#### Header/footer editing

- edit header on one page
- edit footer on one page
- copy header to all pages
- copy footer to all pages
- clear current page header
- clear current page footer
- clear all headers
- clear all footers
- expanding header or footer reduces body area correctly
- content is pushed to next page when header/footer grows
- header/footer never exceed max allowed height

#### Formatting

- bold, italic, underline, strike
- align left, center, right, justify
- font family changes
- numbered list, lettered list, hyphen list
- list nesting up to 4 levels using Tab
- Shift+Tab outdents correctly

#### Selection and UX

- selection highlight appears correctly on list items
- typing near page boundary paginates correctly
- deleting content removes unnecessary extra pages when possible
- undo/redo preserves layout integrity

#### Project memory

- memory entries can be written to SQLite
- prompts and plans are persisted correctly
- expected entry categories are stored correctly
- the raw DB file exists in the repository and is not ignored
- schema initialization or migration works predictably

### Testing style expectations

- Use stable selectors and test ids
- Avoid brittle tests tied to incidental DOM structure
- Assert layout invariants where possible
- Add regression-focused tests for previously broken cases
- Cover realistic user workflows, not only isolated actions

---

## Implementation constraints

Use **TypeScript + React + Vite + Meta Lexical** as the foundation.

### Architectural expectations

The implementation must separate:

1. **Public library API**
   - reusable editor component export
   - public props and types
   - integration surface for host apps

2. **Document model**
   - body content
   - page metadata
   - global header/footer enabled flag
   - per-page header/footer state or shared header/footer templates

3. **Lexical editor integration**
   - Lexical editor state
   - custom nodes if needed
   - commands for formatting and indentation
   - plugins for toolbar, lists, history, selection, and paste normalization

4. **Layout engine**
   - measure content
   - compute available body area per page
   - paginate content into fixed A4 pages
   - enforce max header/footer height
   - reflow after edits, paste, delete, style changes, and toggle changes

5. **Rendering layer**
   - render pages
   - render header/body/footer regions
   - render selection and cursor reliably

6. **Project memory layer**
   - SQLite schema and migrations
   - memory entry writer/reader utilities
   - integration points for saving prompts, plans, steps, decisions, bugs, fixes, and tests
   - repository-safe configuration ensuring the raw DB file is versioned and not ignored

### Important rule

Do not depend on naive CSS overflow for pagination.
Do not rely only on browser natural flow.
Do not assume Lexical alone solves page breaking.

A real pagination strategy must be built on top of Lexical.

---

## Strong technical guidance

Implement with these principles:

### 1. Fixed page box model

Each page must compute:

- fixed total page height
- header height
- footer height
- body available height = page height - header height - footer height - page paddings/margins

When header/footer toggle is off:

- header height = 0
- footer height = 0
- body uses the full content area

### 2. Deterministic pagination over Lexical content

Pagination should work on block-level Lexical nodes first:

- paragraph nodes
- heading nodes
- list nodes
- list item nodes
- other supported block nodes

Process:

- measure each block
- place blocks into current page until limit reached
- when a block does not fit:
  - move it to next page
  - or split only if block type supports safe splitting

- never create a non-A4 page

### 3. Paste-safe repagination

After paste:

- normalize incoming content through Lexical paste handling
- preserve paragraph boundaries
- measure all affected blocks
- rerun pagination from affected page onward or the whole document if simpler
- ensure headers/footers remain untouched geometrically

### 4. Header/footer safety

Header/footer are layout-reserved zones.
Their size must be included before body layout begins.
Body must be paginated only inside remaining safe area.

### 5. Toggle-safe repagination

When headers/footers are enabled or disabled:

- recalculate all page layout constraints
- reflow all body content deterministically
- preserve body content and selection as much as possible
- preserve stored header/footer content while hidden when disabled

### 6. Lexical-first editing integrity

- Use Lexical commands and updates for formatting
- Use Lexical history for undo/redo
- Use Lexical selection APIs for stable selection behavior
- Avoid direct DOM mutations that bypass Lexical state
- Any pagination-related DOM measurement must synchronize safely with Lexical updates

### 7. Project memory integrity

- Save each major prompt, plan, and implementation milestone into SQLite
- Store each entry with timestamps and categories
- Make the write path explicit and maintainable
- Keep schema migrations deterministic
- Ensure the raw SQLite binary database is committed into version control
- Document how future contributors should continue using the memory log
- Do not treat the raw SQLite binary file as transient cache

### 8. Test-per-step discipline

- Every step in the implementation plan must include test work
- Add unit tests as each step is implemented
- Do not postpone all tests until the end
- Each plan milestone should state what unit tests are added for that change

### 9. Selection correctness

Selection visuals for lists and nested blocks must include their visible line box/background properly.
Avoid broken selection caused by layered page containers or clipping mistakes.

### 10. Performance

Target stable editing experience on long documents.
Use:

- memoized measurements where possible
- incremental repagination where safe
- throttled expensive layout recalculation if necessary
- but prioritize correctness over premature optimization

---

## Explicitly solve these existing failures

The implementation must directly prevent these problems:

### Failure 1

**When pasting content, pages are not created**

- Must be fixed by mandatory repagination after paste

### Failure 2

**When pasting content, pages are created but headers/footers become distorted or overlap content**

- Must be fixed by strict reserved layout zones for header/footer
- Header/footer must never share flow space with body text

### Failure 3

**New pages are created with non-static height, such as half pages with footer**

- Must be fixed by enforcing fixed A4 page boxes only
- Every page is always full A4 height

### Failure 4

**When pasting huge multi-paragraph content, page 1 gets only one paragraph and the rest jumps to page 2**

- Must be fixed by better block fitting and splitting logic
- Avoid overly conservative page-breaking behavior

### Failure 5

**Toggling headers/footers on or off corrupts page flow or overlaps content**

- Must be fixed by treating toggle changes as full layout constraint changes followed by deterministic repagination

### Failure 6

**Development context gets lost between iterations**

- Must be fixed by saving prompts, plans, steps, decisions, and important implementation notes into the committed raw SQLite memory database

### Failure 7

**The component becomes too app-specific and hard to reuse**

- Must be fixed by designing it as a pluggable React library/component with a clean public API and isolated internals

### Failure 8

**Tests are added only at the end and regressions slip in between steps**

- Must be fixed by requiring unit tests for every meaningful change made by each plan step

---

## Deliverables

Produce all of the following:

1. **Architecture explanation**
   - how the editor is structured
   - library packaging strategy
   - public component API
   - document model
   - pagination model
   - global toggle model
   - header/footer model
   - Lexical integration model
   - SQLite project memory model

2. **Implementation plan**
   - step-by-step build order
   - each step must explicitly include the unit tests that will be added in that step

3. **Production-grade TypeScript + React + Vite + Lexical code**
   - modular
   - reusable
   - clean and maintainable

4. **Reusable editor library/component**
   - easy to plug into other React projects
   - public exports and types
   - minimal coupling to host app context

5. **Pagination engine**
   - fixed A4 pages
   - safe reflow
   - paste-safe layout
   - toggle-safe layout
   - no overlap

6. **Header/footer system**
   - global enable/disable toggle
   - per-page editing
   - copy to all
   - clear current
   - clear all

7. **Formatting toolbar**
   - alignment
   - font family
   - underline/italic/strike
   - lists with 4 levels

8. **Project memory system**
   - raw SQLite binary DB file in repo
   - SQLite schema
   - migrations or initialization
   - utilities for writing and reading entries
   - sample usage
   - documentation
   - ensure DB file is not gitignored

9. **Git hook setup**
   - include the provided hook
   - document installation/usage
   - ensure commit messages remove `Co-authored-by: Copilot` trailers

10. **Unit test suite**

- aligned with every plan step
- focused coverage for utilities, commands, layout logic, and memory logic

11. **Playwright test suite**

- broad E2E coverage
- regression protection for pagination, toggle behavior, portability, and project memory behavior

12. **Maintainable clean architecture**

- no god files
- small focused modules
- readable code structure
- easy for a human developer to maintain without AI

13. **Bug prevention notes**

- explain how each major failure was prevented

---

## Acceptance criteria

The solution is only acceptable if all these are true:

- Every page is always A4
- No page ever has dynamic or partial height
- The implementation is truly based on TypeScript + React + Vite + Meta Lexical
- The deliverable is a reusable, pluggable React component/library
- The component is easy to integrate into other React projects
- Header/footer can be globally enabled or disabled
- When disabled, no header/footer space is reserved
- When enabled, header/footer space is reserved correctly
- Header/footer never overlap document content
- Large paste creates correct number of pages
- Large paste does not break headers/footers
- Large paste preserves multiple paragraphs correctly
- Content flows across pages without major underfill bugs
- Header/footer can expand up to 20% of page height each
- Expanding header/footer reduces body area correctly
- Content is pushed to following pages when needed
- Toggling headers/footers repaginates correctly
- Toggling does not corrupt content
- Toggling does not create overlap
- Lists support 4 levels with Tab/Shift+Tab
- Formatting controls work reliably
- Selection highlight is visually correct on list items
- Unit tests are added for every meaningful implementation step
- Playwright tests cover the critical flows and edge cases
- The raw SQLite memory database exists as a committed project artifact
- The raw SQLite memory database is not gitignored
- Prompts, plans, and steps are persisted for future developers
- The provided Git hook is included and documented in the repository setup
- The codebase avoids god files and is organized into small, readable, maintainable modules
- UX is stable and not glitchy

---

## Non-goals

Unless explicitly requested later, do not implement:

- comments
- track changes
- collaborative editing
- tables with advanced Word parity
- section breaks
- print preview mode separate from editor mode
- dynamic paper sizes

Focus first on:

- **correct A4 pagination**
- **layout integrity**
- **toggle correctness**
- **paste correctness**
- **Lexical-first architecture**
- **component reusability**
- **project memory continuity**
- **step-by-step test discipline**
- **clean maintainable code**
- **regression-proof testing**

---

## Output format

Return your answer in this order:

1. brief architecture summary
2. key invariants
3. implementation plan
4. full code
5. explanation of pagination logic
6. explanation of header/footer toggle logic
7. explanation of header/footer logic
8. explanation of Lexical integration strategy
9. explanation of reusable library/component strategy
10. explanation of SQLite project memory strategy
11. paste-handling strategy
12. unit test strategy and code
13. Playwright test strategy and code
14. known tradeoffs

Do not give vague advice.
Do not give pseudo-solutions.
Do not suggest infinite-scroll editing.
Do not replace Lexical with another editor framework.
Do not treat project memory as disposable cache.
Do not produce an app-only architecture that is hard to reuse.
Do not postpone unit tests until the end.
Produce concrete implementation with real pagination logic.

---

If Lexical’s default behavior is insufficient for true pagination, build custom pagination orchestration, custom measurement utilities, and custom plugins around Lexical rather than abandoning Lexical or downgrading pagination correctness.

---

> Treat fixed A4 geometry, deterministic pagination, Lexical-first architecture, reusable React library design, clean-code maintainability, zero god files, global header/footer toggle correctness, zero-overlap enforcement, committed raw SQLite project memory, per-step unit testing, Git hook enforcement, and Playwright regression coverage as higher priority than implementation simplicity. Any solution that uses fake pages over one continuous editor, dynamic page heights, another editor engine instead of Lexical, app-specific tight coupling, disposable/untracked memory storage, skipped per-step unit tests, omitted Git hook setup, giant god files, or weak/unreliable tests is invalid.
