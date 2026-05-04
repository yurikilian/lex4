import type { Lex4Document } from './document';
import type { Lex4Extension } from '../extensions/types';
import type { DocumentAst } from '../ast/types';
import type { Lex4Translations } from '../i18n/types';

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export interface Lex4ToolbarControlConfig {
  /** Controls whether the toolbar control is rendered. Defaults to true. */
  visible?: boolean;
  /** Controls whether the toolbar control renders its text label. Defaults to true. */
  showLabel?: boolean;
}

export interface Lex4ToolbarConfig {
  /** Configuration for the history toggle. */
  history?: Lex4ToolbarControlConfig;
  /** Configuration for the variables toggle provided by variablesExtension. */
  variables?: Lex4ToolbarControlConfig;
  /** Configuration for the header/footer toggle group. */
  headerFooter?: Lex4ToolbarControlConfig;
}

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

  /** Called when the user triggers save/export. Provides the full document, AST, and its JSON serialization. */
  onSave?: (payload: { document: Lex4Document; ast: DocumentAst; json: string }) => void;

  /**
   * Extensions to load into the editor.
   * Each extension can contribute nodes, plugins, toolbar items, side panels, and imperative handle methods.
   * @example extensions={[defaultTheme(), astExtension(), variablesExtension(defs)]}
   */
  extensions?: Lex4Extension[];

  /**
   * Translation overrides for i18n. Partial overrides are deep-merged with defaults (English).
   * @example translations={{ toolbar: { undo: 'Desfazer' } }}
   */
  translations?: DeepPartial<Lex4Translations>;

  /** Configuration for optional toolbar controls such as history and variables. */
  toolbar?: Lex4ToolbarConfig;

  /** Additional CSS class for the editor root element */
  className?: string;
}
