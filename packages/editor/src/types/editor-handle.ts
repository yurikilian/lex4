/**
 * Imperative handle exposed by Lex4Editor via React ref.
 *
 * The base interface is empty — all methods are declared by extensions
 * via TypeScript module augmentation of this interface.
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
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Lex4EditorHandle {}
