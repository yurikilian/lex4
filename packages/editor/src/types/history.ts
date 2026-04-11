import type { Lex4Document } from './document';

export type HistorySource =
  | 'body'
  | 'header'
  | 'footer'
  | 'toolbar'
  | 'document'
  | 'overflow'
  | 'history';

export type HistoryRegion = 'document' | 'body' | 'header' | 'footer';

export interface CaretPosition {
  pageId: string;
  region: Exclude<HistoryRegion, 'document'>;
}

export interface CaretSelectionPoint {
  key: string;
  offset: number;
  type: 'text' | 'element';
}

export interface CaretSelection {
  anchor: CaretSelectionPoint;
  focus: CaretSelectionPoint;
  anchorTextOffset: number;
  focusTextOffset: number;
  format: number;
  style: string;
}

export interface HistoryActionDescriptor {
  label: string;
  source: HistorySource;
  pageId?: string;
  region?: HistoryRegion;
}

export interface HistoryEntry extends HistoryActionDescriptor {
  id: string;
  snapshot: Lex4Document;
  undoSnapshot: Lex4Document;
  timestamp: string;
  caretPosition: CaretPosition | null;
  caretSelection: CaretSelection | null;
  undoCaretPosition: CaretPosition | null;
  undoCaretSelection: CaretSelection | null;
}

export interface HistoryState {
  baseSnapshot: Lex4Document;
  baseCaretPosition: CaretPosition | null;
  entries: HistoryEntry[];
  cursor: number;
}
