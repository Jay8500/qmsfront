import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../shared/shared.module';
import { HqmsService } from '../../../services/hqms.service';

// AEFI — Adverse Event Following Immunization (SRS 2.x7). One dialog for:
//   - Vaccine Administration: a Completed row → adminId = that dose row
//   - Vaccine View: adminId = any dose row of the employee × vaccine → the dose is picked from the completed doses
//   - AEFI Register: aefi = an existing report (edit outcome / action / notes, add files)
// Saves with vaccinationAefiApi (fn_vaccination_aefi_write). Severe events notify the Quality Team (server side).
@Component({
  selector: 'app-aefi-report-dialog',
  imports: [CommonModule, SharedModule],
  templateUrl: './aefi-report-dialog.component.html',
  styleUrls: ['../../vaccination-forms.scss']
})
export class AefiReportDialogComponent {
  private _hqms = inject(HqmsService);
  readonly FILE_TYPES = ['pdf', 'jpg', 'jpeg', 'png'];
  readonly FILE_MAX_BYTES = 5 * 1024 * 1024;

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  // Emits true after a successful save.
  @Output() closed = new EventEmitter<boolean>();

  public header = 'Report AEFI';
  public employeeLabel = '';
  public doseList: any[] = [];
  public severityList: any[] = [];
  public outcomeList: any[] = [];
  public symptomList: any[] = [];
  public files: File[] = [];
  public existingFiles: any[] = [];
  public form: any = this.emptyForm();
  public err: any = {};
  private saved = false;

  private emptyForm(): any {
    return {
      action: 'I',
      vaccination_aefi_id: null,
      vaccination_administration_id: null,
      event_time: null,        // 'yyyy-MM-ddTHH:mm' (local)
      severity_id: null,
      symptom_ids: [],
      other_symptom: null,
      immediate_action: null,
      action_time: null,
      outcome_id: null,
      notes: null,
    };
  }

  private nowLocal(): string {
    let d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  }

  private async loadLists() {
    if (this.severityList.length) return;
    let info: any = await this._hqms.customGetApiCall('GET', 'commanEntityValuesGetApi',
      { "entity_codes": "AEFISEVERITY|AEFIOUTCOME|AEFISYMPTOM" });
    let ent: any = info?.status == 200 ? (info.data?.['entities'] || {}) : {};
    let map = (code: string) => (ent[code]?.['values'] || []).map((v: any) => ({ label: v.display_value, value: v.entity_value_id, code: v.value_code }));
    this.severityList = map('AEFISEVERITY');
    this.outcomeList = map('AEFIOUTCOME');
    this.symptomList = map('AEFISYMPTOM');
  }

  // New report. adminId: a dose row; label: employee name (+ vaccine) for the header.
  async openNew(adminId: any, label: string, pickDose: boolean) {
    await this.loadLists();
    this.saved = false;
    this.header = 'Report AEFI';
    this.employeeLabel = label;
    this.form = this.emptyForm();
    this.form.vaccination_administration_id = adminId;
    this.form.event_time = this.nowLocal();
    this.files = [];
    this.existingFiles = [];
    this.err = {};
    this.doseList = [];
    if (pickDose) {
      let info: any = await this._hqms.customGetApiCall('GET', 'vaccinationAefiApi', { "flag": "DOSES", "vaccination_administration_id": adminId });
      this.doseList = info?.status == 200 ? info.data.map((d: any) => ({
        label: `Dose ${d.dose_label} — ${d.administered_at}${d.batch_no ? ' (' + d.batch_no + ')' : ''}`,
        value: d.vaccination_administration_id,
      })) : [];
      // Default: the latest completed dose.
      this.form.vaccination_administration_id = this.doseList.length ? this.doseList[this.doseList.length - 1].value : null;
    }
    this.setVisible(true);
  }

  // Edit an existing report (row of fn_vaccination_aefi_get LIST).
  async openEdit(aefi: any) {
    await this.loadLists();
    this.saved = false;
    this.header = `AEFI ${aefi.aefi_no}`;
    this.employeeLabel = `${aefi.employee_name} — ${aefi.vaccine_name} dose ${aefi.dose_label}`;
    this.doseList = [];
    this.form = {
      action: 'U',
      vaccination_aefi_id: aefi.vaccination_aefi_id,
      vaccination_administration_id: aefi.vaccination_administration_id,
      event_time: aefi.event_time_local,
      severity_id: aefi.severity_id,
      symptom_ids: aefi.symptom_ids || [],
      other_symptom: aefi.other_symptom,
      immediate_action: aefi.immediate_action,
      action_time: aefi.action_time_local,
      outcome_id: aefi.outcome_id,
      notes: aefi.notes,
    };
    this.files = [];
    this.existingFiles = aefi.files || [];
    this.err = {};
    this.setVisible(true);
  }

  private setVisible(value: boolean) {
    this.visible = value;
    this.visibleChange.emit(value);
  }

  // Cancel / close icon. After a save the dialog is already closed (no second "closed").
  onHide() {
    if (!this.visible) return;
    this.setVisible(false);
    this.closed.emit(this.saved);
  }

  // Latest allowed event time (the date picker's max).
  get nowLocalMax(): string {
    return this.nowLocal();
  }

  hasOtherSymptom(): boolean {
    let other = this.symptomList.find((s: any) => s.code === 'OTHER')?.value;
    return !!other && (this.form.symptom_ids || []).includes(other);
  }

  onFiles(event: any) {
    let picked: File[] = Array.from(event?.target?.files || []);
    this.err.files = '';
    for (const file of picked) {
      let extension = (file.name.split('.').pop() || '').toLowerCase();
      if (!this.FILE_TYPES.includes(extension)) { this.err.files = 'Only PDF, JPG or PNG files are allowed.'; continue; }
      if (file.size > this.FILE_MAX_BYTES) { this.err.files = 'Each file can be up to 5 MB.'; continue; }
      if (!this.files.some((f) => f.name === file.name)) this.files.push(file);
    }
    if (event?.target) event.target.value = '';
  }

  removeFile(index: number) {
    this.files.splice(index, 1);
  }

  private validate(): boolean {
    let now = this.nowLocal();
    this.err = { files: this.err.files || '' };
    if (!this.form.vaccination_administration_id) this.err.dose = 'Select the dose.';
    if (!this.form.event_time) this.err.event_time = 'Event time is required.';
    else if (this.form.event_time > now) this.err.event_time = 'Event time cannot be in the future.';
    if (!this.form.severity_id) this.err.severity_id = 'Severity is required.';
    if (this.form.action_time && this.form.event_time && this.form.action_time < this.form.event_time) this.err.action_time = 'Action time cannot be before the event.';
    if (this.hasOtherSymptom() && !String(this.form.other_symptom || '').trim()) this.err.other_symptom = 'Describe the other symptom.';
    if (String(this.form.immediate_action || '').length > 500) this.err.immediate_action = 'Up to 500 characters.';
    if (String(this.form.notes || '').length > 1000) this.err.notes = 'Up to 1000 characters.';
    return !Object.keys(this.err).some((key) => key !== 'files' && this.err[key]);
  }

  private toIso(local: string | null): string | null {
    if (!local) return null;
    let value = new Date(local);
    return isNaN(value.getTime()) ? null : value.toISOString();
  }

  isSevere(): boolean {
    return this.severityList.find((s: any) => s.value === this.form.severity_id)?.code === 'SEVERE';
  }

  async onSave() {
    if (!this.validate()) return;
    let confirm = await this._hqms.showConfirmMessage(this.isSevere()
      ? 'Save this SEVERE event? The Quality Team will be notified.'
      : 'Save this AEFI report?');
    if (!confirm) return;
    let payload: any = {
      ...this.form,
      event_time: this.toIso(this.form.event_time),
      action_time: this.toIso(this.form.action_time),
      aefi_documents: this.files.map((file) => ({
        file_id: null, file_name: file.name, file_type: (file.name.split('.').pop() || '').toLowerCase(),
        file_size: file.size, storage_path: null, is_active: true, upload_file_name: file.name,
      })),
    };
    let body: any = payload;
    if (this.files.length) {
      body = new FormData();
      this.files.forEach((file) => body.append('file', file, file.name));
      body.append('data', JSON.stringify(payload));
    }
    let result: any = await this._hqms.customSaveApiCall('POST', 'vaccinationAefiApi', body);
    if (result?.status == 200) {
      this._hqms.hqmsToasterService({ severity: 'success', summary: 'AEFI', detail: result.message });
      this.saved = true;
      this.setVisible(false);
      this.closed.emit(true);
    } else {
      this._hqms.hqmsToasterService({ severity: 'warn', summary: 'AEFI', detail: result?.message || 'Save failed.' });
    }
  }
}
