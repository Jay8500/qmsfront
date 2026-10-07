import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HqmsService } from '../../services/hqms.service';
import { SharedModule } from '../../shared/shared.module';
import { VaccinationAccessService } from '../../vaccination-management/vaccination-access.service';

// Quality Worklist (SRS v0.2 change 4): open renewals, MoU expiries, approvals waiting for this user,
// rejected documents and reviews due - one list, most urgent first (fn_document_worklist_get).
// Alert Settings (SRS 2.4): days before expiry / review per sub-module, repeat after expiry, roles to
// notify. The daily job (08:15) sends the bell notifications. Admin / Quality Team can change them.
@Component({
  selector: 'app-document-worklist',
  imports: [SharedModule],
  templateUrl: './document-worklist.component.html',
  styleUrl: './document-worklist.component.scss'
})
export class DocumentWorklistComponent implements OnInit {
  public _hqms = inject(HqmsService);
  public router = inject(Router);
  private accessService = inject(VaccinationAccessService);
  public access = this.accessService.access('document-worklist');

  public items = signal<any[]>([]);
  public loaded = signal(false);
  public typeFilter = signal<string | null>(null);
  public priorityFilter = signal<string | null>(null);

  public typeTabs = [
    { label: 'All', value: null },
    { label: 'Licenses', value: 'LICENSE' },
    { label: 'MoUs', value: 'MOU' },
    { label: 'Documents', value: 'DOCUMENT' },
  ];

  public filtered = computed(() => this.items().filter((i: any) =>
    (!this.typeFilter() || i.item_type == this.typeFilter()) &&
    (!this.priorityFilter() || i.priority == this.priorityFilter())));

  public counts = computed(() => {
    const all = this.items();
    return {
      overdue: all.filter((i: any) => i.priority == 'Overdue').length,
      high: all.filter((i: any) => i.priority == 'High').length,
      medium: all.filter((i: any) => i.priority == 'Medium').length,
      low: all.filter((i: any) => i.priority == 'Low').length,
      byType: (t: string) => all.filter((i: any) => i.item_type == t).length,
    };
  });

  // Alert settings dialog
  public showSettings = signal(false);
  public settings: any[] = [];
  public roleOptions: any[] = [];
  public settingsSaving = signal(false);

  async ngOnInit() {
    await this.load();
  }

  async load() {
    try {
      const res: any = await this._hqms.customGetApiCall('GET', 'documentWorklistApi', {});
      this.items.set(res?.status == 200 && Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      this.items.set([]);
    } finally {
      this.loaded.set(true);
    }
  }

  typeLabel(t: string) {
    return t == 'LICENSE' ? 'License' : (t == 'MOU' ? 'MoU' : 'Document');
  }

  openItem(item: any) {
    this.router.navigate(['/' + item.route], { state: { data: { mode: 'VIEW', id: item.ref_id } } });
  }

  togglePriority(p: string) {
    this.priorityFilter.set(this.priorityFilter() == p ? null : p);
  }

  // ---------------- Alert settings ----------------
  async openSettings() {
    try {
      const roles: any = await this._hqms.customGetApiCall('GET', 'fnTemplateListGet', { "flag": 'ROLE' });
      if (roles?.status == 200) {
        this.roleOptions = roles.data.map((r: any) => ({ label: (r.role_name || '').trim(), value: (r.role_name || '').trim() }));
      }
      const res: any = await this._hqms.customGetApiCall('GET', 'docAlertSettingApi', {});
      if (res?.status == 200 && Array.isArray(res.data)) {
        this.settings = res.data.map((s: any) => ({
          ...s,
          days_text: (s.days_before || []).join(', '),
          notify_roles: [...(s.notify_roles || [])],
        }));
        this.showSettings.set(true);
      } else {
        this._hqms.hqmsToasterService({ severity: 'warn', summary: 'Alert Settings', detail: res?.message || 'Could not load settings' });
      }
    } catch (e) { }
  }

  async saveSettings() {
    const payload: any[] = [];
    for (const s of this.settings) {
      const days = String(s.days_text || '').split(/[,\s]+/).filter((x) => x != '').map((x) => Number(x));
      if (days.length == 0 || days.length > 6 || days.some((d) => !Number.isInteger(d) || d < 1 || d > 365)) {
        this._hqms.hqmsToasterService({ severity: 'warn', summary: 'Alert Settings', detail: `${s.item_name}: enter 1 to 6 whole numbers between 1 and 365` });
        return;
      }
      const repeat = Number(s.overdue_repeat_days);
      if (!Number.isInteger(repeat) || repeat < 0 || repeat > 90) {
        this._hqms.hqmsToasterService({ severity: 'warn', summary: 'Alert Settings', detail: `${s.item_name}: repeat must be 0 to 90 days` });
        return;
      }
      if (!s.notify_roles || s.notify_roles.length == 0) {
        this._hqms.hqmsToasterService({ severity: 'warn', summary: 'Alert Settings', detail: `${s.item_name}: select at least one role` });
        return;
      }
      payload.push({ item_type: s.item_type, is_active: s.is_active, days_before: days, overdue_repeat_days: repeat, notify_roles: s.notify_roles });
    }
    this.settingsSaving.set(true);
    try {
      const res: any = await this._hqms.customSaveApiCall('POST', 'docAlertSettingApi', { settings: payload });
      if (res?.status == 200) {
        this._hqms.hqmsToasterService({ severity: 'success', summary: 'Alert Settings', detail: res.message });
        this.showSettings.set(false);
        await this.load();
      } else {
        this._hqms.hqmsToasterService({ severity: 'warn', summary: 'Alert Settings', detail: res?.message || 'Save failed' });
      }
    } finally {
      this.settingsSaving.set(false);
    }
  }
}
