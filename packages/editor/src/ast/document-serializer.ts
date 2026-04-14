/**
 * Document serializer — Converts a Lex4Document to a DocumentAst.
 *
 * This is the top-level serialization pipeline that orchestrates
 * all sub-mappers (inline, block, content) to produce the final
 * AST contract object.
 */

import type {
  DocumentAst,
  PageAst,
  VariableDefinitionAst,
  DocumentMetadataAst,
} from './types';
import { AST_VERSION } from './types';
import type { Lex4Document } from '../types/document';
import type { VariableDefinition } from '../variables/types';
import { mapEditorStateToBlocks, mapEditorStateToContent } from './content-mapper';
import { PAGE_MARGIN_PX, PX_PER_MM } from '../constants';

const MARGIN_MM = Math.round((PAGE_MARGIN_PX / PX_PER_MM) * 10) / 10;

/**
 * Serializes a Lex4Document into a clean, backend-friendly DocumentAst.
 *
 * @param document - The current editor document state
 * @param variableDefinitions - Optional variable definitions for metadata
 */
export function serializeDocument(
  document: Lex4Document,
  variableDefinitions: VariableDefinition[] = [],
): DocumentAst {
  const pages: PageAst[] = document.pages.map((page, index) =>
    serializePage(page, index),
  );

  const metadata = buildMetadata(variableDefinitions);

  return {
    version: AST_VERSION,
    page: {
      format: 'A4',
      widthMm: 210,
      heightMm: 297,
      margins: {
        topMm: MARGIN_MM,
        rightMm: MARGIN_MM,
        bottomMm: MARGIN_MM,
        leftMm: MARGIN_MM,
      },
    },
    headerFooter: {
      enabled: document.headerFooterEnabled,
      pageCounterMode: document.pageCounterMode,
      defaultHeader: document.pages.length > 0
        ? mapEditorStateToContent(document.pages[0].headerState)
        : null,
      defaultFooter: document.pages.length > 0
        ? mapEditorStateToContent(document.pages[0].footerState)
        : null,
    },
    pages,
    metadata,
  };
}

function serializePage(
  page: { bodyState: import('lexical').SerializedEditorState | null; headerState: import('lexical').SerializedEditorState | null; footerState: import('lexical').SerializedEditorState | null },
  pageIndex: number,
): PageAst {
  return {
    pageIndex,
    body: mapEditorStateToBlocks(page.bodyState),
    header: mapEditorStateToContent(page.headerState),
    footer: mapEditorStateToContent(page.footerState),
  };
}

function buildMetadata(
  variableDefinitions: VariableDefinition[],
): DocumentMetadataAst {
  const variables: Record<string, VariableDefinitionAst> = {};

  for (const def of variableDefinitions) {
    variables[def.key] = {
      key: def.key,
      label: def.label,
      ...(def.description ? { description: def.description } : {}),
      ...(def.valueType ? { valueType: def.valueType } : {}),
      ...(def.group ? { group: def.group } : {}),
    };
  }

  return { variables };
}
