import { describe, it, expect } from 'vitest';
import { documentReducer } from '../context/document-reducer';
import { createEmptyDocument, createEmptyPage } from '../types/document';
import type { Lex4Document } from '../types/document';
import { MAX_HEADER_HEIGHT_PX, MAX_FOOTER_HEIGHT_PX } from '../constants/dimensions';

function docWithPages(count: number): Lex4Document {
  const doc = createEmptyDocument();
  doc.pages = Array.from({ length: count }, () => createEmptyPage());
  return doc;
}

describe('documentReducer', () => {
  describe('ADD_PAGE', () => {
    it('appends a page by default', () => {
      const state = docWithPages(1);
      const next = documentReducer(state, { type: 'ADD_PAGE' });
      expect(next.pages).toHaveLength(2);
    });

    it('inserts after specified index', () => {
      const state = docWithPages(3);
      const firstId = state.pages[0].id;
      const next = documentReducer(state, { type: 'ADD_PAGE', afterIndex: 0 });
      expect(next.pages).toHaveLength(4);
      expect(next.pages[0].id).toBe(firstId);
      expect(next.pages[1].id).not.toBe(firstId);
    });

    it('accepts a pre-built page with body content', () => {
      const state = docWithPages(1);
      const customPage = createEmptyPage();
      customPage.bodyState = {
        root: {
          children: [{ type: 'paragraph', children: [], direction: null, format: '', indent: 0, version: 1, textFormat: 0, textStyle: '' }],
          direction: null, format: '', indent: 0, type: 'root', version: 1,
        },
      } as any;

      const next = documentReducer(state, { type: 'ADD_PAGE', page: customPage });
      expect(next.pages).toHaveLength(2);
      expect(next.pages[1].id).toBe(customPage.id);
      expect(next.pages[1].bodyState).toBe(customPage.bodyState);
    });

    it('inserts pre-built page at specified index', () => {
      const state = docWithPages(3);
      const customPage = createEmptyPage();
      const next = documentReducer(state, { type: 'ADD_PAGE', page: customPage, afterIndex: 0 });
      expect(next.pages).toHaveLength(4);
      expect(next.pages[1].id).toBe(customPage.id);
    });
  });

  describe('REMOVE_PAGE', () => {
    it('removes the specified page', () => {
      const state = docWithPages(3);
      const removeId = state.pages[1].id;
      const next = documentReducer(state, { type: 'REMOVE_PAGE', pageId: removeId });
      expect(next.pages).toHaveLength(2);
      expect(next.pages.find(p => p.id === removeId)).toBeUndefined();
    });

    it('does not remove the last page', () => {
      const state = docWithPages(1);
      const next = documentReducer(state, { type: 'REMOVE_PAGE', pageId: state.pages[0].id });
      expect(next.pages).toHaveLength(1);
    });
  });

  describe('SET_HEADER_FOOTER_ENABLED', () => {
    it('sets the toggle on', () => {
      const state = createEmptyDocument();
      const next = documentReducer(state, { type: 'SET_HEADER_FOOTER_ENABLED', enabled: true });
      expect(next.headerFooterEnabled).toBe(true);
    });

    it('sets the toggle off', () => {
      const state = { ...createEmptyDocument(), headerFooterEnabled: true };
      const next = documentReducer(state, { type: 'SET_HEADER_FOOTER_ENABLED', enabled: false });
      expect(next.headerFooterEnabled).toBe(false);
    });
  });

  describe('COPY_HEADER_TO_ALL', () => {
    it('copies the source header to all pages', () => {
      const state = docWithPages(3);
      state.pages[0].headerState = { root: { children: [], direction: null, format: '', indent: 0, type: 'root', version: 1 } };
      state.pages[0].headerHeight = 50;

      const next = documentReducer(state, { type: 'COPY_HEADER_TO_ALL', sourcePageId: state.pages[0].id });
      expect(next.pages[1].headerState).toEqual(state.pages[0].headerState);
      expect(next.pages[2].headerState).toEqual(state.pages[0].headerState);
      expect(next.pages[1].headerHeight).toBe(50);
    });
  });

  describe('COPY_FOOTER_TO_ALL', () => {
    it('copies the source footer to all pages', () => {
      const state = docWithPages(2);
      state.pages[0].footerState = { root: { children: [], direction: null, format: '', indent: 0, type: 'root', version: 1 } };
      state.pages[0].footerHeight = 40;

      const next = documentReducer(state, { type: 'COPY_FOOTER_TO_ALL', sourcePageId: state.pages[0].id });
      expect(next.pages[1].footerState).toEqual(state.pages[0].footerState);
      expect(next.pages[1].footerHeight).toBe(40);
    });
  });

  describe('CLEAR_HEADER', () => {
    it('clears header on the specified page only', () => {
      const state = docWithPages(2);
      state.pages[0].headerState = { root: { children: [], direction: null, format: '', indent: 0, type: 'root', version: 1 } };
      state.pages[1].headerState = { root: { children: [], direction: null, format: '', indent: 0, type: 'root', version: 1 } };

      const next = documentReducer(state, { type: 'CLEAR_HEADER', pageId: state.pages[0].id });
      expect(next.pages[0].headerState).toBeNull();
      expect(next.pages[0].headerHeight).toBe(0);
      expect(next.pages[1].headerState).not.toBeNull();
    });
  });

  describe('CLEAR_ALL_HEADERS', () => {
    it('clears all page headers', () => {
      const state = docWithPages(3);
      state.pages.forEach(p => {
        p.headerState = { root: { children: [], direction: null, format: '', indent: 0, type: 'root', version: 1 } };
        p.headerHeight = 30;
      });

      const next = documentReducer(state, { type: 'CLEAR_ALL_HEADERS' });
      next.pages.forEach(p => {
        expect(p.headerState).toBeNull();
        expect(p.headerHeight).toBe(0);
      });
    });
  });

  describe('CLEAR_ALL_FOOTERS', () => {
    it('clears all page footers', () => {
      const state = docWithPages(2);
      state.pages.forEach(p => {
        p.footerState = { root: { children: [], direction: null, format: '', indent: 0, type: 'root', version: 1 } };
        p.footerHeight = 20;
      });

      const next = documentReducer(state, { type: 'CLEAR_ALL_FOOTERS' });
      next.pages.forEach(p => {
        expect(p.footerState).toBeNull();
        expect(p.footerHeight).toBe(0);
      });
    });
  });

  describe('SET_HEADER_HEIGHT', () => {
    it('sets header height on the specified page', () => {
      const state = docWithPages(1);
      const next = documentReducer(state, { type: 'SET_HEADER_HEIGHT', pageId: state.pages[0].id, height: 100 });
      expect(next.pages[0].headerHeight).toBe(100);
    });

    it('clamps to max header height', () => {
      const state = docWithPages(1);
      const next = documentReducer(state, { type: 'SET_HEADER_HEIGHT', pageId: state.pages[0].id, height: 9999 });
      expect(next.pages[0].headerHeight).toBe(MAX_HEADER_HEIGHT_PX);
    });
  });

  describe('SET_FOOTER_HEIGHT', () => {
    it('sets footer height on the specified page', () => {
      const state = docWithPages(1);
      const next = documentReducer(state, { type: 'SET_FOOTER_HEIGHT', pageId: state.pages[0].id, height: 80 });
      expect(next.pages[0].footerHeight).toBe(80);
    });

    it('clamps to max footer height', () => {
      const state = docWithPages(1);
      const next = documentReducer(state, { type: 'SET_FOOTER_HEIGHT', pageId: state.pages[0].id, height: 9999 });
      expect(next.pages[0].footerHeight).toBe(MAX_FOOTER_HEIGHT_PX);
    });
  });

  describe('SET_DOCUMENT', () => {
    it('replaces the entire document state', () => {
      const state = createEmptyDocument();
      const newDoc = docWithPages(5);
      newDoc.headerFooterEnabled = true;
      const next = documentReducer(state, { type: 'SET_DOCUMENT', document: newDoc });
      expect(next).toEqual(newDoc);
    });
  });

  describe('sync version tracking', () => {
    it('initializes headerSyncVersion and footerSyncVersion to 0', () => {
      const page = createEmptyPage();
      expect(page.headerSyncVersion).toBe(0);
      expect(page.footerSyncVersion).toBe(0);
    });

    it('COPY_HEADER_TO_ALL increments headerSyncVersion on target pages', () => {
      const state = docWithPages(3);
      state.pages[0].headerState = { root: { children: [], direction: null, format: '', indent: 0, type: 'root', version: 1 } };
      const next = documentReducer(state, { type: 'COPY_HEADER_TO_ALL', sourcePageId: state.pages[0].id });
      // Source page stays the same version, targets get incremented
      expect(next.pages[1].headerSyncVersion).toBe(1);
      expect(next.pages[2].headerSyncVersion).toBe(1);
    });

    it('COPY_FOOTER_TO_ALL increments footerSyncVersion on target pages', () => {
      const state = docWithPages(2);
      state.pages[0].footerState = { root: { children: [], direction: null, format: '', indent: 0, type: 'root', version: 1 } };
      const next = documentReducer(state, { type: 'COPY_FOOTER_TO_ALL', sourcePageId: state.pages[0].id });
      expect(next.pages[1].footerSyncVersion).toBe(1);
    });

    it('CLEAR_HEADER increments headerSyncVersion on targeted page', () => {
      const state = docWithPages(2);
      state.pages[0].headerState = { root: { children: [], direction: null, format: '', indent: 0, type: 'root', version: 1 } };
      const next = documentReducer(state, { type: 'CLEAR_HEADER', pageId: state.pages[0].id });
      expect(next.pages[0].headerSyncVersion).toBe(1);
      expect(next.pages[1].headerSyncVersion).toBe(0); // untouched
    });

    it('CLEAR_ALL_HEADERS increments headerSyncVersion on all pages', () => {
      const state = docWithPages(3);
      const next = documentReducer(state, { type: 'CLEAR_ALL_HEADERS' });
      next.pages.forEach(p => expect(p.headerSyncVersion).toBe(1));
    });

    it('CLEAR_FOOTER increments footerSyncVersion on targeted page', () => {
      const state = docWithPages(1);
      state.pages[0].footerState = { root: { children: [], direction: null, format: '', indent: 0, type: 'root', version: 1 } };
      const next = documentReducer(state, { type: 'CLEAR_FOOTER', pageId: state.pages[0].id });
      expect(next.pages[0].footerSyncVersion).toBe(1);
    });

    it('CLEAR_ALL_FOOTERS increments footerSyncVersion on all pages', () => {
      const state = docWithPages(2);
      const next = documentReducer(state, { type: 'CLEAR_ALL_FOOTERS' });
      next.pages.forEach(p => expect(p.footerSyncVersion).toBe(1));
    });
  });
});
