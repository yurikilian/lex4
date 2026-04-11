import type { Lex4Document } from '../types/document';
import { createEmptyPage } from '../types/document';
import type { DocumentAction } from './document-context';
import { MAX_HEADER_HEIGHT_PX, MAX_FOOTER_HEIGHT_PX } from '../constants/dimensions';
import { debug, shortId } from '../utils/debug';

function serializedStateChanged(
  current: import('lexical').SerializedEditorState | null,
  next: import('lexical').SerializedEditorState | null,
): boolean {
  return JSON.stringify(current) !== JSON.stringify(next);
}

function withExternalSyncVersions(
  currentDocument: Lex4Document,
  nextDocument: Lex4Document,
): Lex4Document {
  const currentPages = new Map(currentDocument.pages.map(page => [page.id, page]));

  return {
    ...nextDocument,
    pages: nextDocument.pages.map(nextPage => {
      const currentPage = currentPages.get(nextPage.id);
      if (!currentPage) {
        return nextPage;
      }

      const bodyChanged = serializedStateChanged(currentPage.bodyState, nextPage.bodyState);
      const headerChanged =
        currentPage.headerHeight !== nextPage.headerHeight ||
        serializedStateChanged(currentPage.headerState, nextPage.headerState);
      const footerChanged =
        currentPage.footerHeight !== nextPage.footerHeight ||
        serializedStateChanged(currentPage.footerState, nextPage.footerState);

      return {
        ...nextPage,
        bodySyncVersion: bodyChanged ? currentPage.bodySyncVersion + 1 : currentPage.bodySyncVersion,
        headerSyncVersion: headerChanged ? currentPage.headerSyncVersion + 1 : currentPage.headerSyncVersion,
        footerSyncVersion: footerChanged ? currentPage.footerSyncVersion + 1 : currentPage.footerSyncVersion,
      };
    }),
  };
}

/**
 * Pure reducer for document state.
 * Handles all page-level and document-level mutations.
 */
export function documentReducer(state: Lex4Document, action: DocumentAction): Lex4Document {
  switch (action.type) {
    case 'ADD_PAGE': {
      const newPage = action.page ?? createEmptyPage();
      const pages = [...state.pages];
      const insertAt = action.afterIndex !== undefined ? action.afterIndex + 1 : pages.length;
      pages.splice(insertAt, 0, newPage);
      const hasBody = !!(action.page?.bodyState?.root?.children?.length);
      debug('reducer', `ADD_PAGE id=${shortId(newPage.id)} at=${insertAt} withBody=${hasBody} totalPages=${pages.length}`);
      return { ...state, pages };
    }

    case 'REMOVE_PAGE': {
      if (state.pages.length <= 1) {
        debug('reducer', `REMOVE_PAGE id=${shortId(action.pageId)} — skipped (last page)`);
        return state;
      }
      debug('reducer', `REMOVE_PAGE id=${shortId(action.pageId)} remaining=${state.pages.length - 1}`);
      return {
        ...state,
        pages: state.pages.filter(p => p.id !== action.pageId),
      };
    }

    case 'UPDATE_PAGE_BODY': {
      const childCount = action.bodyState?.root?.children?.length ?? 0;
      debug('reducer', `UPDATE_PAGE_BODY id=${shortId(action.pageId)} children=${childCount}`);
      return {
        ...state,
        pages: state.pages.map(p =>
          p.id === action.pageId ? { ...p, bodyState: action.bodyState } : p,
        ),
      };
    }

    case 'UPDATE_PAGE_HEADER': {
      debug('reducer', `UPDATE_PAGE_HEADER id=${shortId(action.pageId)}`);
      return {
        ...state,
        pages: state.pages.map(p =>
          p.id === action.pageId ? { ...p, headerState: action.headerState } : p,
        ),
      };
    }

    case 'UPDATE_PAGE_FOOTER': {
      debug('reducer', `UPDATE_PAGE_FOOTER id=${shortId(action.pageId)}`);
      return {
        ...state,
        pages: state.pages.map(p =>
          p.id === action.pageId ? { ...p, footerState: action.footerState } : p,
        ),
      };
    }

    case 'SET_HEADER_FOOTER_ENABLED': {
      debug('reducer', `SET_HEADER_FOOTER_ENABLED enabled=${action.enabled}`);
      return { ...state, headerFooterEnabled: action.enabled };
    }

    case 'SET_PAGE_COUNTER_MODE': {
      debug('reducer', `SET_PAGE_COUNTER_MODE mode=${action.mode}`);
      return { ...state, pageCounterMode: action.mode };
    }

    case 'COPY_HEADER_TO_ALL': {
      debug('reducer', `COPY_HEADER_TO_ALL from=${shortId(action.sourcePageId)}`);
      const source = state.pages.find(p => p.id === action.sourcePageId);
      if (!source) return state;
      return {
        ...state,
        defaultHeaderState: source.headerState,
        defaultHeaderHeight: source.headerHeight,
        pages: state.pages.map(p => ({
          ...p,
          headerState: source.headerState,
          headerHeight: source.headerHeight,
          headerSyncVersion: p.headerSyncVersion + 1,
        })),
      };
    }

    case 'COPY_FOOTER_TO_ALL': {
      debug('reducer', `COPY_FOOTER_TO_ALL from=${shortId(action.sourcePageId)}`);
      const source = state.pages.find(p => p.id === action.sourcePageId);
      if (!source) return state;
      return {
        ...state,
        defaultFooterState: source.footerState,
        defaultFooterHeight: source.footerHeight,
        pages: state.pages.map(p => ({
          ...p,
          footerState: source.footerState,
          footerHeight: source.footerHeight,
          footerSyncVersion: p.footerSyncVersion + 1,
        })),
      };
    }

    case 'CLEAR_HEADER': {
      debug('reducer', `CLEAR_HEADER id=${shortId(action.pageId)}`);
      return {
        ...state,
        pages: state.pages.map(p =>
          p.id === action.pageId
            ? { ...p, headerState: null, headerHeight: 0, headerSyncVersion: p.headerSyncVersion + 1 }
            : p,
        ),
      };
    }

    case 'CLEAR_FOOTER': {
      debug('reducer', `CLEAR_FOOTER id=${shortId(action.pageId)}`);
      return {
        ...state,
        pages: state.pages.map(p =>
          p.id === action.pageId
            ? { ...p, footerState: null, footerHeight: 0, footerSyncVersion: p.footerSyncVersion + 1 }
            : p,
        ),
      };
    }

    case 'CLEAR_ALL_HEADERS': {
      debug('reducer', 'CLEAR_ALL_HEADERS');
      return {
        ...state,
        defaultHeaderState: null,
        defaultHeaderHeight: 0,
        pages: state.pages.map(p => ({
          ...p, headerState: null, headerHeight: 0, headerSyncVersion: p.headerSyncVersion + 1,
        })),
      };
    }

    case 'CLEAR_ALL_FOOTERS': {
      debug('reducer', 'CLEAR_ALL_FOOTERS');
      return {
        ...state,
        defaultFooterState: null,
        defaultFooterHeight: 0,
        pages: state.pages.map(p => ({
          ...p, footerState: null, footerHeight: 0, footerSyncVersion: p.footerSyncVersion + 1,
        })),
      };
    }

    case 'CLEAR_DOCUMENT_CONTENT': {
      debug('reducer', 'CLEAR_DOCUMENT_CONTENT');
      const firstPage = state.pages[0];
      return {
        ...state,
        pages: [{
          ...createEmptyPage(firstPage?.id),
          headerState: firstPage?.headerState ?? null,
          footerState: firstPage?.footerState ?? null,
          headerHeight: firstPage?.headerHeight ?? 0,
          footerHeight: firstPage?.footerHeight ?? 0,
          bodySyncVersion: (firstPage?.bodySyncVersion ?? 0) + 1,
          headerSyncVersion: firstPage?.headerSyncVersion ?? 0,
          footerSyncVersion: firstPage?.footerSyncVersion ?? 0,
        }],
      };
    }

    case 'SET_HEADER_HEIGHT': {
      const clamped = Math.min(action.height, MAX_HEADER_HEIGHT_PX);
      debug('header', `SET_HEADER_HEIGHT id=${shortId(action.pageId)} raw=${action.height} clamped=${clamped}`);
      return {
        ...state,
        pages: state.pages.map(p =>
          p.id === action.pageId ? { ...p, headerHeight: clamped } : p,
        ),
      };
    }

    case 'SET_FOOTER_HEIGHT': {
      const clamped = Math.min(action.height, MAX_FOOTER_HEIGHT_PX);
      debug('footer', `SET_FOOTER_HEIGHT id=${shortId(action.pageId)} raw=${action.height} clamped=${clamped}`);
      return {
        ...state,
        pages: state.pages.map(p =>
          p.id === action.pageId ? { ...p, footerHeight: clamped } : p,
        ),
      };
    }

    case 'SET_DOCUMENT': {
      debug('reducer', `SET_DOCUMENT pages=${action.document.pages.length}`);
      return withExternalSyncVersions(state, action.document);
    }

    default:
      return state;
  }
}
