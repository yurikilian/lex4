import type { EditorThemeClasses, Klass, LexicalNode } from 'lexical';
import type { Lex4Document } from '../types/document';

/**
 * Context passed to extension handleMethods factories.
 * Provides read access to editor state so extensions can build
 * their imperative API methods.
 */
export interface ExtensionContext {
  getDocument: () => Lex4Document;
  getActiveEditor: () => import('lexical').LexicalEditor | null;
  getExtensionState: <T = unknown>(key: string) => T | undefined;
  setExtensionState: <T = unknown>(key: string, value: T) => void;
}

/**
 * Lex4Extension — Plugin-based extension contract.
 *
 * Extensions add capabilities to the editor without requiring
 * hard-wired imports. Each extension can contribute:
 * - Lexical nodes (custom block/inline node types)
 * - Body plugins (rendered inside every page's LexicalComposer)
 * - Toolbar items (rendered in the toolbar extension slot)
 * - Side panels (rendered to the right of the document area)
 * - Provider wrappers (React context providers wrapping the editor)
 * - Imperative handle methods (merged into the ref API)
 */
export interface Lex4Extension {
  /** Unique extension name used for identification. */
  name: string;

  /** Additional Lexical node classes to register in every editor instance. */
  nodes?: Klass<LexicalNode>[];

  /** Plugin components rendered inside each page body's LexicalComposer. */
  bodyPlugins?: React.ComponentType[];

  /** Components rendered in the toolbar's extension slot. */
  toolbarItems?: React.ComponentType[];

  /** Components rendered in the toolbar's right-aligned end area (next to history toggle). */
  toolbarEndItems?: React.ComponentType[];

  /** Component rendered as a right side panel. */
  sidePanel?: React.ComponentType;

  /**
   * Provider component that wraps the editor tree.
   * Useful for injecting React contexts.
   */
  provider?: React.ComponentType<{ children: React.ReactNode }>;

  /**
   * Lexical editor theme overrides contributed by this extension.
   * Merged into the base theme.
   */
  themeOverrides?: Partial<EditorThemeClasses>;

  /**
   * CSS custom property overrides applied on the `.lex4-editor` root.
   * Use to retheme the editor — e.g. `{ '--color-primary': 'hsl(350 80% 50%)' }`.
   */
  cssVariables?: Record<string, string>;

  /**
   * Extra CSS class name(s) added to the `.lex4-editor` root element.
   * Useful for scoping extension-specific styles.
   */
  rootClassName?: string;

  /**
   * Factory that returns imperative handle methods.
   * These are merged into the Lex4EditorHandle exposed via ref.
   */
  handleMethods?: (ctx: ExtensionContext) => Record<string, (...args: never[]) => unknown>;
}

/**
 * Resolved extension data after processing all extensions.
 * Used internally by the editor to wire everything together.
 */
export interface ResolvedExtensions {
  nodes: Klass<LexicalNode>[];
  bodyPlugins: React.ComponentType[];
  toolbarItems: React.ComponentType[];
  toolbarEndItems: React.ComponentType[];
  sidePanels: React.ComponentType[];
  providers: React.ComponentType<{ children: React.ReactNode }>[];
  themeOverrides: Partial<EditorThemeClasses>;
  cssVariables: Record<string, string>;
  rootClassNames: string[];
  handleFactories: Array<(ctx: ExtensionContext) => Record<string, (...args: never[]) => unknown>>;
}

/**
 * Processes an array of extensions into a single resolved structure.
 */
export function resolveExtensions(extensions: Lex4Extension[]): ResolvedExtensions {
  const resolved: ResolvedExtensions = {
    nodes: [],
    bodyPlugins: [],
    toolbarItems: [],
    toolbarEndItems: [],
    sidePanels: [],
    providers: [],
    themeOverrides: {},
    cssVariables: {},
    rootClassNames: [],
    handleFactories: [],
  };

  for (const ext of extensions) {
    if (ext.nodes) resolved.nodes.push(...ext.nodes);
    if (ext.bodyPlugins) resolved.bodyPlugins.push(...ext.bodyPlugins);
    if (ext.toolbarItems) resolved.toolbarItems.push(...ext.toolbarItems);
    if (ext.toolbarEndItems) resolved.toolbarEndItems.push(...ext.toolbarEndItems);
    if (ext.sidePanel) resolved.sidePanels.push(ext.sidePanel);
    if (ext.provider) resolved.providers.push(ext.provider);
    if (ext.themeOverrides) {
      resolved.themeOverrides = { ...resolved.themeOverrides, ...ext.themeOverrides };
    }
    if (ext.cssVariables) {
      Object.assign(resolved.cssVariables, ext.cssVariables);
    }
    if (ext.rootClassName) resolved.rootClassNames.push(ext.rootClassName);
    if (ext.handleMethods) resolved.handleFactories.push(ext.handleMethods);
  }

  return resolved;
}
