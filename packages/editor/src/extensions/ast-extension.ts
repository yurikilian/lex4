import type { Lex4Extension, ExtensionContext } from './types';
import { serializeDocument } from '../ast/document-serializer';
import { buildSavePayload, serializeDocumentJson } from '../ast/payload-builder';
import type { PayloadOptions } from '../ast/payload-builder';
import type { DocumentAst, SaveDocumentRequest } from '../ast/types';
import type { VariableDefinition } from '../variables/types';

declare module '../types/editor-handle' {
  interface Lex4EditorHandle {
    getDocumentAst: () => DocumentAst;
    getDocumentJson: () => string;
    buildSavePayload: (options?: PayloadOptions) => SaveDocumentRequest;
  }
}

/**
 * Creates an AST extension that adds document export capabilities.
 *
 * Handle methods provided:
 * - `getDocumentAst()` — returns the current document as a typed AST
 * - `getDocumentJson()` — returns the AST as a JSON string
 * - `buildSavePayload(options?)` — builds a REST payload wrapping the AST
 *
 * @example
 * ```tsx
 * <Lex4Editor extensions={[astExtension()]} />
 * ```
 */
export function astExtension(): Lex4Extension {
  return {
    name: 'ast',
    handleMethods: (ctx: ExtensionContext) => {
      const getDefinitions = (): VariableDefinition[] => {
        return ctx.getExtensionState<VariableDefinition[]>('variableDefinitions') ?? [];
      };

      return {
        getDocumentAst: () => {
          const doc = ctx.getDocument();
          return serializeDocument(doc, getDefinitions());
        },
        getDocumentJson: () => {
          const doc = ctx.getDocument();
          const ast = serializeDocument(doc, getDefinitions());
          return serializeDocumentJson(ast);
        },
        buildSavePayload: (options?: Parameters<typeof buildSavePayload>[1]) => {
          const doc = ctx.getDocument();
          const ast = serializeDocument(doc, getDefinitions());
          return buildSavePayload(ast, options);
        },
      };
    },
  };
}
