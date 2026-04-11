Use this **enhanced increment prompt** with variable support integrated.

---

## Increment prompt: document save/export AST integration with variables

You are continuing an existing project: a **TypeScript + React + Vite + Meta Lexical** reusable paginated A4 editor library with headers/footers, deterministic pagination, clean architecture, SQLite project memory, unit tests, and Playwright coverage.

Your task now is to **increment the project** with the ability to:

1. **save/export the document into a backend-friendly AST payload** that can be sent through a REST API to an external service responsible for generating outputs such as **DOCX** or **PDF**
2. support **document variables/placeholders** that users can insert from the UI and that are exported in the AST together with related document metadata

This is **not** a visual export feature inside the frontend.
This is a **document serialization and integration contract** feature.

Do **not** return a vague proposal.
Do **not** create an HTML dump pretending it is an AST.
Do **not** serialize raw DOM as the main format.
Do **not** couple the API contract to frontend CSS classes or browser-rendered markup.

The output must be a **clean, explicit, typed AST structure** designed for backend consumption.

---

## Core mission

Add a robust **save/export pipeline** that allows the editor to expose an entrypoint that returns the current document as a **structured AST**, suitable for sending to an external REST API.

This AST must:

* represent the document in a **semantic and structured way**
* include enough information for a backend to render the document into **DOCX**, **PDF**, or similar formats
* preserve:

  * text content
  * paragraph structure
  * headings
  * lists
  * nesting
  * alignment
  * formatting marks
  * font family
  * font size
  * headers and footers
  * page-aware A4 concepts
  * inserted variables/placeholders
* be **styling-agnostic** in the sense that backend/internal styling systems may choose their own implementation details
* still carry all relevant semantic formatting choices selected by the user
* be aware of **A4 / print-oriented document concepts**
* be designed as a stable **integration contract**, not as an incidental internal object dump

---

## Functional goal

Add the ability to:

* export the current editor document into a **typed AST object**
* serialize that AST as JSON
* expose a clean entrypoint such as:

  * `getDocumentAst()`
  * `serializeDocumentAst()`
  * `buildDocumentPayload()`
* optionally provide a helper to build a REST payload for backend submission
* keep the AST contract independent from UI rendering details
* allow users to insert **variables** from a UI component
* allow variables to be **loaded**, **refreshed**, and **mapped into document metadata**
* preserve variable references in the AST so the backend can resolve them dynamically

---

## Save/export requirements

### Required capability

The library must provide an explicit save/export API for consumers, for example:

* component ref API
* exported serializer function
* public hook or service

The consumer should be able to do something like:

* obtain the current document AST
* send it to an external backend API
* rely on the AST as the canonical saved document representation

### Important distinction

The frontend is **not** responsible for generating DOCX/PDF directly in this increment.

The frontend **is** responsible for:

* building the document AST correctly
* preserving semantic structure and formatting choices
* including A4/page/header/footer concepts needed by downstream renderers
* preserving variable references and metadata definitions
* producing a stable contract that a backend can interpret

The backend/integration is responsible for:

* applying its own internal styling/rendering implementation
* converting the AST into DOCX, PDF, etc.
* mapping semantic formatting to concrete output format instructions
* resolving variables using the metadata contract or external data sources

---

## Variables requirement

This is mandatory.

The document must support **dynamic variables/placeholders** inserted by the user through the editor UI.

### User goal

A user can insert something like:

* `customer.name`
* `customer.email`
* `proposal.date`
* `company.address.city`

These are not plain text-only conventions.
They must be represented as **structured variable nodes/tokens** in the editor model and in the exported AST.

### UI requirement

The editor must provide a UI mechanism to:

* insert a variable into the document
* browse/select available variables from a component, menu, picker, dropdown, or similar
* load available variables from configuration or provided data
* refresh/reload available variables
* show variables clearly in the editor as special semantic tokens/placeholders

### Variable metadata requirement

The document export must include a metadata area describing variables used or available in the document.

Example goal:

* user inserts `customer.name`
* exported metadata includes something like:

  * `"customer.name": "The customer"`
  * or a richer variable descriptor object

This metadata exists so downstream systems know what the variable means and how to resolve it.

### Important semantic rule

Variables must not be flattened into plain text during export.
They must remain identifiable as variable references in the AST.

---

## Variable behavior expectations

### Must support

* inserting variables from UI
* refreshing variable definitions from a provided source
* preserving variable identity in the editor state
* exporting variable nodes in the AST
* exporting variable metadata/descriptors
* allowing repeated usage of the same variable in multiple places
* preserving surrounding formatting where applicable

### Variable examples

Examples of supported variable keys:

* `customer.name`
* `customer.document`
* `customer.address.street`
* `proposal.validUntil`
* `seller.name`

### Metadata examples

The AST or payload should include a metadata area such as:

```ts id="io8x42"
type VariableDefinition = {
  key: string;
  label: string;
  description?: string;
  valueType?: "string" | "number" | "date" | "boolean";
  group?: string;
};
```

Or a map such as:

```ts id="5y8m6l"
{
  "customer.name": {
    "label": "Customer",
    "description": "The customer full name",
    "valueType": "string"
  }
}
```

The exact shape may improve, but it must be:

* explicit
* typed
* stable
* backend-friendly

### Refresh/load requirement

The project must support a variable source that can be:

* loaded initially
* refreshed later
* exposed to the insertion UI
* kept separate from the actual serialized AST contract

This means:

* variable catalog/source is one concern
* inserted variable references in document content are another concern
* exported metadata/definitions are another concern

Keep these concerns separate and clean.

---

## AST design requirements

The AST must be:

* explicit
* typed
* stable
* versionable
* easy to extend later
* independent from Lexical internals as much as practical
* independent from DOM structure
* independent from CSS class names
* easy for backend developers to understand without frontend knowledge

### Must include top-level document information

At minimum, include:

* document schema version
* page format info
* A4 information
* page settings / print settings
* header/footer enabled flag
* body content
* headers
* footers
* metadata
* variable definitions and/or variable metadata

### Example top-level shape

This is illustrative only; improve it if necessary:

```ts id="ftwnt0"
type DocumentAst = {
  version: string;
  page: {
    format: "A4";
    widthMm: 210;
    heightMm: 297;
    headerFooterEnabled: boolean;
    margins?: {
      topMm: number;
      rightMm: number;
      bottomMm: number;
      leftMm: number;
    };
  };
  header?: HeaderFooterAst;
  footer?: HeaderFooterAst;
  body: BlockNodeAst[];
  metadata?: {
    createdAt?: string;
    updatedAt?: string;
    title?: string;
    variables?: Record<string, VariableDefinitionAst>;
  };
};
```

---

## AST content requirements

### Blocks

Support AST nodes for at least:

* paragraph
* heading
* ordered list
* unordered list
* list item
* text block / inline text runs
* variable/placeholder inline nodes
* line breaks if needed
* header content
* footer content

### Inline formatting

The AST must preserve inline semantics such as:

* bold
* italic
* underline
* strikethrough
* font family
* font size
* text color only if already supported by the editor
* alignment at block level
* nesting depth for list items

### Variables

The AST must preserve variable semantics such as:

* variable node type
* variable key, for example `customer.name`
* optional label
* optional fallback/default value if the project supports it
* optional formatting hints if supported later, but do not overcomplicate now
* relation to exported metadata definitions

### Lists

The AST must preserve:

* ordered vs unordered
* ordered list style if supported
* nesting depth
* list item hierarchy
* item content
* indentation semantics

### Header/footer

The AST must preserve:

* whether header/footer are enabled
* header content
* footer content
* whether content is shared/replicated globally or stored per page model if applicable
* enough structure for downstream print renderers to honor page layout

### A4 awareness

The AST must include enough print-awareness so the backend can respect page-oriented generation, including:

* page format = A4
* fixed A4 dimensions
* header/footer enabled state
* header/footer reserved concepts
* any relevant page margin/body-area semantics if available

Do not encode visual CSS.
Encode document semantics and print semantics.

---

## Styling-agnostic but formatting-aware rule

This is critical.

The AST must be:

* **agnostic of frontend UI styling implementation**
* but **aware of user-selected document formatting semantics**

That means:

### Must preserve

* font family chosen by the user
* font size chosen by the user
* bold/italic/underline/strike
* alignment
* list type and nesting
* headings vs normal paragraphs
* header/footer semantics
* page/A4 semantics
* variable references
* variable metadata descriptors

### Must not depend on

* CSS class names
* generated DOM
* browser layout quirks
* component-specific styling wrappers
* editor-theme-only artifacts

The backend integration may apply its own internal styles while still honoring the semantic AST.

---

## API contract requirement

Design the AST as if it will be consumed by a separate backend team.

### Required qualities

* stable shape
* versioned contract
* typed interfaces
* documented field meanings
* safe defaults
* forward-compatible design

### Required output helpers

Produce:

1. the AST TypeScript types
2. the serializer implementation
3. public API entrypoint for consumers
4. example REST payload shape
5. example of sending the AST to a backend
6. tests validating the serialized structure

---

## Lexical integration requirement

Use the existing **Meta Lexical** architecture.

### Hard rule

Do not dump Lexical internal state directly as the integration contract.

Instead:

* read from Lexical/editor/document state
* map it into a clean external AST
* keep the AST separate from editor-specific storage details

### Variable integration expectation

Variables must be implemented using a proper editor model concept, such as:

* custom Lexical node
* explicit token node
* placeholder node

Do not treat variables as ordinary plain text only.

### Mapping expectations

Implement a clear transformation layer:

* Lexical state -> internal normalized document model if needed
* normalized document model -> external AST

This mapping layer must be:

* testable
* readable
* modular
* not mixed into giant UI components

---

## Public API requirement

This increment must expose a clean public API that makes save/export simple for host apps.

Examples of acceptable patterns:

* `editorRef.current.getDocumentAst()`
* `serializeDocumentAst(editorState)`
* `buildDocumentApiPayload(documentState)`
* `onSave={({ ast, json }) => ... }`
* `editorRef.current.insertVariable(variableKey)`
* `editorRef.current.refreshVariables()`

The public API must be:

* explicit
* typed
* easy to integrate
* decoupled from UI internals

---

## REST integration requirement

The project must include an example integration contract for sending the AST to a backend.

### Example expectations

Show a payload shape such as:

```ts id="74t1rz"
type SaveDocumentRequest = {
  document: DocumentAst;
  exportTarget?: "pdf" | "docx";
  documentId?: string;
  metadata?: Record<string, string>;
};
```

Or richer if needed to support variables:

```ts id="z9743q"
type SaveDocumentRequest = {
  document: DocumentAst;
  exportTarget?: "pdf" | "docx";
  documentId?: string;
  metadata?: Record<string, string>;
  variables?: Record<string, VariableDefinitionAst>;
};
```

And show an example frontend request flow.

### Important rule

Do not hardcode the backend implementation.
Design the frontend side of the contract cleanly and generically.

---

## Testing requirements

This increment must be fully tested.

### Unit tests are mandatory

Add unit tests for:

* AST type mapping
* block serialization
* inline formatting serialization
* list serialization
* header/footer serialization
* A4/page metadata serialization
* disabled vs enabled header/footer behavior
* schema versioning behavior
* public save/export entrypoint behavior
* REST payload builder behavior
* variable node serialization
* variable metadata serialization
* variable insertion behavior
* variable refresh/load behavior
* repeated variable usage behavior

### Playwright coverage

Add end-to-end coverage for:

* creating content and exporting AST
* formatting text and verifying exported structure
* lists and nested lists exported correctly
* header/footer enabled exported correctly
* header/footer disabled exported correctly
* fonts and sizes exported correctly
* alignment exported correctly
* inserting a variable from the UI
* exporting variables correctly in AST
* exporting metadata with variable definitions
* refreshing variables from the UI source
* save/export action available from host integration flow if applicable

---

## Clean code requirements

This increment must respect the existing clean architecture expectations.

### Mandatory rules

* no god files
* no giant serializer module mixing everything
* no giant variable manager file that mixes UI, storage, serialization, and editor logic
* split:

  * AST types
  * serializers
  * block mappers
  * inline mark mappers
  * variable node definitions
  * variable source/catalog logic
  * variable insertion UI
  * variable metadata mapping
  * public API layer
  * REST payload builder
  * tests
* keep code readable for a human developer without AI
* use intention-revealing names
* document non-obvious contract decisions

---

## Project memory requirement

This increment must also be written into the existing SQLite project memory.

Store at least:

* the prompt for this increment
* the AST contract decision
* variable contract and metadata design decisions
* serializer design decisions
* REST integration notes
* tests added
* follow-up limitations or future extensibility notes

Do not ignore this step.

---

## Deliverables

Produce all of the following:

1. architecture summary for the save/export increment
2. AST contract design
3. variable contract design
4. TypeScript AST types/interfaces
5. serializer implementation
6. variable insertion/load/refresh design
7. public API entrypoint for host apps
8. REST payload builder
9. example integration usage
10. unit tests
11. Playwright tests
12. SQLite memory updates for this increment
13. notes on extensibility and tradeoffs

---

## Acceptance criteria

The increment is only acceptable if all these are true:

* the document can be exported as a typed AST
* the AST is not raw DOM
* the AST is not just raw Lexical state
* the AST preserves semantic structure
* the AST preserves selected font family and font size
* the AST preserves formatting marks
* the AST preserves alignment
* the AST preserves lists and nesting
* the AST preserves header/footer semantics
* the AST includes A4/page-aware concepts for backend print rendering
* the AST remains styling-agnostic at the UI/CSS level
* variables can be inserted from the UI
* variables are preserved as semantic variable nodes in the AST
* variable metadata/descriptors are exported
* variable definitions can be loaded and refreshed cleanly
* the public API is easy to use from another React host app
* unit tests cover serialization and variable behavior
* Playwright tests cover real export and variable workflows
* code remains modular and avoids god files
* the SQLite project memory is updated with this increment

---

## Non-goals

Unless explicitly requested later, do not implement:

* backend DOCX rendering
* backend PDF rendering
* CSS-to-PDF rendering logic
* direct frontend file download generation
* section breaks
* comments/track changes integration into AST unless already supported
* full runtime variable resolution in the frontend beyond what is needed for metadata and insertion UX

Focus on:

* **clean AST contract**
* **stable serialization**
* **backend-friendly REST payload**
* **A4-aware semantic export**
* **variable placeholders and metadata**
* **clean modular implementation**

---

## Output format

Return your answer in this order:

1. brief increment architecture summary
2. AST contract
3. variable contract
4. implementation plan
5. full code
6. serializer explanation
7. variable system explanation
8. public API explanation
9. REST payload explanation
10. unit test strategy and code
11. Playwright test strategy and code
12. known tradeoffs

Do not give vague advice.
Do not dump raw editor state as the final contract.
Do not tie the contract to frontend CSS.
Do not flatten variables into plain text.
Do not create a god serializer file.
Produce concrete implementation.

---

> Treat stable AST design, clean backend integration contract, semantic formatting preservation, A4-aware export semantics, variable placeholder support, metadata-rich variable export, modular serializer architecture, zero god files, per-step unit testing, and Playwright regression coverage as higher priority than implementation speed. Any solution that exports raw DOM, raw Lexical state, CSS-dependent markup, flattened variable text, or an unstable undocumented payload is invalid.
