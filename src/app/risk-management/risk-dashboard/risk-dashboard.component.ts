import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HqmsService } from '../../services/hqms.service';
import { SharedModule } from '../../shared/shared.module';
import { VaccinationAccessService } from '../../vaccination-management/vaccination-access.service';
import { QmsBarListComponent } from '../../components/qms-ui/qms-bar-list.component';
import { RiskListComponent } from '../risk-list/risk-list.component';

// Risk Report Dashboard (Risk SRS 2.5): cards (Overall Reported, High Impact, Re-Opened, Closed + open / awaiting
// QT / overdue), 5x5 heat map, charts by department / type / impact level, filters (This Month / Quarter / Year,
// department, type, level) and the risk register list with "Waiting for me".
// Data: fn_risk_dashboard_get + fn_risk_list_get.
@Component({
  selector: 'app-risk-dashboard',
  standalone: true,
  imports: [SharedModule, QmsBarListComponent, RiskListComponent],
  templateUrl: './risk-dashboard.component.html',
  styleUrls: ['./risk-dashboard.component.scss', '../../components/qms-ui/qms-ui.scss']
})
export class RiskDashboardComponent implements OnInit {
  private _hqms = inject(HqmsService);
  private router = inject(Router);
  private accessService = inject(VaccinationAccessService);
  public access = this.accessService.access('risk-dashboard');

  public dash = signal<any>({ cards: {}, by_department: [], by_type: [], by_level: [], heat_map: [] });
  public rows = signal<any[]>([]);
  public total = signal(0);
  public loading = signal(false);
  public period = signal<string>('ALL');
  public periods = [{ k: 'MONTH', l: 'This Month' }, { k: 'QUARTER', l: 'This Quarter' }, { k: 'YEAR', l: 'This Year' }, { k: 'ALL', l: 'All' }];
  public typeList: any[] = [];
  public departmentList: any[] = [];
  public levelList = [{ label: 'High (16-25)', value: 'HIGH' }, { label: 'Medium (6-15)', value: 'MEDIUM' }, { label: 'Low (1-5)', value: 'LOW' }, { label: 'Not scored', value: 'NOT_SCORED' }];
  public statusList = [['REPORTED', 'Reported'], ['MITIGATION_SUBMITTED', 'Mitigation Plan Submitted'], ['UNDER_QT_REVIEW', 'Under QT Review'],
    ['REVISION_REQUIRED', 'Revision Required'], ['PERIODIC_REVIEW', 'Periodic Review'], ['CLOSED', 'Closed'], ['DRAFT', 'Draft (mine)']]
    .map(([v, l]) => ({ label: l, value: v }));
  public filters: any = { status: null, risk_type_id: null, department_id: null, risk_level: null, search: '', queue: null };
  public page = 1;
  public pageSize = 10;
  public showFilters = false;
  public impactNames = ['', 'Minor', 'Moderate', 'Major', 'Severe', 'Catastrophic'];
  public probNames = ['', 'Rare', 'Unlikely', 'Possible', 'Likely', 'Almost certain'];

  async ngOnInit() {
    try {
      const lists: any = await this._hqms.customGetApiCall('GET', 'commanEntityValuesGetApi', { entity_codes: 'RISK_TYPE' }, true);
      if (lists?.status == 200) this.typeList = (lists.data.entities.RISK_TYPE?.values || []).map((v: any) => ({ label: v.display_value, value: v.entity_value_id }));
      const dept: any = await this._hqms.customGetApiCall('GET', 'fnTemplateListGet', { flag: 'DEPARTMENT' }, true);
      if (dept?.status == 200) this.departmentList = dept.data.map((d: any) => ({ label: d.department_name, value: d.department_id }));
    } catch (e) { }
    await Promise.all([this.loadDashboard(), this.loadList()]);
  }

  async loadDashboard() {
    try {
      const res: any = await this._hqms.customGetApiCall('GET', 'riskDashboardApi', {
        period: this.period(), department_id: this.filters.department_id, risk_type_id: this.filters.risk_type_id, risk_level: this.filters.risk_level
      });
      if (res?.status == 200 && res.data?.length) this.dash.set(res.data[0]);
    } catch (e) { }
  }

  async loadList() {
    this.loading.set(true);
    try {
      const res: any = await this._hqms.customGetApiCall('GET', 'riskReportApi', { ...this.filters, page_no: this.page, page_size: this.pageSize });
      const data = res?.status == 200 && Array.isArray(res.data) ? res.data : [];
      this.rows.set(data);
      this.total.set(data.length ? Number(data[0].total_count) : 0);
    } catch (e) {
      this.rows.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  async applyFilters() {
    this.page = 1;
    await Promise.all([this.loadDashboard(), this.loadList()]);
  }

  async clearFilters() {
    this.filters = { status: null, risk_type_id: null, department_id: null, risk_level: null, search: '', queue: this.filters.queue };
    await this.applyFilters();
  }

  async setPeriod(p: string) {
    this.period.set(p);
    await this.loadDashboard();
  }

  async cardFilter(key: string) {
    const f = this.filters;
    if (key === 'HIGH') { f.risk_level = f.risk_level === 'HIGH' ? null : 'HIGH'; f.status = null; }
    else if (key === 'CLOSED') { f.status = f.status === 'CLOSED' ? null : 'CLOSED'; f.risk_level = null; }
    else if (key === 'REOPENED') { f.status = f.status === 'UNDER_QT_REVIEW' ? null : 'UNDER_QT_REVIEW'; f.risk_level = null; }
    else { f.status = null; f.risk_level = null; }
    this.page = 1;
    await this.loadList();
  }

  async setQueue(q: string | null) {
    this.filters.queue = q;
    this.page = 1;
    await this.loadList();
  }

  async goPage(p: number) {
    if (p < 1 || p > this.pages()) return;
    this.page = p;
    await this.loadList();
  }

  pages() { return Math.max(1, Math.ceil(this.total() / this.pageSize)); }

  heatRows() {
    const cells = this.dash().heat_map || [];
    return [5, 4, 3, 2, 1].map((i) => ({ impact: i, cells: [1, 2, 3, 4, 5].map((p) => cells.find((c: any) => c.impact === i && c.probability === p) || { impact: i, probability: p, score: i * p, count: 0 }) }));
  }

  levelOf(score: number) { return score >= 16 ? 'HIGH' : score >= 6 ? 'MEDIUM' : 'LOW'; }

  levelColor(l: string) { return l === 'HIGH' ? '#d73a49' : l === 'MEDIUM' ? '#d4a72c' : l === 'LOW' ? '#2da44e' : '#8c959f'; }

  levelItems() {
    return (this.dash().by_level || []).map((x: any) => ({ ...x, color: this.levelColor(x.level) }));
  }

  openRisk(r: any) {
    this.router.navigate(['/risk-details'], { state: { data: { mode: 'VIEW', id: r.risk_id } } });
  }

  newRisk() {
    this.router.navigate(['/risk-add'], { state: { data: { mode: 'NEW', id: null } } });
  }
}
