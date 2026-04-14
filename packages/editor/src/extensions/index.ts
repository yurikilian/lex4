export type {
  Lex4Extension,
  ExtensionContext,
  ResolvedExtensions,
} from './types';

export { resolveExtensions } from './types';

export {
  ExtensionProvider,
  ExtensionStateProvider,
  useExtensions,
  useExtensionContext,
  useExtensionState,
} from './extension-context';

export { astExtension } from './ast-extension';
export { variablesExtension } from './variables-extension';
