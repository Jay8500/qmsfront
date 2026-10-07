import { Entity, EntityValue, ValueType } from './models';

/**
 * First-run seed data (mirrors the HTML mockup). Loaded into IndexedDB only
 * when the entity store is empty. Delete the `hqms-refdata` DB in DevTools →
 * Application → IndexedDB to re-seed.
 */
const nid = () => crypto.randomUUID();

interface SeedEntity {
  code: string;
  name: string;
  cat: string;
  desc: string;
  order: number;
  system: boolean;
  editable: boolean;
  custom: boolean;
  active: boolean;
  values: SeedValue[];
}
interface SeedValue {
  code: string;
  display: string;
  short: string;
  order: number;
  def?: boolean;
  active?: boolean;
  type?: ValueType;
  color?: string;
}

const v = (
  code: string,
  display: string,
  short: string,
  order: number,
  def = false,
  active = true,
  type: ValueType = 'TEXT',
  color?: string,
): SeedValue => ({ code, display, short, order, def, active, type, color });

const SEED: SeedEntity[] = [
  {
    code: 'TITLE', name: 'Title / Salutation', cat: 'Demographics', desc: 'Patient & staff salutations.',
    order: 1, system: true, editable: true, custom: false, active: true,
    values: [
      v('MR', 'Mr.', 'Mr', 1, true), v('MS', 'Ms.', 'Ms', 2), v('MRS', 'Mrs.', 'Mrs', 3),
      v('DR', 'Dr.', 'Dr', 4), v('PROF', 'Prof.', 'Prof', 5), v('REV', 'Rev.', 'Rev', 6, false, false),
    ],
  },
  {
    code: 'GENDER', name: 'Gender', cat: 'Demographics', desc: 'Administrative gender per HL7.',
    order: 2, system: true, editable: false, custom: false, active: true,
    values: [
      v('M', 'Male', 'M', 1, true), v('F', 'Female', 'F', 2),
      v('O', 'Other', 'O', 3), v('U', 'Unknown', 'U', 4, false, false),
    ],
  },
  {
    code: 'MARITAL_STATUS', name: 'Marital Status', cat: 'Demographics', desc: 'Patient marital status.',
    order: 3, system: false, editable: true, custom: false, active: true,
    values: [
      v('SIN', 'Single', 'S', 1, true), v('MAR', 'Married', 'M', 2),
      v('DIV', 'Divorced', 'D', 3), v('WID', 'Widowed', 'W', 4),
    ],
  },
  {
    code: 'BLOOD_GROUP', name: 'Blood Group', cat: 'Clinical', desc: 'ABO / Rh typing.',
    order: 1, system: true, editable: false, custom: false, active: true,
    values: [
      v('APOS', 'A+', 'A+', 1), v('ANEG', 'A−', 'A−', 2), v('BPOS', 'B+', 'B+', 3), v('BNEG', 'B−', 'B−', 4),
      v('OPOS', 'O+', 'O+', 5, true), v('ONEG', 'O−', 'O−', 6), v('ABPOS', 'AB+', 'AB+', 7), v('ABNEG', 'AB−', 'AB−', 8),
    ],
  },
  {
    code: 'ALLERGY_SEVERITY', name: 'Allergy Severity', cat: 'Clinical', desc: 'Reaction severity grading.',
    order: 2, system: false, editable: true, custom: false, active: true,
    values: [
      v('MILD', 'Mild', 'MILD', 1, false, true, 'COLOR', '#12b76a'),
      v('MOD', 'Moderate', 'MOD', 2, false, true, 'COLOR', '#f79009'),
      v('SEV', 'Severe', 'SEV', 3, false, true, 'COLOR', '#f04438'),
      v('ANA', 'Anaphylaxis', 'ANA', 4, false, true, 'COLOR', '#b42318'),
    ],
  },
  {
    code: 'INCIDENT_CATEGORY', name: 'Incident Category', cat: 'Quality & Safety', desc: 'Top-level incident classification.',
    order: 1, system: false, editable: true, custom: true, active: true,
    values: [
      v('FALL', 'Patient Fall', 'FALL', 1), v('MED', 'Medication Error', 'MED', 2, true),
      v('HAI', 'Healthcare-Assoc. Infection', 'HAI', 3), v('EQUIP', 'Equipment Failure', 'EQUIP', 4),
      v('PRES', 'Pressure Injury', 'PRES', 5),
    ],
  },
  {
    code: 'INCIDENT_SEVERITY', name: 'Incident Severity (SAC)', cat: 'Quality & Safety', desc: 'Severity Assessment Code.',
    order: 2, system: true, editable: true, custom: false, active: true,
    values: [
      v('SAC1', 'SAC 1 — Severe', 'SAC1', 1, false, true, 'COLOR', '#b42318'),
      v('SAC2', 'SAC 2 — Moderate', 'SAC2', 2, false, true, 'COLOR', '#f79009'),
      v('SAC3', 'SAC 3 — Minor', 'SAC3', 3, false, true, 'COLOR', '#eab308'),
      v('SAC4', 'SAC 4 — No harm', 'SAC4', 4, false, true, 'COLOR', '#12b76a'),
    ],
  },
  {
    code: 'DEPARTMENT', name: 'Department / Unit', cat: 'Organization', desc: 'Reporting clinical units.',
    order: 1, system: false, editable: true, custom: true, active: true,
    values: [
      v('ED', 'Emergency Dept.', 'ED', 1), v('ICU', 'Intensive Care', 'ICU', 2),
      v('OT', 'Operating Theatre', 'OT', 3), v('WARD', 'General Ward', 'WARD', 4, true),
      v('LAB', 'Laboratory', 'LAB', 5), v('RAD', 'Radiology', 'RAD', 6),
    ],
  },
  {
    code: 'CAPA_STATUS', name: 'CAPA Status', cat: 'Quality & Safety', desc: 'Corrective/Preventive action workflow states.',
    order: 3, system: true, editable: false, custom: false, active: true,
    values: [
      v('OPEN', 'Open', 'OPEN', 1, true), v('INPROG', 'In Progress', 'WIP', 2),
      v('VERIFY', 'Pending Verification', 'VER', 3), v('CLOSED', 'Closed', 'CLSD', 4),
      v('CANCEL', 'Cancelled', 'CNCL', 5, false, false),
    ],
  },
  {
    code: 'RELIGION', name: 'Religion', cat: 'Demographics', desc: 'Patient religion.',
    order: 4, system: false, editable: true, custom: true, active: false,
    values: [
      v('HIN', 'Hinduism', 'HIN', 1), v('ISL', 'Islam', 'ISL', 2),
      v('CHR', 'Christianity', 'CHR', 3), v('OTH', 'Other', 'OTH', 4),
    ],
  },
];

export function buildSeed(): { entities: Entity[]; values: EntityValue[] } {
  const entities: Entity[] = [];
  const values: EntityValue[] = [];
  const now = new Date().toISOString();

  for (const s of SEED) {
    const entity_id = nid();
    entities.push({
      entity_id,
      entity_code: s.code,
      entity_name: s.name,
      category_type: s.cat,
      description: s.desc || null,
      display_order: s.order,
      is_system: s.system,
      is_editable: s.editable,
      values: s.custom,
      is_active: s.active,
      createdAt: now,
      updatedAt: null,
    });
    for (const sv of s.values) {
      values.push({
        entityValueId: nid(),
        entity_id,
        valueCode: sv.code,
        displayValue: sv.display,
        shortName: sv.short || null,
        description: null,
        display_order: sv.order,
        valueType: sv.type ?? 'TEXT',
        colorHex: sv.color ?? null,
        parentEntityValueId: null,
        effectiveFrom: null,
        effectiveTo: null,
        isDefault: sv.def ?? false,
        is_system: false,
        is_editable: true,
        isVisible: true,
        is_active: sv.active ?? true,
        createdAt: now,
        updatedAt: null,
      });
    }
  }
  return { entities, values };
}
