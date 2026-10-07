import { Component, OnInit, inject, signal } from '@angular/core';
import { HqmsService } from '../../services/hqms.service';
import { SharedModule } from '../../shared/shared.module';
import { VaccinationAccessService } from '../../vaccination-management/vaccination-access.service';

// Incident Rules (Risk SRS v0.2 addendum A; Incident SRS 6): when incidents of the same type repeat in a
// department beyond a threshold within a time window, a Risk is created automatically (High) and the incidents
// are linked. Also the incident entry settings (past-date limit, max evidence files). Admin / Quality Team edit.
@Component({
  selector: 'app-incident-rules',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './incident-rules.component.html',
  styleUrls: ['../../components/qms-ui/qms-ui.scss']
})
export class IncidentRulesComponent implements OnInit {
  private _hqms = inject(HqmsService);
  private accessService = inject(VaccinationAccessService);
  public access = this.accessService.access('incident-rules');

  public settings: any = { past_date_days: 30, max_files: 5 };
  public rules = signal<any[]>([]);
  public typeList: any[] = [];
  public departmentList: any[] = [];
  public saving = signal(false);

  async ngOnInit() {
    try {
      const lists: any = await this._hqms.customGetApiCall('GET', 'commanEntityValuesGetApi', { entity_codes: 'INCIDENT_TYPE' }, true);
      if (lists?.status == 200) {
        this.typeList = [{ label: 'Any type', value: null },
          ...(lists.data.entities.INCIDENT_TYPE?.values || []).map((v: any) => ({ label: v.display_value, value: v.entity_value_id }))];
      }
      const dept: any = await this._hqms.customGetApiCall('GET', 'fnTemplateListGet', { flag: 'DEPARTMENT' }, true);
      if (dept?.status == 200) {
        this.departmentList = [{ label: 'Any department', value: null },
          ...dept.data.map((d: any) => ({ label: d.department_name, value: d.department_id }))];
      }
    } catch (e) { }
    await this.load();
  }

  async load() {
    const res: any = await this._hqms.customGetApiCall('GET', 'incidentRuleApi', {});
    if (res?.status == 200 && res.data?.length) {
      this.settings = { ...res.data[0].settings };
      this.rules.set((res.data[0].rules || []).map((r: any) => ({ ...r })));
    }
  }

  addRule() {
    this.rules.update((r) => [...r, { incident_rule_id: null, incident_type_id: null, department_id: null, threshold_count: 2, window_days: 30, is_active: true, risks_created: 0 }]);
  }

  async save() {
    const warn = (detail: string) => this._hqms.hqmsToasterService({ severity: 'warn', summary: 'Incident Rules', detail });
    const s = this.settings;
    if (!(s.past_date_days >= 1 && s.past_date_days <= 365)) return warn('Past-date limit must be 1 to 365 days');
    if (!(s.max_files >= 1 && s.max_files <= 5)) return warn('Evidence files must be 1 to 5');
    for (const r of this.rules()) {
      if (!(r.threshold_count >= 2 && r.threshold_count <= 50)) return warn('Threshold must be 2 to 50 incidents');
      if (!(r.window_days >= 1 && r.window_days <= 365)) return warn('Time window must be 1 to 365 days');
    }
    this.saving.set(true);
    try {
      const res: any = await this._hqms.customSaveApiCall('POST', 'incidentRuleApi', {
        settings: { past_date_days: Number(s.past_date_days), max_files: Number(s.max_files) },
        rules: this.rules().map((r) => ({
          incident_rule_id: r.incident_rule_id, incident_type_id: r.incident_type_id, department_id: r.department_id,
          threshold_count: Number(r.threshold_count), window_days: Number(r.window_days), is_active: !!r.is_active
        }))
      });
      if (res?.status == 200) {
        this._hqms.hqmsToasterService({ severity: 'success', summary: 'Incident Rules', detail: res.message });
        await this.load();
      } else {
        warn(res?.message || 'Not saved');
      }
    } finally {
      this.saving.set(false);
    }
  }
}
