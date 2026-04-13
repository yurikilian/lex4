/**
 * Variable system types.
 *
 * These types define the variable catalog, definitions,
 * and source interface used by the editor UI and serializer.
 */

/** Describes a single variable that can be inserted into the document. */
export interface VariableDefinition {
  /** Dot-notation key, e.g. "customer.name" */
  key: string;
  /** Human-readable label shown in the picker */
  label: string;
  /** Optional description for tooltips */
  description?: string;
  /** Expected runtime value type */
  valueType?: 'string' | 'number' | 'date' | 'boolean';
  /** Grouping key for the picker UI, e.g. "Customer", "Proposal" */
  group?: string;
}

/** Context value exposed by the VariableProvider. */
export interface VariableContextValue {
  definitions: VariableDefinition[];
  getDefinition(key: string): VariableDefinition | undefined;
  refreshDefinitions(newDefs: VariableDefinition[]): void;
}
