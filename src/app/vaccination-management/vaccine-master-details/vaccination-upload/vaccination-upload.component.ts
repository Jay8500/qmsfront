import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { HqmsService } from '../../../services/hqms.service';
import { SharedModule } from '../../../shared/shared.module';

// One Excel row = one dose given to (or missed by) one employee. Employee codes are matched on the server.
const TEMPLATE_COLUMNS = [
  'EmployeeCode', 'EmployeeName', 'VaccineName', 'DoseNo', 'VaccinationDate', 'Brand', 'BatchNo',
  'VaccinatedBy', 'Status', 'MissedReason', 'Notes'
];
const ALLOWED_STATUS = ['Completed', 'Missed'];

interface UploadError {
  row: number;
  employee: string;
  message: string;
}

@Component({
  selector: 'app-vaccination-upload',
  imports: [CommonModule, FormsModule, SharedModule],
  templateUrl: './vaccination-upload.component.html',
  styleUrl: '../../vaccination-forms.scss',
  providers: [DatePipe]
})
export class VaccinationUploadComponent implements OnInit {
  @Output() closed = new EventEmitter<boolean>();
  public _hqms = inject(HqmsService);
  private _datePipe = inject(DatePipe);
  public visible = true;
  public fileName: string = '';
  public totalRows = 0;
  public validRecords: any[] = [];
  public errors: UploadError[] = [];
  public isChecked = false;
  private saved = false;
  private today: string = '';
  private vaccines = new Map<string, any>();

  async ngOnInit() {
    try {
      this.today = this._datePipe.transform(await this._hqms.getServerDate('DATE'), 'yyyy-MM-dd') || '';
      let vaccines: any = await this._hqms.customGetApiCall('GET', 'fnTemplateListGet', { "flag": "VACCN_MASTR" });
      if (vaccines.status == 200) {
        vaccines.data.forEach((ele: any) => this.vaccines.set(String(ele.vaccine_name).trim().toLowerCase(), ele));
      };
    } catch (e) { }
  }

  onDownloadTemplate() {
    let workBook = XLSX.utils.book_new();
    let firstVaccine = [...this.vaccines.values()][0]?.vaccine_name || 'Hepatitis B';
    let sample = [
      TEMPLATE_COLUMNS,
      ['EMP001', 'Employee name (for reference)', firstVaccine, 1, '05-10-2026', 'Serum Institute of India', 'BN8678', 'EMP010', 'Completed', '', ''],
      ['EMP002', 'Employee name (for reference)', firstVaccine, 1, '05-10-2026', '', '', '', 'Missed', 'On Leave', ''],
    ];
    XLSX.utils.book_append_sheet(workBook, XLSX.utils.aoa_to_sheet(sample), 'Vaccinations');
    let allowed: any[][] = [['Column', 'Allowed values']];
    allowed.push(['EmployeeCode', 'Employee code as in the employee master (required)']);
    allowed.push(['VaccineName', [...this.vaccines.values()].map((v) => v.vaccine_name).join(', ')]);
    allowed.push(['DoseNo', 'Dose number in the series: 1, 2, 3 …']);
    allowed.push(['VaccinationDate', 'dd-mm-yyyy, not in the future']);
    allowed.push(['Brand / BatchNo / VaccinatedBy', 'Required when Status = Completed (VaccinatedBy = employee code)']);
    allowed.push(['Status', ALLOWED_STATUS.join(' / ')]);
    allowed.push(['MissedReason', 'Required when Status = Missed: On Leave, Sick/Contraindicated, Stock-Out, Clinic Closed, Refused, Scheduling Conflict, Other']);
    allowed.push(['Notes', 'Required when MissedReason = Other (max 180 characters)']);
    XLSX.utils.book_append_sheet(workBook, XLSX.utils.aoa_to_sheet(allowed), 'Allowed values');
    XLSX.writeFile(workBook, 'vaccination_details_upload.xlsx');
  }

  onFileChange(event: any) {
    this.resetResult();
    let file: File = event.target?.files?.[0];
    if (!file) return;
    this.fileName = file.name;
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
      this.errors = [{ row: 0, employee: '', message: 'Only .xlsx, .xls or .csv files are allowed.' }];
      this.isChecked = true;
      return;
    }
    let reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        let workBook = XLSX.read(new Uint8Array(e.target.result), { type: 'array', cellDates: true });
        let sheet = workBook.Sheets[workBook.SheetNames[0]];
        let rows: any[] = XLSX.utils.sheet_to_json(sheet, { raw: false, defval: '', dateNF: 'dd-mm-yyyy' });
        this.validateRows(rows);
      } catch (err) {
        this.errors = [{ row: 0, employee: '', message: 'The file could not be read. Use the downloaded template.' }];
      }
      this.isChecked = true;
    };
    reader.readAsArrayBuffer(file);
    event.target.value = '';
  }

  private resetResult() {
    this.fileName = '';
    this.totalRows = 0;
    this.validRecords = [];
    this.errors = [];
    this.isChecked = false;
  }

  private text(row: any, col: string): string {
    return String(row[col] ?? '').trim();
  }

  // dd-mm-yyyy (also dd/mm/yyyy) → yyyy-mm-dd, or null when not a real date.
  private toIsoDate(value: string): string | null {
    let match = /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/.exec(value);
    if (!match) return null;
    let [, d, m, y] = match;
    let iso = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    let dt = new Date(iso + 'T00:00:00');
    return !isNaN(dt.getTime()) && dt.getDate() == Number(d) ? iso : null;
  }

  validateRows(rows: any[]) {
    this.totalRows = rows.length;
    if (rows.length == 0) {
      this.errors.push({ row: 0, employee: '', message: 'The file has no data rows.' });
      return;
    }
    let missingCols = TEMPLATE_COLUMNS.filter((col) => !(col in rows[0]));
    if (missingCols.length > 0) {
      this.errors.push({ row: 0, employee: '', message: `Missing columns: ${missingCols.join(', ')}` });
      return;
    }
    let seen = new Set<string>();
    rows.forEach((row: any, index: number) => {
      let rowNo = index + 2; // row 1 is the header in Excel
      let empCode = this.text(row, 'EmployeeCode');
      let rowErrors: string[] = [];
      let addError = (message: string) => rowErrors.push(message);

      if (!empCode) addError('EmployeeCode is required.');
      let vaccineName = this.text(row, 'VaccineName');
      let vaccine = this.vaccines.get(vaccineName.toLowerCase());
      if (!vaccineName) addError('VaccineName is required.');
      else if (!vaccine) addError(`VaccineName "${vaccineName}" is not an active vaccine.`);
      let doseNo = parseInt(this.text(row, 'DoseNo'), 10);
      if (!(doseNo >= 1)) addError('DoseNo must be 1 or more.');
      let date = this.toIsoDate(this.text(row, 'VaccinationDate'));
      if (!date) addError('VaccinationDate must be a date in dd-mm-yyyy format.');
      else if (this.today && date > this.today) addError('VaccinationDate cannot be in the future.');
      let status = ALLOWED_STATUS.find((st) => st.toLowerCase() === this.text(row, 'Status').toLowerCase());
      if (!status) addError(`Status must be ${ALLOWED_STATUS.join(' or ')}.`);
      if (status === 'Completed') {
        if (!this.text(row, 'Brand')) addError('Brand is required for Completed.');
        if (!this.text(row, 'BatchNo')) addError('BatchNo is required for Completed.');
        if (!this.text(row, 'VaccinatedBy')) addError('VaccinatedBy is required for Completed.');
      }
      let missedReason = this.text(row, 'MissedReason');
      let notes = this.text(row, 'Notes');
      if (status === 'Missed') {
        if (!missedReason) addError('MissedReason is required for Missed.');
        if (missedReason.toLowerCase() === 'other' && !notes) addError('Notes are required when MissedReason is Other.');
      }
      if (notes.length > 180) addError('Notes can have up to 180 characters.');
      let key = `${empCode.toLowerCase()}|${vaccineName.toLowerCase()}|${doseNo}`;
      if (empCode && vaccine && doseNo >= 1 && seen.has(key)) addError('Same employee, vaccine and dose appear twice in the file.');
      seen.add(key);

      if (rowErrors.length > 0) {
        rowErrors.forEach((message) => this.errors.push({ row: rowNo, employee: empCode, message }));
        return;
      }
      this.validRecords.push({
        "row_no": rowNo,
        "employee_code": empCode,
        "vaccine_id": vaccine.vaccine_id,
        "dose_no": doseNo,
        "administered_at": date,
        "brand_name": this.text(row, 'Brand') || null,
        "batch_no": this.text(row, 'BatchNo') || null,
        "administered_by_code": this.text(row, 'VaccinatedBy') || null,
        "status": status,
        "missed_reason": status === 'Missed' ? missedReason : null,
        "missed_notes": status === 'Missed' ? (notes || null) : null,
      });
    });
  }

  async onSubmitClick() {
    if (this.validRecords.length == 0) return;
    let confirm = await this._hqms.showConfirmMessage(
      `Upload ${this.validRecords.length} record(s)? Rows with errors are skipped.`);
    if (!confirm) return;
    let saveResult: any = await this._hqms.customSaveApiCall('POST', 'fnVaccinationDetailsUploadApi', {
      "action": "I",
      "file_name": this.fileName,
      "records": this.validRecords
    });
    if (saveResult?.status == 200) {
      // The server may still reject rows (e.g. unknown employee code); it returns them in data.
      let serverErrors: any[] = Array.isArray(saveResult.data) ? saveResult.data.filter((r: any) => r?.error_msg) : [];
      serverErrors.forEach((r: any) => this.errors.push({ row: r.row_no || 0, employee: r.employee_code || '', message: r.error_msg }));
      this._hqms.hqmsToasterService({
        severity: serverErrors.length > 0 ? 'warn' : 'success',
        summary: 'Vaccination Upload',
        detail: `${this.validRecords.length - serverErrors.length} saved${serverErrors.length > 0 ? `, ${serverErrors.length} rejected by the server` : ''}.`,
      });
      this.saved = true;
      if (serverErrors.length == 0) this.visible = false;
      else this.validRecords = [];
    } else {
      this._hqms.hqmsToasterService({
        severity: 'warn',
        summary: 'Vaccination Upload',
        detail: saveResult?.message || 'Upload failed.',
      });
    }
  }

  onClearClick() {
    this.resetResult();
  }

  onHide() {
    this.closed.emit(this.saved);
  }
}
