import type { Lex4Document } from './document';

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

  /** Additional CSS class for the editor root element */
  className?: string;
}
