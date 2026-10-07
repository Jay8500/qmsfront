import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { HqmsService } from '../../services/hqms.service';
import { SharedModule } from '../../shared/shared.module';
import { QmsTimelineComponent } from '../../components/qms-ui/qms-timeline.component';
import { QmsFileListComponent } from '../../components/qms-ui/qms-file-list.component';

// Risk details (Risk SRS 2.1-2.4, addendum A-D). Buttons come from the database (can_edit_report, can_submit,
// can_score, can_review, can_reopen, can_amend, can_link). Scoring and review open their pages; Reopen, Amend and
// linked items use dialogs (fn_risk_workflow_write).
@Component({
  selector: 'app-risk-details',
  standalone: true,
  imports: [SharedModule, QmsTimelineComponent, QmsFileListComponent],
  templateUrl: './risk-details.component.html',
  styleUrls: ['./risk-details.component.scss', '../../components/qms-ui/qms-ui.scss']
})
export class RiskDetailsComponent implements OnInit {
  private _hqms = inject(HqmsService);
  private router = inject(Router);
  private location = inject(Location);

  public risk = signal<any>(null);
  public loading = signal(true);
  public saving = signal(false);
  public dlg = signal<string | null>(null);
  public dm: any = {};
  public staffList: any[] = [];
  public itemTypes = [
    { label: 'Training', value: 'TRAINING' }, { label: 'Policy Update', value: 'POLICY_UPDATE' },
    { label: 'Committee Action', value: 'COMMITTEE_ACTION' }, { label: 'Document Revision', value: 'DOCUMENT_REVISION' }, { label: 'Other', value: 'OTHER' }
  ];
  public itemStatuses = ['Requested', 'In Progress', 'Completed'].map((s) => ({ label: s, value: s }));
  public scores = [1, 2, 3, 4, 5].map((s) => ({ label: String(s), value: s }));

  async ngOnInit() {
    const id = history.state?.data?.id;
    if (id) await this.load(id);
    this.loading.set(false);
  }

  async load(id: any) {
    const res: any = await this._hqms.customGetApiCall('GET', 'riskWorkflowApi', { risk_id: id });
    if (res?.status == 200 && res.data?.length) this.risk.set(res.data[0]);
  }

  typeName(t: string) {
    return this.itemTypes.find((x) => x.value === t)?.label || t;
  }

  steps() {
    const order = [['REPORTED', 'Reported'], ['MITIGATION_SUBMITTED', 'Mitigation Plan'], ['UNDER_QT_REVIEW', 'QT Review'], ['CLOSED', 'Closed']];
    const s = this.risk()?.status_code;
    const map: any = { DRAFT: -1, REPORTED: 0, REVISION_REQUIRED: 0, MITIGATION_SUBMITTED: 1, UNDER_QT_REVIEW: 2, REOPENED: 2, CLOSED: 3, PERIODIC_REVIEW: 3 };
    const at = map[s] ?? 0;
    return order.map(([c, name], i) => ({ name: i === 3 && s === 'PERIODIC_REVIEW' ? 'Closed (periodic)' : name, done: i < at || (i === 3 && at === 3), current: i === at && at < 3 }));
  }

  edit() { this.router.navigate(['/risk-add'], { state: { data: { mode: 'EDIT', id: this.risk().risk_id } } }); }
  score() { this.router.navigate(['/risk-evaluation'], { state: { data: { mode: 'EDIT', id: this.risk().risk_id } } }); }
  review() { this.router.navigate(['/risk-review'], { state: { data: { mode: 'EDIT', id: this.risk().risk_id } } }); }
  openIncident(i: any) { this.router.navigate(['/incident-details'], { state: { data: { mode: 'VIEW', id: i.incident_id } } }); }

  async openDlg(kind: string) {
    const r = this.risk();
    this.dm = kind === 'AMEND'
      ? { remarks: '', description: r.description, impact_description: r.impact_description, impact_score: null, probability_score: null }
      : kind === 'LINK' ? { item_type: 'TRAINING', title: '', reference_no: '', owner_id: null, due_date: null, remarks: '' }
        : { remarks: '' };
    if (kind === 'LINK' && !this.staffList.length) {
      const staff: any = await this._hqms.customGetApiCall('GET', 'vaccinationStaffListApi', {});
      if (staff?.status == 200) this.staffList = staff.data.filter((s: any) => !!s.employee_id).map((s: any) => ({ label: s.employee_name, value: s.employee_id }));
    }
    this.dlg.set(kind);
  }

  private ymd(d: any) {
    if (!d) return null;
    const x = d instanceof Date ? d : new Date(d);
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
  }

  async submitDlg() {
    const kind = this.dlg();
    const warn = (detail: string) => this._hqms.hqmsToasterService({ severity: 'warn', summary: 'Risk', detail });
    if ((kind === 'REOPEN' || kind === 'AMEND') && !(this.dm.remarks || '').trim()) return warn('Enter the reason');
    if (kind === 'LINK' && !(this.dm.title || '').trim()) return warn('Enter the title');
    if (kind === 'AMEND' && (!!this.dm.impact_score !== !!this.dm.probability_score)) return warn('Select both final Impact and Probability, or neither');
    await this.send({ action: kind, ...this.dm, due_date: this.ymd(this.dm.due_date) });
  }

  async setItemStatus(item: any, status: string) {
    await this.send({ action: 'LINK_STATUS', risk_linked_item_id: item.risk_linked_item_id, item_status: status });
  }

  private async send(body: any) {
    this.saving.set(true);
    try {
      const res: any = await this._hqms.customSaveApiCall('POST', 'riskWorkflowApi', { risk_id: this.risk().risk_id, ...body });
      if (res?.status == 200) {
        this._hqms.hqmsToasterService({ severity: 'success', summary: 'Risk', detail: res.message });
        this.dlg.set(null);
        await this.load(this.risk().risk_id);
      } else {
        this._hqms.hqmsToasterService({ severity: 'warn', summary: 'Risk', detail: res?.message || 'Not saved' });
      }
    } finally {
      this.saving.set(false);
    }
  }

  goBack() { this.location.back(); }
}
