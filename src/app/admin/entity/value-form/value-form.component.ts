import {
  Component,
  computed,
  effect,
  input,
  model,
  output,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DialogModule } from "primeng/dialog";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { TextareaModule } from "primeng/textarea";
import { InputNumberModule } from "primeng/inputnumber";
import { ToggleSwitchModule } from "primeng/toggleswitch";
import { SelectModule } from "primeng/select";
import { DatePickerModule } from "primeng/datepicker";
import { EntityValue, ValueType, VALUE_TYPES } from "../core/models";

export interface ValueFormResult {
  valueCode: string;
  displayValue: string;
  shortName: string;
  valueType: ValueType;
  colorHex: string | null;
  display_order: number;
  parentEntityValueId: string | null;
  description: string;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  isDefault: boolean;
  isVisible: boolean;
  is_editable: boolean;
  is_active: boolean;
}

type ValueForm = Omit<ValueFormResult, "effectiveFrom" | "effectiveTo"> & {
  effectiveFrom: Date | null;
  effectiveTo: Date | null;
};

const empty = (order: number): ValueForm => ({
  valueCode: "",
  displayValue: "",
  shortName: "",
  valueType: "TEXT",
  colorHex: null,
  display_order: order,
  parentEntityValueId: null,
  description: "",
  effectiveFrom: null,
  effectiveTo: null,
  isDefault: false,
  isVisible: true,
  is_editable: true,
  is_active: true,
});

const toIso = (d: Date | null): string | null =>
  d
    ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    : null;
const fromIso = (s: string | null | undefined): Date | null =>
  s ? new Date(s + "T00:00:00") : null;

/* ------------------------------------------------------------------ */
/* Reusable validator building blocks.                                */
/* ------------------------------------------------------------------ */
type Validator<F> = (value: any, form: F) => string | null;

const required =
  <F>(message: string): Validator<F> =>
  (v) =>
    v === null || v === undefined || String(v).trim() === "" ? message : null;

const minLength =
  <F>(n: number, message: string): Validator<F> =>
  (v) =>
    v != null && String(v).trim().length > 0 && String(v).trim().length < n
      ? message
      : null;

const maxLength =
  <F>(n: number, message: string): Validator<F> =>
  (v) =>
    v != null && String(v).trim().length > n ? message : null;

const pattern =
  <F>(re: RegExp, message: string): Validator<F> =>
  (v) =>
    v != null && String(v).trim() !== "" && !re.test(String(v).trim())
      ? message
      : null;

const minNumber =
  <F>(n: number, message: string): Validator<F> =>
  (v) =>
    v != null && Number(v) < n ? message : null;

/** Colour is only meaningful — and only required — when Value Type is COLOR. */
const colorRequiredForColorType: Validator<ValueForm> = (value, form) =>
  form.valueType === "COLOR" && (!value || String(value).trim() === "")
    ? "Colour is required when Value Type is Color."
    : null;

/** Effective To, if set, must not be before Effective From. */
const effectiveToNotBeforeFrom: Validator<ValueForm> = (value, form) => {
  if (!value || !form.effectiveFrom) return null;
  return value < form.effectiveFrom
    ? "Effective To cannot be before Effective From."
    : null;
};

/**
 * Validation rules per field.
 * - `enabled: false` turns OFF the entire field's validation (skipped on
 *   blur, change, and save) — flip it back on any time without touching
 *   the template.
 * - `validators` runs in order; the first one that returns a message wins.
 */
type FieldRule<F> = { enabled: boolean; validators: Validator<F>[] };

const RULES: Record<keyof ValueForm, FieldRule<ValueForm>> = {
  valueCode: {
    enabled: true,
    validators: [
      required("Value Code is required."),
      pattern(
        /^[A-Za-z0-9_]+$/,
        "Only letters, numbers, and underscores are allowed — no spaces.",
      ),
      maxLength(40, "Value Code must be 40 characters or fewer."),
    ],
  },
  displayValue: {
    enabled: true,
    validators: [
      required("Display Value is required."),
      maxLength(100, "Display Value must be 100 characters or fewer."),
    ],
  },
  shortName: {
    enabled: true,
    validators: [maxLength(20, "Short Name must be 20 characters or fewer.")],
  },
  valueType: { enabled: false, validators: [] },
  colorHex: {
    enabled: true,
    validators: [colorRequiredForColorType],
  },
  display_order: {
    enabled: true,
    validators: [
      required("Display Order is required."),
      minNumber(1, "Display Order must be 1 or greater."),
    ],
  },
  parentEntityValueId: { enabled: false, validators: [] },
  description: {
    enabled: true,
    validators: [
      maxLength(300, "Description must be 300 characters or fewer."),
    ],
  },
  effectiveFrom: { enabled: false, validators: [] },
  effectiveTo: {
    enabled: true,
    validators: [effectiveToNotBeforeFrom],
  },
  isDefault: { enabled: false, validators: [] },
  isVisible: { enabled: false, validators: [] },
  is_editable: { enabled: false, validators: [] },
  is_active: { enabled: false, validators: [] },
};

@Component({
  selector: "app-value-form",
  standalone: true,
  imports: [
    FormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    InputNumberModule,
    ToggleSwitchModule,
    SelectModule,
    DatePickerModule,
  ],
  templateUrl: './value-form.component.html',
  styleUrl : './value-form.component.css'
})
export class ValueFormComponent {
  visible = model<boolean>(false);
  value = input<EntityValue | null>(null);
  entityName = input<string>("");
  entityCode = input<string>("");
  nextOrder = input<number>(1);
  siblings = input<EntityValue[]>([]);

  save = output<ValueFormResult>();

  editing = computed(() => !!this.value());
  subtitle = computed(() => `${this.entityName()} · ${this.entityCode()}`);
  valueTypes = VALUE_TYPES;
  form: ValueForm = empty(1);

  /** Error message + touched state per field, driven by RULES above. */
  errors = signal<Partial<Record<keyof ValueForm, string>>>({});
  touched = signal<Partial<Record<keyof ValueForm, boolean>>>({});

  parentOptions = computed(() =>
    this.siblings()
      .filter((s) => s.entityValueId !== this.value()?.entityValueId)
      .map((s) => ({ label: s.displayValue, value: s.entityValueId })),
  );

  constructor() {
    effect(() => {
      this.value();
      this.reset();
    });
  }

  /** Resets form data AND clears all errors/touched state — used on open,
   *  and again after a successful create so placeholders reappear cleanly. */
  reset(): void {
    const v = this.value();
    this.form = v
      ? {
          valueCode: v.valueCode,
          displayValue: v.displayValue,
          shortName: v.shortName ?? "",
          valueType: v.valueType,
          colorHex: v.colorHex ?? "#12b76a",
          display_order: v.display_order,
          parentEntityValueId: v.parentEntityValueId ?? null,
          description: v.description ?? "",
          effectiveFrom: fromIso(v.effectiveFrom),
          effectiveTo: fromIso(v.effectiveTo),
          isDefault: v.isDefault,
          isVisible: v.isVisible,
          is_editable: v.is_editable,
          is_active: v.is_active,
        }
      : empty(this.nextOrder());
    this.errors.set({});
    this.touched.set({});
  }

  /** Single entry point for most field edits — keeps form + live validation in sync. */
  updateField<K extends keyof ValueForm>(name: K, value: ValueForm[K]): void {
    this.form = { ...this.form, [name]: value };
    if (this.touched()[name]) {
      this.revalidate(name);
    }
  }

  /** Value Type drives whether Colour is required/visible, so switching it
   *  must re-check Colour immediately — not just on Colour's own blur. */
  onValueTypeChange(value: ValueType): void {
    this.form = { ...this.form, valueType: value };
    // Give a sensible default colour the first time someone picks COLOR.
    if (value === "COLOR" && !this.form.colorHex) {
      this.form = { ...this.form, colorHex: "#12b76a" };
    }
    this.revalidate("colorHex");
  }

  /** Effective From changing can invalidate an already-set Effective To,
   *  so re-check Effective To immediately as a dependent field. */
  onEffectiveFromChange(value: Date | null): void {
    this.form = { ...this.form, effectiveFrom: value };
    if (this.form.effectiveTo) {
      this.touched.update((t) => ({ ...t, effectiveTo: true }));
      this.revalidate("effectiveTo");
    }
  }

  /** Checks one field against RULES. Returns null if valid or if the rule is disabled. */
  private validateField(name: keyof ValueForm): string | null {
    const rule = RULES[name];
    if (!rule?.enabled) return null;
    const value = this.form[name];
    for (const validator of rule.validators) {
      const msg = validator(value, this.form);
      if (msg) return msg;
    }
    return null;
  }

  private revalidate(name: keyof ValueForm): void {
    const msg = this.validateField(name);
    this.errors.update((e) => ({ ...e, [name]: msg ?? undefined }));
  }

  /** Bound to (blur)/(onBlur) on each field. */
  onBlur(name: keyof ValueForm): void {
    this.touched.update((t) => ({ ...t, [name]: true }));
    this.revalidate(name);
  }

  /** Runs every enabled rule; marks all fields touched so every error surfaces on Save. */
  private validateAll(): boolean {
    const newErrors: Partial<Record<keyof ValueForm, string>> = {};
    const newTouched: Partial<Record<keyof ValueForm, boolean>> = {};
    let valid = true;
    for (const key of Object.keys(RULES) as (keyof ValueForm)[]) {
      newTouched[key] = true;
      const msg = this.validateField(key);
      if (msg) {
        newErrors[key] = msg;
        valid = false;
      }
    }
    this.errors.set(newErrors);
    this.touched.set(newTouched);
    return valid;
  }

  submit(): void {
    if (!this.validateAll()) return;
    const f = this.form;
    this.save.emit({
      valueCode: f.valueCode.trim().toUpperCase(),
      displayValue: f.displayValue.trim(),
      shortName: f.shortName.trim(),
      valueType: f.valueType,
      colorHex: f.valueType === "COLOR" ? f.colorHex : null,
      display_order: f.display_order,
      parentEntityValueId: f.parentEntityValueId,
      description: f.description.trim(),
      effectiveFrom: toIso(f.effectiveFrom),
      effectiveTo: toIso(f.effectiveTo),
      isDefault: f.isDefault,
      isVisible: f.isVisible,
      is_editable: f.is_editable,
      is_active: f.is_active,
    });

    // Clear back to blank/placeholder state after a successful create,
    // in case the dialog stays open for rapid consecutive entries.
    if (!this.editing()) {
      this.form = empty(this.nextOrder());
    }
    this.errors.set({});
    this.touched.set({});
  }
}
