export { Lex4Editor } from './components/Lex4Editor';
export type { Lex4EditorProps } from './types/editor-props';
export type { Lex4Document, PageState } from './types/document';
export { createEmptyDocument, createEmptyPage } from './types/document';

export {
  A4_WIDTH_PX,
  A4_HEIGHT_PX,
  A4_WIDTH_MM,
  A4_HEIGHT_MM,
  MAX_HEADER_HEIGHT_PX,
  MAX_FOOTER_HEIGHT_PX,
} from './constants/dimensions';

export { usePagination } from './hooks/use-pagination';
export { useOverflowDetection } from './hooks/use-overflow-detection';
export { useHeaderFooter } from './hooks/use-header-footer';
