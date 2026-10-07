import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { HqmsService } from '../../services/hqms.service';
import { SharedModule } from '../../shared/shared.module';
import { QmsTimelineComponent } from '../../components/qms-ui/qms-timeline.component';
import { QmsFileListComponent } from '../../components/qms-ui/qms-file-list.component';
import { QmsFilePickerComponent } from '../../components/qms-ui/qms-file-picker.component';

// Incident details (SRS 2.2-2.5, Incident Summary & Audit History). Buttons come from the database
// (can_assign, can_reassign, can_investigate, can_hod_review, can_close, can_comment, can_escalate).
// Actions go to fn_incident_workflow_write; Investigate opens the investigation page.
@Component({
  selector: 'app-incident-details',
  standalone: true,
  imports: [SharedModule, QmsTimelineComponent, QmsFileListComponent, QmsFilePickerComponent],
  templateUrl: './incident-details.component.html',
  styleUrls: ['./incident-details.component.scss', '../../components/qms-ui/qms-ui.scss']
})
export class IncidentDetailsComponent implements OnInit {
  private _hqms = inject(HqmsService);
  private router = inject(Router);
  private location = inject(Location);
  @ViewChild('picker') picker!: QmsFilePickerComponent;

  public inc = signal<any>(null);
  public loading = signal(true);
  public saving = signal(false);
  public officers: any[] = [];
  public departmentList: any[] = [];

  // action dialog
  public dlg = signal<string | null>(null);
  public dlgModel: any = { remarks: '', investigation_officer_id: null, department_id: null };
  private titles: Record<string, string> = {
    ASSIGN: 'Assign Investigation Officer', REASSIGN: 'Reassign Investigation Officer', HOD_REVIEW: 'HOD Review',
    CLOSE: 'Close Incident', COMMENT: 'Add Follow-up Comment / Evidence', ESCALATE: 'Escalate to Risk'
  };

  async ngOnInit() {
    const id = history.state?.data?.id;
    if (id) await this.load(id);
    else this.loading.set(false);
  }

  async load(id: any) {
    this.loading.set(true);
    try {
      const res: any = await this._hqms.customGetApiCall('GET', 'incidentWorkflowApi', { incident_id: id });
      if (res?.status == 200 && res.data?.length) this.inc.set(res.data[0]);
    } catch (e) { } finally {
      this.loading.set(false);
    }
  }

  title(a: string | null) {
    return a ? this.titles[a] : '';
  }

  formName(code: string) {
    return ({ GENERAL: 'General Incident', BLOOD_TRANSFUSION: 'Blood Transfusion Reaction', ADR: 'Adverse Drug Reaction', MEDICAL_ERROR: 'Medical Error' } as any)[code] || code;
  }

  steps() {
    const order = ['Reported', 'Under Investigation', 'HOD Review', 'Pending Closure', 'Closed'];
    const s = this.inc()?.status;
    const at = order.indexOf(s);
    return order.map((name, i) => ({ name, done: s === 'Rejected' ? i === 0 : i < at || s === 'Closed', current: i === at && s !== 'Closed' }));
  }

  whyList() {
    const d = this.inc()?.investigation?.rca_detail || {};
    return Array.isArray(d.whys) ? d.whys.filter((w: any) => w) : [];
  }

  fishbone() {
    const d = this.inc()?.investigation?.rca_detail?.fishbone || {};
    return Object.keys(d).filter((k) => d[k]).map((k) => ({ k, v: d[k] }));
  }

  medicines() {
    return this.inc()?.form_details?.medicines || [];
  }

  async openAction(a: string) {
    this.dlgModel = { remarks: '', investigation_officer_id: null, department_id: null };
    if (a === 'ASSIGN' || a === 'REASSIGN') {
      const res: any = await this._hqms.customGetApiCall('GET', 'incidentOfficerListApi', { incident_id: this.inc().incident_id });
      this.officers = res?.status == 200 ? res.data.map((o: any) => ({
        label: o.employee_name + (o.department_name ? ` (${o.department_name})` : '') + (o.role_name ? ` - ${o.role_name}` : ''),
        value: o.employee_id
      })) : [];
    }
    if (a === 'ESCALATE' && !this.inc().department_id && !this.departmentList.length) {
      const dept: any = await this._hqms.customGetApiCall('GET', 'fnTemplateListGet', { flag: 'DEPARTMENT' }, true);
      if (dept?.status == 200) this.departmentList = dept.data.map((d: any) => ({ label: d.department_name, value: d.department_id }));
    }
    this.dlg.set(a);
  }

  investigate() {
    this.router.navigate(['/investigation'], { state: { data: { mode: 'EDIT', id: this.inc().incident_id } } });
  }

  openRisk(r: any) {
    this.router.navigate(['/risk-details'], { state: { data: { mode: 'VIEW', id: r.risk_id } } });
  }

  async submitAction() {
    const a = this.dlg();
    if (!a) return;
    const m = this.dlgModel;
    const warn = (detail: string) => this._hqms.hqmsToasterService({ severity: 'warn', summary: this.title(a), detail });
    if ((a === 'ASSIGN' || a === 'REASSIGN') && !m.investigation_officer_id) return warn('Select the Investigation Officer');
    if ((a === 'HOD_REVIEW') && !(m.remarks || '').trim()) return warn('Enter the HOD comments');
    if (a === 'COMMENT' && !(m.remarks || '').trim() && !(this.picker?.meta() || []).length) return warn('Enter a comment or attach a file');
    if (a === 'ESCALATE' && !this.inc().department_id && !m.department_id) return warn('Select the department for the risk');

    const payload: any = {
      incident_id: this.inc().incident_id, action: a, remarks: (m.remarks || '').trim(),
      investigation_officer_id: m.investigation_officer_id, department_id: m.department_id,
      files: this.picker?.meta() || []
    };
    const form = new FormData();
    this.picker?.appendTo(form);
    form.append('data', JSON.stringify(payload));
    this.saving.set(true);
    try {
      const res: any = await this._hqms.customSaveApiCall('POST', 'incidentWorkflowApi', form);
      if (res?.status == 200) {
        this._hqms.hqmsToasterService({ severity: 'success', summary: this.title(a), detail: res.message });
        this.dlg.set(null);
        await this.load(this.inc().incident_id);
      } else {
        warn(res?.message || 'Not saved');
      }
    } finally {
      this.saving.set(false);
    }
  }

  goBack() {
    this.location.back();
  }
}
