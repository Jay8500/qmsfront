import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../shared/shared.module';
import { HqmsService } from '../../../services/hqms.service';
import { VaccinationPolicyService } from '../vaccination-policy.service';

// Vaccination Policy / SOP versions (SRS 2.x4): list + upload a new version (PDF, version, effective from).
// Opened from Vaccine Master; uploading needs canEdit (Vaccine Master add access).
@Component({
  selector: 'app-vaccination-policy-dialog',
  imports: [CommonModule, SharedModule],
  templateUrl: './policy-dialog.component.html',
  styleUrls: ['../../vaccination-forms.scss']
})
export class PolicyDialogComponent {
  private _hqms = inject(HqmsService);
  public policy = inject(VaccinationPolicyService);
  readonly FILE_MAX_BYTES = 10 * 1024 * 1024;

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input() canEdit = false;

  public form: any = { title: 'Staff Vaccination Policy', version: null, effective_from: null, notes: null };
  public file: File | null = null;
  public err: any = {};

  async open() {
    await this.policy.load(true);
    let latest = this.policy.versions()[0];
    this.form = { title: latest?.title || 'Staff Vaccination Policy', version: null, effective_from: null, notes: null };
    this.file = null;
    this.err = {};
    this.visible = true;
    this.visibleChange.emit(true);
  }

  close() {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  onFile(event: any) {
    let file: File | null = event?.target?.files?.[0] || null;
    this.err.file = '';
    if (file && (file.name.split('.').pop() || '').toLowerCase() !== 'pdf') this.err.file = 'The policy must be a PDF.';
    else if (file && file.size > this.FILE_MAX_BYTES) this.err.file = 'The file can be up to 10 MB.';
    this.file = this.err.file ? null : file;
    if (event?.target) event.target.value = '';
  }

  async onUpload() {
    let e: any = { file: this.err.file || '' };
    if (!String(this.form.title || '').trim()) e.title = 'Title is required.';
    if (!String(this.form.version || '').trim()) e.version = 'Version is required.';
    if (!this.form.effective_from) e.effective_from = 'Effective from is required.';
    if (!this.file && !e.file) e.file = 'Attach the policy PDF.';
    this.err = e;
    if (Object.values(e).some((v) => v)) return;
    let payload: any = {
      action: 'I', ...this.form,
      policy_documents: [{ file_id: null, file_name: this.file!.name, file_type: 'pdf', file_size: this.file!.size,
        storage_path: null, is_active: true, upload_file_name: this.file!.name }],
    };
    let body = new FormData();
    body.append('file', this.file!, this.file!.name);
    body.append('data', JSON.stringify(payload));
    let result: any = await this._hqms.customSaveApiCall('POST', 'vaccinationPolicyApi', body);
    this._hqms.hqmsToasterService({ severity: result?.status == 200 ? 'success' : 'warn', summary: 'Vaccination Policy', detail: result?.message || 'Upload failed.' });
    if (result?.status == 200) {
      await this.policy.load(true);
      this.form.version = null;
      this.form.effective_from = null;
      this.form.notes = null;
      this.file = null;
    }
  }

  async onRemove(row: any) {
    let confirm = await this._hqms.showConfirmMessage(`Remove policy version ${row.version}?`);
    if (!confirm) return;
    let result: any = await this._hqms.customSaveApiCall('POST', 'vaccinationPolicyApi', { action: 'D', vaccination_policy_id: row.vaccination_policy_id });
    this._hqms.hqmsToasterService({ severity: result?.status == 200 ? 'success' : 'warn', summary: 'Vaccination Policy', detail: result?.message });
    if (result?.status == 200) await this.policy.load(true);
  }
}
