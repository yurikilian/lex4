import type { Lex4Document } from '../types/document';
import { createEmptyPage } from '../types/document';
import type { DocumentAction } from './document-context';
import { MAX_HEADER_HEIGHT_PX, MAX_FOOTER_HEIGHT_PX } from '../constants/dimensions';

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
      return { ...state, pages };
    }

    case 'REMOVE_PAGE': {
      if (state.pages.length <= 1) return state;
      return {
        ...state,
        pages: state.pages.filter(p => p.id !== action.pageId),
      };
    }

    case 'UPDATE_PAGE_BODY': {
      return {
        ...state,
        pages: state.pages.map(p =>
          p.id === action.pageId ? { ...p, bodyState: action.bodyState } : p,
        ),
      };
    }

    case 'UPDATE_PAGE_HEADER': {
      return {
        ...state,
        pages: state.pages.map(p =>
          p.id === action.pageId ? { ...p, headerState: action.headerState } : p,
        ),
      };
    }

    case 'UPDATE_PAGE_FOOTER': {
      return {
        ...state,
        pages: state.pages.map(p =>
          p.id === action.pageId ? { ...p, footerState: action.footerState } : p,
        ),
      };
    }

    case 'SET_HEADER_FOOTER_ENABLED': {
      return { ...state, headerFooterEnabled: action.enabled };
    }

    case 'COPY_HEADER_TO_ALL': {
      const source = state.pages.find(p => p.id === action.sourcePageId);
      if (!source) return state;
      return {
        ...state,
        pages: state.pages.map(p => ({
          ...p,
          headerState: source.headerState,
          headerHeight: source.headerHeight,
        })),
      };
    }

    case 'COPY_FOOTER_TO_ALL': {
      const source = state.pages.find(p => p.id === action.sourcePageId);
      if (!source) return state;
      return {
        ...state,
        pages: state.pages.map(p => ({
          ...p,
          footerState: source.footerState,
          footerHeight: source.footerHeight,
        })),
      };
    }

    case 'CLEAR_HEADER': {
      return {
        ...state,
        pages: state.pages.map(p =>
          p.id === action.pageId ? { ...p, headerState: null, headerHeight: 0 } : p,
        ),
      };
    }

    case 'CLEAR_FOOTER': {
      return {
        ...state,
        pages: state.pages.map(p =>
          p.id === action.pageId ? { ...p, footerState: null, footerHeight: 0 } : p,
        ),
      };
    }

    case 'CLEAR_ALL_HEADERS': {
      return {
        ...state,
        pages: state.pages.map(p => ({ ...p, headerState: null, headerHeight: 0 })),
      };
    }

    case 'CLEAR_ALL_FOOTERS': {
      return {
        ...state,
        pages: state.pages.map(p => ({ ...p, footerState: null, footerHeight: 0 })),
      };
    }

    case 'SET_HEADER_HEIGHT': {
      const clamped = Math.min(action.height, MAX_HEADER_HEIGHT_PX);
      return {
        ...state,
        pages: state.pages.map(p =>
          p.id === action.pageId ? { ...p, headerHeight: clamped } : p,
        ),
      };
    }

    case 'SET_FOOTER_HEIGHT': {
      const clamped = Math.min(action.height, MAX_FOOTER_HEIGHT_PX);
      return {
        ...state,
        pages: state.pages.map(p =>
          p.id === action.pageId ? { ...p, footerHeight: clamped } : p,
        ),
      };
    }

    case 'SET_DOCUMENT': {
      return action.document;
    }

    default:
      return state;
  }
}
