import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { LexicalEditor } from 'lexical';
import { ActiveEditorPlugin } from '../lexical/plugins/active-editor-plugin';

const editorMock = {
  getKey: () => 'editor-key',
  registerCommand: vi.fn(() => () => {}),
  registerRootListener: vi.fn(),
  focus: vi.fn(),
  update: vi.fn(),
} as unknown as LexicalEditor;

const setActiveEditor = vi.fn();
const setActivePageId = vi.fn();

vi.mock('@lexical/react/LexicalComposerContext', () => ({
  useLexicalComposerContext: () => [editorMock],
}));

vi.mock('../context/document-context', () => ({
  useDocument: () => ({
    consumePendingCaretPosition: () => undefined,
    consumePendingFocusAtEnd: () => false,
    focusAtEndVersion: 0,
    setActiveEditor,
    setActivePageId,
  }),
}));

vi.mock('../utils/debug', () => ({
  debug: vi.fn(),
}));

describe('ActiveEditorPlugin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    editorMock.registerRootListener = vi.fn((listener) => {
      const root = document.createElement('div');
      listener(root, null);
      return () => {};
    });
  });

  it('marks the editor as active when the root receives DOM focus', () => {
    const onFocus = vi.fn();

    render(
      <ActiveEditorPlugin
        pageId="page-1"
        region="body"
        onFocus={onFocus}
      />,
    );

    const listener = editorMock.registerRootListener.mock.calls[0]?.[0];
    const root = document.createElement('div');
    listener(root, null);
    root.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));

    expect(setActivePageId).toHaveBeenCalledWith('page-1');
    expect(setActiveEditor).toHaveBeenCalledWith(editorMock, { pageId: 'page-1', region: 'body' });
    expect(onFocus).toHaveBeenCalledWith(editorMock);
  });

  it('marks the editor as active when the root receives a mouse interaction', () => {
    render(
      <ActiveEditorPlugin
        pageId="page-1"
        region="body"
      />,
    );

    const listener = editorMock.registerRootListener.mock.calls[0]?.[0];
    const root = document.createElement('div');
    listener(root, null);
    root.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    expect(setActivePageId).toHaveBeenCalledWith('page-1');
    expect(setActiveEditor).toHaveBeenCalledWith(editorMock, { pageId: 'page-1', region: 'body' });
  });
});
