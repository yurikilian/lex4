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

export {
  OptionalSegmentNode,
  $createOptionalSegmentNode,
  $isOptionalSegmentNode,
  type SerializedOptionalSegmentNode,
} from './optional-segment-node';

export {
  TOGGLE_OPTIONAL_SEGMENT_COMMAND,
  $toggleOptionalSegment,
  $getAncestorOptionalSegment,
  $unwrapOptionalSegment,
} from './optional-segment-commands';

export { OptionalSegmentPlugin } from './optional-segment-plugin';
