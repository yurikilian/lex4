export type { VariableDefinition, VariableContextValue } from './types';

export {
  VariableNode,
  $createVariableNode,
  $isVariableNode,
  type SerializedVariableNode,
} from './variable-node';

export {
  INSERT_VARIABLE_COMMAND,
  insertVariable,
} from './variable-commands';

export { VariablePlugin } from './variable-plugin';
