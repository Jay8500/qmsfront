/**
 * Domain models — column names mirror the Postgres tables
 * (public.entity / public.entity_value) so swapping the IndexedDB service
 * for a Node/HttpClient service later requires no shape changes.
 */

export type ValueType = 'TEXT' | 'CODE' | 'NUMBER' | 'COLOR' | 'BOOLEAN';

export interface Entity {
  entity_id: string;
  entity_code: string;
  entity_name: string;
  category_type: string;
  description?: string | null;
  display_order: number;
  is_system: boolean;
  is_editable: boolean;
  values: boolean;
  is_active: boolean;
  createdAt?: string;
  updatedAt?: string | null;
}

export interface EntityValue {
  entityValueId: string;
  entity_id: string;
  valueCode: string;
  displayValue: string;
  shortName?: string | null;
  description?: string | null;
  display_order: number;
  valueType: ValueType;
  /** UI-only convenience for COLOR type (no DB column in base schema). */
  colorHex?: string | null;
  parentEntityValueId?: string | null;
  effectiveFrom?: string | null; // ISO yyyy-MM-dd
  effectiveTo?: string | null; // ISO yyyy-MM-dd
  isDefault: boolean;
  is_system: boolean;
  is_editable: boolean;
  isVisible: boolean;
  is_active: boolean;
  createdAt?: string;
  updatedAt?: string | null;
}

/** Entity enriched with rollups for the grid + cards. */
export interface EntityWithCounts extends Entity {
  valueCount: number;
  activeValueCount: number;
  defaultValue: string | null;
}

export interface RefDataStats {
  totalEntities: number;
  totalValues: number;
  systemLocked: number;
  activeValues: number;
  avgPerEntity: number;
  inactiveValues: number;
}

export const VALUE_TYPES: ValueType[] = ['TEXT', 'CODE', 'NUMBER', 'COLOR', 'BOOLEAN'];
