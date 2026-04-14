import type { Lex4Document } from './document';
import type { Lex4Extension } from '../extensions/types';
import type { DocumentAst } from '../ast/types';

/** Public props for the Lex4Editor component */
export interface Lex4EditorProps {
  /** Initial document state. Defaults to a single empty page. */
  initialDocument?: Lex4Document;

  /** Called whenever the document state changes */
  onDocumentChange?: (doc: Lex4Document) => void;

  /** Initial header/footer toggle state. Defaults to false. */
  headerFooterEnabled?: boolean;

  /** Called when the header/footer toggle changes */
  onHeaderFooterToggle?: (enabled: boolean) => void;

  /** Whether the editor is read-only */
  readOnly?: boolean;

  /** Capture undo/redo shortcuts at the window level, even when focus is outside the document. Defaults to true. */
  captureHistoryShortcutsOnWindow?: boolean;

  /** Called when the user triggers save/export. Provides both the AST and its JSON serialization. */
  onSave?: (payload: { ast: DocumentAst; json: string }) => void;

  /**
   * Extensions to load into the editor.
   * Each extension can contribute nodes, plugins, toolbar items, side panels, and imperative handle methods.
   * @example extensions={[defaultTheme(), astExtension(), variablesExtension(defs)]}
   */
  extensions?: Lex4Extension[];

  /** Additional CSS class for the editor root element */
  className?: string;
}
