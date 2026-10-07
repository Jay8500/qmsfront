import { Component, signal, OnInit, inject, ViewChild, NO_ERRORS_SCHEMA, computed } from '@angular/core';
import { Location } from '@angular/common';
import { FileUpload } from 'primeng/fileupload';
import { HqmsService } from '../../../services/hqms.service';
import { ImageViewerComponent } from '../../../components/imageviewer/imageviewer.component';
import { SharedModule } from '../../../shared/shared.module';
import { FileUploadModule } from 'primeng/fileupload';
import { VaccinationAccessService } from '../../../vaccination-management/vaccination-access.service';

@Component({
  selector: 'app-license-tracker-details',
  imports: [SharedModule, FileUploadModule],//ImageViewerComponent
  templateUrl: './license-tracker-details.component.html',
  schemas: [NO_ERRORS_SCHEMA]
})
export class LicenseTrackerDetailsComponent implements OnInit {
  @ViewChild('imgView') imgView!: ImageViewerComponent;
  @ViewChild('renewDocs') renewDocs!: FileUpload;

  // Access flags of the License Tracker screen (same list as the side menu)
  private accessService = inject(VaccinationAccessService);
  public access = this.accessService.access('license-tracker-dashboard');
  public canRenew = computed(() => this.access().access_mod && this.readOnlyLicense().is_active);

  public pageMode = 'VIEW';
  public readOnlyLicense: any = signal({
    "action": "I",
    "license_id": null,
    "license_name_id": null,
    "license_master_id": null,
    "license_no": null,
    "provider_id": null,
    "assigned_employee_id": null,
    "issue_date": null,
    "expiry_date": null,
    "renewal_application_date": null,
    "updated_at": null,
    "is_active": true,
    "license_files": [],
    "license_criteria": [],
    "criteriaText": "",
    "status": null,
    "days_to_expiry": null,
    "checklist_total": 0,
    "checklist_done": 0,
  })
  public renewalHistory: any = signal([]);

  // Renew dialog
  public showRenew = signal(false);
  public renewSaving = signal(false);
  public renewForm: any = {
    new_issue_date: null,
    new_expiry_date: null,
    new_renewal_application_date: null,
    remarks: '',
    license_files: []
  };
  public renewAttached: any[] = [];
  public renewError = '';

  constructor(private location: Location, public _hqms: HqmsService, ) { }

  async ngOnInit() {
    try {
      let state = history.state;
      if (state ?.data) {
        await this.editlicenseTracker(state['data']['id'])
      };
    } catch (e) { }
  }

  async editlicenseTracker(licenseId: any) {
    try {
      let getLicenseTrackerInfo: any = await this._hqms.customGetApiCall('GET', 'fnLicenseApi',
        {
          "license_id": licenseId,
        });
      if (getLicenseTrackerInfo.status == 200) {
        let editInfo = getLicenseTrackerInfo['data'];
        if (editInfo.length > 0) {
          editInfo = editInfo[0];
          this.readOnlyLicense.set({
            "action": "U",
            "license_id": editInfo.license_id,
            "license_name_id": editInfo.license_name_id,
            "license_master_id": editInfo.license_master_id,
            "license_no": editInfo.license_no,
            "license_name": editInfo.license_name,
            "license_name_no": editInfo.license_name_no,
            "provider_name": editInfo.provider_name,
            "assigned_employee_id": editInfo.assigned_to,
            "issue_date": editInfo.issue_date,
            "expiry_date": editInfo.expiry_date,
            "renewal_application_date": editInfo.renewal_application_date,
            "updated_at": editInfo.updated_at,
            "license_files": editInfo['license_files'].length > 0 ? editInfo['license_files']
              .filter((ele: any) => ele.is_active == true)
              .map((ele) => ({
                ...ele,
                fileOrImageUrl: ele.fileOrImageUrl != null ? ele.fileOrImageUrl : null,
                is_viewed: false
              })) : [],
            "license_criteria": editInfo.license_criteria != null ? editInfo.license_criteria
              .filter((lc: any) => lc.is_active == true)
              .map((lc, index: number) => ({ ...lc, is_edit_click: false })) : [],
            "is_active": editInfo.is_active,
            "status": editInfo.status,
            "days_to_expiry": editInfo.days_to_expiry,
            "checklist_total": editInfo.checklist_total || 0,
            "checklist_done": editInfo.checklist_done || 0,
          });
          await this.loadRenewalHistory(editInfo.license_id);
        }
      };
    } catch (e) {
    };
  }

  async loadRenewalHistory(licenseId: any) {
    try {
      let history: any = await this._hqms.customGetApiCall('GET', 'licenseRenewalApi', { "license_id": licenseId });
      this.renewalHistory.set(history.status == 200 && Array.isArray(history.data) ? history.data : []);
    } catch (e) {
      this.renewalHistory.set([]);
    }
  }

  statusClass(status: string) {
    switch (status) {
      case 'Active': return 'badge-green';
      case 'In Renewal': return 'badge-yellow';
      case 'Incomplete': return 'badge-yellow';
      default: return 'badge-red';
    }
  }

  goBack(): void {
    this.location.back();
  }

  onViewClick(getImageInfo: any) {
    if (getImageInfo?.fileOrImageUrl) {
      window.open(getImageInfo.fileOrImageUrl, '_blank');
    }
  }

  // ---------------- Renew ----------------
  openRenew() {
    const lic = this.readOnlyLicense();
    this.renewForm = {
      new_issue_date: null,
      new_expiry_date: null,
      new_renewal_application_date: null,
      remarks: '',
      license_files: []
    };
    this.renewAttached = [];
    this.renewError = lic.checklist_done < lic.checklist_total
      ? `Checklist: ${lic.checklist_done} of ${lic.checklist_total} items done. Tick all items on Edit before renewing.`
      : '';
    this.showRenew.set(true);
  }

  onRenewFileSelect(thisFile: any, fileSelected: any) {
    const file = fileSelected.files[0];
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
      this._hqms.hqmsToasterService({ severity: 'warn', summary: 'License Renewal', detail: 'Accepted formats: .pdf, .jpg, .png' });
      thisFile.clear();
      return;
    }
    if (this.renewForm.license_files.some((f: any) => f.file_name === file.name)) {
      this._hqms.hqmsToasterService({ severity: 'warn', summary: 'License Renewal', detail: 'A file with this name is already added' });
      thisFile.clear();
      return;
    }
    this.renewForm.license_files.push({
      file_id: null,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      storage_path: null,
      is_active: true,
      upload_file_name: file.name
    });
    this.renewAttached.push({ fileName: file.name, fileContent: file });
    thisFile.clear();
  }

  removeRenewFile(index: number) {
    const name = this.renewForm.license_files[index]?.file_name;
    this.renewForm.license_files.splice(index, 1);
    this.renewAttached = this.renewAttached.filter((f: any) => f.fileName !== name);
  }

  // 'YYYY-MM-DD' in local time (toISOString would shift the day back in India)
  private ymd(value: any): string | null {
    if (!value) return null;
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return null;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  toDate(value: any): Date | null {
    if ([null, undefined, ''].includes(value)) return null;
    const dt = value instanceof Date ? value : new Date(value);
    return isNaN(dt.getTime()) ? null : dt;
  }

  async onRenewSave() {
    const lic = this.readOnlyLicense();
    const f = this.renewForm;
    const issue = this.ymd(f.new_issue_date);
    const expiry = this.ymd(f.new_expiry_date);
    const renewal = this.ymd(f.new_renewal_application_date);
    let msg = '';
    if (!issue || !expiry) msg = 'New Issue Date and New Expiry Date are required';
    else if (expiry <= issue) msg = 'New Expiry Date must be after the New Issue Date';
    else if (lic.expiry_date && expiry <= lic.expiry_date) msg = 'New Expiry Date must be after the current Expiry Date';
    else if (renewal && (renewal < issue || renewal > expiry)) msg = 'Renewal Application Date must be between the new Issue and Expiry dates';
    else if (f.license_files.length == 0) msg = 'Upload the renewed license / proof (at least one file)';
    if (msg) {
      this._hqms.hqmsToasterService({ severity: 'warn', summary: 'License Renewal', detail: msg });
      return;
    }
    const payload = {
      license_id: lic.license_id,
      new_issue_date: issue,
      new_expiry_date: expiry,
      new_renewal_application_date: renewal,
      remarks: (f.remarks || '').trim(),
      license_files: f.license_files
    };
    const formData = new FormData();
    this.renewAttached.forEach((file: any) => formData.append("file", file.fileContent, file.fileName));
    formData.append("data", JSON.stringify(payload));
    const ok = await this._hqms.showConfirmMessage('Renew this license with the new dates?');
    if (!ok) return;
    this.renewSaving.set(true);
    try {
      const saveResult: any = await this._hqms.customSaveApiCall("POST", "licenseRenewalApi", formData);
      if (saveResult.status == 200) {
        this._hqms.hqmsToasterService({ severity: 'success', summary: 'License Renewal', detail: saveResult.message });
        this.showRenew.set(false);
        await this.editlicenseTracker(lic.license_id);
      } else {
        this._hqms.hqmsToasterService({ severity: 'warn', summary: 'License Renewal', detail: saveResult.message });
      }
    } catch (e) {
    } finally {
      this.renewSaving.set(false);
    }
  }
}
