/**
 * Document AST types — the backend integration contract.
 *
 * These types define the clean, Lexical-independent AST
 * that consumers receive when calling getDocumentAst().
 * Backend teams can use these types directly without any
 * knowledge of Lexical or React internals.
 *
 * @version 1.0.0
 */

export const AST_VERSION = '1.0.0' as const;

// ---------------------------------------------------------------------------
// Top-level document
// ---------------------------------------------------------------------------

export interface DocumentAst {
  version: typeof AST_VERSION;
  page: PageFormatAst;
  headerFooter: HeaderFooterConfigAst;
  pages: PageAst[];
  metadata: DocumentMetadataAst;
}

export interface PageFormatAst {
  format: 'A4';
  widthMm: number;
  heightMm: number;
  margins: MarginsAst;
}

export interface MarginsAst {
  topMm: number;
  rightMm: number;
  bottomMm: number;
  leftMm: number;
}

export interface HeaderFooterConfigAst {
  enabled: boolean;
  pageCounterMode: 'none' | 'header' | 'footer' | 'both';
  defaultHeader: ContentAst | null;
  defaultFooter: ContentAst | null;
}

export interface DocumentMetadataAst {
  variables: Record<string, VariableDefinitionAst>;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export interface PageAst {
  pageIndex: number;
  body: BlockNodeAst[];
  header: ContentAst | null;
  footer: ContentAst | null;
}

// ---------------------------------------------------------------------------
// Content container
// ---------------------------------------------------------------------------

export interface ContentAst {
  blocks: BlockNodeAst[];
}

// ---------------------------------------------------------------------------
// Block nodes
// ---------------------------------------------------------------------------

export type BlockNodeAst =
  | ParagraphAst
  | HeadingAst
  | ListAst
  | BlockQuoteAst;

export type Alignment = 'left' | 'center' | 'right' | 'justify';

export interface ParagraphAst {
  type: 'paragraph';
  alignment?: Alignment;
  indent?: number;
  children: InlineNodeAst[];
}

export interface HeadingAst {
  type: 'heading';
  level: 1 | 2 | 3 | 4 | 5;
  alignment?: Alignment;
  children: InlineNodeAst[];
}

export interface ListAst {
  type: 'list';
  listType: 'ordered' | 'unordered';
  items: ListItemAst[];
}

export interface ListItemAst {
  type: 'list-item';
  children: InlineNodeAst[];
  nestedList?: ListAst;
}

export interface BlockQuoteAst {
  type: 'blockquote';
  children: InlineNodeAst[];
}

// ---------------------------------------------------------------------------
// Inline nodes
// ---------------------------------------------------------------------------

export type InlineNodeAst =
  | TextRunAst
  | VariableAst
  | LineBreakAst;

export interface TextMarks {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  fontFamily?: string;
  fontSize?: number;
}

export interface TextRunAst {
  type: 'text';
  text: string;
  marks?: TextMarks;
}

export interface VariableAst {
  type: 'variable';
  key: string;
  marks?: TextMarks;
}

export interface LineBreakAst {
  type: 'linebreak';
}

// ---------------------------------------------------------------------------
// Variable definitions (shared with variables/types.ts)
// ---------------------------------------------------------------------------

export interface VariableDefinitionAst {
  key: string;
  label: string;
  description?: string;
  valueType?: 'string' | 'number' | 'date' | 'boolean';
  group?: string;
}

// ---------------------------------------------------------------------------
// REST payload
// ---------------------------------------------------------------------------

export interface SaveDocumentRequest {
  document: DocumentAst;
  exportTarget?: 'pdf' | 'docx';
  documentId?: string;
  metadata?: Record<string, string>;
}
