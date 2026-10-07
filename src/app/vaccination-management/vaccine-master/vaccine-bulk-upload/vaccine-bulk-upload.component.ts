import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { HqmsService } from '../../../services/hqms.service';
import { SharedModule } from '../../../shared/shared.module';

// One Excel row = one dose of one vaccine. Rows with the same VaccineName form one vaccine.
const TEMPLATE_COLUMNS = [
  'VaccineName', 'Manufacturer', 'DoseNo', 'BatchNo', 'Route', 'DosageValue', 'DosageUnit',
  'Recurrence', 'GapDays', 'AgeGroup', 'ReminderDays', 'ScopeType', 'ScopeValue', 'Mandatory', 'AllowDecision', 'Status'
];

interface UploadError {
  row: number;
  vaccine: string;
  message: string;
}

@Component({
  selector: 'app-vaccine-bulk-upload',
  imports: [CommonModule, FormsModule, SharedModule],
  templateUrl: './vaccine-bulk-upload.component.html',
  styleUrl: '../../vaccination-forms.scss'
})
export class VaccineBulkUploadComponent implements OnInit {
  @Output() closed = new EventEmitter<boolean>();
  public _hqms = inject(HqmsService);
  public visible = true;
  public fileName: string = '';
  public totalRows = 0;
  public validVaccines: any[] = [];
  public errors: UploadError[] = [];
  public isChecked = false;
  private saved = false;

  // Master lists: label (lower case) → entity_value_id
  private lists: { [code: string]: Map<string, string> } = {};
  private listLabels: { [code: string]: string[] } = {};
  private doseSequences: any[] = [];
  private departments = new Map<string, string>();
  private roles = new Map<string, string>();
  private scopeTypes = new Map<string, any>();
  private existingVaccines = new Set<string>();

  async ngOnInit() {
    try {
      let info: any = await this._hqms.customGetApiCall('GET', 'commanEntityValuesGetApi',
        { "entity_codes": "ROUTE| UNIT| DOSAGE| GAPDAYS| AGEGROUP| RECURRENCE| VACINAPLCTYPE| DOSAGECONFIG" });
      if (info.status == 200) {
        ['ROUTE', 'UNIT', 'DOSAGE', 'GAPDAYS', 'AGEGROUP', 'RECURRENCE'].forEach((code) => {
          let values: any[] = info.data['entities'][code]?.['values'] || [];
          this.lists[code] = new Map(values.map((ele: any) => [String(ele.display_value).trim().toLowerCase(), ele.entity_value_id]));
          this.listLabels[code] = values.map((ele: any) => ele.display_value);
        });
        (info.data['entities']['VACINAPLCTYPE']?.['values'] || []).forEach((ele: any) => {
          this.scopeTypes.set(String(ele.value_code).toUpperCase(), ele);
        });
        this.doseSequences = (info.data['entities']['DOSAGECONFIG']?.['values'] || []).map((ele: any) => ({
          id: ele.entity_value_id,
          label: ele.display_value
        }));
      };
      let depts: any = await this._hqms.customGetApiCall('GET', 'fnTemplateListGet', { "flag": "DEPARTMENT" });
      if (depts.status == 200) {
        depts.data.forEach((ele: any) => this.departments.set(String(ele.department_name).trim().toLowerCase(), ele.department_id));
      };
      let roles: any = await this._hqms.customGetApiCall('GET', 'fnTemplateListGet', { "flag": "ROLE" });
      if (roles.status == 200) {
        roles.data.forEach((ele: any) => this.roles.set(String(ele.role_name).trim().toLowerCase(), ele.role_id));
      };
      let vaccines: any = await this._hqms.customGetApiCall('GET', 'fnTemplateListGet', { "flag": "VACCN_MASTR" });
      if (vaccines.status == 200) {
        vaccines.data.forEach((ele: any) => this.existingVaccines.add(String(ele.vaccine_name).trim().toLowerCase()));
      };
    } catch (e) { }
  }

  onDownloadTemplate() {
    let workBook = XLSX.utils.book_new();
    let sample = [
      TEMPLATE_COLUMNS,
      ['Hepatitis B', 'Serum Institute of India', 1, 'BN8678', this.listLabels['ROUTE']?.[0] || '', this.listLabels['DOSAGE']?.[0] || '',
        this.listLabels['UNIT']?.[0] || '', this.listLabels['RECURRENCE']?.[0] || '', this.listLabels['GAPDAYS']?.[0] || '',
        this.listLabels['AGEGROUP']?.[0] || '', 7, 'Department', 'ICU, Laboratory', 'Y', 'N', 'Active'],
    ];
    XLSX.utils.book_append_sheet(workBook, XLSX.utils.aoa_to_sheet(sample), 'Vaccines');
    let allowed: any[][] = [['Column', 'Allowed values']];
    allowed.push(['DoseNo', this.doseSequences.map((ds, i) => `${i + 1} (${ds.label})`).join(', ')]);
    allowed.push(['Route', (this.listLabels['ROUTE'] || []).join(', ')]);
    allowed.push(['DosageValue', (this.listLabels['DOSAGE'] || []).join(', ')]);
    allowed.push(['DosageUnit', (this.listLabels['UNIT'] || []).join(', ')]);
    allowed.push(['Recurrence', (this.listLabels['RECURRENCE'] || []).join(', ')]);
    allowed.push(['GapDays', (this.listLabels['GAPDAYS'] || []).join(', ') + ' (dose 1 must be the 0 value)']);
    allowed.push(['AgeGroup', (this.listLabels['AGEGROUP'] || []).join(', ')]);
    allowed.push(['ScopeType', 'Department / Role']);
    allowed.push(['ScopeValue', 'Department or role names, comma separated, as in the masters']);
    allowed.push(['Mandatory / AllowDecision', 'Y / N']);
    allowed.push(['Status', 'Active / Inactive (default Active)']);
    XLSX.utils.book_append_sheet(workBook, XLSX.utils.aoa_to_sheet(allowed), 'Allowed values');
    XLSX.writeFile(workBook, 'vaccine_master_bulk_upload.xlsx');
  }

  onFileChange(event: any) {
    this.resetResult();
    let file: File = event.target?.files?.[0];
    if (!file) return;
    this.fileName = file.name;
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
      this.errors = [{ row: 0, vaccine: '', message: 'Only .xlsx, .xls or .csv files are allowed.' }];
      this.isChecked = true;
      return;
    }
    let reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        let workBook = XLSX.read(new Uint8Array(e.target.result), { type: 'array', cellDates: true });
        let sheet = workBook.Sheets[workBook.SheetNames[0]];
        let rows: any[] = XLSX.utils.sheet_to_json(sheet, { raw: false, defval: '' });
        this.validateRows(rows);
      } catch (err) {
        this.errors = [{ row: 0, vaccine: '', message: 'The file could not be read. Use the downloaded template.' }];
      }
      this.isChecked = true;
    };
    reader.readAsArrayBuffer(file);
    event.target.value = '';
  }

  private resetResult() {
    this.fileName = '';
    this.totalRows = 0;
    this.validVaccines = [];
    this.errors = [];
    this.isChecked = false;
  }

  private text(row: any, col: string): string {
    return String(row[col] ?? '').trim();
  }

  private lookup(code: string, value: string): string | null {
    if (!value) return null;
    return this.lists[code]?.get(value.toLowerCase()) || null;
  }

  validateRows(rows: any[]) {
    this.totalRows = rows.length;
    if (rows.length == 0) {
      this.errors.push({ row: 0, vaccine: '', message: 'The file has no data rows.' });
      return;
    }
    let missingCols = TEMPLATE_COLUMNS.filter((col) => !(col in rows[0]));
    if (missingCols.length > 0) {
      this.errors.push({ row: 0, vaccine: '', message: `Missing columns: ${missingCols.join(', ')}` });
      return;
    }
    let vaccines = new Map<string, any>();
    let badVaccines = new Set<string>();
    rows.forEach((row: any, index: number) => {
      let rowNo = index + 2; // row 1 is the header in Excel
      let name = this.text(row, 'VaccineName');
      let key = name.toLowerCase();
      let rowErrors: string[] = [];
      let addError = (message: string) => rowErrors.push(message);

      if (!name) addError('VaccineName is required.');
      else if (name.length < 3) addError('VaccineName needs at least 3 characters.');
      if (key && this.existingVaccines.has(key)) addError('Vaccine already exists — edit it on the Vaccine Master screen.');
      if (!this.text(row, 'Manufacturer')) addError('Manufacturer is required.');

      let doseNo = parseInt(this.text(row, 'DoseNo'), 10);
      if (!(doseNo >= 1 && doseNo <= this.doseSequences.length)) addError(`DoseNo must be 1 to ${this.doseSequences.length}.`);
      if (!this.text(row, 'BatchNo')) addError('BatchNo is required.');

      let ids: any = {};
      [['Route', 'ROUTE', 'route_id'], ['DosageValue', 'DOSAGE', 'dosage_value'], ['DosageUnit', 'UNIT', 'dosage_unit'],
      ['Recurrence', 'RECURRENCE', 'recurrence_interval'], ['GapDays', 'GAPDAYS', 'gap_days'], ['AgeGroup', 'AGEGROUP', 'age_group_id']]
        .forEach(([col, code, field]) => {
          let value = this.text(row, col);
          ids[field] = this.lookup(code, value);
          if (!value) addError(`${col} is required.`);
          else if (!ids[field]) addError(`${col} "${value}" is not an allowed value.`);
        });
      if (doseNo == 1 && ids['gap_days'] && parseInt(this.text(row, 'GapDays'), 10) !== 0) addError('GapDays for dose 1 must be the 0 value.');
      if (doseNo > 1 && ids['gap_days'] && !(parseInt(this.text(row, 'GapDays'), 10) > 0)) addError('GapDays after dose 1 must be more than 0.');

      let reminder = this.text(row, 'ReminderDays');
      if (!/^\d+$/.test(reminder)) addError('ReminderDays must be a whole number (0 or more).');

      let scopeType = this.text(row, 'ScopeType').toUpperCase();
      let scope = this.scopeTypes.get(scopeType);
      let scopeIds: string[] = [];
      if (!scope) addError('ScopeType must be Department or Role.');
      else {
        let names = this.text(row, 'ScopeValue').split(',').map((s) => s.trim()).filter((s) => s);
        let master = scopeType === 'ROLE' ? this.roles : this.departments;
        if (names.length == 0) addError('ScopeValue is required.');
        if (scopeType === 'DEPARTMENT' && names.length > 1) addError('Only one Department can be selected (SRS).');
        names.forEach((nm) => {
          let id = master.get(nm.toLowerCase());
          if (id) scopeIds.push(id);
          else addError(`ScopeValue "${nm}" is not in the ${scopeType === 'ROLE' ? 'Role' : 'Department'} master.`);
        });
      }
      let mandatory = this.text(row, 'Mandatory').toUpperCase() || 'N';
      let allowDecision = this.text(row, 'AllowDecision').toUpperCase() || 'N';
      if (!['Y', 'N'].includes(mandatory)) addError('Mandatory must be Y or N.');
      if (!['Y', 'N'].includes(allowDecision)) addError('AllowDecision must be Y or N.');
      let status = this.text(row, 'Status') || 'Active';
      if (!['active', 'inactive'].includes(status.toLowerCase())) addError('Status must be Active or Inactive.');

      if (rowErrors.length > 0) {
        rowErrors.forEach((message) => this.errors.push({ row: rowNo, vaccine: name, message }));
        if (key) badVaccines.add(key);
        return;
      }
      if (!vaccines.has(key)) {
        vaccines.set(key, {
          "vaccine_id": null,
          "vaccine_name": name,
          "manufacturer_master_id": null,
          "manufacture_name": this.text(row, 'Manufacturer'),
          "is_active": status.toLowerCase() === 'active',
          "configurations": []
        });
      }
      let vaccine = vaccines.get(key);
      let sequence = this.doseSequences[doseNo - 1];
      if (vaccine.configurations.some((c: any) => c.dosage_sequence === sequence.id)) {
        this.errors.push({ row: rowNo, vaccine: name, message: `DoseNo ${doseNo} is repeated for this vaccine.` });
        badVaccines.add(key);
        return;
      }
      vaccine.configurations.push({
        "vaccine_det_id": null,
        "dosage_sequence": sequence.id,
        "sequence": doseNo,
        "route_id": ids['route_id'],
        "dosage_value": ids['dosage_value'],
        "dosage_unit": ids['dosage_unit'],
        "gap_days": ids['gap_days'],
        "age_group_id": ids['age_group_id'],
        "recurrence_interval": ids['recurrence_interval'],
        "target_id": scope.entity_value_id,
        "target_source_id": scopeIds,
        "is_mandatory": mandatory === 'Y',
        "allow_decisions": allowDecision === 'Y',
        "reminder_days": parseInt(reminder, 10),
        "batch_no": this.text(row, 'BatchNo'),
        "is_active": true
      });
    });
    vaccines.forEach((vaccine, key) => {
      if (badVaccines.has(key)) return;
      vaccine.configurations.sort((a: any, b: any) => a.sequence - b.sequence);
      if (vaccine.configurations[0]?.sequence !== 1) {
        this.errors.push({ row: 0, vaccine: vaccine.vaccine_name, message: 'Dose 1 row is missing.' });
        return;
      }
      this.validVaccines.push(vaccine);
    });
  }

  async onSubmitClick() {
    if (this.validVaccines.length == 0) return;
    let confirm = await this._hqms.showConfirmMessage(
      `Create ${this.validVaccines.length} vaccine(s)? Rows with errors are skipped.`);
    if (!confirm) return;
    // Each vaccine is saved like "New Vaccine" (vaccineMasterApi → fn_vaccine_master_write), which also
    // creates the staff list of its target. fn_vaccine_master_write_bulkupload is not used: in the 6 Oct
    // database it reads org / location / user from the request instead of the session and writes the
    // missing manufacturer_master table, so every upload failed.
    let created = 0;
    let failed: any[] = [];
    for (const vaccine of this.validVaccines) {
      let saveResult: any = await this._hqms.customSaveApiCall('POST', 'vaccineMasterApi', { "action": "I", ...vaccine });
      if (saveResult?.status == 200) created++;
      else failed.push({ row: 0, vaccine: vaccine.vaccine_name, message: saveResult?.message || 'Save failed.' });
    }
    if (created > 0) this.saved = true;
    if (failed.length == 0) {
      this._hqms.hqmsToasterService({
        severity: 'success',
        summary: 'Vaccine Bulk Upload',
        detail: `${created} vaccine(s) created${this.errors.length > 0 ? ', rows with errors skipped' : ''}.`,
      });
      this.visible = false;
    } else {
      // Keep the popup open and list the vaccines the server did not save.
      this.errors = [...this.errors, ...failed];
      this.validVaccines = this.validVaccines.filter((vaccine: any) => failed.some((fl) => fl.vaccine === vaccine.vaccine_name));
      this._hqms.hqmsToasterService({
        severity: 'warn',
        summary: 'Vaccine Bulk Upload',
        detail: `${created} created, ${failed.length} not saved — see the list.`,
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
