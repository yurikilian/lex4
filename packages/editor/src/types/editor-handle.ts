import type { Lex4Document } from './document';

/**
 * Imperative handle exposed by Lex4Editor via React ref.
 *
 * Base methods control editor chrome that is always present.
 * Extensions can still augment this interface with extra methods.
 *
 * @example
 * ```ts
 * // In a custom extension file:
 * declare module '@yurikilian/lex4' {
 *   interface Lex4EditorHandle {
 *     myMethod: () => void;
 *   }
 * }
 * ```
 */
export interface Lex4EditorHandle {
  setHistorySidebarOpen: (open: boolean) => void;
  toggleHistorySidebar: () => void;
  insertDocumentContent: (document: Lex4Document) => boolean;
}
