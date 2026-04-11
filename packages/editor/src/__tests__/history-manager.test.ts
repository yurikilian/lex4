import { describe, expect, it } from 'vitest';

import { createEmptyDocument } from '../types/document';
import type { Lex4Document } from '../types/document';
import type { CaretPosition } from '../types/history';
import {
  MAX_HISTORY_ACTIONS,
  clearHistoryState,
  createHistoryState,
  jumpToHistoryEntry,
  recordHistoryEntry,
  redoHistory,
  undoHistory,
} from '../utils/history-manager';

function buildDocument(version: number): Lex4Document {
  const document = createEmptyDocument();
  document.pages[0].bodyState = {
    root: {
      children: [
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: `Version ${version}`,
              type: 'text',
              version: 1,
            },
          ],
          direction: null,
          format: '',
          indent: 0,
          textFormat: 0,
          textStyle: '',
          type: 'paragraph',
          version: 1,
        },
      ],
      direction: null,
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  } as Lex4Document['pages'][number]['bodyState'];
  return document;
}

const bodyCaret: CaretPosition = { pageId: 'page-1', region: 'body' };
const headerCaret: CaretPosition = { pageId: 'page-1', region: 'header' };

describe('history-manager', () => {
  it('records labeled entries and supports undo/redo traversal', () => {
    let history = createHistoryState(buildDocument(0));

    history = recordHistoryEntry(history, buildDocument(1), {
      label: 'Typed text - Page 1',
      source: 'body',
      region: 'body',
    }, buildDocument(0), bodyCaret, null, bodyCaret, null);
    history = recordHistoryEntry(history, buildDocument(2), {
      label: 'Bold applied',
      source: 'toolbar',
      region: 'document',
    }, buildDocument(1), headerCaret, null, headerCaret, null);

    expect(history.entries).toHaveLength(2);
    expect(history.cursor).toBe(2);
    expect(history.entries[0].label).toBe('Typed text - Page 1');
    expect(history.entries[1].label).toBe('Bold applied');

    const undoResult = undoHistory(history);
    expect(undoResult).not.toBeNull();
    expect(undoResult?.history.cursor).toBe(1);
    expect(undoResult?.document.pages[0].bodyState?.root.children[0]).toBeDefined();
    expect(undoResult?.caretPosition).toEqual(headerCaret);

    const redoResult = redoHistory(undoResult!.history);
    expect(redoResult).not.toBeNull();
    expect(redoResult?.history.cursor).toBe(2);
    expect(redoResult?.caretPosition).toEqual(headerCaret);
  });

  it('purges the oldest action when more than 100 actions are recorded', () => {
    let history = createHistoryState(buildDocument(0));

    for (let index = 1; index <= MAX_HISTORY_ACTIONS + 1; index++) {
      history = recordHistoryEntry(history, buildDocument(index), {
        label: `Action ${index}`,
        source: 'body',
        region: 'body',
      }, buildDocument(index - 1), bodyCaret, null, bodyCaret, null);
    }

    expect(history.entries).toHaveLength(MAX_HISTORY_ACTIONS);
    expect(history.cursor).toBe(MAX_HISTORY_ACTIONS);
    expect(history.entries[0].label).toBe('Action 2');
    expect(history.baseSnapshot.pages[0].bodyState?.root.children[0]).toBeDefined();
  });

  it('drops redo entries when a new action is recorded after undo', () => {
    let history = createHistoryState(buildDocument(0));
    history = recordHistoryEntry(history, buildDocument(1), {
      label: 'Action 1',
      source: 'body',
      region: 'body',
    }, buildDocument(0), bodyCaret, null, bodyCaret, null);
    history = recordHistoryEntry(history, buildDocument(2), {
      label: 'Action 2',
      source: 'body',
      region: 'body',
    }, buildDocument(1), headerCaret, null, headerCaret, null);

    const undoResult = undoHistory(history);
    expect(undoResult).not.toBeNull();

    const rewrittenHistory = recordHistoryEntry(undoResult!.history, buildDocument(3), {
      label: 'Action 3',
      source: 'body',
      region: 'body',
    }, buildDocument(1), bodyCaret, null, bodyCaret, null);

    expect(rewrittenHistory.entries).toHaveLength(2);
    expect(rewrittenHistory.entries[1].label).toBe('Action 3');
  });

  it('jumps directly to a clicked history entry', () => {
    let history = createHistoryState(buildDocument(0));
    history = recordHistoryEntry(history, buildDocument(1), {
      label: 'Action 1',
      source: 'body',
      region: 'body',
    }, buildDocument(0), bodyCaret, null, bodyCaret, null);
    history = recordHistoryEntry(history, buildDocument(2), {
      label: 'Action 2',
      source: 'body',
      region: 'body',
    }, buildDocument(1), headerCaret, null, headerCaret, null);
    history = recordHistoryEntry(history, buildDocument(3), {
      label: 'Action 3',
      source: 'body',
      region: 'body',
    }, buildDocument(2), bodyCaret, null, bodyCaret, null);

    const jumpResult = jumpToHistoryEntry(history, 0);
    expect(jumpResult).not.toBeNull();
    expect(jumpResult?.history.cursor).toBe(1);
    expect(jumpResult?.document.pages[0].bodyState?.root.children[0]).toBeDefined();
    expect(jumpResult?.caretPosition).toEqual(bodyCaret);
  });

  it('clears all history while keeping the current document as the new base snapshot', () => {
    let history = createHistoryState(buildDocument(0));
    history = recordHistoryEntry(history, buildDocument(1), {
      label: 'Action 1',
      source: 'body',
      region: 'body',
    }, buildDocument(0), bodyCaret, null, bodyCaret, null);

    const cleared = clearHistoryState(buildDocument(7), headerCaret);
    expect(cleared.entries).toHaveLength(0);
    expect(cleared.cursor).toBe(0);
    expect(cleared.baseSnapshot.pages[0].bodyState?.root.children[0]).toBeDefined();
    expect(cleared.baseCaretPosition).toEqual(headerCaret);
  });
});
