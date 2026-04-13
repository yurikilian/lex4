/**
 * Payload builder — Wraps a DocumentAst into a REST-ready payload.
 *
 * This module provides a simple helper for consumers to construct
 * a request body suitable for sending to a backend document generation API.
 */

import type { DocumentAst, SaveDocumentRequest } from './types';

export interface PayloadOptions {
  /** Target export format */
  exportTarget?: 'pdf' | 'docx';
  /** External document identifier */
  documentId?: string;
  /** Additional metadata for the backend */
  metadata?: Record<string, string>;
}

/**
 * Builds a SaveDocumentRequest payload from a DocumentAst.
 */
export function buildSavePayload(
  ast: DocumentAst,
  options?: PayloadOptions,
): SaveDocumentRequest {
  return {
    document: ast,
    ...(options?.exportTarget ? { exportTarget: options.exportTarget } : {}),
    ...(options?.documentId ? { documentId: options.documentId } : {}),
    ...(options?.metadata ? { metadata: options.metadata } : {}),
  };
}

/**
 * Serializes a DocumentAst to a JSON string.
 */
export function serializeDocumentJson(ast: DocumentAst): string {
  return JSON.stringify(ast, null, 2);
}
