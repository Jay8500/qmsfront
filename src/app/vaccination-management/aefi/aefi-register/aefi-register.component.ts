import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as XLSX from 'xlsx';
import { SharedModule } from '../../../shared/shared.module';
import { HqmsService } from '../../../services/hqms.service';
import { VaccinationAccessService } from '../../vaccination-access.service';
import { AefiReportDialogComponent } from '../aefi-report-dialog/aefi-report-dialog.component';

// AEFI Register (SRS 2.x7): reports, cards (AEFI per 1,000 doses, severe, time to action) and
// breakdowns by severity / brand / batch. Data: vaccinationAefiApi → fn_vaccination_aefi_get (LIST / STATS).
@Component({
  selector: 'app-aefi-register',
  imports: [CommonModule, SharedModule, AefiReportDialogComponent],
  templateUrl: './aefi-register.component.html',
  styleUrls: ['../../vaccination-forms.scss', './aefi-register.component.scss']
})
export class AefiRegisterComponent implements OnInit {
  private _hqms = inject(HqmsService);
  public access = inject(VaccinationAccessService).access('vaccination-aefi');
  @ViewChild('aefiDialog') aefiDialog!: AefiReportDialogComponent;

  public filters: any = { from_dt: null, to_dt: null, vaccine_id: null, severity_id: null };
  public vaccineList: any[] = [];
  public severityList: any[] = [];
  public rows: any[] = [];
  public stats: any = null;
  public loading = false;
  public searchText = '';
  public showDialog = false;

  async ngOnInit() {
    let today = new Date();
    let from = new Date(today.getFullYear(), today.getMonth() - 2, 1);
    this.filters.from_dt = this.ymd(from);
    this.filters.to_dt = this.ymd(today);
    try {
      let vaccines: any = await this._hqms.customGetApiCall('GET', 'fnTemplateListGet', { "flag": "VACCN_MASTR" });
      this.vaccineList = vaccines?.status == 200 ? vaccines.data.map((v: any) => ({ label: v.vaccine_name, value: v.vaccine_id })) : [];
      let ent: any = await this._hqms.customGetApiCall('GET', 'commanEntityValuesGetApi', { "entity_codes": "AEFISEVERITY" });
      this.severityList = ent?.status == 200
        ? (ent.data?.['entities']?.['AEFISEVERITY']?.['values'] || []).map((v: any) => ({ label: v.display_value, value: v.entity_value_id }))
        : [];
    } catch (e) { }
    await this.load();
  }

  private ymd(d: Date): string {
    let local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  private params(): any {
    let p: any = {};
    Object.keys(this.filters).forEach((key) => { if (this.filters[key]) p[key] = this.filters[key]; });
    return p;
  }

  async load() {
    this.loading = true;
    try {
      let list: any = await this._hqms.customGetApiCall('GET', 'vaccinationAefiApi', { "flag": "LIST", ...this.params() });
      this.rows = list?.status == 200 ? list.data : [];
      let stats: any = await this._hqms.customGetApiCall('GET', 'vaccinationAefiApi', { "flag": "STATS", ...this.params() });
      this.stats = stats?.status == 200 ? stats.data?.[0] : null;
    } catch (e) {
    } finally {
      this.loading = false;
    }
  }

  onClearFilters() {
    this.filters.vaccine_id = null;
    this.filters.severity_id = null;
    this.load();
  }

  visibleRows(): any[] {
    let text = this.searchText.trim().toLowerCase();
    if (!text) return this.rows;
    return this.rows.filter((r) => [r.aefi_no, r.employee_name, r.employee_code, r.vaccine_name, r.department_name, r.batch_no]
      .some((v) => String(v || '').toLowerCase().includes(text)));
  }

  // Bar width (%) inside a breakdown list.
  barWidth(list: any[], value: number): number {
    let max = Math.max(...(list || []).map((x: any) => Number(x.value) || 0), 1);
    return Math.round((Number(value) || 0) * 100 / max);
  }

  severityClass(code: string): string {
    return code === 'SEVERE' ? 'badge-red' : code === 'MODERATE' ? 'badge-yellow' : 'badge-green';
  }

  onEdit(row: any) {
    if (!this.access().access_mod) return;
    this.aefiDialog.openEdit(row);
  }

  async onDialogClosed(saved: boolean) {
    if (saved) await this.load();
  }

  onExport() {
    let sheet = XLSX.utils.json_to_sheet(this.visibleRows().map((r) => ({
      'AEFI No.': r.aefi_no, 'Event Time': r.event_time, 'Employee': r.employee_name, 'Employee ID': r.employee_code,
      'Department': r.department_name, 'Vaccine': r.vaccine_name, 'Dose': r.dose_label, 'Vaccination Date': r.vaccination_date,
      'Brand': r.brand_name, 'Batch': r.batch_no, 'Severity': r.severity, 'Symptoms': [r.symptoms, r.other_symptom].filter((x) => x).join(', '),
      'Immediate Action': r.immediate_action, 'Minutes to Action': r.minutes_to_action, 'Outcome': r.outcome,
      'Reporter': r.reporter_name, 'Quality Notified': r.quality_notified ? 'Yes' : 'No', 'Notes': r.notes,
    })));
    let book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, 'AEFI Register');
    XLSX.writeFile(book, `AEFI_Register_${this.filters.from_dt || ''}_${this.filters.to_dt || ''}.xlsx`);
  }
}
