import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { HqmsService } from '../../services/hqms.service';
import { SharedModule } from '../../shared/shared.module';
import { QmsFilePickerComponent } from '../../components/qms-ui/qms-file-picker.component';
import { QmsFileListComponent } from '../../components/qms-ui/qms-file-list.component';

// Investigation Workflow Screen (SRS 2.3): the assigned Investigation Officer records findings, RCA
// (5 Whys or Fishbone + category), Corrective Action and Preventive Action (the CAPA), evidence, then
//   Submit  -> HOD review (CAPA raised)        Reject -> incident archived with the reason      Save draft
// Saved by fn_incident_workflow_write (action INVESTIGATE).
@Component({
  selector: 'app-investigation',
  standalone: true,
  imports: [SharedModule, QmsFilePickerComponent, QmsFileListComponent],
  templateUrl: './investigation.component.html',
  styleUrls: ['./investigation.component.scss', '../../components/qms-ui/qms-ui.scss']
})
export class InvestigationComponent implements OnInit {
  private _hqms = inject(HqmsService);
  private router = inject(Router);
  private location = inject(Location);
  @ViewChild('picker') picker!: QmsFilePickerComponent;

  public inc = signal<any>(null);
  public loading = signal(true);
  public saving = signal(false);
  public categoryList: any[] = [];
  public showReject = signal(false);
  public rejectReason = '';
  public fishboneKeys = [
    { k: 'people', label: 'People' }, { k: 'process', label: 'Process / Method' }, { k: 'equipment', label: 'Equipment' },
    { k: 'environment', label: 'Environment' }, { k: 'materials', label: 'Materials' }, { k: 'management', label: 'Management' }
  ];
  public m: any = {
    findings: '', rca_method: '5WHYS', rca_category_id: null, whys: ['', '', '', '', ''], root_cause: '',
    fishbone: { people: '', process: '', equipment: '', environment: '', materials: '', management: '' },
    corrective_action: '', preventive_action: ''
  };

  async ngOnInit() {
    try {
      const lists: any = await this._hqms.customGetApiCall('GET', 'commanEntityValuesGetApi', { entity_codes: 'RCACATEGORY' }, true);
      if (lists?.status == 200) {
        this.categoryList = (lists.data.entities.RCACATEGORY?.values || []).map((v: any) => ({ label: v.display_value, value: v.entity_value_id }));
      }
    } catch (e) { }
    const id = history.state?.data?.id;
    if (id) await this.load(id);
    this.loading.set(false);
  }

  async load(id: any) {
    const res: any = await this._hqms.customGetApiCall('GET', 'incidentWorkflowApi', { incident_id: id });
    if (res?.status == 200 && res.data?.length) {
      const d = res.data[0];
      this.inc.set(d);
      const v = d.investigation || {};
      const r = v.rca_detail || {};
      this.m = {
        findings: v.findings || '', rca_method: v.rca_method || '5WHYS', rca_category_id: v.rca_category_id || null,
        whys: [0, 1, 2, 3, 4].map((i) => (r.whys || [])[i] || ''), root_cause: r.root_cause || '',
        fishbone: { people: '', process: '', equipment: '', environment: '', materials: '', management: '', ...(r.fishbone || {}) },
        corrective_action: v.corrective_action || '', preventive_action: v.preventive_action || ''
      };
    }
  }

  len(t: any) { return (t || '').trim().length; }

  private rcaDetail() {
    return this.m.rca_method === 'FISHBONE'
      ? { fishbone: this.m.fishbone, root_cause: (this.m.root_cause || '').trim() }
      : { whys: this.m.whys.map((w: string) => (w || '').trim()).filter((w: string) => w), root_cause: (this.m.root_cause || '').trim() };
  }

  async save(decision: 'DRAFT' | 'APPROVE' | 'REJECT') {
    const warn = (detail: string) => this._hqms.hqmsToasterService({ severity: 'warn', summary: 'Investigation', detail });
    if (decision === 'APPROVE') {
      if (this.len(this.m.findings) < 20) return warn('Enter the findings (at least 20 characters)');
      if (!this.m.rca_category_id) return warn('Select the RCA category');
      if (!this.len(this.m.root_cause)) return warn('Enter the root cause');
      if (this.len(this.m.corrective_action) < 20) return warn('Enter the Corrective Action (at least 20 characters)');
      if (this.len(this.m.preventive_action) < 20) return warn('Enter the Preventive Action (at least 20 characters)');
      const ok = await this._hqms.showConfirmMessage('Submit the investigation? It goes to the Department Head for review and the CAPA is raised.');
      if (!ok) return;
    }
    if (decision === 'REJECT' && !this.len(this.rejectReason)) return warn('Enter the reason for rejection');

    const payload = {
      incident_id: this.inc().incident_id, action: 'INVESTIGATE', decision,
      findings: this.m.findings, rca_method: this.m.rca_method, rca_category_id: this.m.rca_category_id, rca_detail: this.rcaDetail(),
      corrective_action: this.m.corrective_action, preventive_action: this.m.preventive_action,
      reject_reason: decision === 'REJECT' ? this.rejectReason.trim() : null,
      files: this.picker?.meta() || []
    };
    const form = new FormData();
    this.picker?.appendTo(form);
    form.append('data', JSON.stringify(payload));
    this.saving.set(true);
    try {
      const res: any = await this._hqms.customSaveApiCall('POST', 'incidentWorkflowApi', form);
      if (res?.status == 200) {
        this._hqms.hqmsToasterService({ severity: 'success', summary: 'Investigation', detail: res.message });
        this.showReject.set(false);
        if (decision === 'DRAFT') {
          this.picker?.clear();
          await this.load(this.inc().incident_id);
        } else {
          this.router.navigate(['/incident-details'], { state: { data: { mode: 'VIEW', id: this.inc().incident_id } } });
        }
      } else {
        warn(res?.message || 'Not saved');
      }
    } finally {
      this.saving.set(false);
    }
  }

  goBack() { this.location.back(); }
}
