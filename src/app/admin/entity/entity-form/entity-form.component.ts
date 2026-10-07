import { Component, computed, effect, input, model, output, signal, } from "@angular/core";
import { QueryList, ViewChildren, inject, OnInit } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Location } from '@angular/common';
import { SelectComponent } from '../../../smart/select/select.component';
import { TextComponent } from '../../../smart/text/text.component';
import { TextareaComponent } from '../../../smart/textarea/textarea.component';
import { IncdecComponent } from '../../../smart/incdec/incdec.component';
import { HqmsService } from '../../../services/hqms.service';
import { SharedModule } from '../../../shared/shared.module';

///Actual Code
// import { FormsModule } from "@angular/forms";
// import { DialogModule } from "primeng/dialog";
// import { ButtonModule } from "primeng/button";
// import { InputTextModule } from "primeng/inputtext";
// import { TextareaModule } from "primeng/textarea";
// import { InputNumberModule } from "primeng/inputnumber";
// import { ToggleSwitchModule } from "primeng/toggleswitch";
// import { AutoCompleteModule } from "primeng/autocomplete";
import { Entity } from "../core/models";

// type EntityForm = {
//   entity_code: any;
//   entity_name: any;
//   category_type: any;
//   description: any;
//   display_order: number;
//   values: boolean;
//   is_editable: boolean;
//   is_system: boolean;
//   is_active: boolean;
// };

// const empty = (order: number): EntityForm => ({
//   entity_code: "",
//   entity_name: "",
//   category_type: "",
//   description: "",
//   display_order: order,
//   values: false,
//   is_editable: true,
//   is_system: false,
//   is_active: true,
// });

// type Validator<F> = (value: any, form: F) => string | null;

// const required =
//   <F>(message: string): Validator<F> =>
//     (v) =>
//       v === null || v === undefined || String(v).trim() === "" ? message : null;

// const minLength =
//   <F>(n: number, message: string): Validator<F> =>
//     (v) =>
//       v != null && String(v).trim().length > 0 && String(v).trim().length < n
//         ? message
//         : null;

// const maxLength =
//   <F>(n: number, message: string): Validator<F> =>
//     (v) =>
//       v != null && String(v).trim().length > n ? message : null;

// const pattern =
//   <F>(re: RegExp, message: string): Validator<F> =>
//     (v) =>
//       v != null && String(v).trim() !== "" && !re.test(String(v).trim())
//         ? message
//         : null;

// const minNumber =
//   <F>(n: number, message: string): Validator<F> =>
//     (v) =>
//       v != null && Number(v) < n ? message : null;

// type FieldRule<F> = { enabled: boolean; validators: Validator<F>[] };

// const RULES: Record<keyof EntityForm, FieldRule<EntityForm>> = {
//   entity_code: {
//     enabled: true,
//     validators: [
//       required("Entity Code is required."),
//       pattern(
//         /^[A-Za-z0-9_]+$/,
//         "Only letters, numbers, and underscores are allowed — no spaces.",
//       ),
//       maxLength(40, "Entity Code must be 40 characters or fewer."),
//     ],
//   },
//   entity_name: {
//     enabled: true,
//     validators: [
//       required("Entity Name is required."),
//       minLength(2, "Entity Name must be at least 2 characters."),
//       maxLength(80, "Entity Name must be 80 characters or fewer."),
//     ],
//   },
//   category_type: {
//     enabled: true,
//     validators: [
//       required("Category Type is required."),
//       maxLength(60, "Category Type must be 60 characters or fewer."),
//     ],
//   },
//   description: {
//     enabled: true,
//     validators: [
//       maxLength(300, "Description must be 300 characters or fewer."),
//     ],
//   },
//   display_order: {
//     enabled: true,
//     validators: [
//       required("Display Order is required."),
//       minNumber(1, "Display Order must be 1 or greater."),
//     ],
//   },
//   values: { enabled: false, validators: [] },
//   is_editable: { enabled: false, validators: [] },
//   is_system: { enabled: false, validators: [] },
//   is_active: { enabled: false, validators: [] },
// };

interface EntityForms {
  "action": any,
  "entity_id": any,
  "entity_code": any;
  "entity_name": any;
  "category_type": any;
  "description": any;
  "display_order": number;
  "is_values": boolean;
  "is_editable": boolean;
  "is_system": boolean;
  "is_active": boolean;
  "values": [];
};

@Component({
  selector: "app-entity-form",
  standalone: true,
  imports: [
    // FormsModule, DialogModule, ButtonModule, InputTextModule, TextareaModule,
    // InputNumberModule, ToggleSwitchModule, AutoCompleteModule,
    TextComponent, SelectComponent, TextareaComponent, IncdecComponent, SharedModule
  ],
  templateUrl: './entity-form.component.html',
  styleUrl: './entity-form.component.css'
})
export class EntityFormComponent implements OnInit {
  readonly FORM_NAME = 'EntityForm';
  public router = inject(Router);
  public pageMode = "NEW";

  @ViewChildren(TextComponent) inputComponents!: QueryList<TextComponent>;
  @ViewChildren(SelectComponent) selectComponent!: QueryList<SelectComponent>;
  @ViewChildren(TextareaComponent) textAreaComponent!: QueryList<TextareaComponent>;
  @ViewChildren(IncdecComponent) indecComponent!: QueryList<IncdecComponent>;

  private fieldValidity = signal<Record<string, boolean>>({});
  public categoryTypeList = [];

  public intialEntity: any = JSON.stringify({
    "action": "I",
    "entity_id": null,
    "entity_code": null,
    "entity_name": null,
    "category_type": null,
    "description": null,
    "display_order": null,
    "is_values": true,
    "is_editable": true,
    "is_system": true,
    "is_active": true,
    "values": [],
  });

  public EntityForms = signal<EntityForms>({ ...JSON.parse(this.intialEntity) });

  async onFieldStatusChange(event: {
    fieldName: string;
    value: any;
    isValid: boolean;
    isTouched: boolean;
  }) {
    this.fieldValidity.update((current) => ({
      ...current,
      [event.fieldName]: event.isValid,
    }));
  }

  constructor(private location: Location, public _hqms: HqmsService, private activatedRoute: ActivatedRoute) {
  }

  async ngOnInit() {
    try {
      let getCategoryType: any = await this._hqms.customGetApiCall('GET', 'commanEntityValuesGetApi',
        { "entity_codes": "ENTITY_CATGEORY" });
      if (getCategoryType.status == 200) {
        this.categoryTypeList = getCategoryType.data.entities.ENTITY_CATGEORY.values.map((ele: any) => ({
          label: ele.display_value,
          value: ele.entity_value_id,
          value_code: ele.value_code
        }))
      };
      let state = history.state;
      this.pageMode = state['data']['mode'];
      if (this.pageMode != 'NEW') {
        await this.editEntity(state['data']['id'])
      };
    } catch (e) {
    };
  }

  async editEntity(entityId: any) {
    try {
      let getEntityListEdit: any = await this._hqms.customGetApiCall('GET', 'fnFacultyGetApi',
        {
          "action": "U",
          "entity_id": entityId,
        });
      if (getEntityListEdit.status == 200) {
        let editInfo = getEntityListEdit['data'];
        if (editInfo.length > 0) {
          editInfo = editInfo[0];
          this.EntityForms.set({
            "action": "U",
            "entity_id": editInfo.entity_id,
            "entity_code": editInfo.entity_code,
            "entity_name": editInfo.entity_name,
            "category_type": editInfo.category_type,
            "description": editInfo.description,
            "display_order": editInfo.display_order,
            "values": editInfo.values,
            "is_values": editInfo.is_values,
            "is_editable": editInfo.is_editable,
            "is_system": editInfo.is_system,
            "is_active": editInfo.is_active,
          });
        }
      };
    } catch (e) {
    };
  }

  async onSubmitClick() {
    this.inputComponents.forEach((input: any) => input.markAsTouchedAndValidate());
    this.selectComponent.forEach((input) => input.markAsTouchedAndValidate());
    this.textAreaComponent.forEach((input) => input.markAsTouchedAndValidate());
    this.indecComponent.forEach((input) => input.markAsTouchedAndValidate());
    let submitCnt: any = 0;
    this.inputComponents['_results'].forEach((res: any) => {
      if (res.hasError()) submitCnt++;
    });
    this.selectComponent['_results'].forEach((res: any) => {
      if (res.hasError()) submitCnt++;
    });
    this.textAreaComponent['_results'].forEach((res: any) => {
      if (res.hasError()) submitCnt++;
    });
    this.indecComponent['_results'].forEach((res: any) => {
      if (res.hasError()) submitCnt++;
    });
    if (submitCnt != 0) {
      this._hqms.hqmsToasterService({
        key: 'entity',
        severity: 'warn',
        summary: 'Entity Master',
        detail: 'Check the errors',
      });
      return;
    };
    let entity = JSON.parse(JSON.stringify(this.EntityForms()));
    let formData = new FormData();
    formData.append("data", JSON.stringify(entity));
    let confirmCreateEntity = await this._hqms.showConfirmMessage();
    if (confirmCreateEntity) {
      var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnEntityApi", formData);
      if (saveResult.status == 200) {
        this._hqms.hqmsToasterService({
          severity: 'success',
          summary: 'Entity Master',
          detail: saveResult.message,
        });
        this.onClearClick();
      } else if (saveResult.status == 204 || saveResult.status == 501) {
        this._hqms.hqmsToasterService({
          severity: 'warn',
          summary: 'Entity Master',
          detail: saveResult.message,
        });
      }
    };
  }

  onClearClick() {
    this.EntityForms.set({ ...JSON.parse(this.intialEntity) });
    this.selectComponent['_results'].forEach((res: any) => {
      res.hasError.set(false);
      res.touched.set(false);
    });
    this.inputComponents['_results'].forEach((res: any) => {
      res.hasError.set(false);
      res.touched.set(false);
    });
    this.textAreaComponent['_results'].forEach((res: any) => {
      res.hasError.set(false);
      res.touched.set(false);
    });
    this.indecComponent['_results'].forEach((res: any) => {
      res.hasError.set(false);
      res.touched.set(false);
    });
  }


  ///Actual Code
  visible = model<boolean>(false);
  entity = input<Entity | null>(null);
  categories = input<string[]>([]);
  nextOrder = input<number>(1);

  // save = output<EntityForm>();
  editing = computed(() => !!this.entity());
  // suggestions = signal<string[]>([]);

  /** Form data is now a signal — Angular tracks every read/write directly,
   *  instead of relying on zone.js noticing a plain object reassignment.
   *  This removes any timing-dependent "sometimes doesn't show" behavior. */
  // form = signal<EntityForm>(empty(1));

  /** Error message + touched state per field, driven by RULES above. */
  // errors = signal<Partial<Record<keyof EntityForm, string>>>({});
  // touched = signal<Partial<Record<keyof EntityForm, boolean>>>({});

  // constructor() {
  //   effect(() => {
  //     this.entity();
  //     this.reset();
  //   });
  // }

  // reset(): void {
  //   const e = this.entity();
  //   this.form.set(
  //     e
  //       ? {
  //         entity_code: e.entity_code,
  //         entity_name: e.entity_name,
  //         category_type: e.category_type,
  //         description: e.description ?? "",
  //         display_order: e.display_order,
  //         values: e.values,
  //         is_editable: e.is_editable,
  //         is_system: e.is_system,
  //         is_active: e.is_active,
  //       }
  //       : empty(this.nextOrder()),
  //   );
  //   this.errors.set({});
  //   this.touched.set({});
  // }

  // filterCats(q: string): void {
  //   const query = (q || "").toLowerCase();
  //   this.suggestions.set(
  //     this.categories().filter((c) => c.toLowerCase().includes(query)),
  //   );
  // }

  // updateField<K extends keyof EntityForm>(name: K, value: EntityForm[K]): void {
  //   this.form.update((f) => ({ ...f, [name]: value }));
  //   if (this.touched()[name]) {
  //     this.revalidate(name);
  //   }
  // }

  // toggle<K extends keyof EntityForm>(name: K): void {
  //   this.form.update((f) => ({ ...f, [name]: !f[name] }));
  // }

  // private validateField(name: keyof EntityForm): string | null {
  //   const rule = RULES[name];
  //   if (!rule ?.enabled) return null;
  //   const value = this.form()[name];
  //   for (const validator of rule.validators) {
  //     const msg = validator(value, this.form());
  //     if (msg) return msg;
  //   }
  //   return null;
  // }

  // private revalidate(name: keyof EntityForm): void {
  //   const msg = this.validateField(name);
  //   this.errors.update((e) => ({ ...e, [name]: msg ?? undefined }));
  // }

  // onBlur(name: keyof EntityForm): void {
  //   this.touched.update((t) => ({ ...t, [name]: true }));
  //   this.revalidate(name);
  // }

  // private validateAll(): boolean {
  //   const newErrors: Partial<Record<keyof EntityForm, string>> = {};
  //   const newTouched: Partial<Record<keyof EntityForm, boolean>> = {};
  //   let valid = true;
  //   for (const key of Object.keys(RULES) as (keyof EntityForm)[]) {
  //     newTouched[key] = true;
  //     const msg = this.validateField(key);
  //     if (msg) {
  //       newErrors[key] = msg;
  //       valid = false;
  //     }
  //   }
  //   this.errors.set(newErrors);
  //   this.touched.set(newTouched);
  //   return valid;
  // }

  // submit(): void {
  //   if (!this.validateAll()) return;
  //   const f = this.form();
  //   this.save.emit({ ...f, entity_code: f.entity_code.trim().toUpperCase() });

  //   if (!this.editing()) {
  //     this.form.set(empty(this.nextOrder()));
  //   }
  //   this.errors.set({});
  //   this.touched.set({});
  // }

}
