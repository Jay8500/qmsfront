import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HqmsService } from '../../services/hqms.service';
import { SharedModule } from '../../shared/shared.module';
import { QmsFileListComponent } from '../../components/qms-ui/qms-file-list.component';
import { RiskListComponent } from '../risk-list/risk-list.component';

// Quality Review of Risk (Risk SRS 2.3): the Quality Team queue (mitigation submitted, reopened, periodic reviews
// due) and the review form: department plan and evidence, final Impact x Probability = final score, closure option
// Closed / Revision Required / Close & Periodic Review (Weekly / Monthly / Quarterly / Yearly), comments
// (required for High risks and revisions). Saved by fn_risk_workflow_write (REVIEW).
@Component({
  selector: 'app-riskqualityreview',
  standalone: true,
  imports: [SharedModule, QmsFileListComponent, RiskListComponent],
  templateUrl: './riskqualityreview.component.html',
  styleUrls: ['./riskqualityreview.component.scss', '../../components/qms-ui/qms-ui.scss']
})
export class RiskqualityreviewComponent implements OnInit {
  private _hqms = inject(HqmsService);
  private router = inject(Router);

  public queue = signal<any[]>([]);
  public loading = signal(false);
  public risk = signal<any>(null);
  public saving = signal(false);
  public impacts = [[1, 'Minor'], [2, 'Moderate'], [3, 'Major'], [4, 'Severe'], [5, 'Catastrophic']].map(([v, l]) => ({ value: v, label: `${v} - ${l}` }));
  public probs = [[1, 'Rare'], [2, 'Unlikely'], [3, 'Possible'], [4, 'Likely'], [5, 'Almost certain']].map(([v, l]) => ({ value: v, label: `${v} - ${l}` }));
  public decisions = [
    { v: 'CLOSED', l: 'Closed', d: 'Mitigated; no further tracking' },
    { v: 'REVISION_REQUIRED', l: 'Revision Required', d: 'Mitigation inadequate; back to the department' },
    { v: 'PERIODIC_REVIEW', l: 'Close & Periodic Review', d: 'Reduced but needs regular review' }
  ];
  public freqs = [{ label: 'Weekly', value: 'WEEKLY' }, { label: 'Monthly', value: 'MONTHLY' }, { label: 'Quarterly', value: 'QUARTERLY' }, { label: 'Yearly', value: 'YEARLY' }];
  public m: any = { impact_score: null, probability_score: null, decision: null, review_frequency: null, remarks: '' };

  async ngOnInit() {
    const id = history.state?.data?.id;
    if (id) await this.select(id);
    await this.loadQueue();
  }

  async loadQueue() {
    this.loading.set(true);
    try {
      const res: any = await this._hqms.customGetApiCall('GET', 'riskReportApi', { page_size: 500 });
      const rows = res?.status == 200 && Array.isArray(res.data) ? res.data : [];
      const today = new Date();
      this.queue.set(rows.filter((r: any) => ['MITIGATION_SUBMITTED', 'UNDER_QT_REVIEW'].includes(r.status_code)
        || (r.status_code === 'PERIODIC_REVIEW' && r.next_review_date && this.parse(r.next_review_date) <= today)));
    } finally {
      this.loading.set(false);
    }
  }

  private parse(dmy: string) {
    const [d, mo, y] = (dmy || '').split('-').map(Number);
    return new Date(y, (mo || 1) - 1, d || 1);
  }

  async select(id: any) {
    const res: any = await this._hqms.customGetApiCall('GET', 'riskWorkflowApi', { risk_id: id });
    if (res?.status == 200 && res.data?.length) {
      const d = res.data[0];
      this.risk.set(d);
      this.m = {
        impact_score: d.dept_scoring?.impact_score || null, probability_score: d.dept_scoring?.probability_score || null,
        decision: null, review_frequency: d.review_frequency || null, remarks: ''
      };
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  score() { return (this.m.impact_score || 0) * (this.m.probability_score || 0); }
  level() { const s = this.score(); return !s ? null : s >= 16 ? 'HIGH' : s >= 6 ? 'MEDIUM' : 'LOW'; }
  levelName() { return ({ HIGH: 'High risk (16-25)', MEDIUM: 'Medium risk (6-15)', LOW: 'Low risk (1-5)' } as any)[this.level() || ''] || 'Select both scores'; }
  commentsRequired() { return this.level() === 'HIGH' || this.m.decision === 'REVISION_REQUIRED'; }

  async submit() {
    const warn = (detail: string) => this._hqms.hqmsToasterService({ severity: 'warn', summary: 'Quality Review', detail });
    const m = this.m;
    if (!m.impact_score || !m.probability_score) return warn('Select the final Impact and Probability');
    if (!m.decision) return warn('Select the closure option');
    if (m.decision === 'PERIODIC_REVIEW' && !m.review_frequency) return warn('Select the review frequency');
    if (this.commentsRequired() && !(m.remarks || '').trim()) return warn('Comments are required');
    const label = this.decisions.find((x) => x.v === m.decision)?.l;
    const ok = await this._hqms.showConfirmMessage(`Save the review: final score ${this.score()} (${this.levelName()}), ${label}?`);
    if (!ok) return;
    this.saving.set(true);
    try {
      const res: any = await this._hqms.customSaveApiCall('POST', 'riskWorkflowApi', {
        risk_id: this.risk().risk_id, action: 'REVIEW', impact_score: m.impact_score, probability_score: m.probability_score,
        decision: m.decision, review_frequency: m.review_frequency, remarks: (m.remarks || '').trim()
      });
      if (res?.status == 200) {
        this._hqms.hqmsToasterService({ severity: 'success', summary: 'Quality Review', detail: res.message });
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
