import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../shared/shared.module';
import { HqmsService } from '../../../services/hqms.service';

// Previous vaccination record (SRS 2.x5).
//   mode 'MY' — employee, from My Vaccines: own record, proof required → Pending approval
//   mode 'HR' — History Approvals: HR / Quality / Admin add for an employee → Approved at once
// Saves with vaccinationHistoryApi (fn_vaccination_history_write).
@Component({
  selector: 'app-history-record-dialog',
  imports: [CommonModule, SharedModule],
  templateUrl: './history-record-dialog.component.html',
  styleUrls: ['../../vaccination-forms.scss']
})
export class HistoryRecordDialogComponent {
  private _hqms = inject(HqmsService);
  readonly FILE_TYPES = ['pdf', 'jpg', 'jpeg', 'png'];
  readonly FILE_MAX_BYTES = 5 * 1024 * 1024;

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() closed = new EventEmitter<boolean>();

  public mode: 'MY' | 'HR' = 'MY';
  public vaccineList: any[] = [];
  public employeeList: any[] = [];
  public doseCount: { [vaccineId: string]: number } = {};
  public form: any = {};
  public file: File | null = null;
  public err: any = {};
  public today = '';

  get doseOptions(): any[] {
    let n = this.doseCount[this.form.vaccine_id] || 1;
    return Array.from({ length: n }, (_, i) => ({ label: `Dose ${i + 1}`, value: i + 1 }));
  }

  async open(mode: 'MY' | 'HR') {
    this.mode = mode;
    let d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    this.today = d.toISOString().slice(0, 10);
    this.form = { vaccine_id: null, dose_no: 1, vaccination_date: null, brand_name: null, batch_no: null, issuer: null, employee_id: null };
    this.file = null;
    this.err = {};
    if (!this.vaccineList.length) {
      // Active vaccines with their number of doses (Vaccine Master grid).
      let grid: any = await this._hqms.customGetApiCall('GET', 'vaccineMasterApi', { "page_no": 1, "page_size": 500 });
      let rows: any[] = grid?.status == 200 ? grid.data.filter((v: any) => v.status === 'Active') : [];
      this.vaccineList = rows.map((v: any) => ({ label: v.vaccine_name, value: v.vaccine_id }));
      rows.forEach((v: any) => this.doseCount[v.vaccine_id] = Math.max((v.configurations || []).length, 1));
    }
    if (mode === 'HR' && !this.employeeList.length) {
      let staff: any = await this._hqms.customGetApiCall('GET', 'vaccinationStaffListApi', {});
      this.employeeList = staff?.status == 200
        ? staff.data.map((s: any) => ({ label: `${s.employee_name} (${s.employee_code || '-'})`, value: s.employee_id }))
        : [];
    }
    this.setVisible(true);
  }

  private setVisible(value: boolean) {
    this.visible = value;
    this.visibleChange.emit(value);
  }

  onHide() {
    if (!this.visible) return;
    this.setVisible(false);
    this.closed.emit(false);
  }

  onFile(event: any) {
    let file: File | null = event?.target?.files?.[0] || null;
    this.err.file = '';
    if (file) {
      let extension = (file.name.split('.').pop() || '').toLowerCase();
      if (!this.FILE_TYPES.includes(extension)) this.err.file = 'Only PDF, JPG or PNG files are allowed.';
      else if (file.size > this.FILE_MAX_BYTES) this.err.file = 'The file can be up to 5 MB.';
    }
    this.file = this.err.file ? null : file;
    if (event?.target) event.target.value = '';
  }

  private validate(): boolean {
    let e: any = { file: this.err.file || '' };
    if (this.mode === 'HR' && !this.form.employee_id) e.employee_id = 'Employee is required.';
    if (!this.form.vaccine_id) e.vaccine_id = 'Vaccine is required.';
    if (!this.form.dose_no) e.dose_no = 'Dose is required.';
    if (!this.form.vaccination_date) e.vaccination_date = 'Date is required.';
    else if (this.form.vaccination_date > this.today) e.vaccination_date = 'Date cannot be in the future.';
    if (this.mode === 'MY' && !this.file && !e.file) e.file = 'Attach the proof (certificate / card).';
    this.err = e;
    return !Object.values(e).some((v) => v);
  }

  async onSave() {
    if (!this.validate()) return;
    let confirm = await this._hqms.showConfirmMessage(this.mode === 'MY'
      ? 'Send this record for approval?'
      : 'Save this record? It is approved at once and the dose is marked completed.');
    if (!confirm) return;
    let payload: any = {
      action: 'I',
      ...this.form,
      my_records: this.mode === 'MY' ? 'Y' : 'N',
      employee_id: this.mode === 'HR' ? this.form.employee_id : null,
      proof_documents: this.file ? [{
        file_id: null, file_name: this.file.name, file_type: (this.file.name.split('.').pop() || '').toLowerCase(),
        file_size: this.file.size, storage_path: null, is_active: true, upload_file_name: this.file.name,
      }] : [],
    };
    let body: any = payload;
    if (this.file) {
      body = new FormData();
      body.append('file', this.file, this.file.name);
      body.append('data', JSON.stringify(payload));
    }
    let result: any = await this._hqms.customSaveApiCall('POST', 'vaccinationHistoryApi', body);
    if (result?.status == 200) {
      this._hqms.hqmsToasterService({ severity: 'success', summary: 'Vaccination History', detail: result.message });
      this.setVisible(false);
      this.closed.emit(true);
    } else {
      this._hqms.hqmsToasterService({ severity: 'warn', summary: 'Vaccination History', detail: result?.message || 'Save failed.' });
    }
  }
}
