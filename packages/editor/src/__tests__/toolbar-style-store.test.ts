import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TOOLBAR_STYLE_SNAPSHOT,
  createToolbarStyleStore,
} from '../context/toolbar-style-store';

describe('toolbar-style-store', () => {
  it('starts with the default toolbar snapshot', () => {
    const store = createToolbarStyleStore();

    expect(store.getState()).toMatchObject(DEFAULT_TOOLBAR_STYLE_SNAPSHOT);
  });

  it('updates and resets the toolbar snapshot', () => {
    const store = createToolbarStyleStore();

    store.getState().setSnapshot({
      blockType: 'h1',
      fontFamily: 'Georgia',
      fontSize: 22.5,
      alignment: 'center',
      activeList: 'alpha',
      isBold: true,
      isItalic: false,
      isUnderline: true,
      isStrikethrough: false,
      hasSelectedVariable: true,
    });

    expect(store.getState()).toMatchObject({
      blockType: 'h1',
      fontFamily: 'Georgia',
      fontSize: 22.5,
      alignment: 'center',
      activeList: 'alpha',
      isBold: true,
      isUnderline: true,
      hasSelectedVariable: true,
    });

    store.getState().reset();

    expect(store.getState()).toMatchObject(DEFAULT_TOOLBAR_STYLE_SNAPSHOT);
  });
});
