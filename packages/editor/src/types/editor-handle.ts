/**
 * Base imperative handle exposed by Lex4Editor via React ref.
 *
 * This is always empty — all methods are contributed by extensions.
 * The actual handle type is dynamic based on which extensions are loaded.
 *
 * Common extension-provided methods:
 * - astExtension: getDocumentAst(), getDocumentJson(), buildSavePayload()
 * - variablesExtension: insertVariable(), refreshVariables()
 */
export interface Lex4EditorHandle {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: (...args: any[]) => any;
}
