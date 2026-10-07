import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HqmsService } from '../../services/hqms.service';
import { SharedModule } from '../../shared/shared.module';
import { QmsFilePickerComponent } from '../../components/qms-ui/qms-file-picker.component';
import { QmsFileListComponent } from '../../components/qms-ui/qms-file-list.component';
import { RiskListComponent } from '../risk-list/risk-list.component';

// Evaluation & Risk Scoring (Risk SRS 2.2): the Department Head's queue (Reported / Revision Required / reopened
// risks of their department) and the scoring form: Impact 1-5 x Probability 1-5 = initial score with NABH colour,
// Mitigation Plan, Action Taken, mitigation action type (Training creates a linked item), target date, evidence.
// Saved by fn_risk_workflow_write (SCORE).
@Component({
  selector: 'app-riskevaluation',
  standalone: true,
  imports: [SharedModule, QmsFilePickerComponent, QmsFileListComponent, RiskListComponent],
  templateUrl: './riskevaluation.component.html',
  styleUrls: ['./riskevaluation.component.scss', '../../components/qms-ui/qms-ui.scss']
})
export class RiskevaluationComponent implements OnInit {
  private _hqms = inject(HqmsService);
  private router = inject(Router);
  @ViewChild('picker') picker!: QmsFilePickerComponent;

  public queue = signal<any[]>([]);
  public loading = signal(false);
  public risk = signal<any>(null);
  public saving = signal(false);
  public actionTypes: any[] = [];
  public impacts = [[1, 'Minor'], [2, 'Moderate'], [3, 'Major'], [4, 'Severe'], [5, 'Catastrophic']].map(([v, l]) => ({ value: v, label: `${v} - ${l}` }));
  public probs = [[1, 'Rare'], [2, 'Unlikely'], [3, 'Possible'], [4, 'Likely'], [5, 'Almost certain']].map(([v, l]) => ({ value: v, label: `${v} - ${l}` }));
  public today = new Date();
  public m: any = { impact_score: null, probability_score: null, mitigation_plan: '', action_taken: '', mitigation_action_type: null, due_date: null, remarks: '' };

  async ngOnInit() {
    try {
      const lists: any = await this._hqms.customGetApiCall('GET', 'commanEntityValuesGetApi', { entity_codes: 'RISK_MITIGATION' }, true);
      if (lists?.status == 200) this.actionTypes = (lists.data.entities.RISK_MITIGATION?.values || []).map((v: any) => ({ label: v.display_value, value: v.value_code }));
    } catch (e) { }
    const id = history.state?.data?.id;
    if (id) await this.select(id);
    await this.loadQueue();
  }

  async loadQueue() {
    this.loading.set(true);
    try {
      // visible risks (the server limits a Department Head to the own department); keep those awaiting scoring
      const res: any = await this._hqms.customGetApiCall('GET', 'riskReportApi', { page_size: 500 });
      const rows = res?.status == 200 && Array.isArray(res.data) ? res.data : [];
      this.queue.set(rows.filter((r: any) => ['REPORTED', 'REVISION_REQUIRED', 'UNDER_QT_REVIEW'].includes(r.status_code)));
    } finally {
      this.loading.set(false);
    }
  }

  async select(id: any) {
    const res: any = await this._hqms.customGetApiCall('GET', 'riskWorkflowApi', { risk_id: id });
    if (res?.status == 200 && res.data?.length) {
      const d = res.data[0];
      this.risk.set(d);
      const s = d.dept_scoring;
      this.m = {
        impact_score: s?.impact_score || null, probability_score: s?.probability_score || null,
        mitigation_plan: s?.mitigation_plan || '', action_taken: s?.action_taken || '',
        mitigation_action_type: d.mitigation_action_type || null, due_date: d.due_date ? new Date(d.due_date) : null, remarks: ''
      };
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  score() { return (this.m.impact_score || 0) * (this.m.probability_score || 0); }
  level() { const s = this.score(); return !s ? null : s >= 16 ? 'HIGH' : s >= 6 ? 'MEDIUM' : 'LOW'; }
  levelName() { return ({ HIGH: 'High risk (16-25)', MEDIUM: 'Medium risk (6-15)', LOW: 'Low risk (1-5)' } as any)[this.level() || ''] || 'Select both scores'; }

  private ymd(d: any) {
    if (!d) return null;
    const x = d instanceof Date ? d : new Date(d);
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
  }

  async submit() {
    const warn = (detail: string) => this._hqms.hqmsToasterService({ severity: 'warn', summary: 'Risk Scoring', detail });
    const m = this.m;
    if (!m.impact_score || !m.probability_score) return warn('Select Impact and Probability');
    if (!(m.mitigation_plan || '').trim()) return warn('Enter the Mitigation Plan');
    if (!(m.action_taken || '').trim()) return warn('Enter the Action Taken');
    if (this.level() === 'HIGH' && !(m.remarks || '').trim()) return warn('Comments are required for a High risk');
    const ok = await this._hqms.showConfirmMessage(`Submit the score ${this.score()} (${this.levelName()}) and mitigation plan to the Quality Team?`);
    if (!ok) return;
    const payload = {
      risk_id: this.risk().risk_id, action: 'SCORE', impact_score: m.impact_score, probability_score: m.probability_score,
      mitigation_plan: m.mitigation_plan.trim(), action_taken: m.action_taken.trim(), mitigation_action_type: m.mitigation_action_type,
      due_date: this.ymd(m.due_date), remarks: (m.remarks || '').trim(), files: this.picker?.meta() || []
    };
    const form = new FormData();
    this.picker?.appendTo(form);
    form.append('data', JSON.stringify(payload));
    this.saving.set(true);
    try {
      const res: any = await this._hqms.customSaveApiCall('POST', 'riskWorkflowApi', form);
      if (res?.status == 200) {
        this._hqms.hqmsToasterService({ severity: 'success', summary: 'Risk Scoring', detail: res.message });
        this.router.navigate(['/risk-details'], { state: { data: { mode: 'VIEW', id: this.risk().risk_id } } });
      } else {
        warn(res?.message || 'Not saved');
      }
    } finally {
      this.saving.set(false);
    }
  }

  openFull() {
    this.router.navigate(['/risk-details'], { state: { data: { mode: 'VIEW', id: this.risk().risk_id } } });
  }
}
