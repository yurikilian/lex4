import type { Lex4Document } from '../types/document';
import type {
  CaretPosition,
  CaretSelection,
  HistoryActionDescriptor,
  HistoryEntry,
  HistoryState,
} from '../types/history';

export const MAX_HISTORY_ACTIONS = 100;

function cloneSnapshot(document: Lex4Document): Lex4Document {
  return structuredClone(document);
}

function createHistoryEntry(
  document: Lex4Document,
  descriptor: HistoryActionDescriptor,
  undoSnapshot: Lex4Document,
  caretPosition: CaretPosition | null,
  caretSelection: CaretSelection | null,
  undoCaretPosition: CaretPosition | null,
  undoCaretSelection: CaretSelection | null,
): HistoryEntry {
  return {
    ...descriptor,
    id: crypto.randomUUID(),
    snapshot: cloneSnapshot(document),
    undoSnapshot: cloneSnapshot(undoSnapshot),
    timestamp: new Date().toISOString(),
    caretPosition,
    caretSelection,
    undoCaretPosition,
    undoCaretSelection,
  };
}

export function createHistoryState(
  document: Lex4Document,
  baseCaretPosition: CaretPosition | null = null,
): HistoryState {
  return {
    baseSnapshot: cloneSnapshot(document),
    baseCaretPosition,
    entries: [],
    cursor: 0,
  };
}

export function getHistorySnapshot(history: HistoryState, cursor = history.cursor): Lex4Document {
  if (cursor <= 0) {
    return cloneSnapshot(history.baseSnapshot);
  }

  return cloneSnapshot(history.entries[cursor - 1].snapshot);
}

export function clearHistoryState(
  document: Lex4Document,
  baseCaretPosition: CaretPosition | null = null,
): HistoryState {
  return createHistoryState(document, baseCaretPosition);
}

export function recordHistoryEntry(
  history: HistoryState,
  nextDocument: Lex4Document,
  descriptor: HistoryActionDescriptor,
  undoSnapshot: Lex4Document,
  caretPosition: CaretPosition | null,
  caretSelection: CaretSelection | null,
  undoCaretPosition: CaretPosition | null,
  undoCaretSelection: CaretSelection | null,
): HistoryState {
  const entries = history.entries.slice(0, history.cursor);
  entries.push(createHistoryEntry(
    nextDocument,
    descriptor,
    undoSnapshot,
    caretPosition,
    caretSelection,
    undoCaretPosition,
    undoCaretSelection,
  ));

  let baseSnapshot = cloneSnapshot(history.baseSnapshot);
  let baseCaretPosition = history.baseCaretPosition;
  let trimmedEntries = entries;

  if (trimmedEntries.length > MAX_HISTORY_ACTIONS) {
    baseSnapshot = cloneSnapshot(trimmedEntries[1].undoSnapshot);
    baseCaretPosition = trimmedEntries[1].undoCaretPosition;
    trimmedEntries = trimmedEntries.slice(1);
  }

  return {
    baseSnapshot,
    baseCaretPosition,
    entries: trimmedEntries,
    cursor: trimmedEntries.length,
  };
}

export function undoHistory(
  history: HistoryState,
): {
  history: HistoryState;
  document: Lex4Document;
  caretPosition: CaretPosition | null;
  caretSelection: CaretSelection | null;
} | null {
  if (history.cursor === 0) {
    return null;
  }

  const cursor = history.cursor - 1;
  const nextHistory: HistoryState = {
    ...history,
    cursor,
  };

  return {
    history: nextHistory,
    document: cloneSnapshot(history.entries[history.cursor - 1].undoSnapshot),
    caretPosition: history.entries[history.cursor - 1].undoCaretPosition,
    caretSelection: history.entries[history.cursor - 1].undoCaretSelection,
  };
}

export function redoHistory(
  history: HistoryState,
): {
  history: HistoryState;
  document: Lex4Document;
  caretPosition: CaretPosition | null;
  caretSelection: CaretSelection | null;
} | null {
  if (history.cursor >= history.entries.length) {
    return null;
  }

  const cursor = history.cursor + 1;
  const nextHistory: HistoryState = {
    ...history,
    cursor,
  };

  return {
    history: nextHistory,
    document: getHistorySnapshot(nextHistory),
    caretPosition: nextHistory.entries[cursor - 1]?.caretPosition ?? nextHistory.baseCaretPosition,
    caretSelection: nextHistory.entries[cursor - 1]?.caretSelection ?? null,
  };
}

export function jumpToHistoryEntry(
  history: HistoryState,
  entryIndex: number,
): {
  history: HistoryState;
  document: Lex4Document;
  caretPosition: CaretPosition | null;
  caretSelection: CaretSelection | null;
} | null {
  if (entryIndex < 0 || entryIndex >= history.entries.length) {
    return null;
  }

  const nextHistory: HistoryState = {
    ...history,
    cursor: entryIndex + 1,
  };

  return {
    history: nextHistory,
    document: getHistorySnapshot(nextHistory),
    caretPosition: nextHistory.entries[nextHistory.cursor - 1]?.caretPosition ?? nextHistory.baseCaretPosition,
    caretSelection: nextHistory.entries[nextHistory.cursor - 1]?.caretSelection ?? null,
  };
}
