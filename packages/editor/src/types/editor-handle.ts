import type { DocumentAst, SaveDocumentRequest } from '../ast/types';
import type { PayloadOptions } from '../ast/payload-builder';
import type { VariableDefinition } from '../variables/types';

/**
 * Imperative handle exposed by Lex4Editor via React ref.
 *
 * Host apps use this to programmatically interact with the editor:
 * - Export the document AST
 * - Insert/refresh variables
 * - Build REST payloads
 */
export interface Lex4EditorHandle {
  /** Returns the current document as a clean, typed AST. */
  getDocumentAst(): DocumentAst;

  /** Returns the current document AST serialized as a JSON string. */
  getDocumentJson(): string;

  /** Inserts a variable node at the current cursor position. */
  insertVariable(key: string): void;

  /** Replaces the variable definitions catalog at runtime. */
  refreshVariables(definitions: VariableDefinition[]): void;

  /** Builds a complete REST payload wrapping the document AST. */
  buildSavePayload(options?: PayloadOptions): SaveDocumentRequest;
}
