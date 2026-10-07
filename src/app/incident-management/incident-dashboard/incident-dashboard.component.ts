import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HqmsService } from '../../services/hqms.service';
import { SharedModule } from '../../shared/shared.module';
import { VaccinationAccessService } from '../../vaccination-management/vaccination-access.service';
import { QmsBarListComponent } from '../../components/qms-ui/qms-bar-list.component';
import { IncidentListComponent } from '../incident-list/incident-list.component';

// Incident & Investigations Dashboard (SRS 2.6): status cards (Opened / Investigated / Reviewed / Closed), charts
// (happened with, category, location, department, trend) and the incident list with filters and "My queue".
// Data: fn_incident_dashboard_get + fn_incident_list_get (same visibility rules per role).
@Component({
  selector: 'app-incident-dashboard',
  standalone: true,
  imports: [SharedModule, QmsBarListComponent, IncidentListComponent],
  templateUrl: './incident-dashboard.component.html',
  styleUrls: ['./incident-dashboard.component.scss', '../../components/qms-ui/qms-ui.scss']
})
export class IncidentDashboardComponent implements OnInit {
  private _hqms = inject(HqmsService);
  private router = inject(Router);
  private accessService = inject(VaccinationAccessService);
  public access = this.accessService.access('incident-dashboard');

  public dash = signal<any>({ cards: {}, happened_with: [], by_type: [], by_location: [], by_department: [], trend: [] });
  public rows = signal<any[]>([]);
  public loading = signal(false);
  public total = signal(0);
  public typeList: any[] = [];
  public departmentList: any[] = [];
  public statusList = ['Reported', 'Under Investigation', 'HOD Review', 'Pending Closure', 'Closed', 'Rejected']
    .map((s) => ({ label: s, value: s }));
  public period = signal<'MONTH' | 'YEAR'>('YEAR');
  public filters: any = { status: null, incident_type_id: null, department_id: null, search: '', queue: null };
  public page = 1;
  public pageSize = 10;
  public showFilters = false;

  async ngOnInit() {
    const st = history.state?.data;
    if (st?.queue) this.filters.queue = st.queue;
    try {
      const lists: any = await this._hqms.customGetApiCall('GET', 'commanEntityValuesGetApi', { entity_codes: 'INCIDENT_TYPE' }, true);
      if (lists?.status == 200) {
        this.typeList = (lists.data.entities.INCIDENT_TYPE?.values || []).map((v: any) => ({ label: v.display_value, value: v.entity_value_id }));
      }
      const dept: any = await this._hqms.customGetApiCall('GET', 'fnTemplateListGet', { flag: 'DEPARTMENT' }, true);
      if (dept?.status == 200) this.departmentList = dept.data.map((d: any) => ({ label: d.department_name, value: d.department_id }));
    } catch (e) { }
    await Promise.all([this.loadDashboard(), this.loadList()]);
  }

  async loadDashboard() {
    try {
      const res: any = await this._hqms.customGetApiCall('GET', 'incidentDashboardApi', {
        period: this.period(), incident_type_id: this.filters.incident_type_id, department_id: this.filters.department_id
      });
      if (res?.status == 200 && res.data?.length) this.dash.set(res.data[0]);
    } catch (e) { }
  }

  async loadList() {
    this.loading.set(true);
    try {
      const res: any = await this._hqms.customGetApiCall('GET', 'incidentReportApi', {
        ...this.filters, page_no: this.page, page_size: this.pageSize
      });
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
    this.filters = { status: null, incident_type_id: null, department_id: null, search: '', queue: this.filters.queue };
    await this.applyFilters();
  }

  async cardFilter(status: string | null) {
    this.filters.status = this.filters.status === status ? null : status;
    this.page = 1;
    await this.loadList();
  }

  async setQueue(q: string | null) {
    this.filters.queue = q;
    this.page = 1;
    await this.loadList();
  }

  async setPeriod(p: 'MONTH' | 'YEAR') {
    this.period.set(p);
    await this.loadDashboard();
  }

  async goPage(p: number) {
    if (p < 1 || p > this.pages()) return;
    this.page = p;
    await this.loadList();
  }

  pages() {
    return Math.max(1, Math.ceil(this.total() / this.pageSize));
  }

  trendPct(count: number) {
    const max = Math.max(1, ...(this.dash().trend || []).map((t: any) => Number(t.count)));
    return Math.round((Number(count) / max) * 100);
  }

  openIncident(r: any) {
    this.router.navigate(['/incident-details'], { state: { data: { mode: 'VIEW', id: r.incident_id } } });
  }

  newIncident() {
    this.router.navigate(['/incident-add'], { state: { data: { mode: 'NEW', id: null } } });
  }
}
