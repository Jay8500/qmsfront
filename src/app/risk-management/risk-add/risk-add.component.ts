import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { HqmsService } from '../../services/hqms.service';
import { SharedModule } from '../../shared/shared.module';
import { QmsFilePickerComponent } from '../../components/qms-ui/qms-file-picker.component';

// Risk Reporting Form (Risk SRS 2.1): Save (draft) / Submit Final. Also opens an existing risk for edit
// (reporter while Draft; Quality Team until the department scores it). Saved by fn_risk_report_write.
@Component({
  selector: 'app-risk-add',
  standalone: true,
  imports: [SharedModule, QmsFilePickerComponent],
  templateUrl: './risk-add.component.html',
  styleUrls: ['./risk-add.component.scss', '../../components/qms-ui/qms-ui.scss']
})
export class RiskAddComponent implements OnInit {
  private _hqms = inject(HqmsService);
  private router = inject(Router);
  private location = inject(Location);
  @ViewChild('picker') picker!: QmsFilePickerComponent;

  public lists: any = {};
  public departmentList: any[] = [];
  public staffList: any[] = [];
  public saving = signal(false);
  public existing = signal<any>(null);
  public today = new Date();
  public scores = [1, 2, 3, 4, 5];
  public scoreHint = ['', 'Very low', 'Low', 'Moderate', 'High', 'Very high'];
  public m: any = this.blank();

  blank() {
    return {
      risk_id: null, date_of_risk: new Date(), department_id: null, location_id: null, risk_type_id: null,
      description: '', impact_description: '', impact_type_id: null, reporter_score: null, owner_ids: [], immediate_action: '',
      removed_file_ids: []
    };
  }

  async ngOnInit() {
    try {
      const res: any = await this._hqms.customGetApiCall('GET', 'commanEntityValuesGetApi', { entity_codes: 'RISK_TYPE | RISK_LOC | RISK_IMPACT_TYPE' });
      if (res?.status == 200) {
        ['RISK_TYPE', 'RISK_LOC', 'RISK_IMPACT_TYPE'].forEach((c) => {
          this.lists[c] = (res.data.entities[c]?.values || []).map((v: any) => ({ label: v.display_value, value: v.entity_value_id }));
        });
      }
      const dept: any = await this._hqms.customGetApiCall('GET', 'fnTemplateListGet', { flag: 'DEPARTMENT' }, true);
      if (dept?.status == 200) this.departmentList = dept.data.map((d: any) => ({ label: d.department_name, value: d.department_id }));
      const staff: any = await this._hqms.customGetApiCall('GET', 'vaccinationStaffListApi', {});
      if (staff?.status == 200) {
        this.staffList = staff.data.filter((s: any) => !!s.employee_id).map((s: any) => ({
          label: s.department_name ? `${s.employee_name} (${s.department_name})` : s.employee_name, value: s.employee_id
        }));
      }
    } catch (e) { }
    const st = history.state?.data;
    if (st?.id) await this.loadRisk(st.id);
  }

  async loadRisk(id: any) {
    const res: any = await this._hqms.customGetApiCall('GET', 'riskWorkflowApi', { risk_id: id });
    if (res?.status == 200 && res.data?.length) {
      const d = res.data[0];
      this.existing.set(d);
      this.m = {
        risk_id: d.risk_id, date_of_risk: d.date_of_risk ? new Date(d.date_of_risk) : new Date(),
        department_id: d.department_id, location_id: d.location_id, risk_type_id: d.risk_type_id,
        description: d.description === '(draft)' ? '' : d.description, impact_description: d.impact_description || '',
        impact_type_id: d.impact_type_id, reporter_score: d.reporter_score, owner_ids: (d.owners || []).map((o: any) => o.user_id),
        immediate_action: d.immediate_action || '', removed_file_ids: []
      };
    }
  }

  canEdit() {
    return !this.existing() || !!this.existing()?.can_edit_report;
  }

  len(t: any) { return (t || '').trim().length; }

  existingFiles() {
    const removed = this.m.removed_file_ids || [];
    return (this.existing()?.evidence || []).filter((f: any) => !removed.includes(f.file_id));
  }

  removeExisting(f: any) {
    this.m.removed_file_ids = [...(this.m.removed_file_ids || []), f.file_id];
  }

  maxNewFiles() {
    return Math.max(0, 3 - this.existingFiles().length);
  }

  private ymd(d: any) {
    if (!d) return null;
    const x = d instanceof Date ? d : new Date(d);
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
  }

  async save(action: 'SAVE' | 'SUBMIT') {
    const warn = (detail: string) => this._hqms.hqmsToasterService({ severity: 'warn', summary: 'Risk Report', detail });
    const m = this.m;
    if (!m.risk_type_id) return warn('Select the Risk Type');
    if (!m.department_id) return warn('Select the Department');
    if (action === 'SUBMIT') {
      if (this.len(m.description) < 100) return warn(`Description of Risk must be at least 100 characters (now ${this.len(m.description)})`);
      if (!this.len(m.impact_description)) return warn('Enter the Impact for Risk');
      if (!m.impact_type_id) return warn('Select the Impact Type');
      if (!m.reporter_score) return warn('Select the Risk Scoring (1-5)');
      if (!m.owner_ids?.length) return warn('Select at least one Risk Owner');
      const ok = await this._hqms.showConfirmMessage('Submit the risk? The department head will score it and plan the mitigation.');
      if (!ok) return;
    }
    const isSubmitted = this.existing() && this.existing().status_code !== 'DRAFT';
    const payload = {
      action: isSubmitted ? 'SAVE' : action, risk_id: m.risk_id, date_of_risk: this.ymd(m.date_of_risk),
      department_id: m.department_id, location_id: m.location_id, risk_type_id: m.risk_type_id,
      description: m.description, impact_description: m.impact_description, impact_type_id: m.impact_type_id,
      reporter_score: m.reporter_score, owner_ids: m.owner_ids, immediate_action: m.immediate_action,
      removed_file_ids: m.removed_file_ids, evidence_documents: this.picker?.meta() || []
    };
    const form = new FormData();
    this.picker?.appendTo(form);
    form.append('data', JSON.stringify(payload));
    this.saving.set(true);
    try {
      const res: any = await this._hqms.customSaveApiCall('POST', 'riskReportApi', form);
      if (res?.status == 200) {
        this._hqms.hqmsToasterService({ severity: 'success', summary: 'Risk Report', detail: res.message });
        const id = res.data?.[0]?.risk_id;
        this.router.navigate(['/risk-details'], { state: { data: { mode: 'VIEW', id } } });
      } else {
        warn(res?.message || 'Not saved');
      }
    } finally {
      this.saving.set(false);
    }
  }

  goBack() { this.location.back(); }
}
