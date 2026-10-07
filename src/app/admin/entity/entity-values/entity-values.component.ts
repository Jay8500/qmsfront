import { Component, computed, inject, signal } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { TableModule } from "primeng/table";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";
import { MessageService, ConfirmationService } from "primeng/api";

import { ReferenceDataService } from "../core/reference-data.service";
import { Entity, EntityValue } from "../core/models";
import {
  ValueFormComponent,
  ValueFormResult,
} from "../value-form/value-form.component";

@Component({
  selector: "app-entity-values",
  standalone: true,
  imports: [
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    TagModule,
    TooltipModule,
    ValueFormComponent,
  ],
  templateUrl: './entity-values.component.html',
  styleUrl : './entity-values.component.css'
})
export class EntityValuesComponent {
  public svc = inject(ReferenceDataService);
  public route = inject(ActivatedRoute);
  public router = inject(Router);
  public toast = inject(MessageService);
  public confirm = inject(ConfirmationService);

  public entity_id = this.route.snapshot.paramMap.get("entity_id") ?? "";

  entity = signal<Entity | null>(null);
  values = signal<EntityValue[]>([]);
  search = signal("");

  valueDialogVisible = signal(false);
  editingValue = signal<EntityValue | null>(null);

  activeCount = computed(() => this.values().filter((v) => v.is_active).length);
  defaultValue = computed(
    () => this.values().find((v) => v.isDefault)?.displayValue ?? null,
  );

  filtered = computed(() => {
    const q = this.search().toLowerCase().trim();
    if (!q) return this.values();
    return this.values().filter(
      (v) =>
        v.displayValue.toLowerCase().includes(q) ||
        v.valueCode.toLowerCase().includes(q) ||
        (v.shortName ?? "").toLowerCase().includes(q),
    );
  });

  constructor() {
    this.reload();
  }

  async reload(): Promise<void> {
    const [entity, values] = await Promise.all([
      this.svc.getEntity(this.entity_id),
      this.svc.listValues(this.entity_id),
    ]);
    if (!entity) {
      this.router.navigate(["/"]);
      return;
    }
    this.entity.set(entity);
    this.values.set(values);
  }

  // back(): void {
  //   this.router.navigate(["./entities-list"]);
  // }

  goBack(): void {
    this.router.navigateByUrl('/entities-list');
  }

  editEntity(): void {
    // Entity editing lives on the list screen; navigate back and open there,
    // or wire an entity dialog here if you prefer inline editing.
    this.router.navigate(["/"]);
  }

  openAddValue(): void {
    const e = this.entity();
    if (!e?.is_editable) {
      this.toast.add({
        severity: "warn",
        summary: "This entity is locked",
        life: 2200,
      });
      return;
    }
    this.editingValue.set(null);
    this.valueDialogVisible.set(true);
  }

  openEditValue(v: EntityValue): void {
    this.editingValue.set({ ...v });
    this.valueDialogVisible.set(true);
  }

  async onSaveValue(form: ValueFormResult): Promise<void> {
    const current = this.editingValue();
    if (current) {
      await this.svc.saveValue({ ...current, ...form });
      this.toast.add({
        severity: "success",
        summary: "Value updated",
        life: 2000,
      });
    } else {
      await this.svc.createValue({
        entity_id: this.entity_id,
        is_system: false,
        ...form,
      });
      this.toast.add({
        severity: "success",
        summary: "Value added",
        life: 2000,
      });
    }
    this.valueDialogVisible.set(false);
    await this.reload();
  }

  // async toggleActive(v: EntityValue): Promise<void> {
  //   await this.svc.saveValue({ ...v, is_active: !v.is_active });
  //   this.toast.add({
  //     severity: "info",
  //     summary: v.is_active ? "Value deactivated" : "Value activated",
  //     life: 1800,
  //   });
  //   await this.reload();
  // }

  // async duplicate(v: EntityValue): Promise<void> {
  //   const { entityValueId, createdAt, updatedAt, ...rest } = v;
  //   await this.svc.createValue({
  //     ...rest,
  //     valueCode: `${v.valueCode}_COPY`,
  //     displayValue: `${v.displayValue} (copy)`,
  //     isDefault: false,
  //     display_order: this.values().length + 1,
  //   });
  //   this.toast.add({
  //     severity: "success",
  //     summary: "Value duplicated",
  //     life: 1800,
  //   });
  //   await this.reload();
  // }

  confirmDelete(v: EntityValue): void {
    this.confirm.confirm({
      header: "Delete value",
      message: `Delete “${v.displayValue}”? This cannot be undone.`,
      icon: "pi pi-exclamation-triangle",
      acceptButtonProps: { label: "Delete", severity: "danger" },
      rejectButtonProps: { label: "Cancel", text: true, severity: "secondary" },
      accept: async () => {
        await this.svc.deleteValue(v.entityValueId);
        this.toast.add({
          severity: "warn",
          summary: "Value deleted",
          life: 2000,
        });
        await this.reload();
      },
    });
  }
}
